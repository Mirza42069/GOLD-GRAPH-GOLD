import Link from "next/link"
import { ArrowDownRightIcon, ArrowUpRightIcon, AlertCircleIcon } from "lucide-react"

import { GoldCalculator } from "@/components/gold/gold-calculator"
import { CurrencyConverter } from "@/components/gold/currency-converter"
import { PriceChart } from "@/components/gold/price-chart"
import { RefreshDataButton } from "@/components/gold/refresh-data-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  fetchGoldSeries,
  fetchExchangeRate,
  formatDateTime,
  formatPercent,
  formatUsd,
  goldUnits,
  type GoldUnit,
  type ExchangeRateData,
} from "@/lib/gold"

type GoldDashboardProps = {
  unit?: string | string[]
}

function resolveUnit(input?: string | string[]): GoldUnit {
  const value = Array.isArray(input) ? input[0] : input
  const match = goldUnits.find((u) => u.value === value)
  return match?.value ?? "oz"
}

function buildHref(unit: GoldUnit) {
  return unit === "oz" ? "/" : `/?unit=${unit}`
}

export async function GoldDashboard({ unit }: GoldDashboardProps) {
  const selectedUnit = resolveUnit(unit)
  const unitLabel = goldUnits.find((option) => option.value === selectedUnit)?.suffix ?? "USD/oz"

  const [goldResult, fxResult] = await Promise.allSettled([
    fetchGoldSeries(selectedUnit, 14),
    fetchExchangeRate(),
  ])

  const series = goldResult.status === "fulfilled" ? goldResult.value : null
  const error =
    goldResult.status === "rejected"
      ? goldResult.reason instanceof Error
        ? goldResult.reason.message
        : "Failed to fetch gold price"
      : null

  const exchangeRate: ExchangeRateData | null =
    fxResult.status === "fulfilled" ? fxResult.value : null
  const exchangeRateError: string | null =
    fxResult.status === "rejected"
      ? fxResult.reason instanceof Error
        ? fxResult.reason.message
        : "Failed to fetch exchange rate"
      : null

  const data = series?.data ?? null
  const chartPoints = series?.points ?? []
  const chartDays = series?.days ?? 0

  const isPositive = data ? data.changePercent24h >= 0 : false
  const ChangeIcon = isPositive ? ArrowUpRightIcon : ArrowDownRightIcon

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-primary/15 absolute -top-48 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-secondary/15 absolute bottom-0 right-0 h-72 w-72 rounded-full blur-3xl" />
        <div className="bg-foreground/5 absolute left-0 top-1/3 h-40 w-40 rounded-full blur-2xl" />
      </div>
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">MetalpriceAPI</Badge>
              <Badge variant="outline">{unitLabel}</Badge>
              <Badge variant="outline" className="text-[10px]">
                Cached
              </Badge>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Gold Graph
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Gold price tracker for personal investment context.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="border-border/60 bg-muted/30 flex items-center gap-1 rounded-full border p-1">
              {goldUnits.map((option) => (
                <Button
                  key={option.value}
                  asChild
                  size="xs"
                  variant={option.value === selectedUnit ? "secondary" : "outline"}
                >
                  <Link
                    href={buildHref(option.value)}
                    aria-current={option.value === selectedUnit ? "page" : undefined}
                  >
                    {option.shortLabel}
                  </Link>
                </Button>
              ))}
            </div>
            <RefreshDataButton />
          </div>
        </header>

        {error ? (
          <Card className="animate-in fade-in slide-in-from-bottom-2 border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircleIcon className="size-5 text-destructive" />
                <CardTitle>Unable to load gold price</CardTitle>
              </div>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild>
                <Link href={buildHref(selectedUnit)}>Retry</Link>
              </Button>
              <span className="text-muted-foreground text-xs">
                Check your connection or API token.
              </span>
            </CardContent>
          </Card>
        ) : data ? (
          <section className="flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              {/* Main Price Card */}
              <Card className="relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle>Current Gold Price</CardTitle>
                      <CardDescription>As of {formatDateTime(data.timestamp)}</CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "flex w-fit items-center gap-1.5 border",
                        isPositive
                          ? "border-emerald-400/40 text-emerald-400"
                          : "border-destructive/40 text-destructive"
                      )}
                    >
                      <ChangeIcon className="size-3.5" />
                      <span className="font-medium">{formatPercent(data.changePercent24h)}</span>
                      <span className="text-[11px] uppercase tracking-wide">1D</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-semibold tracking-tight">
                        {formatUsd(data.price)}
                      </span>
                      <span className="text-muted-foreground text-lg">{data.unitSuffix}</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-sm",
                        isPositive ? "text-emerald-400" : "text-destructive"
                      )}
                    >
                      <ChangeIcon className="size-4" />
                      <span>
                        {isPositive ? "+" : ""}
                        {formatUsd(data.change24h)} since prior close
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-muted-foreground text-xs">
                  Cached - click Refresh to update
                </CardFooter>
              </Card>

              {/* Recent Price Chart */}
              <Card className="animate-in fade-in slide-in-from-bottom-2 delay-75">
                <CardHeader>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle>Recent Trend</CardTitle>
                      <CardDescription>Last {chartDays} calendar days</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PriceChart points={chartPoints} unitSuffix={data.unitSuffix} className="w-full" />
                </CardContent>
              </Card>
            </div>

            {/* Calculators */}
            <Card className="animate-in fade-in slide-in-from-bottom-2 delay-150">
              <CardHeader>
                <CardTitle>Converters</CardTitle>
                <CardDescription>Calculate gold and currency values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <GoldCalculator price={data.price} unit={data.unit} unitSuffix={data.unitSuffix} />
                {exchangeRate && (
                  <>
                    <Separator />
                    <CurrencyConverter rate={exchangeRate.rate} timestamp={exchangeRate.timestamp} />
                  </>
                )}
                {exchangeRateError && (
                  <>
                    <Separator />
                    <div className="text-muted-foreground text-xs">
                      USD/IDR rate unavailable: {exchangeRateError}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        ) : null}

        <footer className="text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>Data is cached; click Refresh to refetch.</span>
          <span>Not financial advice.</span>
        </footer>
      </div>
    </main>
  )
}
