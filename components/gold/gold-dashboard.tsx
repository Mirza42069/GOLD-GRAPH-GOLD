import Link from "next/link"
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react"

import { LineChart } from "@/components/gold/line-chart"
import { GoldCalculator } from "@/components/gold/gold-calculator"
import { RangeControls } from "@/components/gold/range-controls"
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
  buildHref,
  formatDate,
  formatPercent,
  formatUsd,
  getGoldData,
  goldUnits,
  resolveRange,
  resolveUnit,
} from "@/lib/gold"

type GoldDashboardProps = {
  range?: string | string[]
  unit?: string | string[]
}

type StatCardProps = {
  label: string
  value: string
}

export async function GoldDashboard({ range, unit }: GoldDashboardProps) {
  const rangeConfig = resolveRange(range)
  const selectedUnit = resolveUnit(unit)
  const rangeLabel = rangeConfig.label
  const unitLabel =
    goldUnits.find((option) => option.value === selectedUnit)?.suffix ?? "USD/oz"

  let data: Awaited<ReturnType<typeof getGoldData>> | null = null
  let hasError = false

  try {
    data = await getGoldData(rangeConfig, selectedUnit)
  } catch {
    hasError = true
  }

  const sourceLabel = data?.sourceLabel ?? "Local snapshot"
  const zoomLevel = rangeConfig.kind === "recent" ? "in" : "out"

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
              <Badge variant="secondary">{sourceLabel}</Badge>
              <Badge variant="outline">{unitLabel}</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Gold Graph
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Minimal gold benchmark view for investment context.
              </p>
            </div>
          </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="border-border/60 bg-muted/30 flex items-center gap-1 rounded-full border p-1">
                {goldUnits.map((option) => (
                  <Button
                    key={option.value}
                    asChild
                    size="xs"
                    variant={
                      option.value === selectedUnit ? "secondary" : "outline"
                    }
                  >
                    <Link
                      href={buildHref(rangeConfig.key, option.value)}
                      aria-current={
                        option.value === selectedUnit ? "page" : undefined
                      }
                    >
                      {option.shortLabel}
                    </Link>
                  </Button>
                ))}
              </div>
              <Separator orientation="vertical" className="h-6" />
              <RangeControls
                range={rangeConfig}
                unit={selectedUnit}
                latestDate={data?.latest.date ?? ""}
              />
            </div>
          </header>

        {hasError || !data ? (
          <Card className="animate-in fade-in slide-in-from-bottom-2">
            <CardHeader>
              <CardTitle>Unable to load gold data</CardTitle>
              <CardDescription>
                Local data could not be read. Please check the data file.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild>
                <Link href={buildHref(rangeConfig.key, selectedUnit)}>Retry</Link>
              </Button>
              <span className="text-muted-foreground text-xs">
                Edit data/gold-series.json and reload.
              </span>
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[3fr_1fr]">
            <Card className="animate-in fade-in slide-in-from-bottom-2">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle>Gold Price Trend</CardTitle>
                    <CardDescription>
                      {rangeLabel} range - {sourceLabel}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    Updated {formatDate(data.lastUpdated)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <LineChart
                  points={data.rangePoints}
                  id={`gold-${data.range.key}-${data.unit}`}
                  ariaLabel={`Gold price trend in ${data.unitSuffix}`}
                  unitSuffix={data.unitSuffix}
                  className="w-full"
                  zoom={zoomLevel}
                />
                <GoldCalculator
                  latestPoint={data.latest}
                  unit={data.unit}
                  unitSuffix={data.unitSuffix}
                />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label={`${rangeLabel} high`}
                    value={formatUsd(data.rangeStats.high)}
                  />
                  <StatCard
                    label={`${rangeLabel} low`}
                    value={formatUsd(data.rangeStats.low)}
                  />
                  <StatCard
                    label="52W high"
                    value={formatUsd(data.yearStats.high)}
                  />
                  <StatCard
                    label="52W low"
                    value={formatUsd(data.yearStats.low)}
                  />
                </div>
              </CardContent>
              <CardFooter className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>Source: {data.sourceLabel}</span>
                <span>{data.pointsCount} points</span>
              </CardFooter>
            </Card>

              <Card
                size="sm"
                className="relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 lg:max-w-sm lg:justify-self-end"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
              <CardHeader>
                    <div className="space-y-1">
                      <CardTitle>Current Price</CardTitle>
                      <CardDescription>Latest available snapshot</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-4xl font-semibold tracking-tight">
                      {formatUsd(data.latest.value)}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {data.unitSuffix}
                    </p>
                  </div>
                  <Separator />
                  <div className="text-muted-foreground text-xs">
                    Updated {formatDate(data.lastUpdated)}
                  </div>
                </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                {buildChangeCards(data.changes).map((item) => (
                  <Badge
                    key={item.label}
                    variant="outline"
                    className={cn(
                      "flex items-center gap-1.5 border bg-background/40",
                      item.className
                    )}
                  >
                    {item.icon}
                    <span className="text-[11px] uppercase tracking-wide">
                      {item.label}
                    </span>
                    <span className="font-medium">{item.value}</span>
                  </Badge>
                ))}
              </CardFooter>
            </Card>
          </section>
        )}

        <footer className="text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>Update data in data/gold-series.json to refresh the chart.</span>
          <span>Not financial advice.</span>
        </footer>
      </div>
    </main>
  )
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="border-border/60 bg-muted/20 rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function buildChangeCards(changes: {
  day1: number | null
  day7: number | null
  day30: number | null
}) {
  return [
    { label: "1D", value: changes.day1 },
    { label: "7D", value: changes.day7 },
    { label: "30D", value: changes.day30 },
  ].map((item) => {
    if (item.value === null) {
      return {
        label: item.label,
        value: "--",
        className: "text-muted-foreground border-border/50",
        icon: null,
      }
    }

    const isPositive = item.value >= 0
    const Icon = isPositive ? ArrowUpRightIcon : ArrowDownRightIcon
    const className = isPositive
      ? "text-emerald-400 border-emerald-400/40"
      : "text-destructive border-destructive/40"

    return {
      label: item.label,
      value: formatPercent(item.value),
      className,
      icon: <Icon className="size-3.5" />,
    }
  })
}
