"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { motion } from "framer-motion"
import { Bar, Pie } from "react-chartjs-2"
import * as XLSX from "xlsx"
import { criteriaHierarchy, getLeafCriteria } from "@/lib/criteria-hierarchy"
import type { TOPSISResult } from "@/lib/topsis"

export default function AllResultsPage() {
  const [topsisResults, setTopsisResults] = useState<TOPSISResult[]>([])
  const [visibleCount, setVisibleCount] = useState(20)
  const [criteria, setCriteria] = useState<{id: string, name: string}[]>([])

  // KPI state'leri
  const [kpi, setKpi] = useState({
    totalDrivers: 0,
    avgC: 0,
    maxC: 0,
    minC: 0,
    stdC: 0,
    excellentCount: 0,
  })

  useEffect(() => {
    // Kriterleri çek
    const leaf = getLeafCriteria()
    setCriteria(leaf.map(c => ({ id: c.id, name: c.name })))
    // TOPSIS sonuçlarını localStorage'dan çek
    const stored = localStorage.getItem("topsisResults")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Son kaydı al (veya birleştir)
        const last = Array.isArray(parsed) ? parsed[parsed.length-1] : parsed
        if (last && last.topsisResults) {
          setTopsisResults(last.topsisResults)
          // KPI hesapla
          const cArr = last.topsisResults.map((r: any) => r.closenessCoefficient)
          const avgC = cArr.reduce((a: number, b: number) => a + b, 0) / (cArr.length || 1)
          const maxC = Math.max(...cArr)
          const minC = Math.min(...cArr)
          const stdC = Math.sqrt(cArr.reduce((a: number, b: number) => a + Math.pow(b-avgC,2), 0) / (cArr.length || 1))
          const excellentCount = cArr.filter((c: number) => c >= 0.9).length
          setKpi({
            totalDrivers: cArr.length,
            avgC,
            maxC,
            minC,
            stdC,
            excellentCount,
          })
        }
      } catch {}
    }
  }, [])

  // Scroll ile daha fazla sürücü göster
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setVisibleCount((prev) => prev + 20)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Tüm Sürücü Sonuçları</h1>
      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Toplam Sürücü Sayısı</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{kpi.totalDrivers}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ortalama TOPSIS Puanı</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{kpi.avgC.toFixed(3)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mükemmel Performanslılar</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{kpi.excellentCount}</span>
          </CardContent>
        </Card>
      </div>
      {/* Ana Tablo ve Sağ Panel */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 overflow-x-auto max-h-[600px]" onScroll={handleScroll}>
          {/* Akıllı Tablo: Sürücülerin kriter puanları ve TOPSIS puanı */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sicil No</TableHead>
                {criteria.map(c => <TableHead key={c.id}>{c.name}</TableHead>)}
                <TableHead>TOPSIS Puanı (C*)</TableHead>
                <TableHead>Sıralama</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topsisResults.slice(0, visibleCount).map((row, i) => (
                <TableRow key={row.driverId}>
                  <TableCell>{row.driverId}</TableCell>
                  {criteria.map(c => <TableCell key={c.id}>{row.normalizedPerformance?.[c.id]?.toFixed(2) ?? '-'}</TableCell>)}
                  <TableCell>{row.closenessCoefficient.toFixed(3)}</TableCell>
                  <TableCell>{row.rank}</TableCell>
                </TableRow>
              ))}
              {topsisResults.length === 0 && (
                <TableRow>
                  <TableCell colSpan={criteria.length+3} className="text-center text-muted-foreground">Veri bulunamadı.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="w-full md:w-96 flex-shrink-0">
          {/* Kriter Bazlı İstatistikler ve Grafikler */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Kriter Bazlı İstatistikler</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-muted-foreground">Grafik ve özetler burada olacak</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Performans Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-muted-foreground">Histogram/Boxplot burada olacak</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
