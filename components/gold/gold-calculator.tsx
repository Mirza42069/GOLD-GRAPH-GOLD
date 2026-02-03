"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import type { GoldPoint, GoldUnit } from "@/lib/gold"

type GoldCalculatorProps = {
  latestPoint: GoldPoint
  unit: GoldUnit
  unitSuffix: string
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
})

export function GoldCalculator({
  latestPoint,
  unit,
  unitSuffix,
}: GoldCalculatorProps) {
  const [usdValue, setUsdValue] = React.useState("1000")
  const [goldValue, setGoldValue] = React.useState("")
  const [activeField, setActiveField] = React.useState<"usd" | "gold">("usd")

  const price = latestPoint.value

  React.useEffect(() => {
    const parsed = activeField === "usd" ? parseFloat(usdValue) : parseFloat(goldValue)

    if (!Number.isFinite(parsed) || !price) {
      if (activeField === "usd") {
        setGoldValue("")
      } else {
        setUsdValue("")
      }
      return
    }

    if (activeField === "usd") {
      setGoldValue((parsed / price).toFixed(4))
    } else {
      setUsdValue((parsed * price).toFixed(2))
    }
  }, [price, activeField, usdValue, goldValue])

  function handleUsdChange(event: React.ChangeEvent<HTMLInputElement>) {
    setActiveField("usd")
    setUsdValue(event.target.value)
  }

  function handleGoldChange(event: React.ChangeEvent<HTMLInputElement>) {
    setActiveField("gold")
    setGoldValue(event.target.value)
  }

  return (
    <div className="border-border/60 bg-muted/20 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Gold Calculator</p>
          <p className="text-muted-foreground text-xs">
            1 {unit} = {usdFormatter.format(price)} ({unitSuffix})
          </p>
          <p className="text-muted-foreground text-[11px]">
            Latest snapshot {monthFormatter.format(new Date(latestPoint.date))}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-muted-foreground text-xs">USD</label>
          <Input
            value={usdValue}
            onChange={handleUsdChange}
            inputMode="decimal"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-muted-foreground text-xs">Gold ({unit})</label>
          <Input
            value={goldValue}
            onChange={handleGoldChange}
            inputMode="decimal"
            className="mt-1"
          />
        </div>
      </div>
    </div>
  )
}
