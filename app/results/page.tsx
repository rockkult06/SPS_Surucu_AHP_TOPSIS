"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Download, BarChart } from "lucide-react"
import { motion } from "framer-motion"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"
import type { HierarchicalAHPResults } from "@/lib/ahp"
import { criteriaHierarchy } from "@/lib/criteria-hierarchy"

type AHPResultsPageProps = {}

export default function AHPResultsPage({}: AHPResultsPageProps) {
  const router = useRouter()
  const [ahpResults, setAhpResults] = useState<HierarchicalAHPResults | null>(null)
  const [evaluatorName, setEvaluatorName] = useState<string | null>(null)
  const [calculationDate, setCalculationDate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedResults = localStorage.getItem("ahpResults")
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults)
        setAhpResults(parsedResults)
        setEvaluatorName(parsedResults.evaluatorName || "Bilinmiyor")
        setCalculationDate(parsedResults.date ? new Date(parsedResults.date).toLocaleString() : "Bilinmiyor")
      } catch (e) {
        console.error("Error parsing AHP results from localStorage:", e)
        setError("Kaydedilmiş AHP sonuçları yüklenirken bir hata oluştu.")
      }
    } else {
      setError("Henüz hesaplanmış bir AHP sonucu bulunmamaktadır.")
    }
  }, [])

  const globalWeightsChartData = useMemo(() => {
    if (!ahpResults?.globalWeights) return []
    return Object.entries(ahpResults.globalWeights)
      .map(([id, weight]) => ({
        name: criteriaHierarchy[id as keyof typeof criteriaHierarchy]?.name || id,
        weight: Number.parseFloat(((weight as number) * 100).toFixed(2)), // Convert to percentage
      }))
      .sort((a, b) => b.weight - a.weight) // Sort by weight descending
  }, [ahpResults])

  const exportToExcel = () => {
    if (!ahpResults) {
      setError("Dışa aktarılacak sonuç bulunamadı.")
      return
    }

    const data = []

    // General Info
    data.push(["Değerlendirmeyi Yapan:", evaluatorName])
    data.push(["Hesaplama Tarihi:", calculationDate])
    data.push([]) // Empty row for spacing

    // Global Weights (Ana sonuçlar)
    data.push(["Global Kriter Ağırlıkları"])
    data.push(["Kriter", "Ağırlık (%)"])
    globalWeightsChartData.forEach((item: { name: string; weight: number }) => {
      data.push([item.name, item.weight.toFixed(2)])
    })
    data.push([])

    // Consistency Info
    data.push(["Tutarlılık Bilgisi"])
    data.push(["Ana Kriterler CR:", (ahpResults.mainCR * 100).toFixed(2) + "%"])
    data.push(["Ana Kriterler Tutarlı mı?:", ahpResults.mainConsistent ? "Evet" : "Hayır"])
    
    // Sub-criteria consistency
    for (const parentId in ahpResults.subCRs) {
      const parentName = criteriaHierarchy[parentId as keyof typeof criteriaHierarchy]?.name || parentId
      data.push([`${parentName} CR:`, (ahpResults.subCRs[parentId] * 100).toFixed(2) + "%"])
      data.push([`${parentName} Tutarlı mı?:`, ahpResults.subConsistent[parentId] ? "Evet" : "Hayır"])
    }
    
    // Sub-sub-criteria consistency
    for (const parentId in ahpResults.subSubCRs) {
      const parentName = criteriaHierarchy[parentId as keyof typeof criteriaHierarchy]?.name || parentId
      data.push([`${parentName} Alt-Alt CR:`, (ahpResults.subSubCRs[parentId] * 100).toFixed(2) + "%"])
      data.push([`${parentName} Alt-Alt Tutarlı mı?:`, ahpResults.subSubConsistent[parentId] ? "Evet" : "Hayır"])
    }
    
    data.push(["Genel Tutarlılık:", ahpResults.isOverallConsistent ? "Evet" : "Hayır"])

    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "AHP Sonuçları")
    XLSX.writeFile(wb, "AHP_Sonuclari.xlsx")
  }

  const exportToPDF = () => {
    if (!ahpResults) {
      setError("Dışa aktarılacak sonuç bulunamadı.")
      return
    }

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text("AHP Hesaplama Sonuçları", 14, 22)

    doc.setFontSize(12)
    doc.text(`Değerlendirmeyi Yapan: ${evaluatorName}`, 14, 32)
    doc.text(`Hesaplama Tarihi: ${calculationDate}`, 14, 39)

    let yPos = 50

    // Global Weights
    doc.setFontSize(14)
    doc.text("Global Kriter Ağırlıkları", 14, yPos)
    yPos += 7
    doc.setFontSize(10)
    doc.autoTable({
      startY: yPos,
      head: [["Kriter", "Ağırlık (%)"]],
      body: globalWeightsChartData.map((item: { name: string; weight: number }) => [item.name, item.weight.toFixed(2)]),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [23, 162, 184] },
      margin: { left: 14, right: 14 },
    })
    yPos = (doc as any).lastAutoTable.finalY + 10

    // Consistency Information
    doc.setFontSize(14)
    doc.text("Tutarlılık Bilgisi", 14, yPos)
    yPos += 10
    doc.setFontSize(10)
    doc.text(`Ana Kriterler CR: ${(ahpResults.mainCR * 100).toFixed(2)}%`, 14, yPos)
    yPos += 5
    doc.text(`Ana Kriterler Tutarlı mı?: ${ahpResults.mainConsistent ? "Evet" : "Hayır"}`, 14, yPos)
    yPos += 5

    // Sub-criteria consistency
    for (const parentId in ahpResults.subCRs) {
      const parentName = criteriaHierarchy[parentId as keyof typeof criteriaHierarchy]?.name || parentId
      doc.text(`${parentName} CR: ${(ahpResults.subCRs[parentId] * 100).toFixed(2)}%`, 14, yPos)
      yPos += 5
      doc.text(`${parentName} Tutarlı mı?: ${ahpResults.subConsistent[parentId] ? "Evet" : "Hayır"}`, 14, yPos)
      yPos += 5
    }

    // Sub-sub-criteria consistency  
    for (const parentId in ahpResults.subSubCRs) {
      const parentName = criteriaHierarchy[parentId as keyof typeof criteriaHierarchy]?.name || parentId
      doc.text(`${parentName} Alt-Alt CR: ${(ahpResults.subSubCRs[parentId] * 100).toFixed(2)}%`, 14, yPos)
      yPos += 5
      doc.text(`${parentName} Alt-Alt Tutarlı mı?: ${ahpResults.subSubConsistent[parentId] ? "Evet" : "Hayır"}`, 14, yPos)
      yPos += 5
    }

    doc.text(`Genel Tutarlılık: ${ahpResults.isOverallConsistent ? "Evet" : "Hayır"}`, 14, yPos)

    doc.save("AHP_Sonuclari.pdf")
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => router.push("/hierarchical-comparison")}>Yeni Hesaplama Yap</Button>
        </div>
      </div>
    )
  }

  if (!ahpResults) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Sonuçlar Yükleniyor...</p>
        </div>
      </div>
    )
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
            <CardTitle className="text-2xl font-bold">AHP Hesaplama Sonuçları</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Hiyerarşik Analitik Hiyerarşi Prosesi (AHP) sonuçları aşağıda gösterilmiştir.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="mb-6 space-y-2">
              <p>
                <span className="font-semibold">Değerlendirmeyi Yapan:</span> {evaluatorName}
              </p>
              <p>
                <span className="font-semibold">Hesaplama Tarihi:</span> {calculationDate}
              </p>
            </div>

            {!ahpResults.isOverallConsistent && (
              <Alert variant="destructive" className="mb-6 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Tutarsızlık Uyarısı!</AlertTitle>
                <AlertDescription>
                  Hesaplamalarınızda tutarsızlık tespit edildi. Tutarlılık oranının %10'un altında olması önerilir.
                  Lütfen karşılaştırmalarınızı gözden geçirin.
                </AlertDescription>
              </Alert>
            )}

            <h3 className="text-xl font-semibold mb-4">Global Kriter Ağırlıkları</h3>
            <Table className="mb-8">
              <TableHeader>
                <TableRow>
                  <TableHead>Kriter</TableHead>
                  <TableHead className="text-right">Ağırlık (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {globalWeightsChartData.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.weight.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <h3 className="text-xl font-semibold mb-4">Tutarlılık Oranları</h3>
            <Table className="mb-8">
              <TableHeader>
                <TableRow>
                  <TableHead>Kriter Seviyesi</TableHead>
                  <TableHead className="text-right">Tutarlılık Oranı (CR)</TableHead>
                  <TableHead className="text-right">Tutarlı mı?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Ana Kriterler</TableCell>
                  <TableCell className="text-right">{(ahpResults.mainCR * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-right">
                    {ahpResults.mainConsistent ? (
                      <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 inline-block" />
                    )}
                  </TableCell>
                </TableRow>
                {Object.keys(ahpResults.subCRs).map((parentId) => (
                  <TableRow key={parentId}>
                    <TableCell className="font-medium">
                      {criteriaHierarchy[parentId as keyof typeof criteriaHierarchy]?.name} Alt Kriterleri
                    </TableCell>
                    <TableCell className="text-right">{(ahpResults.subCRs[parentId] * 100).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      {ahpResults.subConsistent[parentId] ? (
                        <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 inline-block" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {Object.keys(ahpResults.subSubCRs).map((parentId) => (
                  <TableRow key={parentId}>
                    <TableCell className="font-medium">
                      {criteriaHierarchy[parentId as keyof typeof criteriaHierarchy]?.name} Alt-Alt Kriterleri
                    </TableCell>
                    <TableCell className="text-right">{(ahpResults.subSubCRs[parentId] * 100).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      {ahpResults.subSubConsistent[parentId] ? (
                        <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 inline-block" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>Genel Tutarlılık</TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right">
                    {ahpResults.isOverallConsistent ? (
                      <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 inline-block" />
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <h3 className="text-xl font-semibold mb-4">Global Ağırlıkların Grafiği</h3>
            <div className="h-[300px] w-full">
              <ChartContainer
                config={{
                  weight: {
                    label: "Ağırlık (%)",
                    color: "hsl(var(--primary))",
                  },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={globalWeightsChartData} layout="vertical" margin={{ left: 100, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" dataKey="weight" />
                    <YAxis type="category" dataKey="name" width={100} tickFormatter={(value) => value.split(" ")[0]} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="weight" fill="var(--color-weight)" radius={5} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
          <CardContent className="p-8 border-t flex flex-wrap gap-4 justify-center">
            <Button onClick={exportToExcel} className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Excel Olarak İndir
            </Button>
            <Button onClick={exportToPDF} className="flex items-center gap-2">
              <Download className="h-4 w-4" /> PDF Olarak İndir
            </Button>
            <Button onClick={() => router.push("/topsis")} className="flex items-center gap-2">
              <BarChart className="h-4 w-4" /> TOPSIS Hesapla
            </Button>
            <Button onClick={() => router.push("/hierarchical-comparison")} variant="outline">
              Yeni AHP Hesaplaması Yap
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
