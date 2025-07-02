"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Download, Info, CheckCircle, Trash2, Users } from "lucide-react"
import * as XLSX from "xlsx"
import { getLeafCriteria, getCriteriaPath, criteriaHierarchy } from "@/lib/criteria-hierarchy"

interface AHPEvaluation {
  id: string
  evaluatorName: string
  globalWeights: Record<string, number>
  date: string
  mainCR: number
  isOverallConsistent: boolean
  createdAt: string
}

export default function AggregateWeightsPage() {
  const router = useRouter()
  const [evaluations, setEvaluations] = useState<AHPEvaluation[]>([])
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([])
  const [averageWeights, setAverageWeights] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const leafCriteria = useMemo(() => getLeafCriteria(), [])

  const getCriterionDisplayName = useCallback((id: string) => {
    return criteriaHierarchy[id]?.name || id
  }, [])

  const getCriterionPathNames = useCallback((id: string) => {
    const pathIds = getCriteriaPath(id)
    return pathIds.map((pathId) => criteriaHierarchy[pathId]?.name || pathId).join(" > ")
  }, [])

  // Veritabanından değerlendirmeleri yükle
  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        const response = await fetch('/api/ahp-evaluations')
        if (response.ok) {
          const data = await response.json()
          setEvaluations(data.evaluations || [])
        } else {
          setError("Değerlendirmeler yüklenirken hata oluştu.")
        }
      } catch (e) {
        console.error("Değerlendirmeler yüklenirken hata:", e)
        setError("Değerlendirmeler yüklenirken hata oluştu.")
      } finally {
        setLoading(false)
      }
    }

    loadEvaluations()
  }, [])

  // Seçilen değerlendirmelerin ortalama ağırlıklarını hesapla
  useEffect(() => {
    if (selectedEvaluations.length === 0) {
      setAverageWeights({})
      return
    }

    const selectedEvals = evaluations.filter(eval => selectedEvaluations.includes(eval.id))
    if (selectedEvals.length === 0) return

    const avgWeights: Record<string, number> = {}
    
    // Her kriter için ortalama hesapla
    leafCriteria.forEach(criterion => {
      const weights = selectedEvals
        .map(eval => eval.globalWeights[criterion.id] || 0)
        .filter(weight => weight > 0)
      
      if (weights.length > 0) {
        avgWeights[criterion.id] = weights.reduce((sum, weight) => sum + weight, 0) / weights.length
      }
    })

    setAverageWeights(avgWeights)
  }, [selectedEvaluations, evaluations, leafCriteria])

  const handleEvaluationToggle = (evaluationId: string, checked: boolean) => {
    setSelectedEvaluations(prev => 
      checked 
        ? [...prev, evaluationId]
        : prev.filter(id => id !== evaluationId)
    )
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedEvaluations(checked ? evaluations.map(eval => eval.id) : [])
  }

  const handleDeleteEvaluation = async (evaluationId: string) => {
    try {
      const response = await fetch(`/api/ahp-evaluations?id=${evaluationId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setEvaluations(prev => prev.filter(eval => eval.id !== evaluationId))
        setSelectedEvaluations(prev => prev.filter(id => id !== evaluationId))
      } else {
        alert("Değerlendirme silinirken hata oluştu.")
      }
    } catch (error) {
      console.error("Silme hatası:", error)
      alert("Değerlendirme silinirken hata oluştu.")
    }
  }

  const handleSaveAverageWeights = () => {
    if (Object.keys(averageWeights).length === 0) {
      alert("Ortalama hesaplanacak değerlendirme seçin.")
      return
    }

    // Ortalama ağırlıkları localStorage'a kaydet (TOPSIS'te kullanılmak üzere)
    const avgResults = {
      globalWeights: averageWeights,
      evaluatorName: `Toplu Ortalama (${selectedEvaluations.length} değerlendirme)`,
      date: new Date().toISOString(),
      isOverallConsistent: true
    }

    localStorage.setItem("ahpResults", JSON.stringify(avgResults))
    alert("Ortalama ağırlıklar TOPSIS için kaydedildi!")
  }

  const handleExportToExcel = useCallback(() => {
    if (Object.keys(averageWeights).length === 0) {
      setError("Dışa aktarılacak ortalama ağırlık bulunamadı.")
      return
    }

    const dataToExport = Object.entries(averageWeights)
      .sort(([idA], [idB]) => getCriterionDisplayName(idA).localeCompare(getCriterionDisplayName(idB)))
      .map(([id, weight]) => ({
        Kriter: getCriterionDisplayName(id),
        "Kriter Yolu": getCriterionPathNames(id),
        Ağırlık: weight,
        "Ağırlık (%)": (weight * 100).toFixed(2) + "%",
      }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Toplu AHP Ağırlıkları")
    XLSX.writeFile(wb, "Toplu_AHP_Agirliklari.xlsx")
  }, [averageWeights, getCriterionDisplayName, getCriterionPathNames])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <Progress value={50} className="w-1/2" />
        <p className="ml-4 text-lg">Değerlendirmeler yükleniyor...</p>
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
            <p className="text-muted-foreground">Lütfen AHP değerlendirmelerinin yüklendiğinden emin olun.</p>
            <Button onClick={() => router.push("/hierarchical-comparison")} className="mt-4">
              AHP Ölçme Aracına Git
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card className="card-shadow overflow-hidden border-0">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-primary-foreground py-8">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Toplu AHP Ağırlıkları
          </CardTitle>
          <CardDescription className="text-primary-foreground/90">
            Farklı değerlendiricilerin AHP ağırlıklarını yönetin ve ortalamalarını hesaplayın.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          {/* Değerlendirme Listesi */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">AHP Değerlendirmeleri ({evaluations.length})</h3>
              <div className="flex gap-2">
                <Button onClick={() => handleSelectAll(true)} variant="outline" size="sm">
                  Tümünü Seç
                </Button>
                <Button onClick={() => handleSelectAll(false)} variant="outline" size="sm">
                  Seçimi Temizle
                </Button>
              </div>
            </div>
            
            {evaluations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Info className="h-12 w-12 text-gray-400 mb-4 mx-auto" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Henüz AHP Değerlendirmesi Yok</h3>
                  <p className="text-gray-500 mb-4">
                    AHP ağırlıklarını hesaplamak için önce değerlendirme yapın.
                  </p>
                  <Button onClick={() => router.push("/hierarchical-comparison")}>
                    AHP Değerlendirmesi Yap
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Seç</TableHead>
                    <TableHead>Değerlendirici</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tutarlılık (CR)</TableHead>
                    <TableHead>Tutarlı mı?</TableHead>
                    <TableHead className="w-16">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map(evaluation => (
                    <TableRow key={evaluation.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEvaluations.includes(evaluation.id)}
                          onCheckedChange={(checked) => handleEvaluationToggle(evaluation.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{evaluation.evaluatorName}</TableCell>
                      <TableCell>{new Date(evaluation.date).toLocaleDateString()}</TableCell>
                      <TableCell>{(evaluation.mainCR * 100).toFixed(2)}%</TableCell>
                      <TableCell>
                        {evaluation.isOverallConsistent ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-red-600">Tutarsız</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvaluation(evaluation.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <Separator className="my-8" />

          {/* Ortalama Ağırlıklar */}
          {selectedEvaluations.length > 0 && Object.keys(averageWeights).length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Ortalama Kriter Ağırlıkları ({selectedEvaluations.length} değerlendirme)
                </h3>
                <div className="flex gap-2">
                  <Button onClick={handleSaveAverageWeights} className="bg-green-600 hover:bg-green-700">
                    TOPSIS için Kaydet
                  </Button>
                  <Button onClick={handleExportToExcel} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Excel'e Aktar
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kriter</TableHead>
                    <TableHead>Kriter Yolu</TableHead>
                    <TableHead className="text-right">Ağırlık</TableHead>
                    <TableHead className="text-right">Ağırlık (%)</TableHead>
                    <TableHead className="w-32">Görsel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(averageWeights)
                    .sort(([, a], [, b]) => b - a)
                    .map(([criterionId, weight]) => (
                      <TableRow key={criterionId}>
                        <TableCell className="font-medium">
                          {getCriterionDisplayName(criterionId)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getCriterionPathNames(criterionId)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {weight.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {(weight * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <Progress 
                            value={weight * 100} 
                            className="h-2" 
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}

          {selectedEvaluations.length === 0 && (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-gray-400 mb-4 mx-auto" />
              <p className="text-gray-500">
                Ortalama ağırlıkları görmek için değerlendirme seçin.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
