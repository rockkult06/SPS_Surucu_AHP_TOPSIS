import { type NextRequest, NextResponse } from "next/server"
import { calculateAHP, calculateHierarchicalAHP } from "@/lib/ahp"

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()

    // Log the request data for debugging
    console.log("AHP calculation request data:", JSON.stringify(requestData, null, 2))

    const { matrix, evaluatorName, hierarchyData } = requestData

    // Check if we're using hierarchical AHP
    if (hierarchyData) {
      // Validate hierarchical data
      if (!hierarchyData.mainCriteria || !hierarchyData.subCriteria) {
        return NextResponse.json({ error: "Geçersiz hiyerarşik veri yapısı" }, { status: 400 })
      }

      // Calculate hierarchical AHP weights and consistency ratios
      const result = calculateHierarchicalAHP(hierarchyData)

      // Log the result for debugging
      console.log("Hierarchical AHP calculation result:", JSON.stringify(result, null, 2))

      // Generate a unique ID for this evaluation
      const evaluationId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7)

      // Create response with evaluation ID
      const response = {
        ...result,
        evaluatorName: evaluatorName || "Anonim",
        evaluationId,
      }

      return NextResponse.json(response)
    } else {
      // Legacy flat AHP calculation
      if (!matrix || !Array.isArray(matrix) || matrix.length === 0) {
        return NextResponse.json({ error: "Geçersiz matris verisi" }, { status: 400 })
      }

      // Calculate AHP weights and consistency ratio
      const { weights, cr, isConsistent } = calculateAHP(matrix)

      // Log the result for debugging
      console.log("Flat AHP calculation result:", { weights, cr, isConsistent })

      // Generate a unique ID for this evaluation
      const evaluationId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7)

      // Create response with evaluation ID
      const result = {
        weights,
        cr,
        isConsistent,
        evaluatorName: evaluatorName || "Anonim",
        evaluationId,
      }

      return NextResponse.json(result)
    }
  } catch (error) {
    console.error("AHP hesaplama hatası:", error)
    return NextResponse.json({ error: "AHP hesaplaması sırasında bir hata oluştu" }, { status: 500 })
  }
}
