"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download, Info, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { getLeafCriteria, getExcelColumnMappings, getCriteriaBenefitType } from "@/lib/criteria-hierarchy"
import { calculateTOPSIS, type DriverData, type TOPSISResult } from "@/lib/topsis"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'

export default function TOPSISPage() {
  const [driversData, setDriversData] = useState<DriverData[]>([])
  const [ahpWeights, setAhpWeights] = useState<Record<string, number>>({})
  const [topsisResults, setTopsisResults] = useState<TOPSISResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([])
  const [criteriaTypes, setCriteriaTypes] = useState<Record<string, boolean>>({}) // true for benefit, false for cost
  const [useDefaultWeights, setUseDefaultWeights] = useState(false)
  const [hasAhpWeights, setHasAhpWeights] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const leafCriteria = useMemo(() => getLeafCriteria(), [])
  const excelColumnMappings = useMemo(() => getExcelColumnMappings(), [])

  useEffect(() => {
    // Load AHP weights from localStorage
    const storedAhpResults = localStorage.getItem("ahpResults")
    if (storedAhpResults) {
      try {
        const parsedResults = JSON.parse(storedAhpResults)
        if (parsedResults.globalWeights) {
          setAhpWeights(parsedResults.globalWeights)
          setHasAhpWeights(true)
          // Initialize selected criteria and types based on AHP weights
          const initialSelected = Object.keys(parsedResults.globalWeights)
          setSelectedCriteria(initialSelected)

          const initialTypes: Record<string, boolean> = {}
          initialSelected.forEach((id) => {
            initialTypes[id] = getCriteriaBenefitType(id) || false // Default to cost if not specified
          })
          setCriteriaTypes(initialTypes)
          setError(null) // Clear any previous errors
        }
      } catch (e) {
        console.error("Error loading AHP weights from localStorage:", e)
        setError("AHP ağırlıkları yüklenirken bir hata oluştu.")
        setHasAhpWeights(false)
      }
    } else {
      setHasAhpWeights(false)
      // Initialize with all criteria for default weights option
      const allCriteriaIds = leafCriteria.map(c => c.id)
      setSelectedCriteria(allCriteriaIds)
      
      const initialTypes: Record<string, boolean> = {}
      allCriteriaIds.forEach((id) => {
        initialTypes[id] = getCriteriaBenefitType(id) || false
      })
      setCriteriaTypes(initialTypes)
      setError("AHP değerlendirmesi bulunamadı. Varsayılan eşit ağırlıkları kullanabilirsiniz.")
    }
  }, [leafCriteria])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSelectedFileName(file.name)

    setLoading(true)
    setError(null)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json: any[] = XLSX.utils.sheet_to_json(worksheet)

        const processedData: DriverData[] = json.map((row, index) => {
          // Debug: Log first few rows to see the structure
          if (index < 3) {
            console.log(`Row ${index}:`, row)
            console.log(`Available keys:`, Object.keys(row))
          }

          const driver: DriverData = {
            driverId: row["Sicil No"] || row["SicilNo"] || row["sicil no"] || `Driver_${index}`,
            tripCount: row["Sefer Sayısı"] || row["sefer sayısı"] || 0,
            distance: row["Yapılan Kilometre"] || row["yapılan kilometre"] || 0,
          }

          // Log the extracted basic info
          if (index < 3) {
            console.log(`Extracted driver info:`, {
              driverId: driver.driverId,
              tripCount: driver.tripCount,
              distance: driver.distance
            })
          }

          leafCriteria.forEach((criterion) => {
            let value = 0
            
            // Try direct criterion name first
            if (row[criterion.name] !== undefined) {
              const rawValue = row[criterion.name]
              if (typeof rawValue === "string") {
                value = Number.parseFloat(rawValue.replace(",", ".")) || 0
              } else if (typeof rawValue === "number") {
                value = rawValue
              }
            } else {
              // Try alternative mappings
              const excelHeader = Object.keys(excelColumnMappings).find(
                (key) => excelColumnMappings[key] === criterion.id
              )
              if (excelHeader && row[excelHeader] !== undefined) {
                const rawValue = row[excelHeader]
                if (typeof rawValue === "string") {
                  value = Number.parseFloat(rawValue.replace(",", ".")) || 0
                } else if (typeof rawValue === "number") {
                  value = rawValue
                }
              }
            }
            
            driver[criterion.id] = value
            
            // Debug: Log criterion values for first driver
            if (index === 0) {
              console.log(`Criterion ${criterion.name} (${criterion.id}): ${value}`)
            }
          })
          
          return driver
        })
        setDriversData(processedData)
        setTopsisResults([]) // Clear previous results
      } catch (err) {
        console.error("Error reading Excel file:", err)
        setError("Excel dosyası okunurken bir hata oluştu. Lütfen formatı kontrol edin.")
      } finally {
        setLoading(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleCalculateTOPSIS = async () => {
    if (driversData.length === 0) {
      setError("Lütfen önce sürücü verilerini yükleyin.")
      return
    }
    if (!hasAhpWeights && !useDefaultWeights) {
      setError("AHP ağırlıkları bulunamadı. Lütfen AHP değerlendirmesi yapın veya varsayılan ağırlıkları kullanın.")
      return
    }
    if (selectedCriteria.length === 0) {
      setError("Lütfen TOPSIS hesaplaması için en az bir kriter seçin.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      let weightsToUse: Record<string, number> = {}
      
      if (useDefaultWeights || !hasAhpWeights) {
        // Use equal weights for all selected criteria
        const equalWeight = 1 / selectedCriteria.length
        selectedCriteria.forEach(criterionId => {
          weightsToUse[criterionId] = equalWeight
        })
        console.log("Using default equal weights:", weightsToUse)
      } else {
        // Use AHP weights
        selectedCriteria.forEach((criterionId) => {
          weightsToUse[criterionId] = ahpWeights[criterionId] || 0
        })
        console.log("Using AHP weights:", weightsToUse)
      }

      // Create FormData for API call
      const formData = new FormData()
      
      // Create a simple Excel file from driversData for API
      const ws = XLSX.utils.json_to_sheet(driversData.map(driver => {
        const row: any = {
          "Sicil No": driver.driverId,
          "Sefer Sayısı": driver.tripCount || 0,
          "Yapılan Kilometre": driver.distance || 0
        }
        
        // Add criterion values with proper headers
        leafCriteria.forEach(criterion => {
          row[criterion.name] = driver[criterion.id] || 0
        })
        
        return row
      }))
      
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Veriler")
      const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
      const file = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      formData.append('file', file, 'driver_data.xlsx')
      formData.append('globalWeights', JSON.stringify(weightsToUse))
      formData.append('minTripCount', '0')
      formData.append('minDistance', '0')

      const response = await fetch('/api/topsis', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'TOPSIS hesaplaması başarısız')
      }

      const data = await response.json()
      setTopsisResults(data.results || [])
      
      if (useDefaultWeights) {
        console.log("TOPSIS hesaplaması varsayılan eşit ağırlıklarla tamamlandı")
      } else {
        console.log("TOPSIS hesaplaması AHP ağırlıklarıyla tamamlandı")
      }
      
      // Sonuçları localStorage'a kaydet
      try {
        const storedAhpResults = localStorage.getItem("ahpResults")
        let evaluatorName = "Bilinmiyor"
        if (storedAhpResults) {
          try {
            const parsed = JSON.parse(storedAhpResults)
            evaluatorName = parsed.evaluatorName || "Bilinmiyor"
          } catch {}
        }
        const topsisToStore = {
          driversData,
          topsisResults: data.results || [],
          evaluatorName,
          date: new Date().toISOString(),
        }
        localStorage.setItem("topsisResults", JSON.stringify(topsisToStore))
      } catch (e) {
        console.error("TOPSIS sonucu kaydedilemedi:", e)
      }
      // Başarılı bildirim ve yönlendirme
      toast({
        title: "TOPSIS Analizi Başarıyla tamamlandı.",
        description: "Toplu Sonuçlar sayfasından kontrol ediniz.",
      })
      router.push('/all-results')
    } catch (err) {
      console.error("Error calculating TOPSIS:", err)
      setError(err instanceof Error ? err.message : "TOPSIS hesaplaması sırasında bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const handleCriterionToggle = (criterionId: string, checked: boolean) => {
    setSelectedCriteria((prev) => (checked ? [...prev, criterionId] : prev.filter((id) => id !== criterionId)))
  }

  const handleCriterionTypeChange = (criterionId: string, type: string) => {
    setCriteriaTypes((prev) => ({
      ...prev,
      [criterionId]: type === "benefit",
    }))
  }

  const exportTopsisToExcel = () => {
    if (topsisResults.length === 0) {
      setError("Dışa aktarılacak TOPSIS sonucu bulunamadı.")
      return
    }

    // 1. TOPSIS Sonuçları
    const resultsData = [["Sıra", "Sürücü Sicil No", "Yakınlık Katsayısı (C*)", "TOPSIS Puanı"]]
    topsisResults.forEach((result) => {
      resultsData.push([result.rank, result.driverId, result.closenessCoefficient.toFixed(4), (result.closenessCoefficient * 100).toFixed(2)])
    })
    const wsResults = XLSX.utils.aoa_to_sheet(resultsData)

    // 2. Normalize Matris
    const normalizeHeaders = ["Sürücü Sicil No", ...leafCriteria.map((c) => c.name)]
    const normalizeData = [normalizeHeaders]
    topsisResults.forEach((result) => {
      const row = [result.driverId]
      leafCriteria.forEach((c) => {
        row.push(result.normalizedPerformance[c.id]?.toFixed(6) ?? "")
      })
      normalizeData.push(row)
    })
    const wsNormalize = XLSX.utils.aoa_to_sheet(normalizeData)

    // 3. Ağırlıklı Normalize Matris
    const weightedHeaders = ["Sürücü Sicil No", ...leafCriteria.map((c) => c.name)]
    const weightedData = [weightedHeaders]
    topsisResults.forEach((result) => {
      const row = [result.driverId]
      leafCriteria.forEach((c) => {
        row.push(result.weightedNormalizedPerformance[c.id]?.toFixed(6) ?? "")
      })
      weightedData.push(row)
    })
    const wsWeighted = XLSX.utils.aoa_to_sheet(weightedData)

    // 4. İdeal Çözümler
    const idealHeaders = ["Kriter", "İdeal (A+)", "Anti-İdeal (A-)"]
    const idealData = [idealHeaders]
    if (topsisResults.length > 0) {
      const first = topsisResults[0]
      leafCriteria.forEach((c) => {
        idealData.push([
          c.name,
          first.idealPositive[c.id]?.toFixed(6) ?? "",
          first.idealNegative[c.id]?.toFixed(6) ?? "",
        ])
      })
    }
    const wsIdeal = XLSX.utils.aoa_to_sheet(idealData)

    // 5. Uzaklıklar ve C*
    const distHeaders = ["Sürücü Sicil No", "d+ (İdeal Uzaklık)", "d- (Anti-İdeal Uzaklık)", "Yakınlık Katsayısı (C*)"]
    const distData = [distHeaders]
    topsisResults.forEach((result) => {
      distData.push([
        result.driverId,
        result.distanceToPositive.toFixed(6),
        result.distanceToNegative.toFixed(6),
        result.closenessCoefficient.toFixed(6),
      ])
    })
    const wsDist = XLSX.utils.aoa_to_sheet(distData)

    // Kitap oluştur ve sheet'leri ekle
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, wsResults, "TOPSIS Sonuçları")
    XLSX.utils.book_append_sheet(wb, wsNormalize, "Normalize Matris")
    XLSX.utils.book_append_sheet(wb, wsWeighted, "Ağırlıklı Normalize")
    XLSX.utils.book_append_sheet(wb, wsIdeal, "İdeal Çözümler")
    XLSX.utils.book_append_sheet(wb, wsDist, "Uzaklıklar ve C*")
    XLSX.writeFile(wb, "TOPSIS_Tum_Asamalar.xlsx")
  }

  const exportTopsisToPDF = () => {
    if (topsisResults.length === 0) {
      setError("Dışa aktarılacak TOPSIS sonucu bulunamadı.")
      return
    }

    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("TOPSIS Hesaplama Sonuçları", 14, 22)

    doc.setFontSize(12)
    doc.autoTable({
      startY: 30,
      head: [["Sürücü Sicil No", "Yakınlık Katsayısı", "TOPSIS Puanı", "Sıra"]],
      body: topsisResults.map((result) => [result.driverId, result.closenessCoefficient.toFixed(4), (result.closenessCoefficient * 100).toFixed(2), result.rank]),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [23, 162, 184] },
      margin: { left: 14, right: 14 },
    })

    doc.save("TOPSIS_Sonuclari.pdf")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <Card className="card-shadow overflow-hidden border-0">
          <CardHeader className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground py-8">
            <CardTitle className="text-2xl font-bold">TOPSIS ile Sürücü Sıralaması</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Sürücü verilerini yükleyin ve AHP ağırlıklarını kullanarak TOPSIS sıralamasını hesaplayın.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            {error && (
              <Alert variant="destructive" className="mb-6 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert className="mb-6 rounded-xl bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/30">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                TOPSIS analizi için sürücü verilerini içeren bir Excel dosyası yükleyin. Dosyanızın ilk satırında
                'Sicil No', 'Sefer Sayısı', 'Yapılan Kilometre' ve diğer kriter başlıkları bulunmalıdır.
              </AlertDescription>
            </Alert>

            {!hasAhpWeights && (
              <Alert className="mb-6 rounded-xl bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/30">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <div className="space-y-3">
                    <p>AHP değerlendirmesi bulunamadı. İki seçeneğiniz var:</p>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-default-weights"
                        checked={useDefaultWeights}
                        onCheckedChange={(checked) => setUseDefaultWeights(checked === true)}
                      />
                      <Label htmlFor="use-default-weights" className="cursor-pointer">
                        <strong>Varsayılan Eşit Ağırlıkları Kullan</strong> - Tüm kriterler eşit önemde değerlendirilir ({(100 / leafCriteria.length).toFixed(1)}% her biri)
                      </Label>
                    </div>
                    <p className="text-sm">
                      Daha doğru sonuçlar için önce <strong>AHP değerlendirmesi</strong> yapmanız önerilir.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {hasAhpWeights && (
              <Alert className="mb-6 rounded-xl bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/30">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  AHP değerlendirmesi başarıyla yüklendi. Kriter ağırlıkları hesaplanmış durumda.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-4 items-end mb-8">
              <div className="flex flex-col flex-1">
                <Label htmlFor="data-upload">Sürücü Verilerini Yükle (Excel)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="data-upload"
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('data-upload')?.click()}
                    className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg"
                    disabled={loading}
                  >
                    Dosya Seç
                  </Button>
                  <span className="text-sm text-gray-500 truncate max-w-[180px]">
                    {selectedFileName || "Dosya seçilmedi"}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleCalculateTOPSIS}
                disabled={loading || driversData.length === 0 || selectedCriteria.length === 0}
                className="h-10 px-6 text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-md disabled:bg-gray-300 disabled:text-gray-500"
              >
                {loading ? "Hesaplanıyor..." : "TOPSIS Sıralamasını Hesapla"}
              </Button>
            </div>

            {driversData.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Yüklenen Sürücü Verileri ({driversData.length} Kayıt)</h3>
                <div className="max-h-60 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sicil No</TableHead>
                        <TableHead>Sefer Sayısı</TableHead>
                        <TableHead>Kilometre</TableHead>
                        {leafCriteria.map((criterion) => (
                          <TableHead key={criterion.id}>{criterion.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {driversData.slice(0, 5).map((driver, index) => (
                        <TableRow key={index}>
                          <TableCell>{driver.driverId}</TableCell>
                          <TableCell>{driver.tripCount}</TableCell>
                          <TableCell>{driver.distance}</TableCell>
                          {leafCriteria.map((criterion) => (
                            <TableCell key={criterion.id}>{driver[criterion.id]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {driversData.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={leafCriteria.length + 3} className="text-center text-muted-foreground">
                            ... {driversData.length - 5} diğer kayıtlar
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {Object.keys(ahpWeights).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">AHP Global Kriter Ağırlıkları</h3>
                <Table className="mb-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kriter</TableHead>
                      <TableHead className="text-right">Ağırlık</TableHead>
                      <TableHead className="text-center">Seç</TableHead>
                      <TableHead className="text-center">Tip</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leafCriteria.map((criterion) => (
                      <TableRow key={criterion.id}>
                        <TableCell className="font-medium">{criterion.name}</TableCell>
                        <TableCell className="text-right">
                          {(ahpWeights[criterion.id] * 100 || 0).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedCriteria.includes(criterion.id)}
                            onCheckedChange={(checked: boolean) => handleCriterionToggle(criterion.id, checked)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Select
                            value={criteriaTypes[criterion.id] ? "benefit" : "cost"}
                            onValueChange={(value) => handleCriterionTypeChange(criterion.id, value)}
                          >
                            <SelectTrigger className="w-[100px] mx-auto">
                              <SelectValue placeholder="Tip" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="benefit">Fayda</SelectItem>
                              <SelectItem value="cost">Maliyet</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/30">
                  <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    Her kriterin 'Fayda' (daha yüksek daha iyi) veya 'Maliyet' (daha düşük daha iyi) tipi TOPSIS
                    hesaplaması için önemlidir. Lütfen doğru seçimi yapın.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {topsisResults.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">TOPSIS Sonuçları</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sıra</TableHead>
                      <TableHead>Sürücü Sicil No</TableHead>
                      <TableHead className="text-right">Yakınlık Katsayısı (C*)</TableHead>
                      <TableHead className="text-right">TOPSIS Puanı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topsisResults.map((result) => (
                      <TableRow key={result.driverId}>
                        <TableCell className="font-medium">{result.rank}</TableCell>
                        <TableCell>{result.driverId}</TableCell>
                        <TableCell className="text-right">{result.closenessCoefficient.toFixed(4)}</TableCell>
                        <TableCell className="text-right">{(result.closenessCoefficient * 100).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                  <Button onClick={exportTopsisToExcel} className="flex items-center gap-2">
                    <Download className="h-4 w-4" /> Excel Olarak İndir
                  </Button>
                  <Button onClick={exportTopsisToPDF} className="flex items-center gap-2">
                    <Download className="h-4 w-4" /> PDF Olarak İndir
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
