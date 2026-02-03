const GRAMS_PER_OUNCE = 31.1034768
const MANUAL_CACHE_SECONDS = 60 * 60 * 24 * 30
const GOLD_CACHE_TAG = "gold-data"
const FX_CACHE_TAG = "fx-usd-idr"
const MAX_TIMEFRAME_DAYS_FREE_PLAN = 5

export const goldUnits = [
  { value: "oz", label: "Ounce", shortLabel: "oz", suffix: "USD/oz" },
  { value: "g", label: "Gram", shortLabel: "g", suffix: "USD/g" },
] as const

export type GoldUnit = (typeof goldUnits)[number]["value"]

type MetalpriceApiError = {
  success: false
  error: {
    statusCode: number
    message: string
  }
}

type MetalpriceTimeframeSuccess = {
  success: true
  base: string
  start_date: string
  end_date: string
  rates: Record<string, Record<string, number>>
}

export type GoldData = {
  price: number
  pricePerGram: number
  change24h: number
  changePercent24h: number
  timestamp: Date
  unit: GoldUnit
  unitSuffix: string
}

export type PricePoint = {
  time: Date
  price: number
}

export type GoldSeries = {
  data: GoldData
  points: PricePoint[]
  days: number
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

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export function formatUsd(value: number) {
  return usdFormatter.format(value)
}

export function formatPercent(value: number) {
  return percentFormatter.format(value / 100)
}

export function formatDateTime(value: Date) {
  return dateTimeFormatter.format(value)
}

export function convertPrice(pricePerOz: number, unit: GoldUnit): number {
  return unit === "g" ? pricePerOz / GRAMS_PER_OUNCE : pricePerOz
}

function formatIsoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00Z`)
}

function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000)
}

function diffDaysInclusive(start: Date, end: Date) {
  const startTime = start.getTime()
  const endTime = end.getTime()
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return 0
  }
  const delta = Math.round((endTime - startTime) / (24 * 60 * 60 * 1000))
  return Math.max(0, delta) + 1
}

function buildTimeframeChunks(start: Date, end: Date, maxDaysInclusive: number) {
  const chunks: Array<{ start: string; end: string }> = []
  let cursor = start

  while (cursor.getTime() <= end.getTime()) {
    const chunkStart = cursor
    const chunkEnd = addDays(chunkStart, maxDaysInclusive - 1)
    const boundedEnd = chunkEnd.getTime() > end.getTime() ? end : chunkEnd
    chunks.push({ start: formatIsoDate(chunkStart), end: formatIsoDate(boundedEnd) })
    cursor = addDays(boundedEnd, 1)
  }

  return chunks
}

function getMetalpriceApiKey() {
  const apiKey = process.env.METALPRICE_API_KEY
  if (!apiKey) {
    throw new Error("METALPRICE_API_KEY environment variable is not set")
  }
  return apiKey
}

function isMetalpriceApiError(payload: unknown): payload is MetalpriceApiError {
  if (!payload || typeof payload !== "object") {
    return false
  }

  const record = payload as Record<string, unknown>
  if (record.success !== false) {
    return false
  }

  const error = record.error as Record<string, unknown> | undefined
  return typeof error?.message === "string"
}

export async function fetchGoldSeries(
  unit: GoldUnit = "oz",
  days: number = 5
): Promise<GoldSeries> {
  const apiKey = getMetalpriceApiKey()
  const safeDays = Math.max(2, Math.floor(days))

  const end = parseIsoDate(formatIsoDate(new Date()))
  const start = addDays(end, -(safeDays - 1))
  const chunks = buildTimeframeChunks(start, end, MAX_TIMEFRAME_DAYS_FREE_PLAN)

  const responses = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await fetch(
        `https://api.metalpriceapi.com/v1/timeframe?api_key=${apiKey}&base=XAU&currencies=USD&start_date=${chunk.start}&end_date=${chunk.end}`,
        {
          next: {
            tags: [GOLD_CACHE_TAG],
            revalidate: MANUAL_CACHE_SECONDS,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`MetalpriceAPI timeframe failed: ${response.status}`)
      }

      const json = (await response.json()) as unknown
      if (isMetalpriceApiError(json)) {
        throw new Error(json.error.message)
      }

      return json as MetalpriceTimeframeSuccess
    })
  )

  const perDayUsd: Record<string, number> = {}
  for (const timeframe of responses) {
    for (const [date, rates] of Object.entries(timeframe.rates)) {
      const record = rates as Record<string, number>
      const value = record.USD
      if (typeof value === "number" && Number.isFinite(value)) {
        perDayUsd[date] = value
      }
    }
  }

  const totalDays = diffDaysInclusive(start, end)
  const dates = Array.from({ length: totalDays }, (_, index) => {
    const day = addDays(start, index)
    return { date: formatIsoDate(day), time: day }
  })

  const rawValues = dates.map((item) => perDayUsd[item.date] ?? null)
  const firstKnown = rawValues.find((value) => value !== null)
  if (firstKnown === null || firstKnown === undefined) {
    throw new Error("MetalpriceAPI returned no points for selected range")
  }

  // Fill missing days: leading gaps use the first known; later gaps forward-fill.
  const filledValues: number[] = []
  let lastKnown = firstKnown

  for (const value of rawValues) {
    if (value !== null) {
      lastKnown = value
      filledValues.push(value)
      continue
    }
    filledValues.push(lastKnown)
  }

  const pointsOz: Array<{ date: string; time: Date; pricePerOz: number }> = dates.map(
    (item, index) => ({
      date: item.date,
      time: item.time,
      pricePerOz: filledValues[index],
    })
  )

  const lastPointOz = pointsOz[pointsOz.length - 1]
  const priorPointOz = pointsOz.length >= 2 ? pointsOz[pointsOz.length - 2] : null

  const unitMeta = goldUnits.find((option) => option.value === unit) ?? goldUnits[0]
  const currentPrice = convertPrice(lastPointOz.pricePerOz, unit)
  const priorPrice = priorPointOz ? convertPrice(priorPointOz.pricePerOz, unit) : null
  const change24h = priorPrice !== null ? currentPrice - priorPrice : 0
  const changePercent24h = priorPrice !== null && priorPrice !== 0 ? (change24h / priorPrice) * 100 : 0

  const points: PricePoint[] = pointsOz.map((point) => ({
    time: point.time,
    price: convertPrice(point.pricePerOz, unit),
  }))

  return {
    data: {
      price: currentPrice,
      pricePerGram: lastPointOz.pricePerOz / GRAMS_PER_OUNCE,
      change24h,
      changePercent24h,
      timestamp: lastPointOz.time,
      unit,
      unitSuffix: unitMeta.suffix,
    },
    points,
    days: safeDays,
  }
}

