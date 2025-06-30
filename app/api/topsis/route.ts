import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { calculateTOPSIS } from "@/lib/topsis"
import {
  getLeafCriteria,
  getExcelColumnMappings,
  getCriteriaBenefitType,
} from "@/lib/criteria-hierarchy"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const weightsString = formData.get("weights") as string
    const globalWeightsString = formData.get("globalWeights") as string
    const minTripCountString = formData.get("minTripCount") as string
    const minDistanceString = formData.get("minDistance") as string

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 })
    }

    // Parse weights
    let globalWeights: Record<string, number> = {}
    try {
      if (globalWeightsString) {
        globalWeights = JSON.parse(globalWeightsString) as Record<string, number>
      } else if (weightsString) {
        const weights = JSON.parse(weightsString) as number[]
        // Convert array weights to global weights (for backward compatibility)
        const leafCriteria = getLeafCriteria()
        leafCriteria.forEach((criterion, index) => {
          if (index < weights.length) {
            globalWeights[criterion.id] = weights[index]
          }
        })
      } else {
        return NextResponse.json(
          { error: "AHP ağırlıkları bulunamadı. Lütfen önce AHP değerlendirmesi yapın." },
          { status: 400 }
        )
      }

      // Validate weights
      const weightValues = Object.values(globalWeights)
      const isValidWeights = weightValues.every((w) => !isNaN(w) && w >= 0 && w <= 1)
      const weightSum = weightValues.reduce((sum, w) => sum + w, 0)

      if (!isValidWeights || Math.abs(weightSum - 1) > 0.01) {
        return NextResponse.json(
          {
            error: `Geçersiz AHP ağırlıkları. Ağırlıklar toplamı ${weightSum.toFixed(4)} olmalıdır (1.0 olmalı).`,
          },
          { status: 400 }
        )
      }
    } catch (e) {
      console.error("AHP ağırlıkları işlenirken hata:", e)
      return NextResponse.json(
        { error: "AHP ağırlıkları işlenirken hata oluştu." },
        { status: 400 }
      )
    }

    const minTripCount = minTripCountString ? Number.parseInt(minTripCountString, 10) : 25
    const minDistance = minDistanceString ? Number.parseInt(minDistanceString, 10) : 250

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]

    if (!data || data.length < 2 || !Array.isArray(data[0])) {
      return NextResponse.json(
        { error: "Geçersiz Excel dosyası formatı." },
        { status: 400 }
      )
    }

    // Extract headers and data
    const headers = data[0] as string[]
    console.log("Excel headers:", headers)

    // Find column indices
    const tripCountIndex = headers.findIndex((h) => h.includes("Sefer Sayısı"))
    const distanceIndex = headers.findIndex((h) => h.includes("Yapılan Kilometre"))

    // Filter data based on criteria
    const filteredData = data.slice(1).filter((row) => {
      if (tripCountIndex === -1 || distanceIndex === -1) return true
      const tripCount = Number(row[tripCountIndex])
      const distance = Number(row[distanceIndex])
      return tripCount >= minTripCount && distance >= minDistance
    })

    if (filteredData.length === 0) {
      return NextResponse.json(
        {
          error: `Minimum sefer sayısı (${minTripCount}) ve minimum kilometre (${minDistance}) kriterlerine uyan sürücü bulunamadı.`,
        },
        { status: 400 }
      )
    }

    // Get mappings and criteria
    const excelColumnMappings = getExcelColumnMappings()
    const leafCriteria = getLeafCriteria()

    // Create header to index mapping
    const headerToIndexMap: Record<string, number> = {}
    headers.forEach((header, index) => {
      headerToIndexMap[header] = index
    })

    // Process driver data
    const driversData: any[] = []

    for (let rowIndex = 0; rowIndex < filteredData.length; rowIndex++) {
      const row = filteredData[rowIndex]
      const driverData: any = {
        driverId: row[0]?.toString() || `Driver_${rowIndex}`,
      }

      // Extract values for each criterion
      for (const criterion of leafCriteria) {
        let value = 0
        let columnIndex = -1

        // Find column for this criterion
        if (headerToIndexMap[criterion.name] !== undefined) {
          columnIndex = headerToIndexMap[criterion.name]
        } else {
          // Check alternative mappings
          for (const [headerName, criterionId] of Object.entries(excelColumnMappings)) {
            if (criterionId === criterion.id && headerToIndexMap[headerName] !== undefined) {
              columnIndex = headerToIndexMap[headerName]
              break
            }
          }
        }

        if (columnIndex !== -1) {
          const rawValue = row[columnIndex]
          if (typeof rawValue === "string") {
            const cleanValue = rawValue.replace(",", ".").trim()
            value = Number.parseFloat(cleanValue) || 0
          } else if (typeof rawValue === "number") {
            value = rawValue
          }
        }

        driverData[criterion.id] = value
      }

      driversData.push(driverData)
    }

    console.log(`Processed ${driversData.length} drivers with ${leafCriteria.length} criteria`)
    
    // Log sample data for debugging
    if (driversData.length > 0) {
      console.log("Sample driver data (first driver):", driversData[0])
      console.log("Global weights being used:", globalWeights)
      
      // Check for non-zero values
      const firstDriver = driversData[0]
      const nonZeroValues = Object.keys(firstDriver).filter(key => 
        key !== 'driverId' && typeof firstDriver[key] === 'number' && firstDriver[key] !== 0
      )
      console.log("Non-zero values in first driver:", nonZeroValues)
    }

    // Calculate TOPSIS
    const results = calculateTOPSIS(driversData, globalWeights)

    console.log(`TOPSIS completed. Results count: ${results.length}`)
    
    // Log sample results
    if (results.length > 0) {
      console.log("Sample TOPSIS result (first result):", results[0])
      const nonZeroResults = results.filter(r => r.closenessCoefficient > 0)
      console.log(`Results with non-zero coefficients: ${nonZeroResults.length}/${results.length}`)
    }

    // Prepare response
    const filterInfo = {
      totalDrivers: data.length - 1,
      filteredDrivers: filteredData.length,
      minTripCount,
      minDistance,
    }

    const weightsUsed = leafCriteria
      .map((criterion) => ({
        criterion: criterion.name,
        criterionId: criterion.id,
        weight: globalWeights[criterion.id] || 0,
        percentage: ((globalWeights[criterion.id] || 0) * 100).toFixed(2) + "%",
      }))
      .sort((a, b) => b.weight - a.weight)

    return NextResponse.json({
      results,
      filterInfo,
      weightsUsed,
      criteriaUsed: leafCriteria.map((c) => c.name),
    })
  } catch (error) {
    console.error("Error processing TOPSIS:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu" },
      { status: 500 }
    )
  }
}
