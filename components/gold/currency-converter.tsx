"use client"

import * as React from "react"
import { ArrowRightLeftIcon } from "lucide-react"

import { Input } from "@/components/ui/input"

type CurrencyConverterProps = {
  rate: number // USD to IDR rate
  timestamp?: Date
}

const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const idrNumberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
})

const usdNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

function parseUsdInput(value: string) {
  const cleaned = value.trim().replace(/\s/g, "").replace(/,/g, "")
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function parseIdrInput(value: string) {
  const cleaned = value.replace(/[^0-9]/g, "")
  if (!cleaned) return null
  const parsed = Number.parseInt(cleaned, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function formatIdrNumber(value: number) {
  return idrNumberFormatter.format(Math.round(value))
}

function formatUsdNumber(value: number) {
  return usdNumberFormatter.format(value)
}

export function CurrencyConverter({ rate, timestamp }: CurrencyConverterProps) {
  const [usdValue, setUsdValue] = React.useState("100")
  const [idrValue, setIdrValue] = React.useState("")
  const [activeField, setActiveField] = React.useState<"usd" | "idr">("usd")

  React.useEffect(() => {
    if (!rate) {
      return
    }

    if (activeField === "usd") {
      const parsedUsd = parseUsdInput(usdValue)
      if (parsedUsd === null) {
        setIdrValue("")
        return
      }
      setIdrValue(formatIdrNumber(parsedUsd * rate))
      return
    }

    const parsedIdr = parseIdrInput(idrValue)
    if (parsedIdr === null) {
      setUsdValue("")
      return
    }
    setUsdValue(formatUsdNumber(parsedIdr / rate))
  }, [rate, activeField, usdValue, idrValue])

  function handleUsdChange(event: React.ChangeEvent<HTMLInputElement>) {
    setActiveField("usd")
    setUsdValue(event.target.value)
  }

  function handleIdrChange(event: React.ChangeEvent<HTMLInputElement>) {
    setActiveField("idr")
    setIdrValue(event.target.value)
  }

  return (
    <div className="border-border/60 bg-muted/20 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <ArrowRightLeftIcon className="text-muted-foreground size-4" />
        <div>
          <p className="text-sm font-medium">USD to IDR</p>
          <p className="text-muted-foreground text-xs">
            1 USD = {idrFormatter.format(rate)}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="usd-idr-input" className="text-muted-foreground text-xs">
            USD
          </label>
          <Input
            id="usd-idr-input"
            value={usdValue}
            onChange={handleUsdChange}
            inputMode="decimal"
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="idr-input" className="text-muted-foreground text-xs">
            IDR
          </label>
          <Input
            id="idr-input"
            value={idrValue}
            onChange={handleIdrChange}
            inputMode="numeric"
            className="mt-1"
          />
        </div>
      </div>
      {timestamp && (
        <p className="text-muted-foreground mt-3 text-[10px]">
          Rate updated {timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      )}
    </div>
  )
}
