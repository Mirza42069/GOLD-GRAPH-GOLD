"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import type { GoldUnit } from "@/lib/gold"

type GoldCalculatorProps = {
  price: number
  unit: GoldUnit
  unitSuffix: string
}

export function GoldCalculator({ price, unit, unitSuffix }: GoldCalculatorProps) {
  const [usdValue, setUsdValue] = React.useState("1000")
  const [goldValue, setGoldValue] = React.useState("")
  const [activeField, setActiveField] = React.useState<"usd" | "gold">("usd")

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
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Gold Calculator</p>
        <p className="text-muted-foreground text-xs">
          Convert USD to gold at current spot price ({unitSuffix})
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="usd-input" className="text-muted-foreground text-xs">
            USD
          </label>
          <Input
            id="usd-input"
            value={usdValue}
            onChange={handleUsdChange}
            inputMode="decimal"
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="gold-input" className="text-muted-foreground text-xs">
            Gold ({unit})
          </label>
          <Input
            id="gold-input"
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
