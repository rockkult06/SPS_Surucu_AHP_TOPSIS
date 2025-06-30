"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download, Info } from "lucide-react"
import { motion } from "framer-motion"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { getLeafCriteria, getExcelColumnMappings, getCriteriaBenefitType } from "@/lib/criteria-hierarchy"
import { calculateTOPSIS, type DriverData, type TOPSISResult } from "@/lib/topsis"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TOPSISPage() {
  const [driversData, setDriversData] = useState<DriverData[]>([])
  const [ahpWeights, setAhpWeights] = useState<Record<string, number>>({})
  const [topsisResults, setTopsisResults] = useState<TOPSISResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([])
  const [criteriaTypes, setCriteriaTypes] = useState<Record<string, boolean>>({}) // true for benefit, false for cost

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
          // Initialize selected criteria and types based on AHP weights
          const initialSelected = Object.keys(parsedResults.globalWeights)
          setSelectedCriteria(initialSelected)

          const initialTypes: Record<string, boolean> = {}
          initialSelected.forEach((id) => {
            initialTypes[id] = getCriteriaBenefitType(id) || false // Default to cost if not specified
          })
          setCriteriaTypes(initialTypes)
        }
      } catch (e) {
        console.error("Error loading AHP weights from localStorage:", e)
        setError("AHP ağırlıkları yüklenirken bir hata oluştu.")
      }
    } else {
      setError("Lütfen önce AHP hesaplamasını tamamlayın.")
    }
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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

        const processedData: DriverData[] = json.map((row) => {
          const driver: DriverData = {
            driverId: row[excelColumnMappings.SicilNo] || "Bilinmiyor",
            tripCount: row[excelColumnMappings["Sefer Sayısı"]] || 0,
            distance: row[excelColumnMappings["Yapılan Kilometre"]] || 0,
          }

          leafCriteria.forEach((criterion) => {
            const excelHeader = Object.keys(excelColumnMappings).find(
              (key) => excelColumnMappings[key] === criterion.id,
            )
            if (excelHeader && row[excelHeader] !== undefined) {
              driver[criterion.id] = Number.parseFloat(row[excelHeader]) || 0
            } else {
              driver[criterion.id] = 0 // Ensure all criteria have a numeric value
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

  const handleCalculateTOPSIS = () => {
    if (driversData.length === 0) {
      setError("Lütfen önce sürücü verilerini yükleyin.")
      return
    }
    if (Object.keys(ahpWeights).length === 0) {
      setError("AHP ağırlıkları yüklenemedi. Lütfen AHP hesaplamasını tamamlayın.")
      return
    }
    if (selectedCriteria.length === 0) {
      setError("Lütfen TOPSIS hesaplaması için en az bir kriter seçin.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Filter weights and criteria types based on selected criteria
      const filteredWeights: Record<string, number> = {}
      const filteredDriversData = driversData.map((driver) => {
        const newDriver: DriverData = {
          driverId: driver.driverId,
          tripCount: driver.tripCount,
          distance: driver.distance,
        }
        selectedCriteria.forEach((criterionId) => {
          filteredWeights[criterionId] = ahpWeights[criterionId] || 0
          newDriver[criterionId] = driver[criterionId] || 0
        })
        return newDriver
      })

      const results = calculateTOPSIS(filteredDriversData, filteredWeights)
      setTopsisResults(results)
    } catch (err) {
      console.error("Error calculating TOPSIS:", err)
      setError("TOPSIS hesaplaması sırasında bir hata oluştu.")
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

    const data = []
    data.push(["Sürücü Sicil No", "Yakınlık Katsayısı", "Sıra"])
    topsisResults.forEach((result) => {
      data.push([result.driverId, result.closenessCoefficient.toFixed(4), result.rank])
    })

    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "TOPSIS Sonuçları")
    XLSX.writeFile(wb, "TOPSIS_Sonuclari.xlsx")
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
      head: [["Sürücü Sicil No", "Yakınlık Katsayısı", "Sıra"]],
      body: topsisResults.map((result) => [result.driverId, result.closenessCoefficient.toFixed(4), result.rank]),
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
                'SicilNo', 'Sefer Sayısı', 'Yapılan Kilometre' ve diğer kriter başlıkları bulunmalıdır.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 mb-8">
              <Label htmlFor="data-upload">Sürücü Verilerini Yükle (Excel)</Label>
              <Input id="data-upload" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading} />
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

            <div className="flex justify-center">
              <Button
                onClick={handleCalculateTOPSIS}
                disabled={loading || driversData.length === 0 || selectedCriteria.length === 0}
              >
                {loading ? "Hesaplanıyor..." : "TOPSIS Sıralamasını Hesapla"}
              </Button>
            </div>

            {topsisResults.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">TOPSIS Sonuçları</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sıra</TableHead>
                      <TableHead>Sürücü Sicil No</TableHead>
                      <TableHead className="text-right">Yakınlık Katsayısı (C*)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topsisResults.map((result) => (
                      <TableRow key={result.driverId}>
                        <TableCell className="font-medium">{result.rank}</TableCell>
                        <TableCell>{result.driverId}</TableCell>
                        <TableCell className="text-right">{result.closenessCoefficient.toFixed(4)}</TableCell>
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
