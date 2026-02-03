"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  buildHref,
  recentRange,
  type GoldRangeConfig,
  type GoldUnit,
} from "@/lib/gold"

type RangeControlsProps = {
  range: GoldRangeConfig
  unit: GoldUnit
  latestDate: string
}

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
})

export function RangeControls({ range, unit, latestDate }: RangeControlsProps) {
  const router = useRouter()

  const baseDate = React.useMemo(() => {
    const parsed = new Date(`${latestDate}T00:00:00Z`)
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  }, [latestDate])

  const monthOptions = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(
        Date.UTC(
          baseDate.getUTCFullYear(),
          baseDate.getUTCMonth() - index,
          1
        )
      )
      const year = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, "0")
      return {
        value: `month-${year}-${month}`,
        label: monthFormatter.format(date),
      }
    })
  }, [baseDate])

  const yearOptions = React.useMemo(() => {
    const baseYear = baseDate.getUTCFullYear()
    return Array.from({ length: 10 }, (_, index) => {
      const year = String(baseYear - index)
      return {
        value: `year-${year}`,
        label: year,
      }
    })
  }, [baseDate])

  const monthValue =
    range.kind === "month" ? range.key : monthOptions[0]?.value ?? ""
  const yearValue =
    range.kind === "year" ? range.key : yearOptions[0]?.value ?? ""

  const monthActive = range.kind === "month"
  const yearActive = range.kind === "year"

  function handleRangeChange(value: string) {
    router.push(buildHref(value, unit))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={range.kind === "recent" ? "secondary" : "outline"}
        className={
          range.kind === "recent"
            ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-100"
            : ""
        }
        onClick={() => handleRangeChange(recentRange.key)}
      >
        {recentRange.label}
      </Button>
      <Select value={monthValue} onValueChange={handleRangeChange}>
        <SelectTrigger
          className={cn(
            "h-9 min-w-[140px] px-2 text-xs",
            monthActive && "border-emerald-500/60 bg-emerald-500/15 text-emerald-100"
          )}
          aria-label="Select month range"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="data-[state=checked]:bg-emerald-500/15 data-[state=checked]:text-emerald-200"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={yearValue} onValueChange={handleRangeChange}>
        <SelectTrigger
          className={cn(
            "h-9 min-w-[100px] px-2 text-xs",
            yearActive && "border-emerald-500/60 bg-emerald-500/15 text-emerald-100"
          )}
          aria-label="Select year range"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="data-[state=checked]:bg-emerald-500/15 data-[state=checked]:text-emerald-200"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
