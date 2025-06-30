import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { calculateTOPSIS, calculateHierarchicalTOPSIS } from "@/lib/topsis"
import {
  getLeafCriteria,
  getAllCriteriaMapping,
  getAllCriteriaNames,
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
    const isHierarchical = formData.get("isHierarchical") === "true"
    const criteriaNames = formData.get("criteriaNames") as string

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 })
    }

    // Parse weights and filter parameters
    let weights, globalWeights
    try {
      if (isHierarchical && globalWeightsString) {
        // Parse global weights for hierarchical TOPSIS
        globalWeights = JSON.parse(globalWeightsString)

        // Validate global weights
        const weightValues = Object.values(globalWeights) as number[]
        const isValidWeights = weightValues.every((w) => !isNaN(w) && w >= 0 && w <= 1)
        const weightSum = weightValues.reduce((sum, w) => sum + w, 0)

        if (!isValidWeights || Math.abs(weightSum - 1) > 0.01) {
          return NextResponse.json(
            {
              error: `Geçersiz AHP ağırlıkları. Ağırlıklar toplamı ${weightSum.toFixed(4)} olmalıdır (1.0 olmalı). Lütfen geçerli bir AHP değerlendirmesi yapın.`,
            },
            { status: 400 },
          )
        }
      } else if (weightsString) {
        // Parse weights for flat TOPSIS
        weights = JSON.parse(weightsString) as number[]

        // Validate weights
        const isValidWeights = weights.every((w) => !isNaN(w) && w >= 0 && w <= 1)
        const weightSum = weights.reduce((sum, w) => sum + w, 0)

        if (!isValidWeights || Math.abs(weightSum - 1) > 0.01) {
          return NextResponse.json(
            {
              error: `Geçersiz AHP ağırlıkları. Ağırlıklar toplamı ${weightSum.toFixed(4)} olmalıdır (1.0 olmalı). Lütfen geçerli bir AHP değerlendirmesi yapın.`,
            },
            { status: 400 },
          )
        }
      } else {
        return NextResponse.json(
          {
            error:
              "AHP değerlendirmesi sonucu elde edilen kriter ağırlıkları bulunamadı. Lütfen önce AHP değerlendirmesi yapın.",
          },
          { status: 400 },
        )
      }
    } catch (e) {
      console.error("AHP ağırlıkları işlenirken hata:", e)
      return NextResponse.json(
        {
          error: "AHP ağırlıkları işlenirken hata oluştu. Lütfen geçerli bir AHP değerlendirmesi yapın.",
        },
        { status: 400 },
      )
    }

    const minTripCount = minTripCountString ? Number.parseInt(minTripCountString, 10) : 25 // Default: 25
    const minDistance = minDistanceString ? Number.parseInt(minDistanceString, 10) : 250 // Default: 250 km

    // Read the Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })

    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    // Convert the worksheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]

    // Check if data is valid
    if (!data || data.length < 2 || !Array.isArray(data[0])) {
      return NextResponse.json(
        {
          error: "Geçersiz Excel dosyası formatı.",
        },
        { status: 400 },
      )
    }

    // Extract headers (first row)
    const headers = data[0] as string[]

    // Log all headers for debugging
    console.log("Excel headers:", headers)

    // Find indices for trip count and distance columns
    const tripCountIndex = headers.findIndex((h) => h.includes("Sefer Sayısı"))
    const distanceIndex = headers.findIndex((h) => h.includes("Yapılan Kilometre"))

    if (tripCountIndex === -1 || distanceIndex === -1) {
      console.warn("Sefer Sayısı veya Yapılan Kilometre sütunları bulunamadı, filtreleme yapılamayabilir.")
    }

    // Filter drivers based on minimum trip count and minimum distance
    const filteredData = data.slice(1).filter((row) => {
      if (tripCountIndex === -1 || distanceIndex === -1) {
        return true // If columns not found, include all rows
      }

      const tripCount = Number(row[tripCountIndex])
      const distance = Number(row[distanceIndex])
      return tripCount >= minTripCount && distance >= minDistance
    })

    if (filteredData.length === 0) {
      return NextResponse.json(
        {
          error: `Minimum sefer sayısı (${minTripCount}) ve minimum kilometre (${minDistance}) kriterlerine uyan sürücü bulunamadı.`,
        },
        { status: 400 },
      )
    }

    // Extract driver IDs (first column)
    const driverIds = filteredData.map((row) => row[0].toString())

    // Get all criteria mapping and Excel column mappings
    const criterionMapping = getAllCriteriaMapping()
    const excelColumnMappings = getExcelColumnMappings()

    // Get all leaf criteria
    const leafCriteria = getLeafCriteria()

    // Parse criteria names if provided, otherwise get all criteria names
    let criteriaArray = []
    if (criteriaNames) {
      try {
        criteriaArray = JSON.parse(criteriaNames)
        console.log("Using provided criteria names:", criteriaArray)
      } catch (e) {
        console.error("Criteria names parsing error:", e)
        criteriaArray = getAllCriteriaNames()
        console.log("Using all criteria names after parsing error:", criteriaArray)
      }
    } else {
      criteriaArray = getAllCriteriaNames()
      console.log("Using all criteria names (no criteria provided):", criteriaArray)
    }

    // Initialize criteria data object for all leaf criteria
    const criteriaData: Record<string, number[]> = {}

    // Initialize with zeros for all criteria
    leafCriteria.forEach((criterion) => {
      criteriaData[criterion.id] = Array(filteredData.length).fill(0)
    })

    // Add special entries for trip count and distance
    criteriaData["tripCount"] = Array(filteredData.length).fill(0)
    criteriaData["distance"] = Array(filteredData.length).fill(0)

    // Create a mapping from header to column index
    const headerToIndexMap: Record<string, number> = {}
    headers.forEach((header, index) => {
      headerToIndexMap[header] = index
    })

    // Log the header to index mapping for debugging
    console.log("Header to index mapping:", headerToIndexMap)

    // Excel dosyasından tüm kriterlerin alındığından emin olmak için
    // Process each criterion and find its corresponding column in the Excel file
    leafCriteria.forEach((criterion) => {
      // Try different possible header names for this criterion
      let columnIndex = -1
      let matchedHeader = ""

      // Check for exact match with criterion name
      if (headerToIndexMap[criterion.name] !== undefined) {
        columnIndex = headerToIndexMap[criterion.name]
        matchedHeader = criterion.name
      } else {
        // Check for alternative names in the Excel column mappings
        for (const [headerName, criterionId] of Object.entries(excelColumnMappings)) {
          if (criterionId === criterion.id && headerToIndexMap[headerName] !== undefined) {
            columnIndex = headerToIndexMap[headerName]
            matchedHeader = headerName
            break
          }
        }
      }

      // If we found a matching column, extract the data
      if (columnIndex !== -1) {
        console.log(`Found data for criterion "${criterion.name}" in column "${matchedHeader}" (index: ${columnIndex})`)

        criteriaData[criterion.id] = filteredData.map((row, rowIndex) => {
          const value = row[columnIndex]
          let numericValue = 0
          
          // Handle different value types and formats
          if (typeof value === "string") {
            // Handle comma as decimal separator and other string processing
            const cleanValue = value.replace(",", ".").trim()
            numericValue = Number.parseFloat(cleanValue) || 0
          } else if (typeof value === "number") {
            numericValue = value
          }
          
          // Log first few values for debugging
          if (rowIndex < 3) {
            console.log(`  Row ${rowIndex}: "${value}" -> ${numericValue}`)
          }
          
          return numericValue
        })
        
        // Log some statistics for this criterion
        const values = criteriaData[criterion.id]
        const nonZeroValues = values.filter(v => v !== 0)
        console.log(`  Statistics: Total values: ${values.length}, Non-zero: ${nonZeroValues.length}, Min: ${Math.min(...values)}, Max: ${Math.max(...values)}`)
      } else {
        console.warn(`No data found for criterion "${criterion.name}" (id: ${criterion.id}). Using zeros.`)
        // Keep the initialized zeros for this criterion
      }
    })

    // Extract trip count and distance data
    if (tripCountIndex !== -1) {
      criteriaData["tripCount"] = filteredData.map((row) => Number.parseFloat(row[tripCountIndex]) || 0)
    }
    if (distanceIndex !== -1) {
      criteriaData["distance"] = filteredData.map((row) => Number.parseFloat(row[distanceIndex]) || 0)
    }

    // Log the criteria data keys to verify all criteria are included
    console.log("Criteria data keys:", Object.keys(criteriaData))
    console.log("Number of criteria data keys:", Object.keys(criteriaData).length)
    console.log("Number of leaf criteria:", leafCriteria.length)

    // All criteria are negative impact (lower is better)
    const criteriaMap = leafCriteria.reduce(
      (map, criterion) => {
        map[criterion.id] = criterion
        return map
      },
      {} as Record<string, any>,
    )

    // Update the isNegative mapping in the TOPSIS API route
    // Extract leaf criteria (those used in TOPSIS calculation)
    const leafCriteriaIds = Object.keys(criteriaMap).filter((id) => criteriaMap[id].isLeaf)

    console.log("Leaf criteria IDs for TOPSIS:", leafCriteriaIds)
    console.log("Available data keys:", Object.keys(criteriaData))

    // Define which criteria are negative (lower is better) and which are positive (higher is better)
    const isNegative: Record<string, boolean> = {}
    leafCriteriaIds.forEach((criterionId) => {
      // Default to true (negative impact) for most criteria
      isNegative[criterionId] = true

      // Set positive impact criteria based on the provided list
      if (
        criterionId === "attendance" || // İş Devamlılık Durumu
        criterionId === "normal_overtime" || // Normal Fazla Mesai
        criterionId === "weekend_overtime" || // Hafta Tatili Mesaisi
        criterionId === "holiday_overtime" // Resmi Tatil Mesaisi
      ) {
        isNegative[criterionId] = false // These are positive impact criteria (higher is better)
      }
    })

    // If we have weights but not globalWeights, convert weights to globalWeights
    if (!globalWeights && weights && criteriaArray) {
      globalWeights = {}
      criteriaArray.forEach((criterionName, index) => {
        const criterionId = criterionMapping[criterionName]
        if (criterionId && index < weights.length) {
          globalWeights[criterionId] = weights[index]
        }
      })
    }

    // Ensure all leaf criteria have weights
    leafCriteria.forEach((criterion) => {
      if (!globalWeights[criterion.id]) {
        console.warn(`No weight found for criterion "${criterion.name}" (id: ${criterion.id}). Using default weight.`)
        // Assign a small default weight
        globalWeights[criterion.id] = 0.01
      }
    })

    // Normalize global weights to ensure they sum to 1
    const totalWeight = Object.values(globalWeights).reduce((sum, weight) => sum + weight, 0)
    if (totalWeight > 0) {
      for (const criterionId in globalWeights) {
        globalWeights[criterionId] = globalWeights[criterionId] / totalWeight
      }
    }

    // Log the normalized global weights
    console.log("Normalized global weights:", globalWeights)

    console.log("Using global weights for TOPSIS:", globalWeights)

    // Calculate TOPSIS results
    let results
    if (isHierarchical) {
      results = calculateHierarchicalTOPSIS(criteriaData, globalWeights, driverIds, criteriaMap, isNegative)
    } else {
      const driversDataArray = filteredData.map((row) => {
        const driverData: Record<string, any> = {
          driverId: row[0].toString(),
          tripCount: row[tripCountIndex] || 0,
          distance: row[distanceIndex] || 0,
        }
        leafCriteriaIds.forEach((criterionId) => {
          driverData[criterionId] = criteriaData[criterionId].find((value) => value !== 0) || 0
        })
        return driverData
      })

      const benefitTypeMap = getCriteriaBenefitType()
      const isNegativeMap: Record<string, boolean> = {}
      leafCriteriaIds.forEach((criterionId) => {
        isNegativeMap[criterionId] = benefitTypeMap[criterionId] === "negative"
      })

      results = calculateTOPSIS(driversDataArray, globalWeights, isNegativeMap)
    }

    // Add trip count and distance to original scores
    results.forEach((result, index) => {
      result.originalScores["Sefer Sayısı"] = criteriaData["tripCount"][index]
      result.originalScores["Yapılan Kilometre"] = criteriaData["distance"][index]
    })

    // Sort results by performance score, with kilometers as tiebreaker for equal scores
    results.sort((a, b) => {
      if (b.performanceScore === a.performanceScore) {
        // If performance scores are equal, sort by kilometers (higher kilometers first)
        const aDistance = a.originalScores["Yapılan Kilometre"] || 0
        const bDistance = b.originalScores["Yapılan Kilometre"] || 0
        return bDistance - aDistance
      }
      return b.performanceScore - a.performanceScore
    })

    // Update ranks after sorting
    results.forEach((result, index) => {
      result.rank = index + 1
    })

    // Save filter info for later use in Excel export
    const filterInfo = {
      totalDrivers: data.length - 1,
      filteredDrivers: filteredData.length,
      minTripCount,
      minDistance,
    }

    // Create weights used info for all criteria
    const weightsUsed = leafCriteria
      .map((criterion) => {
        const weight = globalWeights ? globalWeights[criterion.id] || 0 : 0
        return {
          criterion: criterion.name,
          criterionId: criterion.id,
          weight: weight,
          percentage: ((weight || 0) * 100).toFixed(2) + "%",
        }
      })
      .sort((a, b) => b.weight - a.weight)

    // Include the weights used in the response for verification
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
      { status: 500 },
    )
  }
}