// ============================================================================
// USD to IDR Exchange Rate (via exchangerate-api.com)
// ============================================================================

export type ExchangeRateData = {
  rate: number
  from: string
  to: string
  timestamp: Date
}

type ExchangeRateApiResponse = {
  result: string
  base_code: string
  conversion_rates: Record<string, number>
  time_last_update_unix: number
}

/**
 * Fetches live USD to IDR exchange rate from exchangerate-api.com
 */
export async function fetchExchangeRate(): Promise<ExchangeRateData> {
  const apiKey = process.env.EXCHANGERATE_API_KEY

  if (!apiKey) {
    throw new Error("EXCHANGERATE_API_KEY environment variable is not set")
  }

  const response = await fetch(
    `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
    {
      next: {
        tags: [FX_CACHE_TAG],
        revalidate: MANUAL_CACHE_SECONDS,
      },
    }
  )

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Invalid exchange rate API key")
    }
    if (response.status === 429) {
      throw new Error("Exchange rate API quota exceeded")
    }
    throw new Error(`Exchange rate API failed: ${response.status}`)
  }

  const data = (await response.json()) as ExchangeRateApiResponse

  if (data.result !== "success") {
    throw new Error("Exchange rate API returned error")
  }

  const idrRate = data.conversion_rates.IDR

  if (!idrRate) {
    throw new Error("IDR rate not found in API response")
  }

  return {
    rate: idrRate,
    from: "USD",
    to: "IDR",
    timestamp: new Date(data.time_last_update_unix * 1000),
  }
}
