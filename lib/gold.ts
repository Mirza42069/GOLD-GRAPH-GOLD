import goldSeries from "@/data/gold-series.json"

const DAY_MS = 24 * 60 * 60 * 1000
const GRAMS_PER_OUNCE = 31.1034768

export type GoldRangeKind = "recent" | "month" | "year"

export type GoldRangeConfig = {
  key: string
  label: string
  kind: GoldRangeKind
  days?: number
  year?: string
  month?: string
}

export const recentRange: GoldRangeConfig = {
  key: "recent",
  label: "Recent",
  days: 14,
  kind: "recent",
}

export const goldUnits = [
  { value: "oz", label: "Ounce", shortLabel: "oz", suffix: "USD/oz" },
  { value: "g", label: "Gram", shortLabel: "g", suffix: "USD/g" },
] as const

export type GoldUnit = (typeof goldUnits)[number]["value"]

export type GoldPoint = {
  date: string
  value: number
  time: number
}

export type GoldChanges = {
  day1: number | null
  day7: number | null
  day30: number | null
}

export type GoldStats = {
  low: number
  high: number
}

type GoldAnchor = {
  date: string
  value: number
}

type GoldSeriesFile = {
  source: string
  updatedAt: string
  anchors: GoldAnchor[]
}

export type GoldData = {
  latest: GoldPoint
  range: GoldRangeConfig
  unit: GoldUnit
  unitSuffix: string
  sourceLabel: string
  rangePoints: GoldPoint[]
  rangeStats: GoldStats
  yearStats: GoldStats
  lastUpdated: string
  changes: GoldChanges
  pointsCount: number
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
  signDisplay: "always",
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const monthYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
})


export function resolveRange(input?: string | string[]): GoldRangeConfig {
  const value = Array.isArray(input) ? input[0] : input
  const normalized = value?.toLowerCase()

  if (!normalized || normalized === recentRange.key) {
    return recentRange
  }

  if (normalized.startsWith("month-")) {
    const [, year, month] = normalized.split("-")
    if (year?.length === 4 && month?.length === 2) {
      const label = monthYearFormatter.format(
        new Date(Date.UTC(Number(year), Number(month) - 1, 1))
      )
      return {
        key: normalized,
        label,
        kind: "month",
        year,
        month,
      }
    }
  }

  if (normalized.startsWith("year-")) {
    const [, year] = normalized.split("-")
    if (year?.length === 4) {
      return {
        key: normalized,
        label: year,
        kind: "year",
        year,
      }
    }
  }

  return recentRange
}

export function resolveUnit(input?: string | string[]): GoldUnit {
  const value = Array.isArray(input) ? input[0] : input
  const match = goldUnits.find((unit) => unit.value === value)
  return match?.value ?? "oz"
}

export function buildHref(rangeKey: string, unit: GoldUnit) {
  const params = new URLSearchParams()
  if (rangeKey !== recentRange.key) {
    params.set("range", rangeKey)
  }
  if (unit !== "oz") {
    params.set("unit", unit)
  }
  const query = params.toString()
  return query ? `/?${query}` : "/"
}

export function formatUsd(value: number) {
  return usdFormatter.format(value)
}

export function formatPercent(value: number) {
  return percentFormatter.format(value)
}

export function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return dateFormatter.format(date)
}

export async function getGoldData(
  range: GoldRangeConfig,
  unit: GoldUnit
): Promise<GoldData> {
  const seriesFile = loadSeriesFile()
  const series = buildSeriesFromAnchors(seriesFile.anchors)
  const unitMeta = goldUnits.find((option) => option.value === unit) ?? goldUnits[0]
  const unitMultiplier = unit === "g" ? 1 / GRAMS_PER_OUNCE : 1
  const points = series.map((point) => ({
    ...point,
    value: point.value * unitMultiplier,
  }))
  if (points.length === 0) {
    throw new Error("Gold data is empty")
  }
  const latest = points[points.length - 1]
  const lastUpdated = seriesFile.updatedAt || latest.date
  const rangePoints = sliceRange(points, range, latest)
  const yearPoints = sliceRange(points, { ...recentRange, days: 365 }, latest)
  const rangeStats = computeHighLow(rangePoints) ?? {
    low: latest.value,
    high: latest.value,
  }
  const yearStats = computeHighLow(yearPoints) ?? rangeStats
  return {
    latest,
    range,
    unit,
    unitSuffix: unitMeta.suffix,
    sourceLabel: seriesFile.source,
    rangePoints,
    rangeStats,
    yearStats,
    lastUpdated,
    changes: {
      day1: computeChange(points, 1),
      day7: computeChange(points, 7),
      day30: computeChange(points, 30),
    },
    pointsCount: rangePoints.length,
  }
}

function loadSeriesFile(): GoldSeriesFile {
  const parsed = goldSeries as GoldSeriesFile

  if (!parsed?.anchors?.length) {
    throw new Error("Gold series file is empty")
  }

  return {
    source: parsed.source || "Local snapshot",
    updatedAt: parsed.updatedAt || parsed.anchors[parsed.anchors.length - 1]?.date,
    anchors: parsed.anchors,
  }
}

function buildSeriesFromAnchors(anchors: GoldAnchor[]): GoldPoint[] {
  const sorted = [...anchors].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))

  if (sorted.length === 1) {
    const time = Date.parse(sorted[0].date)
    return [{ ...sorted[0], time }]
  }

  const points: GoldPoint[] = []

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const start = sorted[index]
    const end = sorted[index + 1]
    const startTime = Date.parse(start.date)
    const endTime = Date.parse(end.date)
    const daySpan = Math.max(1, Math.round((endTime - startTime) / DAY_MS))

    for (let day = 0; day <= daySpan; day += 1) {
      if (index > 0 && day === 0) {
        continue
      }

      const ratio = daySpan === 0 ? 0 : day / daySpan
      const value = start.value + (end.value - start.value) * ratio
      const time = startTime + day * DAY_MS
      const date = new Date(time).toISOString().slice(0, 10)

      points.push({ date, value, time })
    }
  }

  return points
}


function sliceRange(
  points: GoldPoint[],
  range: GoldRangeConfig,
  latest: GoldPoint
): GoldPoint[] {
  if (points.length === 0) {
    return []
  }

  if (range.kind === "recent") {
    const rangeDays = range.days ?? 14
    const cutoff = latest.time - rangeDays * DAY_MS
    const sliced = points.filter((point) => point.time >= cutoff)
    return sliced.length ? sliced : points
  }

  if (range.kind === "month" && range.year && range.month) {
    const prefix = `${range.year}-${range.month}`
    const sliced = points.filter((point) => point.date.startsWith(prefix))
    return sliced.length ? sliced : points
  }

  if (range.kind === "year" && range.year) {
    const year = range.year
    const sliced = points.filter((point) => point.date.startsWith(year))
    return sliced.length ? sliced : points
  }

  return points
}

function computeChange(points: GoldPoint[], daysBack: number): number | null {
  if (points.length === 0) {
    return null
  }

  const latest = points[points.length - 1]
  const target = latest.time - daysBack * DAY_MS
  let prior: GoldPoint | undefined

  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].time <= target) {
      prior = points[index]
      break
    }
  }

  if (!prior) {
    return null
  }

  return (latest.value - prior.value) / prior.value
}

function computeHighLow(points: GoldPoint[]): GoldStats | null {
  if (points.length === 0) {
    return null
  }

  let low = points[0].value
  let high = points[0].value

  for (const point of points) {
    if (point.value < low) {
      low = point.value
    }

    if (point.value > high) {
      high = point.value
    }
  }

  return { low, high }
}
