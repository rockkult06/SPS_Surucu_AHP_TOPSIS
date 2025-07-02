"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, Zap, Gauge, Clock, CheckCircle, Info, HelpCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { criteriaHierarchy, getCriteriaDescriptions, initializeHierarchyData } from "@/lib/criteria-hierarchy"
import type { JSX } from "react/jsx-runtime"

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
  acceleration: <Zap className="h-5 w-5 text-yellow-500" />,
  speed: <Gauge className="h-5 w-5 text-blue-500" />,
  engine: <AlertTriangle className="h-5 w-5 text-red-600" />,
  idle: <Clock className="h-5 w-5 text-green-500" />,
}

export default function ComparisonPage() {
  const router = useRouter()
  const [hierarchyData, setHierarchyData] = useState(initializeHierarchyData())
  const [sliderPositions, setSliderPositions] = useState<Record<string, number>>({})
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [evaluatorName, setEvaluatorName] = useState("")
  const [progress, setProgress] = useState(0)
  const [totalComparisons, setTotalComparisons] = useState(0)
  const [completedComparisons, setCompletedComparisons] = useState(0)
  const [criteriaDescriptions] = useState(getCriteriaDescriptions())

  useEffect(() => {
    // Load evaluator name
    const storedName = localStorage.getItem("evaluatorName")
    if (storedName) {
      setEvaluatorName(storedName)
    }

    // Load saved comparison data if exists
    const savedComparisons = localStorage.getItem("hierarchicalComparisonData")
    if (savedComparisons) {
      try {
        const data = JSON.parse(savedComparisons)
        if (data.hierarchyData && data.sliderPositions) {
          setHierarchyData(data.hierarchyData)
          setSliderPositions(data.sliderPositions)
        }
      } catch (e) {
        console.error("Error loading saved comparison data:", e)
      }
    }

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
    setCompletedComparisons(Object.keys(sliderPositions).length)
  }, [])

  useEffect(() => {
    // Update progress when completed comparisons change
    if (totalComparisons > 0) {
      setProgress(Math.round((completedComparisons / totalComparisons) * 100))
    }
  }, [completedComparisons, totalComparisons])

  const handleSliderChange = (
    level: string,
    parentId: string | null,
    rowIndex: number,
    colIndex: number,
    position: number,
  ) => {
    // Create a unique key for this comparison
    const key = `${level}-${parentId}-${rowIndex}-${colIndex}`

    // Update slider positions
    const newSliderPositions = {
      ...sliderPositions,
      [key]: position,
    }
    setSliderPositions(newSliderPositions)

    // Update the comparison matrix
    const newHierarchyData = { ...hierarchyData }

    let matrix
    if (level === "main") {
      matrix = [...newHierarchyData.mainCriteria.matrix]
    } else if (level === "sub") {
      matrix = [...newHierarchyData.subCriteria[parentId!].matrix]
    } else if (level === "subSub") {
      matrix = [...newHierarchyData.subSubCriteria[parentId!].matrix]
    } else if (level === "subSubSub") {
      matrix = [...newHierarchyData.subSubSubCriteria[parentId!].matrix]
    } else {
      return
    }

    const value = sliderPositionToSaatyValue(position)
    matrix[rowIndex][colIndex] = value
    matrix[colIndex][rowIndex] = 1 / value

    if (level === "main") {
      newHierarchyData.mainCriteria.matrix = matrix
    } else if (level === "sub") {
      newHierarchyData.subCriteria[parentId!].matrix = matrix
    } else if (level === "subSub") {
      newHierarchyData.subSubCriteria[parentId!].matrix = matrix
    } else if (level === "subSubSub") {
      newHierarchyData.subSubSubCriteria[parentId!].matrix = matrix
    }

    setHierarchyData(newHierarchyData)
    setError(null)

    // Count completed comparisons
    setCompletedComparisons(Object.keys(newSliderPositions).length)

    // Save current state to localStorage
    saveComparisonData(newHierarchyData, newSliderPositions)
  }

  const saveComparisonData = (data: any, positions: Record<string, number>) => {
    localStorage.setItem(
      "hierarchicalComparisonData",
      JSON.stringify({
        hierarchyData: data,
        sliderPositions: positions,
      }),
    )
  }

  const validateHierarchy = () => {
    // Check main criteria matrix
    const mainMatrix = hierarchyData.mainCriteria.matrix
    for (let i = 0; i < mainMatrix.length; i++) {
      for (let j = 0; j < mainMatrix.length; j++) {
        if (i !== j && mainMatrix[i][j] === 0) {
          setError(
            `Lütfen tüm ana kriter karşılaştırmalarını tamamlayın: ${hierarchyData.mainCriteria.names[i]} ve ${hierarchyData.mainCriteria.names[j]} arasındaki karşılaştırma eksik.`,
          )
          return false
        }
      }
    }

    // Check sub-criteria matrices
    for (const mainId in hierarchyData.subCriteria) {
      const subMatrix = hierarchyData.subCriteria[mainId].matrix
      const subNames = hierarchyData.subCriteria[mainId].names

      if (subMatrix.length > 1) {
        for (let i = 0; i < subMatrix.length; i++) {
          for (let j = 0; j < subMatrix.length; j++) {
            if (i !== j && subMatrix[i][j] === 0) {
              const mainName = criteriaHierarchy[mainId].name
              setError(
                `Lütfen "${mainName}" altındaki tüm alt kriter karşılaştırmalarını tamamlayın: ${subNames[i]} ve ${subNames[j]} arasındaki karşılaştırma eksik.`,
              )
              return false
            }
          }
        }
      }
    }

    // Check sub-sub-criteria matrices
    for (const subId in hierarchyData.subSubCriteria) {
      const subSubMatrix = hierarchyData.subSubCriteria[subId].matrix
      const subSubNames = hierarchyData.subSubCriteria[subId].names

      if (subSubMatrix.length > 1) {
        for (let i = 0; i < subSubMatrix.length; i++) {
          for (let j = 0; j < subSubMatrix.length; j++) {
            if (i !== j && subSubMatrix[i][j] === 0) {
              const subName = criteriaHierarchy[subId].name
              setError(
                `Lütfen "${subName}" altındaki tüm alt kriter karşılaştırmalarını tamamlayın: ${subSubNames[i]} ve ${subSubNames[j]} arasındaki karşılaştırma eksik.`,
              )
              return false
            }
          }
        }
      }
    }

    // Check sub-sub-sub-criteria matrices
    for (const subSubId in hierarchyData.subSubSubCriteria || {}) {
      const subSubSubMatrix = hierarchyData.subSubSubCriteria[subSubId].matrix
      const subSubSubNames = hierarchyData.subSubSubCriteria[subSubId].names

      if (subSubSubMatrix.length > 1) {
        for (let i = 0; i < subSubSubMatrix.length; i++) {
          for (let j = 0; j < subSubSubMatrix.length; j++) {
            if (i !== j && subSubSubMatrix[i][j] === 0) {
              const subSubName = criteriaHierarchy[subSubId].name
              setError(
                `Lütfen "${subSubName}" altındaki tüm alt kriter karşılaştırmalarını tamamlayın: ${subSubSubNames[i]} ve ${subSubSubNames[j]} arasındaki karşılaştırma eksik.`,
              )
              return false
            }
          }
        }
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateHierarchy()) return

    setLoading(true)
    try {
      // Log the data being sent to the API
      console.log("Sending hierarchy data to API:", JSON.stringify(hierarchyData, null, 2))

      const response = await fetch("/api/calculate-ahp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evaluatorName,
          hierarchyData,
        }),
      })

      if (!response.ok) {
        throw new Error("Hesaplama sırasında bir hata oluştu.")
      }

      const data = await response.json()

      // Log the response data
      console.log("AHP calculation response:", JSON.stringify(data, null, 2))

      // Store results in localStorage to pass to results page
      localStorage.setItem("ahpResults", JSON.stringify(data))

      // Navigate to results page
      router.push("/results")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  // Get slider position for a comparison
  const getSliderPosition = (level: string, parentId: string | null, rowIndex: number, colIndex: number) => {
    const key = `${level}-${parentId}-${rowIndex}-${colIndex}`
    if (key in sliderPositions) {
      return sliderPositions[key]
    }
    // Default to middle (equal importance)
    return 4
  }

  // Check if a comparison has been completed
  const isComparisonCompleted = (level: string, parentId: string | null, rowIndex: number, colIndex: number) => {
    const key = `${level}-${parentId}-${rowIndex}-${colIndex}`
    return key in sliderPositions
  }

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  // Render comparison slider for two criteria
  const renderComparisonSlider = (
    level: string,
    parentId: string | null,
    rowIndex: number,
    colIndex: number,
    leftCriterion: string,
    rightCriterion: string,
    leftId: string,
    rightId: string,
  ) => {
    const sliderPosition = getSliderPosition(level, parentId, rowIndex, colIndex)
    const completed = isComparisonCompleted(level, parentId, rowIndex, colIndex)

    return (
      <motion.div
        key={`${level}-${parentId}-${rowIndex}-${colIndex}`}
        className={`mb-8 p-6 bg-card rounded-xl border shadow-sm hover:shadow-md transition-all ${
          completed ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30" : ""
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-1/3 font-medium text-right pr-4 flex items-center justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={sliderPosition < 4 ? "text-primary font-bold" : ""}>
                    {criteriaIcons[leftId] && (
                      <span className="inline-flex items-center mr-2">{criteriaIcons[leftId]}</span>
                    )}
                    {leftCriterion}
                    {criteriaDescriptions[leftId] && <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground" />}
                  </span>
                </TooltipTrigger>
                {criteriaDescriptions[leftId] && (
                  <TooltipContent>
                    <p className="max-w-xs">{criteriaDescriptions[leftId]}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="w-1/3 text-center">
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-accent/50">
              {saatyValues[sliderPosition].label} - {saatyValues[sliderPosition].description}
            </span>
          </div>
          <div className="w-1/3 font-medium pl-4 flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={sliderPosition > 4 ? "text-primary font-bold" : ""}>
                    {criteriaIcons[rightId] && (
                      <span className="inline-flex items-center mr-2">{criteriaIcons[rightId]}</span>
                    )}
                    {rightCriterion}
                    {criteriaDescriptions[rightId] && <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground" />}
                  </span>
                </TooltipTrigger>
                {criteriaDescriptions[rightId] && (
                  <TooltipContent>
                    <p className="max-w-xs">{criteriaDescriptions[rightId]}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="relative mt-4 px-6">
          {/* Slider ticks and labels */}
          <div className="flex justify-between mb-2">
            {saatyValues.map((item, index) => (
              <div key={index} className="flex flex-col items-center" style={{ width: "20px" }}>
                <div
                  className={`h-3 w-1 ${index === sliderPosition ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`}
                ></div>
                <span
                  className={`text-xs mt-1 ${
                    index === sliderPosition ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Custom slider */}
          <input
            type="range"
            min="0"
            max="8"
            step="1"
            value={sliderPosition}
            onChange={(e) => handleSliderChange(level, parentId, rowIndex, colIndex, Number.parseInt(e.target.value))}
            className="w-full h-3 bg-secondary rounded-full appearance-none cursor-pointer"
          />

          {/* Gradient background for selected area */}
          <div
            className="absolute top-[calc(50%-6px)] h-3 rounded-full pointer-events-none"
            style={{
              left: sliderPosition < 4 ? `${sliderPosition * 12.5}%` : "50%",
              right: sliderPosition > 4 ? `${(8 - sliderPosition) * 12.5}%` : "50%",
              background:
                sliderPosition < 4
                  ? "linear-gradient(90deg, rgba(173, 216, 230, 0.7), rgba(173, 216, 230, 0.3))"
                  : sliderPosition > 4
                    ? "linear-gradient(90deg, rgba(173, 216, 230, 0.3), rgba(173, 216, 230, 0.7))"
                    : "rgba(173, 216, 230, 0.5)",
            }}
          ></div>
        </div>

        {completed && (
          <div className="flex justify-end mt-2">
            <div className="text-green-600 dark:text-green-400 text-sm flex items-center">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Değerlendirildi
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  // Render comparisons for a specific level
  const renderComparisons = (level: string, parentId: string | null, ids: string[], names: string[]) => {
    const comparisons = []

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        comparisons.push(renderComparisonSlider(level, parentId, i, j, names[i], names[j], ids[i], ids[j]))
      }
    }

    return comparisons
  }

  return (
    <>
      {/* Sabit ilerleme çubuğu */}
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
          className="max-w-5xl mx-auto"
        >
          <Card className="card-shadow overflow-hidden border-0">
            <CardHeader className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground py-8">
              <CardTitle className="text-2xl font-bold">Hiyerarşik Kriter Karşılaştırması</CardTitle>
              <CardDescription className="text-primary-foreground/90">
                Her bir kriter çiftini Saaty'nin 1-9 ölçeğine göre karşılaştırın. Sliderı daha önemli gördüğünüz kritere
                doğru kaydırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              {error && (
                <Alert variant="destructive" className="mb-6 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert className="mb-6 rounded-xl bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/30">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Güncellenmiş kriter hiyerarşisi uygulanmıştır. Disiplin kriterleri artık 3 seviyeli hiyerarşiye
                  sahiptir. Önce ana kriterleri karşılaştırın, ardından her seviyedeki alt kriterleri değerlendirin.
                </AlertDescription>
              </Alert>

              <Accordion type="multiple" className="space-y-4">
                {/* Ana Kriterler Karşılaştırması */}
                <AccordionItem value="main-criteria" className="border rounded-xl overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:bg-secondary/20">
                    <div className="flex items-center">
                      <span className="text-lg font-semibold">Ana Kriterler Karşılaştırması</span>
                      <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {hierarchyData.mainCriteria.ids.length} Kriter
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2">
                    <div className="space-y-4">
                      {renderComparisons(
                        "main",
                        null,
                        hierarchyData.mainCriteria.ids,
                        hierarchyData.mainCriteria.names,
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Alt Kriterler Karşılaştırması (Level 2) */}
                {hierarchyData.mainCriteria.ids.map((mainId) => {
                  const mainCriterion = criteriaHierarchy[mainId]
                  // Only render if there are children to compare at this level
                  if (!mainCriterion.children || mainCriterion.children.length <= 1) return null

                  // Filter out the old 'dismissal_violations' and 'penalty_violations' if they somehow persist in hierarchyData.subCriteria
                  const currentSubCriteriaIds =
                    hierarchyData.subCriteria[mainId]?.ids.filter(
                      (id) => id !== "dismissal_violations" && id !== "penalty_violations",
                    ) || []
                  const currentSubCriteriaNames = currentSubCriteriaIds.map((id) => criteriaHierarchy[id]?.name || id)

                  if (currentSubCriteriaIds.length <= 1) return null // No comparisons needed if 1 or fewer criteria

                  return (
                    <AccordionItem key={mainId} value={`sub-${mainId}`} className="border rounded-xl overflow-hidden">
                      <AccordionTrigger className="px-6 py-4 hover:bg-secondary/20">
                        <div className="flex items-center">
                          <span className="text-lg font-semibold">{mainCriterion.name} Alt Kriterleri</span>
                          <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {currentSubCriteriaIds.length} Kriter
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4 pt-2">
                        <div className="space-y-4">
                          {renderComparisons("sub", mainId, currentSubCriteriaIds, currentSubCriteriaNames)}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}

                {/* Alt-Alt Kriterler Karşılaştırması (Level 3) */}
                {/* This loop now handles the dismissal criteria directly under 'discipline' */}
                {Object.keys(hierarchyData.subSubCriteria).map((subId) => {
                  const subCriterion = criteriaHierarchy[subId]
                  // Ensure the subCriterion exists and has children for comparison
                  if (
                    !subCriterion ||
                    !hierarchyData.subSubCriteria[subId] ||
                    hierarchyData.subSubCriteria[subId].ids.length <= 1
                  )
                    return null

                  // Filter out any old penalty criteria if they somehow persist
                  const currentSubSubCriteriaIds =
                    hierarchyData.subSubCriteria[subId]?.ids.filter((id) => !id.includes("penalty")) || []
                  const currentSubSubCriteriaNames = currentSubSubCriteriaIds.map(
                    (id) => criteriaHierarchy[id]?.name || id,
                  )

                  if (currentSubSubCriteriaIds.length <= 1) return null // No comparisons needed if 1 or fewer criteria

                  return (
                    <AccordionItem key={subId} value={`subSub-${subId}`} className="border rounded-xl overflow-hidden">
                      <AccordionTrigger className="px-6 py-4 hover:bg-secondary/20">
                        <div className="flex items-center">
                          <span className="text-lg font-semibold">{subCriterion.name} Alt Kriterleri</span>
                          <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {currentSubSubCriteriaIds.length} Kriter
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4 pt-2">
                        <div className="space-y-4">
                          {renderComparisons("subSub", subId, currentSubSubCriteriaIds, currentSubSubCriteriaNames)}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}

                {/* Alt-Alt-Alt Kriterler Karşılaştırması (Level 4) - This section will now be empty for discipline */}
                {Object.keys(hierarchyData.subSubSubCriteria || {}).map((subSubId) => {
                  const subSubCriterion = criteriaHierarchy[subSubId]
                  if (
                    !subSubCriterion ||
                    !hierarchyData.subSubSubCriteria[subSubId] ||
                    hierarchyData.subSubSubCriteria[subSubId].ids.length <= 1
                  )
                    return null

                  return (
                    <AccordionItem
                      key={subSubId}
                      value={`subSubSub-${subSubId}`}
                      className="border rounded-xl overflow-hidden"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:bg-secondary/20">
                        <div className="flex items-center">
                          <span className="text-lg font-semibold">{subSubCriterion.name} Alt Kriterleri</span>
                          <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            {hierarchyData.subSubSubCriteria[subSubId].ids.length} Kriter
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4 pt-2">
                        <div className="space-y-4">
                          {renderComparisons(
                            "subSubSub",
                            subSubId,
                            hierarchyData.subSubSubCriteria[subSubId].ids,
                            hierarchyData.subSubSubCriteria[subSubId].names,
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
            <CardFooter className="flex justify-center p-8 bg-secondary/50">
              <Button
                onClick={handleSubmit}
                disabled={loading}
                size="lg"
                className="rounded-full h-14 px-8 text-lg font-medium btn-gradient shadow-lg"
              >
                {loading ? "Hesaplanıyor..." : "Hesapla ve Sonuçları Göster"}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
