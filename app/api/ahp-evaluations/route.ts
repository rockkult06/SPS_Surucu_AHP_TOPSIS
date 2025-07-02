import { NextRequest, NextResponse } from "next/server"

// Geçici olarak localStorage benzeri bir in-memory storage kullanıyoruz
// Gerçek projede PostgreSQL, MongoDB vs. kullanılabilir
let evaluationsStorage: any[] = []

// LocalStorage'dan verileri yükle
const loadFromStorage = () => {
  try {
    const storedData = localStorage.getItem('ahpEvaluations')
    if (storedData) {
      evaluationsStorage = JSON.parse(storedData)
    }
  } catch (error) {
    console.error('Veriler yüklenirken hata:', error)
  }
}

// LocalStorage'a verileri kaydet
const saveToStorage = () => {
  try {
    localStorage.setItem('ahpEvaluations', JSON.stringify(evaluationsStorage))
  } catch (error) {
    console.error('Veriler kaydedilirken hata:', error)
  }
}

// Başlangıçta verileri yükle
loadFromStorage()

export async function GET() {
  try {
    loadFromStorage() // Her GET isteğinde güncel verileri al
    return NextResponse.json({
      evaluations: evaluationsStorage
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Değerlendirmeler alınırken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { evaluatorName, globalWeights, date, mainCR, isOverallConsistent } = body

    if (!evaluatorName || !globalWeights) {
      return NextResponse.json(
        { error: "Değerlendirici adı ve ağırlıklar gerekli" },
        { status: 400 }
      )
    }

    const newEvaluation = {
      id: Date.now().toString(),
      evaluatorName,
      globalWeights,
      date: date || new Date().toISOString(),
      mainCR: mainCR || 0,
      isOverallConsistent: isOverallConsistent || false,
      createdAt: new Date().toISOString()
    }

    evaluationsStorage.push(newEvaluation)
    saveToStorage() // Yeni değerlendirmeyi kaydet

    return NextResponse.json({
      success: true,
      evaluation: newEvaluation
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Değerlendirme kaydedilirken hata oluştu" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Silinecek değerlendirme ID'si gerekli" },
        { status: 400 }
      )
    }

    const initialLength = evaluationsStorage.length
    evaluationsStorage = evaluationsStorage.filter(evaluation => evaluation.id !== id)
    saveToStorage() // Değişiklikleri kaydet

    if (evaluationsStorage.length === initialLength) {
      return NextResponse.json(
        { error: "Silinecek değerlendirme bulunamadı" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Değerlendirme başarıyla silindi"
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Değerlendirme silinirken hata oluştu" },
      { status: 500 }
    )
  }
} 