"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download, Search, Filter, SortAsc, SortDesc, XCircle, Info } from "lucide-react"
import { motion } from "framer-motion"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"
import type { HierarchicalAHPResults } from "@/lib/ahp"
import type { TOPSISResult } from "@/lib/topsis"
import { criteriaHierarchy } from "@/lib/criteria-hierarchy"

interface StoredAHPResult extends HierarchicalAHPResults {
  evaluatorName: string
  date: string
}

interface StoredTOPSISResult {
  driversData: any[] // Raw data used for TOPSIS
  topsisResults: TOPSISResult[]
  evaluatorName: string
  date: string
}

type ResultType = "ahp" | "topsis"

export default function AllResultsPage() {
  const [ahpResults, setAhpResults] = useState<StoredAHPResult[]>([])
  const [topsisResults, setTopsisResults] = useState<StoredTOPSISResult[]>([])
  const [activeTab, setActiveTab] = useState<ResultType>("ahp")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load AHP results
    const storedAhp = localStorage.getItem("ahpResults")
    if (storedAhp) {
      try {
        const parsed = JSON.parse(storedAhp)
        // If it's a single object, wrap it in an array for consistency
        setAhpResults(Array.isArray(parsed) ? parsed : [parsed])
      } catch (e) {
        console.error("Error parsing AHP results from localStorage:", e)
        setError("Kaydedilmiş AHP sonuçları yüklenirken bir hata oluştu.")
      }
    }

    // Load TOPSIS results
    const storedTopsis = localStorage.getItem("topsisResults")
    if (storedTopsis) {
      try {
        const parsed = JSON.parse(storedTopsis)
        setTopsisResults(Array.isArray(parsed) ? parsed : [parsed])
      } catch (e) {
        console.error("Error parsing TOPSIS results from localStorage:", e)
        setError("Kaydedilmiş TOPSIS sonuçları yüklenirken bir hata oluştu.")
      }
    }
  }, [])

  const filteredAndSortedAhpResults = useMemo(() => {
    const filtered = ahpResults.filter((result) =>
      result.evaluatorName.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (sortBy === "date") {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      })
    } else if (sortBy === "overallConsistency") {
      filtered.sort((a, b) => {
        const valA = a.isOverallConsistent ? 1 : 0
        const valB = b.isOverallConsistent ? 1 : 0
        return sortOrder === "asc" ? valA - valB : valB - valA
      })
    }
    return filtered
  }, [ahpResults, searchTerm, sortBy, sortOrder])

  const filteredAndSortedTopsisResults = useMemo(() => {
    const filtered = topsisResults.filter((result) =>
      result.evaluatorName.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (sortBy === "date") {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      })
    } else if (sortBy === "driverCount") {
      filtered.sort((a, b) => {
        const valA = a.driversData.length
        const valB = b.driversData.length
        return sortOrder === "asc" ? valA - valB : valB - valA
      })
    }
    return filtered
  }, [topsisResults, searchTerm, sortBy, sortOrder])

  const handleClearResults = (type: ResultType) => {
    if (type === "ahp") {
      localStorage.removeItem("ahpResults")
      setAhpResults([])
    } else {
      localStorage.removeItem("topsisResults")
      setTopsisResults([])
    }
    setError(null)
  }

  const exportAhpToExcel = (result: StoredAHPResult) => {
    const data = []

    data.push(["Değerlendirmeyi Yapan:", result.evaluatorName])
    data.push(["Hesaplama Tarihi:", new Date(result.date).toLocaleString()])
    data.push([])

    data.push(["Ana Kriter Ağırlıkları"])
    data.push(["Kriter", "Ağırlık (%)"])
    result.mainWeights.forEach((weight, index) => {
      const criterionId = result.mainCriteria.ids[index]
      const criterionName = criteriaHierarchy[criterionId as keyof typeof criteriaHierarchy]?.name || criterionId
      data.push([criterionName, (weight * 100).toFixed(2)])
    })
    data.push(["Tutarlılık Oranı (CR):", (result.mainCR * 100).toFixed(2) + "%"])
    data.push(["Tutarlı mı?:", result.mainConsistent ? "Evet" : "Hayır"])
    data.push([])

    data.push(["Global Kriter Ağırlıkları"])
    data.push(["Kriter", "Ağırlık (%)"])
    Object.entries(result.globalWeights).forEach(([id, weight]) => {
      const criterionName = criteriaHierarchy[id as keyof typeof criteriaHierarchy]?.name || id
      data.push([criterionName, (weight * 100).toFixed(2)])
    })
    data.push(["Genel Tutarlılık:", result.isOverallConsistent ? "Evet" : "Hayır"])

    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "AHP Sonuçları")
    XLSX.writeFile(wb, `AHP_Sonucu_${result.evaluatorName}_${new Date(result.date).toLocaleDateString()}.xlsx`)
  }

  const exportTopsisToExcel = (result: StoredTOPSISResult) => {
    const data = []
    data.push(["Değerlendirmeyi Yapan:", result.evaluatorName])
    data.push(["Hesaplama Tarihi:", new Date(result.date).toLocaleString()])
    data.push([])

    data.push(["TOPSIS Sıralaması"])
    data.push(["Sıra", "Sürücü Sicil No", "Yakınlık Katsayısı"])
    result.topsisResults.forEach((topsisRes) => {
      data.push([topsisRes.rank, topsisRes.driverId, topsisRes.closenessCoefficient.toFixed(4)])
    })

    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "TOPSIS Sonuçları")
    XLSX.writeFile(wb, `TOPSIS_Sonucu_${result.evaluatorName}_${new Date(result.date).toLocaleDateString()}.xlsx`)
  }

  const exportAhpToPdf = (result: StoredAHPResult) => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("AHP Hesaplama Sonuçları", 14, 22)
    doc.setFontSize(12)
    doc.text(`Değerlendirmeyi Yapan: ${result.evaluatorName}`, 14, 32)
    doc.text(`Hesaplama Tarihi: ${new Date(result.date).toLocaleString()}`, 14, 39)

    let yPos = 45

    yPos += 10
    doc.setFontSize(14)
    doc.text("Ana Kriter Ağırlıkları", 14, yPos)
    yPos += 7
    doc.setFontSize(10)
    doc.autoTable({
      startY: yPos,
      head: [["Kriter", "Ağırlık (%)"]],
      body: result.mainWeights.map((weight, index) => {
        const criterionId = result.mainCriteria.ids[index]
        const criterionName = criteriaHierarchy[criterionId as keyof typeof criteriaHierarchy]?.name || criterionId
        return [criterionName, (weight * 100).toFixed(2)]
      }),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [23, 162, 184] },
      margin: { left: 14, right: 14 },
    })
    yPos = (doc as any).lastAutoTable.finalY + 5
    doc.text(`Tutarlılık Oranı (CR): ${(result.mainCR * 100).toFixed(2)}%`, 14, yPos)
    yPos += 5
    doc.text(`Tutarlı mı?: ${result.mainConsistent ? "Evet" : "Hayır"}`, 14, yPos)

    yPos += 10
    doc.setFontSize(14)
    doc.text("Global Kriter Ağırlıkları", 14, yPos)
    yPos += 7
    doc.setFontSize(10)
    doc.autoTable({
      startY: yPos,
      head: [["Kriter", "Ağırlık (%)"]],
      body: Object.entries(result.globalWeights).map(([id, weight]) => {
        const criterionName = criteriaHierarchy[id as keyof typeof criteriaHierarchy]?.name || id
        return [criterionName, (weight * 100).toFixed(2)]
      }),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [23, 162, 184] },
      margin: { left: 14, right: 14 },
    })
    yPos = (doc as any).lastAutoTable.finalY + 5
    doc.text(`Genel Tutarlılık: ${result.isOverallConsistent ? "Evet" : "Hayır"}`, 14, yPos)

    doc.save(`AHP_Sonucu_${result.evaluatorName}_${new Date(result.date).toLocaleDateString()}.pdf`)
  }

  const exportTopsisToPdf = (result: StoredTOPSISResult) => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text("TOPSIS Hesaplama Sonuçları", 14, 22)
    doc.setFontSize(12)
    doc.text(`Değerlendirmeyi Yapan: ${result.evaluatorName}`, 14, 32)
    doc.text(`Hesaplama Tarihi: ${new Date(result.date).toLocaleString()}`, 14, 39)

    doc.autoTable({
      startY: 45,
      head: [["Sıra", "Sürücü Sicil No", "Yakınlık Katsayısı"]],
      body: result.topsisResults.map((topsisRes) => [
        topsisRes.rank,
        topsisRes.driverId,
        topsisRes.closenessCoefficient.toFixed(4),
      ]),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [23, 162, 184] },
      margin: { left: 14, right: 14 },
    })

    doc.save(`TOPSIS_Sonucu_${result.evaluatorName}_${new Date(result.date).toLocaleDateString()}.pdf`)
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
            <CardTitle className="text-2xl font-bold">Tüm Hesaplama Sonuçları</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Kaydedilmiş AHP ve TOPSIS hesaplama sonuçlarını görüntüleyin, filtreleyin ve dışa aktarın.
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

            <div className="flex space-x-4 mb-6">
              <Button
                variant={activeTab === "ahp" ? "default" : "outline"}
                onClick={() => setActiveTab("ahp")}
                className="flex-1"
              >
                AHP Sonuçları ({ahpResults.length})
              </Button>
              <Button
                variant={activeTab === "topsis" ? "default" : "outline"}
                onClick={() => setActiveTab("topsis")}
                className="flex-1"
              >
                TOPSIS Sonuçları ({topsisResults.length})
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Değerlendirmeyi yapanı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground"
                    onClick={() => setSearchTerm("")}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Tarihe Göre</SelectItem>
                  {activeTab === "ahp" && <SelectItem value="overallConsistency">Tutarlılığa Göre</SelectItem>}
                  {activeTab === "topsis" && <SelectItem value="driverCount">Sürücü Sayısına Göre</SelectItem>}
                </SelectContent>
              </Select>
              <Button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} variant="outline">
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>

            {activeTab === "ahp" && (
              <>
                {filteredAndSortedAhpResults.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>Henüz kaydedilmiş AHP sonucu bulunmamaktadır.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    {filteredAndSortedAhpResults.map((result, index) => (
                      <Card key={index} className="border shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {result.evaluatorName} -{" "}
                            {new Date(result.date).toLocaleDateString("tr-TR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </CardTitle>
                          <CardDescription>
                            Genel Tutarlılık:{" "}
                            {result.isOverallConsistent ? (
                              <span className="text-green-600">Tutarlı</span>
                            ) : (
                              <span className="text-red-600">Tutarsız</span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <h4 className="font-semibold mb-2">Global Ağırlıklar (İlk 5)</h4>
                          <Table>
                            <TableBody>
                              {Object.entries(result.globalWeights)
                                .sort(([, wA], [, wB]) => wB - wA)
                                .slice(0, 5)
                                .map(([id, weight]) => (
                                  <TableRow key={id}>
                                    <TableCell>
                                      {criteriaHierarchy[id as keyof typeof criteriaHierarchy]?.name || id}
                                    </TableCell>
                                    <TableCell className="text-right">{(weight * 100).toFixed(2)}%</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                          <div className="flex gap-2 mt-4 justify-end">
                            <Button size="sm" onClick={() => exportAhpToExcel(result)}>
                              <Download className="h-4 w-4 mr-2" /> Excel
                            </Button>
                            <Button size="sm" onClick={() => exportAhpToPdf(result)}>
                              <Download className="h-4 w-4 mr-2" /> PDF
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {ahpResults.length > 0 && (
                  <div className="mt-6 text-center">
                    <Button variant="destructive" onClick={() => handleClearResults("ahp")}>
                      Tüm AHP Sonuçlarını Temizle
                    </Button>
                  </div>
                )}
              </>
            )}

            {activeTab === "topsis" && (
              <>
                {filteredAndSortedTopsisResults.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>Henüz kaydedilmiş TOPSIS sonucu bulunmamaktadır.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    {filteredAndSortedTopsisResults.map((result, index) => (
                      <Card key={index} className="border shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {result.evaluatorName} -{" "}
                            {new Date(result.date).toLocaleDateString("tr-TR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </CardTitle>
                          <CardDescription>Sürücü Sayısı: {result.driversData.length}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <h4 className="font-semibold mb-2">İlk 5 Sıralama</h4>
                          <Table>
                            <TableBody>
                              {result.topsisResults.slice(0, 5).map((topsisRes) => (
                                <TableRow key={topsisRes.driverId}>
                                  <TableCell>{topsisRes.rank}.</TableCell>
                                  <TableCell>{topsisRes.driverId}</TableCell>
                                  <TableCell className="text-right">
                                    {topsisRes.closenessCoefficient.toFixed(4)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <div className="flex gap-2 mt-4 justify-end">
                            <Button size="sm" onClick={() => exportTopsisToExcel(result)}>
                              <Download className="h-4 w-4 mr-2" /> Excel
                            </Button>
                            <Button size="sm" onClick={() => exportTopsisToPdf(result)}>
                              <Download className="h-4 w-4 mr-2" /> PDF
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {topsisResults.length > 0 && (
                  <div className="mt-6 text-center">
                    <Button variant="destructive" onClick={() => handleClearResults("topsis")}>
                      Tüm TOPSIS Sonuçlarını Temizle
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
