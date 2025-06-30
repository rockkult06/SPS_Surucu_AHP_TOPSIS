"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Download, Info, CheckCircle } from "lucide-react"
import * as XLSX from "xlsx"
import { getLeafCriteria, getCriteriaPath, criteriaHierarchy } from "@/lib/criteria-hierarchy"

interface AHPResult {
  evaluatorName: string
  mainCriteriaWeights: Record<string, number>
  subCriteriaWeights: Record<string, Record<string, number>>
  subSubCriteriaWeights?: Record<string, Record<string, number>>
  subSubSubCriteriaWeights?: Record<string, Record<string, number>>
  leafCriteriaWeights: Record<string, number>
  consistencyRatios: Record<string, number>
}

export default function AggregateWeightsPage() {
  const router = useRouter()
  const [ahpResults, setAhpResults] = useState<AHPResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedResults = localStorage.getItem("ahpResults")
    if (storedResults) {
      try {
        const parsedResults: AHPResult = JSON.parse(storedResults)
        setAhpResults(parsedResults)
      } catch (e) {
        console.error("Error parsing AHP results from localStorage:", e)
        setError("Kayıtlı AHP sonuçları yüklenirken bir hata oluştu.")
      } finally {
        setLoading(false)
      }
    } else {
      setError(
        "Henüz hesaplanmış AHP sonucu bulunmamaktadır. Lütfen önce 'AHP Ölçme Aracı' sayfasında değerlendirme yapın.",
      )
      setLoading(false)
    }
  }, [])

  const leafCriteria = useMemo(() => getLeafCriteria(), [])

  const getCriterionDisplayName = useCallback((id: string) => {
    return criteriaHierarchy[id]?.name || id
  }, [])

  const getCriterionPathNames = useCallback((id: string) => {
    const pathIds = getCriteriaPath(id)
    return pathIds.map((pathId) => criteriaHierarchy[pathId]?.name || pathId).join(" > ")
  }, [])

  const handleExportToExcel = useCallback(() => {
    if (!ahpResults) {
      setError("Dışa aktarılacak veri bulunamadı.")
      return
    }

    const dataToExport = Object.entries(ahpResults.leafCriteriaWeights)
      .sort(([idA], [idB]) => getCriterionDisplayName(idA).localeCompare(getCriterionDisplayName(idB)))
      .map(([id, weight]) => ({
        Kriter: getCriterionDisplayName(id),
        "Kriter Yolu": getCriterionPathNames(id),
        Ağırlık: weight,
        "Ağırlık (%)": (weight * 100).toFixed(2) + "%",
      }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "AHP Ağırlıkları")
    XLSX.writeFile(wb, "AHP_Agirliklari.xlsx")
  }, [ahpResults, getCriterionDisplayName, getCriterionPathNames])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Progress value={50} className="w-1/2" />
        <p className="ml-4 text-lg">Sonuçlar yükleniyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="card-shadow overflow-hidden border-0">
          <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-primary-foreground py-8">
            <CardTitle className="text-2xl font-bold">Hata</CardTitle>
            <CardDescription className="text-primary-foreground/90">{error}</CardDescription>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Lütfen AHP değerlendirmesini tamamladığınızdan emin olun.</p>
            <Button onClick={() => router.push("/comparison")} className="mt-4">
              AHP Ölçme Aracına Git
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ahpResults) {
    return null // Should not happen due to error handling above, but for type safety
  }

  const sortedLeafWeights = Object.entries(ahpResults.leafCriteriaWeights)
    .sort(([, weightA], [, weightB]) => weightB - weightA) // Sort by weight descending
    .map(([id, weight]) => ({
      id,
      name: getCriterionDisplayName(id),
      path: getCriterionPathNames(id),
      weight,
    }))

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="card-shadow overflow-hidden border-0">
        <CardHeader className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground py-8">
          <CardTitle className="text-2xl font-bold">Toplu Kriter Ağırlıkları</CardTitle>
          <CardDescription className="text-primary-foreground/90">
            AHP analizi sonucunda hesaplanan tüm yaprak kriterlerin nihai ağırlıkları.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="text-lg font-semibold">
              Değerlendirmeyi Yapan: <span className="font-normal">{ahpResults.evaluatorName}</span>
            </div>
            <Button onClick={handleExportToExcel} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Excel'e Aktar
            </Button>
          </div>

          <Separator className="my-6" />

          <h3 className="text-xl font-semibold mb-4">Yaprak Kriter Ağırlıkları</h3>
          <div className="space-y-4">
            {sortedLeafWeights.map((criterion) => (
              <div key={criterion.id} className="flex items-center gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-1">
                        <span className="font-medium">{criterion.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({criterion.path})</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{criterion.path}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="w-48">
                  <Progress value={criterion.weight * 100} className="h-2" />
                </div>
                <div className="font-semibold text-right w-16">{(criterion.weight * 100).toFixed(2)}%</div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <h3 className="text-xl font-semibold mb-4">Tutarlılık Oranları (CR)</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kriter Seviyesi</TableHead>
                <TableHead className="text-right">Tutarlılık Oranı (CR)</TableHead>
                <TableHead className="text-right">Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(ahpResults.consistencyRatios).map(([levelId, cr]) => {
                const isConsistent = cr < 0.1
                const levelName = criteriaHierarchy[levelId]?.name || "Ana Kriterler"
                return (
                  <TableRow key={levelId}>
                    <TableCell className="font-medium">{levelName}</TableCell>
                    <TableCell className="text-right">{(cr * 100).toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isConsistent
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {isConsistent ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" /> Tutarlı
                          </>
                        ) : (
                          <>
                            <Info className="h-3 w-3 mr-1" /> Tutarsız
                          </>
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <p className="text-sm text-muted-foreground mt-4">
            Tutarlılık Oranı (CR) 0.10'dan küçük veya eşit olmalıdır. Daha yüksek bir değer, karşılaştırmalarınızda
            tutarsızlık olduğunu gösterir.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
