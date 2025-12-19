"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Users, Calendar } from "lucide-react"

interface YearlyStatsProps {
  year: number
  totalHours: number
  studiesCount: number
  entriesCount: number
}

export function YearlyStats({ year, totalHours, studiesCount, entriesCount }: YearlyStatsProps) {
  return (
    <Card className="border-border/40">
      <CardContent className="py-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Hours */}
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                {year} Total Hours
              </p>
              <p className="text-lg font-bold text-blue-600">{totalHours} hrs</p>
            </div>
          </div>

          {/* Total Studies */}
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-cyan-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Total Studies
              </p>
              <p className="text-lg font-bold text-cyan-600">{studiesCount} people</p>
            </div>
          </div>

          {/* Days Logged */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Days Logged
              </p>
              <p className="text-lg font-bold text-green-600">{entriesCount} days</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
