"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Info, AlertTriangle, Zap, Gauge, Clock, Users, ClockIcon, Car, FileWarning } from "lucide-react"
import { motion } from "framer-motion"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { initializeHierarchyData, getCriteriaDescriptions } from "@/lib/criteria-hierarchy"
import { calculateHierarchicalAHP } from "@/lib/ahp"
import type { JSX } from "react"
import { useLocalStorage, useLocalStorageItem } from "@/hooks/use-local-storage"

// Saaty scale values and their corresponding numeric values
const saatyValues = [
  { value: 9, label: "9", description: "Sol çok daha önemli" },
  { value: 7, label: "7", description: "Sol oldukça önemli" },
  { value: 5, label: "5", description: "Sol daha önemli" },
  { value: 3, label: "3", description: "Sol biraz önemli" },
  { value: 1, label: "1", description: "Eşit önemde" },
  { value: 1 / 3, label: "1/3", description: "Sağ biraz önemli" },
  { value: 1 / 5, label: "1/5", description: "Sağ daha önemli" },
  { value: 1 / 7, label: "1/7", description: "Sağ oldukça önemli" },
  { value: 1 / 9, label: "1/9", description: "Sağ çok daha önemli" },
]

// Map slider position (0-8) to Saaty value
const sliderPositionToSaatyValue = (position: number) => {
  return saatyValues[position].value
}

// Criteria icons mapping
const criteriaIcons: Record<string, JSX.Element> = {
  admin: <Users className="h-5 w-5 text-blue-500" />,
  technical: <Car className="h-5 w-5 text-green-500" />,
  attendance: <Users className="h-5 w-5 text-blue-500" />,
  overtime: <ClockIcon className="h-5 w-5 text-purple-500" />,
  accident: <AlertTriangle className="h-5 w-5 text-red-600" />,
  discipline: <FileWarning className="h-5 w-5 text-orange-500" />,
  acceleration: <Zap className="h-5 w-5 text-yellow-500" />,
  speed: <Gauge className="h-5 w-5 text-blue-500" />,
  engine: <AlertTriangle className="h-5 w-5 text-red-600" />,
  idle: <Clock className="h-5 w-5 text-green-500" />,
  normal_overtime: <Clock className="h-5 w-5 text-purple-500" />,
  weekend_overtime: <Clock className="h-5 w-5 text-purple-500" />,
  holiday_overtime: <Clock className="h-5 w-5 text-purple-500" />,
  fatal_accident: <AlertTriangle className="h-5 w-5 text-red-600" />,
  injury_accident: <AlertTriangle className="h-5 w-5 text-red-600" />,
  material_damage_accident: <AlertTriangle className="h-5 w-5 text-red-600" />,
  first_degree_dismissal: <FileWarning className="h-5 w-5 text-orange-500" />,
  second_degree_dismissal: <FileWarning className="h-5 w-5 text-orange-500" />,
  third_degree_dismissal: <FileWarning className="h-5 w-5 text-orange-500" />,
  fourth_degree_dismissal: <FileWarning className="h-5 w-5 text-orange-500" />,
  first_degree_penalty: <FileWarning className="h-5 w-5 text-red-500" />,
  second_degree_penalty: <FileWarning className="h-5 w-5 text-red-500" />,
  third_degree_penalty: <FileWarning className="h-5 w-5 text-red-500" />,
  fourth_degree_penalty: <FileWarning className="h-5 w-5 text-red-500" />,
}

