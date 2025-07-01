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
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import { Progress } from "@/components/ui/progress"
import { usePathname } from 'next/navigation'
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

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

  // Kriter bazlı istatistikler
  const [criteriaStats, setCriteriaStats] = useState<any[]>([])
  // Histogram için
  const [histogramData, setHistogramData] = useState<{labels: string[], counts: number[]}>({labels: [], counts: []})

  // Sıralama ve filtreleme için state
  const [sortBy, setSortBy] = useState<string>("rank")
  const [sortOrder, setSortOrder] = useState<"asc"|"desc">("asc")
  const [filters, setFilters] = useState<Record<string, string>>({})

  const pathname = usePathname();

  // Sıralama ve filtreleme uygulanmış tablo verisi
  const filteredSortedResults = useMemo(() => {
    let data = [...topsisResults]
    // Filtre uygula
    Object.entries(filters).forEach(([key, val]) => {
      if (val) {
        data = data.filter(row => (row.normalizedPerformance?.[key]?.toString() ?? "").includes(val))
      }
    })
    // Sıralama uygula
    if (sortBy === "rank" || sortBy === "closenessCoefficient") {
      data.sort((a, b) => sortOrder === "asc" ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy])
    } else {
      data.sort((a, b) => sortOrder === "asc"
        ? (a.normalizedPerformance?.[sortBy] ?? 0) - (b.normalizedPerformance?.[sortBy] ?? 0)
        : (b.normalizedPerformance?.[sortBy] ?? 0) - (a.normalizedPerformance?.[sortBy] ?? 0))
    }
    return data
  }, [topsisResults, sortBy, sortOrder, filters])

  useEffect(() => {
    // Kriterleri çek
    const leaf = getLeafCriteria()
    setCriteria(leaf.map(c => ({ id: c.id, name: c.name })))
    // TOPSIS sonuçlarını localStorage'dan çek
    const loadTopsis = () => {
      const stored = localStorage.getItem("topsisResults")
      if (stored) {
        try {
          const last = JSON.parse(stored)
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
            // Kriter istatistikleri hesapla
            if (last.topsisResults.length > 0 && leaf.length > 0) {
              const stats = leaf.map(c => {
                const vals = last.topsisResults.map((r: any) => r.normalizedPerformance?.[c.id] ?? 0)
                const avg = vals.reduce((a: number, b: number) => a + b, 0) / vals.length
                const min = Math.min(...vals)
                const max = Math.max(...vals)
                const std = Math.sqrt(vals.reduce((a: number, b: number) => a + Math.pow(b-avg,2), 0) / vals.length)
                return { id: c.id, name: c.name, avg, min, max, std }
              })
              setCriteriaStats(stats)
              // Histogram (C* dağılımı)
              const bins = Array(10).fill(0)
              cArr.forEach((val: number) => {
                const idx = Math.min(9, Math.floor(val * 10))
                bins[idx]++
              })
              setHistogramData({
                labels: bins.map((_: any, i: number) => `${(i/10).toFixed(1)}–${((i+1)/10).toFixed(1)}`),
                counts: bins
              })
            }
          }
        } catch {}
      }
    }
    loadTopsis()
    // Storage event ile güncelle
    const onStorage = (e: StorageEvent) => {
      if (e.key === "topsisResults") loadTopsis()
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [pathname])

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
      {/* Kriter Bazlı Ortalama Değerler - Progress Bar Kartları */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Kriter Bazlı Ortalama Değerler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {criteriaStats.length > 0 ? (
                criteriaStats.map(s => (
                  <div key={s.id} className="flex flex-col gap-1 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900/10">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate" title={s.name}>{s.name}</span>
                    <Progress value={Math.round(s.avg * 100)} max={100} className="h-2 bg-gray-200" />
                    <span className="text-xs text-gray-500 mt-1">Ortalama: <b>{s.avg.toFixed(2)}</b></span>
                  </div>
                ))
              ) : (
                <span className="text-muted-foreground">Grafik ve özetler burada olacak</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* En Yüksek ve En Düşük Puan Alanlar Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>En Yüksek Puan Alanlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {filteredSortedResults.slice(0, 3).map((row, i) => (
                <li key={row.driverId} className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{row.rank}.</span>
                  <span className="mx-2">{row.driverId}</span>
                  <span className="text-blue-700 font-bold">{row.closenessCoefficient.toFixed(3)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En Düşük Puan Alanlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {filteredSortedResults.slice(-3).map((row, i) => (
                <li key={row.driverId} className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{row.rank}.</span>
                  <span className="mx-2">{row.driverId}</span>
                  <span className="text-red-700 font-bold">{row.closenessCoefficient.toFixed(3)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* Tam genişlikte, sıralanabilir ve filtrelenebilir tablo */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sicil No</TableHead>
              {criteria.map(c => (
                <TableHead key={c.id} className="cursor-pointer" onClick={() => {
                  setSortBy(c.id)
                  setSortOrder(o => (sortBy === c.id && o === "asc") ? "desc" : "asc")
                }}>
                  {c.name}
                  {sortBy === c.id ? (sortOrder === "asc" ? " ▲" : " ▼") : ""}
                </TableHead>
              ))}
              <TableHead className="cursor-pointer" onClick={() => {
                setSortBy("closenessCoefficient")
                setSortOrder(o => (sortBy === "closenessCoefficient" && o === "asc") ? "desc" : "asc")
              }}>
                TOPSIS Puanı (C*){sortBy === "closenessCoefficient" ? (sortOrder === "asc" ? " ▲" : " ▼") : ""}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => {
                setSortBy("rank")
                setSortOrder(o => (sortBy === "rank" && o === "asc") ? "desc" : "asc")
              }}>
                Sıralama{sortBy === "rank" ? (sortOrder === "asc" ? " ▲" : " ▼") : ""}
              </TableHead>
            </TableRow>
            {/* Filtre inputları */}
            <TableRow>
              <TableCell></TableCell>
              {criteria.map(c => (
                <TableCell key={c.id}>
                  <input type="text" className="w-16 px-1 py-0.5 border rounded text-xs" placeholder="Filtrele" value={filters[c.id]||""} onChange={e => setFilters(f => ({...f, [c.id]: e.target.value}))} />
                </TableCell>
              ))}
              <TableCell></TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSortedResults.slice(0, visibleCount).map((row, i) => (
              <TableRow key={row.driverId}>
                <TableCell>{row.driverId}</TableCell>
                {criteria.map(c => <TableCell key={c.id}>{row.normalizedPerformance?.[c.id]?.toFixed(2) ?? '-'}</TableCell>)}
                <TableCell>{row.closenessCoefficient.toFixed(3)}</TableCell>
                <TableCell>{row.rank}</TableCell>
              </TableRow>
            ))}
            {filteredSortedResults.length === 0 && (
              <TableRow>
                <TableCell colSpan={criteria.length+3} className="text-center text-muted-foreground">Veri bulunamadı.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
