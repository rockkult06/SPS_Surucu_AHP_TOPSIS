"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Home, BarChart2, PieChart, HelpCircle, BarChart, Gauge, FileSpreadsheet, FileText } from "lucide-react"

export function Header() {
  const pathname = usePathname()

  const navItems = [
    { name: "Ana Sayfa", href: "/", icon: <Home className="h-4 w-4 mr-1" /> },
    { name: "AHP Ölçme Aracı", href: "/comparison", icon: <BarChart2 className="h-4 w-4 mr-1" /> },
    { name: "AHP Sonuçları", href: "/results", icon: <PieChart className="h-4 w-4 mr-1" /> },
    { name: "Toplu Ağırlıklar", href: "/aggregate", icon: <BarChart className="h-4 w-4 mr-1" /> },
    { name: "TOPSIS Verileri", href: "/topsis", icon: <FileSpreadsheet className="h-4 w-4 mr-1" /> },
    { name: "Tüm Sonuçlar", href: "/all-results", icon: <FileText className="h-4 w-4 mr-1" /> },
    { name: "Yardım", href: "/help", icon: <HelpCircle className="h-4 w-4 mr-1" /> },
  ]

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="flex items-center">
              <div className="bg-primary/10 rounded-full p-1.5 mr-2">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                SPS
              </h1>
            </div>
          </Link>
        </div>

        <nav className="flex items-center space-x-1">
          <div className="hidden md:flex items-center bg-secondary/50 rounded-full p-1 backdrop-blur-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary rounded-full"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <span className="relative flex items-center">
                    {item.icon}
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </div>

          <div className="ml-4">
            <ModeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