export default function HierarchicalComparisonPage() {
  const router = useRouter()
  const [hierarchyData, setHierarchyData] = useState(initializeHierarchyData())
  const [sliderPositions, setSliderPositions] = useState<Record<string, any>>({})
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showNameInput, setShowNameInput] = useState(true)
  const [totalComparisons, setTotalComparisons] = useState(0)
  const [completedComparisons, setCompletedComparisons] = useState(0)
  const [criteriaDescriptions] = useState(getCriteriaDescriptions())

  // localStorage hooks
  const [evaluatorName, setEvaluatorName] = useLocalStorage("evaluatorName", "")
  const { removeItem: removeComparisonData } = useLocalStorageItem("hierarchicalComparisonData")

  // Karşılaştırma verilerini temizle ve toplam karşılaştırma sayısını hesapla
  useEffect(() => {
    if (showNameInput) return // Kullanıcı adı girilmediyse işlem yapma

    // Önceki karşılaştırma verilerini temizle
    removeComparisonData()

    // Calculate total number of comparisons needed
    let total = 0

    // Main criteria comparisons
    const mainSize = hierarchyData.mainCriteria.ids.length
    total += (mainSize * (mainSize - 1)) / 2

    // Sub-criteria comparisons
    Object.values(hierarchyData.subCriteria).forEach((level) => {
      const size = level.ids.length
      total += (size * (size - 1)) / 2
    })

    // Sub-sub-criteria comparisons
    Object.values(hierarchyData.subSubCriteria).forEach((level) => {
      const size = level.ids.length
      total += (size * (size - 1)) / 2
    })

    // Sub-sub-sub-criteria comparisons
    Object.values(hierarchyData.subSubSubCriteria || {}).forEach((level) => {
      const size = level.ids.length
      total += (size * (size - 1)) / 2
    })

    setTotalComparisons(total)
    setCompletedComparisons(0)
  }, [showNameInput, hierarchyData])

  // Kullanıcı adı giriş formu
  if (showNameInput) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="card-shadow overflow-hidden border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-primary-foreground py-8">
            <CardTitle className="text-2xl font-bold">AHP Değerlendirmesi</CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Lütfen değerlendirmeyi yapmak için adınızı girin.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={(e) => {
              e.preventDefault()
              if (evaluatorName.trim()) {
                setShowNameInput(false)
              }
            }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="evaluatorName">Adınız</Label>
                  <Input
                    id="evaluatorName"
                    placeholder="Adınızı girin"
                    value={evaluatorName}
                    onChange={(e) => setEvaluatorName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Değerlendirmeye Başla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSliderChange = (level: string, parentId: string | null, row: number, col: number, position: number) => {
    // Determine the key based on the level and parent
    let key = level
    if (level === "subCriteria" && parentId) {
      key = parentId
    } else if (level === "subSubCriteria" && parentId) {
      key = parentId
    }

    // Create position key
    const positionKey = `${row}-${col}`

    // Update slider positions
    const newSliderPositions = { ...sliderPositions }
    if (!newSliderPositions[level]) {
      newSliderPositions[level] = {}
    }
    if (!newSliderPositions[level][key]) {
      newSliderPositions[level][key] = {}
    }
    newSliderPositions[level][key][positionKey] = position
    setSliderPositions(newSliderPositions)

    // Update matrix in hierarchy data
    const newHierarchyData = { ...hierarchyData }
    let matrix

    if (level === "mainCriteria") {
      matrix = newHierarchyData.mainCriteria.matrix
    } else if (level === "subCriteria" && parentId) {
      matrix = newHierarchyData.subCriteria[parentId].matrix
    } else if (level === "subSubCriteria" && parentId) {
      matrix = newHierarchyData.subSubCriteria[parentId].matrix
    }

    if (matrix) {
      const value = sliderPositionToSaatyValue(position)
      matrix[row][col] = value
      matrix[col][row] = 1 / value
    }

    setHierarchyData(newHierarchyData)
    setError(null)

    // Save current state to localStorage
    saveComparisonData(newHierarchyData, newSliderPositions)
  }

  const saveComparisonData = (data: any, positions: Record<string, number>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        "hierarchicalComparisonData",
        JSON.stringify({
          hierarchyData: data,
          sliderPositions: positions,
        })
      )
    }
  }

  const getSliderPosition = (level: string, parentId: string | null, row: number, col: number) => {
    // Determine the key based on the level and parent
    let key = level
    if (level === "subCriteria" && parentId) {
      key = parentId
    } else if (level === "subSubCriteria" && parentId) {
      key = parentId
    }

    // Create position key
    const positionKey = `${row}-${col}`

    // Get slider position
    if (sliderPositions[level] && sliderPositions[level][key] && positionKey in sliderPositions[level][key]) {
      return sliderPositions[level][key][positionKey]
    }

    // Default to middle (equal importance)
    return 4
  }

  const isComparisonCompleted = (level: string, parentId: string | null, row: number, col: number) => {
    // Determine the key based on the level and parent
    let key = level
    if (level === "subCriteria" && parentId) {
      key = parentId
    } else if (level === "subSubCriteria" && parentId) {
      key = parentId
    }

    // Create position key
    const positionKey = `${row}-${col}`

    // Check if comparison is completed
    return sliderPositions[level] && sliderPositions[level][key] && positionKey in sliderPositions[level][key]
  }

  const calculateProgress = () => {
    if (!hierarchyData) return 0

    let totalComparisons = 0
    let completedComparisons = 0

    // Main criteria comparisons
    const mainSize = hierarchyData.mainCriteria.ids.length
    totalComparisons += (mainSize * (mainSize - 1)) / 2

    // Count completed main criteria comparisons
    if (sliderPositions.mainCriteria && sliderPositions.mainCriteria.mainCriteria) {
      completedComparisons += Object.keys(sliderPositions.mainCriteria.mainCriteria).length
    }

    // Sub-criteria comparisons
    Object.keys(hierarchyData.subCriteria).forEach((parentId) => {
      const subSize = hierarchyData.subCriteria[parentId].ids.length
      if (subSize > 1) {
        totalComparisons += (subSize * (subSize - 1)) / 2

        // Count completed sub-criteria comparisons
        if (sliderPositions.subCriteria && sliderPositions.subCriteria[parentId]) {
          completedComparisons += Object.keys(sliderPositions.subCriteria[parentId]).length
        }
      }
    })

    // Sub-sub-criteria comparisons
    Object.keys(hierarchyData.subSubCriteria).forEach((parentId) => {
      const subSubSize = hierarchyData.subSubCriteria[parentId].ids.length
      if (subSubSize > 1) {
        totalComparisons += (subSubSize * (subSubSize - 1)) / 2

        // Count completed sub-sub-criteria comparisons
        if (sliderPositions.subSubCriteria && sliderPositions.subSubCriteria[parentId]) {
          completedComparisons += Object.keys(sliderPositions.subSubCriteria[parentId]).length
        }
      }
    })

    return totalComparisons > 0 ? Math.round((completedComparisons / totalComparisons) * 100) : 0
  }

  const validateMatrices = () => {
    if (!hierarchyData) return false

    // Validate main criteria matrix
    const mainMatrix = hierarchyData.mainCriteria.matrix
    const mainIds = hierarchyData.mainCriteria.ids
    for (let i = 0; i < mainIds.length; i++) {
      for (let j = 0; j < mainIds.length; j++) {
        if (i !== j && mainMatrix[i][j] === 0) {
          setError(
            `Lütfen tüm ana kriter karşılaştırmalarını tamamlayın: ${hierarchyData.mainCriteria.names[i]} ve ${hierarchyData.mainCriteria.names[j]} arasındaki karşılaştırma eksik.`,
          )
          return false
        }
      }
    }

    // Validate sub-criteria matrices
    for (const parentId of Object.keys(hierarchyData.subCriteria)) {
      const subMatrix = hierarchyData.subCriteria[parentId].matrix
      const subIds = hierarchyData.subCriteria[parentId].ids

      if (subIds.length > 1) {
        for (let i = 0; i < subIds.length; i++) {
          for (let j = 0; j < subIds.length; j++) {
            if (i !== j && subMatrix[i][j] === 0) {
              const parentName = hierarchyData.criteriaMap[parentId].name
              setError(
                `Lütfen tüm "${parentName}" alt kriter karşılaştırmalarını tamamlayın: ${hierarchyData.subCriteria[parentId].names[i]} ve ${hierarchyData.subCriteria[parentId].names[j]} arasındaki karşılaştırma eksik.`,
              )
              return false
            }
          }
        }
      }
    }

    // Validate sub-sub-criteria matrices
    for (const parentId of Object.keys(hierarchyData.subSubCriteria)) {
      const subSubMatrix = hierarchyData.subSubCriteria[parentId].matrix
      const subSubIds = hierarchyData.subSubCriteria[parentId].ids

      if (subSubIds.length > 1) {
        for (let i = 0; i < subSubIds.length; i++) {
          for (let j = 0; j < subSubIds.length; j++) {
            if (i !== j && subSubMatrix[i][j] === 0) {
              const parentName = hierarchyData.criteriaMap[parentId].name
              setError(
                `Lütfen tüm "${parentName}" alt kriter karşılaştırmalarını tamamlayın: ${hierarchyData.subSubCriteria[parentId].names[i]} ve ${hierarchyData.subSubCriteria[parentId].names[j]} arasındaki karşılaştırma eksik.`,
              )
              return false
            }
          }
        }
      }
    }

    return true
  }

  const handleCalculate = () => {
    if (!validateMatrices()) return

    setLoading(true)
    try {
      const results = calculateHierarchicalAHP(hierarchyData) // Pass hierarchyData directly
      setResults(results)

      // Store results in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          "ahpResults",
          JSON.stringify({
            ...results,
            evaluatorName: evaluatorName,
            date: new Date().toISOString(),
          })
        )
      }

      // Veritabanına da kaydet
      fetch('/api/ahp-evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluatorName,
          globalWeights: results.globalWeights,
          date: new Date().toISOString(),
          mainCR: results.mainCR,
          isOverallConsistent: results.isOverallConsistent
        })
      }).catch(error => {
        console.error('Veritabanına kaydetme hatası:', error)
        // Hata olsa da devam et, localStorage zaten var
      })

      // Navigate to results page
      router.push("/results")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Hesaplama sırasında bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const progress = calculateProgress()

  if (!hierarchyData) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  const renderComparisons = (level: string, parentId: string | null, ids: string[], names: string[]) => {
    return (
      <>
        {ids.map((rowId: string, rowIndex: number) => (
          <div key={rowIndex}>
            {ids.map((colId: string, colIndex: number) => {
              if (colIndex <= rowIndex) return null

              const rowName = names[rowIndex]
              const colName = names[colIndex]
              const sliderPosition = getSliderPosition(level, parentId, rowIndex, colIndex)
              const completed = isComparisonCompleted(level, parentId, rowIndex, colIndex)

              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  className={`mb-8 p-6 bg-card rounded-xl border shadow-sm hover:shadow-md transition-all ${
                    completed ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30" : ""
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: (rowIndex * ids.length + colIndex) * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-1/3 font-medium text-right pr-4 flex items-center justify-end">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-2">
                              {criteriaIcons[rowId]}
                              {rowName}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{criteriaDescriptions[rowId]}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="w-2/3 flex flex-col items-center">
                      <Slider
                        min={0}
                        max={saatyValues.length - 1}
                        step={1}
                        value={[sliderPosition]}
                        onValueChange={([pos]) => handleSliderChange(level, parentId, rowIndex, colIndex, pos)}
                        className="w-full max-w-md"
                      />
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-primary">{saatyValues[sliderPosition].label}</span> -{" "}
                        {saatyValues[sliderPosition].description}
                      </div>
                    </div>

                    <div className="w-1/3 font-medium text-left pl-4 flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-2">
                              {criteriaIcons[colId]}
                              {colName}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{criteriaDescriptions[colId]}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ))}
      </>
    )
  }

  return (
    <>
      {/* Progress bar */}
      <div className="sticky top-16 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b shadow-sm py-3">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {evaluatorName && (
              <div className="text-sm">
                Değerlendirmeyi Yapan: <span className="font-medium">{evaluatorName}</span>
              </div>
            )}
            <div className="flex items-center bg-white/90 dark:bg-gray-800/90 rounded-full px-3 py-1.5 text-sm backdrop-blur-sm shadow-sm">
              <div className="mr-2 font-medium">İlerleme:</div>
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="ml-2 font-medium">{progress}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <Card className="card-shadow overflow-hidden border-0">
            <CardHeader className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground py-8">
              <CardTitle className="text-2xl font-bold">Hiyerarşik Kriter Karşılaştırması</CardTitle>
              <CardDescription className="text-primary-foreground/90">
                Kriterleri hiyerarşik yapıda Saaty'nin 1-9 ölçeğine göre karşılaştırın. Her seviyedeki kriterleri ayrı
                ayrı değerlendirin.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {error && (
                <Alert variant="destructive" className="mb-6 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="mb-6">
                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/30">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    Hiyerarşik AHP yönteminde, önce ana kriterleri karşılaştırın, ardından her ana kriterin alt
                    kriterlerini kendi aralarında karşılaştırın. Tüm karşılaştırmalar tamamlandığında, sistem otomatik
                    olarak global ağırlıkları hesaplayacaktır.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="mb-6">
                <Label htmlFor="evaluator-name" className="mb-2 block">
                  Değerlendirmeyi Yapanın Adı:
                </Label>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Input
                      id="evaluator-name"
                      type="text"
                      value={evaluatorName}
                      onChange={(e) => {
                        setEvaluatorName(e.target.value)
                      }}
                      placeholder="Adınızı girin"
                      className="max-w-sm"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const confirmed = confirm(
                        "Yeni değerlendirme başlatmak istediğinizden emin misiniz?\n\n" +
                        "Bu işlem mevcut tüm karşılaştırma verilerini silecektir."
                      )
                      if (confirmed) {
                        removeComparisonData()
                      }
                    }}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Yeni Değerlendirme Başlat
                  </Button>
                </div>
              </div>

              <Tabs value="main" className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="main" className="text-base py-3">
                    Ana Kriterler
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="main" className="space-y-6">
                  <div className="bg-card p-6 rounded-xl border shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Ana Kriter Karşılaştırması</h2>
                    {renderComparisons(
                      "mainCriteria",
                      "mainCriteria",
                      hierarchyData.mainCriteria.ids,
                      hierarchyData.mainCriteria.names,
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-8 flex justify-end">
                <Button onClick={handleCalculate} disabled={loading || progress < 100}>
                  {loading ? "Hesaplanıyor..." : "AHP Sonuçlarını Hesapla"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
