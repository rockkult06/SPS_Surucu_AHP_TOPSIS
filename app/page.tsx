"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { InfoIcon, HelpCircle, TrendingUp, TrendingDown } from "lucide-react"
import { motion } from "framer-motion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function Home() {
  const router = useRouter()
  const [evaluatorName, setEvaluatorName] = useState("")
  const [nameError, setNameError] = useState(false)
  const [showInfoCard, setShowInfoCard] = useState(false)

  useEffect(() => {
    // Check if there's a stored name
    const storedName = localStorage.getItem("evaluatorName")
    if (storedName) {
      setEvaluatorName(storedName)
    }
  }, [])

  const handleStartEvaluation = () => {
    if (!evaluatorName.trim()) {
      setNameError(true)
      return
    }

    // Store evaluator name in localStorage
    localStorage.setItem("evaluatorName", evaluatorName)

    // Navigate to comparison page
    router.push("/comparison")
  }

  // Updated criteria structure to match the hierarchical tree with effect indicators
  const criteriaTree = [
    {
      name: "1. İdari Değerlendirme",
      children: [
        {
          name: "1.1. Sağlık Sebebiyle Devamsızlık Durumu",
          isPositive: false,
        },
        {
          name: "1.2. Fazla Mesaili Çalışma Gayreti",
          children: [
            { name: "1.2.1. Normal Fazla Mesai", isPositive: true },
            { name: "1.2.2. Hafta Tatili Mesaisi", isPositive: true },
            { name: "1.2.3. Resmi Tatil Mesaisi", isPositive: true },
          ],
        },
        {
          name: "1.3. Yapılan Km'ye Göre Kaza Durumu (Atölye Dışı)",
          children: [
            { name: "1.3.1. Ölümle Sonuçlanan Kaza", isPositive: false },
            { name: "1.3.2. Yaralanmalı Kaza", isPositive: false },
            { name: "1.3.3. Maddi Hasarlı Kaza", isPositive: false },
          ],
        },
        {
          name: "1.4. Yapılan Km'ye Göre Disiplin Durumu",
          children: [
            {
              name: "1.4.1. 1'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
              isPositive: false,
            },
            {
              name: "1.4.2. 2'nci Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
              isPositive: false,
            },
            {
              name: "1.4.3. 3'ncü Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
              isPositive: false,
            },
            {
              name: "1.4.4. 4'ncü Derece Disiplin İhlallerinden Sevk Sayısı Kilometreye Oranı",
              isPositive: false,
            },
          ],
        },
      ],
    },
    {
      name: "2. Teknik Değerlendirme (Telemetri)",
      children: [
        { name: "2.1. Hatalı Hızlanma Sayısı", isPositive: false },
        { name: "2.2. Hız İhlal Sayısı", isPositive: false },
        { name: "2.3. Motor (KırmızıLamba) Uyarısı", isPositive: false },
        { name: "2.4. Rölanti İhlal Sayısı", isPositive: false },
      ],
    },
  ]

  // Render a criterion with its children
  const renderCriterion = (criterion: any, level = 0) => {
    return (
      <div key={criterion.name} className="mb-2">
        <div className="flex items-start">
          <div className="ml-4" style={{ marginLeft: `${level * 20}px` }}>
            <span className="font-medium flex items-center">
              {criterion.name}
              {criterion.isPositive !== undefined && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={`ml-2 ${criterion.isPositive ? "text-green-600" : "text-red-600"}`}>
                        {criterion.isPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {criterion.isPositive
                        ? "Pozitif etki: Yüksek değerler daha iyi performansı gösterir"
                        : "Negatif etki: Düşük değerler daha iyi performansı gösterir"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </span>
            {criterion.description && (
              <p className="text-sm text-muted-foreground mt-1 ml-4">{criterion.description}</p>
            )}
          </div>
        </div>
        {criterion.children && (
          <div className="mt-2">{criterion.children.map((child: any) => renderCriterion(child, level + 1))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="card-shadow overflow-hidden border-0">
          <CardHeader className="text-center bg-gradient-to-r from-primary/90 to-primary text-primary-foreground py-8">
            <CardTitle className="text-3xl font-bold tracking-tight">Sürücü Puanlama Sistemi (SPS)</CardTitle>
            <CardDescription className="text-base mt-2 text-primary-foreground/90">
              Toplu taşıma sürücülerinin sürüş alışkanlıklarını değerlendirmek için AHP ve TOPSIS tabanlı puanlama
              sistemi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-semibold">AHP ve TOPSIS Yöntemleri Nedir?</h2>
                <button
                  onClick={() => setShowInfoCard(!showInfoCard)}
                  className="ml-2 p-1 rounded-full hover:bg-accent transition-colors"
                >
                  <InfoIcon className="h-5 w-5 text-primary" />
                </button>
              </div>

              {showInfoCard && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 bg-accent/50 rounded-lg border border-accent"
                >
                  <p className="text-sm">
                    <strong>Analitik Hiyerarşi Süreci (AHP)</strong>, Thomas L. Saaty tarafından geliştirilen çok
                    kriterli karar verme yöntemidir. Bu yöntem, karmaşık karar problemlerini hiyerarşik bir yapıda ele
                    alarak, kriterlerin ikili karşılaştırmalarına dayalı olarak her bir kriterin göreceli önemini
                    belirler. AHP, 1-9 ölçeğini kullanarak kriterlerin birbirlerine göre önem derecelerini
                    sayısallaştırır ve tutarlılık analizi yaparak değerlendirmenin güvenilirliğini ölçer.
                  </p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <p className="mb-3 text-muted-foreground">
                    <strong>Analitik Hiyerarşi Süreci (AHP)</strong>, çok kriterli karar verme problemlerinde kullanılan
                    matematiksel bir yöntemdir. Bu yöntem, kriterlerin ikili karşılaştırmalarına dayanarak her bir
                    kriterin göreceli önemini belirler.
                  </p>
                  <p className="mb-3 text-muted-foreground">
                    <strong>TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)</strong>,
                    alternatiflerin ideal çözüme yakınlığına göre sıralanmasını sağlayan çok kriterli karar verme
                    yöntemidir. AHP ile belirlenen kriter ağırlıkları kullanılarak, sürücülerin performansları
                    değerlendirilir ve sıralanır.
                  </p>
                  <p className="text-muted-foreground">
                    Sürücü Puanlama Sistemi'nde, farklı sürüş alışkanlıklarının önem derecelerini belirlemek için AHP,
                    sürücüleri değerlendirmek için ise TOPSIS kullanılmaktadır.
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="relative max-w-xs">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250416_1131_%C4%B0ki%20Modern%20S%C3%BCr%C3%BCc%C3%BC_remix_01jryvfv54fyrvny5bhmb5k1g9-vQ9KbYuc8X7XgvPEY9p33UQH5gty3j.png"
                      alt="Sürücü Puanlama Sistemi"
                      width={400}
                      height={400}
                      className="rounded-2xl shadow-lg transform transition-transform hover:scale-105 duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Değerlendirme Kriterleri</h2>
                <Link href="/help">
                  <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Kriterler Hakkında
                  </Button>
                </Link>
              </div>

              <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/30">
                <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Kriter ağırlıkları, AHP değerlendirmeleri sonucunda belirlenecektir. Disiplin kriterleri artık 3
                  seviyeli hiyerarşik yapıya sahiptir.
                </AlertDescription>
              </Alert>

              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
                <div className="flex items-center mb-2">
                  <InfoIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <h3 className="font-medium">Kriter Etki Türleri</h3>
                </div>
                <div className="flex flex-col space-y-2 ml-7">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">
                      <strong>Pozitif Etki:</strong> Yüksek değerler daha iyi performansı gösterir (Fazla Mesai)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm">
                      <strong>Negatif Etki:</strong> Düşük değerler daha iyi performansı gösterir (Devamsızlık, Kaza,
                      İhlal, Uyarı, Sevk)
                    </span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-secondary/10">
                <h3 className="text-lg font-medium mb-3">Kriter Ağacı</h3>
                <div className="space-y-2">{criteriaTree.map((criterion) => renderCriterion(criterion))}</div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-all">
              <h2 className="text-xl font-semibold mb-4">Değerlendirmeyi Yapan</h2>
              <div className="space-y-2">
                <Label htmlFor="evaluatorName">Adınız Soyadınız</Label>
                <Input
                  id="evaluatorName"
                  placeholder="Adınızı ve soyadınızı girin"
                  value={evaluatorName}
                  onChange={(e) => {
                    setEvaluatorName(e.target.value)
                    setNameError(false)
                  }}
                  className={`rounded-full h-12 px-4 input-shadow ${nameError ? "border-destructive" : ""}`}
                />
                {nameError && <p className="text-destructive text-sm">Lütfen adınızı ve soyadınızı girin</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center p-8 bg-secondary/50">
            <Button
              onClick={handleStartEvaluation}
              size="lg"
              className="rounded-full h-14 px-8 text-lg font-medium btn-gradient shadow-lg"
            >
              Değerlendirmeye Başla
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
