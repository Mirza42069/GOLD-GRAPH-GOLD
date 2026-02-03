"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type PricePoint = {
  time: Date
  price: number
}

type PriceChartProps = {
  points: PricePoint[]
  className?: string
  unitSuffix?: string
}

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
})

export function PriceChart({
  points,
  className,
  unitSuffix = "USD/oz",
}: PriceChartProps) {
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)

  const chart = React.useMemo(() => {
    if (!points.length) return null

    const width = 900
    const height = 240
    const paddingY = 28
    const values = points.map((p) => p.price)
    let min = Math.min(...values)
    let max = Math.max(...values)

    if (min === max) {
      min -= 10
      max += 10
    }

    const range = max - min
    const padding = range * 0.1
    min -= padding
    max += padding

    // Precompute Y labels to size left gutter.
    const yLabelValues = Array.from({ length: 4 }, (_, i) => {
      const ratio = i / 3
      const value = max - ratio * (max - min)
      return { ratio, value }
    })

    const yLabelText = yLabelValues.map((label) => priceFormatter.format(label.value))
    const maxLabelLength = yLabelText.reduce(
      (maxLen, label) => Math.max(maxLen, label.length),
      0
    )

    // Ensure "$4,636.46" doesn't clip on the left.
    const paddingX = Math.max(68, Math.min(128, 14 + maxLabelLength * 7))

    const innerWidth = width - paddingX * 2
    const innerHeight = height - paddingY * 2
    const lastIndex = points.length - 1

    const coordinates = points.map((point, index) => {
      const x = points.length === 1 ? width / 2 : paddingX + (index / lastIndex) * innerWidth
      const y = paddingY + (1 - (point.price - min) / (max - min)) * innerHeight
      return { x, y }
    })

    const linePath = coordinates
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ")

    const areaPath = `${linePath} L ${coordinates[lastIndex].x.toFixed(2)} ${(height - paddingY).toFixed(2)} L ${coordinates[0].x.toFixed(2)} ${(height - paddingY).toFixed(2)} Z`

    const yLabels = yLabelValues.map((label, index) => {
      const y = paddingY + label.ratio * innerHeight
      return {
        value: label.value,
        y,
        label: yLabelText[index],
      }
    })

    return {
      width,
      height,
      paddingX,
      paddingY,
      innerWidth,
      innerHeight,
      coordinates,
      linePath,
      areaPath,
      yLabels,
      yLabelText,
      min,
      max,
    }
  }, [points])

  const labelMode = React.useMemo(() => {
    if (points.length < 2) return "date" as const
    const first = points[0].time.getTime()
    const last = points[points.length - 1].time.getTime()
    const spanDays = Math.abs(last - first) / (24 * 60 * 60 * 1000)
    return spanDays >= 2 ? ("date" as const) : ("time" as const)
  }, [points])

  // X-axis labels (5 labels spread across)
  const xLabels = React.useMemo(() => {
    if (!points.length) return []
    const positions = [0, 0.25, 0.5, 0.75, 1]
    return positions.map((ratio) => {
      const index = Math.round(ratio * (points.length - 1))
      const value = points[index].time
      return labelMode === "time" ? timeFormatter.format(value) : dateFormatter.format(value)
    })
  }, [points, labelMode])

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current || !chart) return
    const rect = svgRef.current.getBoundingClientRect()
    const relativeX = event.clientX - rect.left
    const viewX = (relativeX / rect.width) * chart.width
    const clampedX = Math.max(chart.paddingX, Math.min(viewX, chart.width - chart.paddingX))
    const ratio = (clampedX - chart.paddingX) / chart.innerWidth
    const index = Math.round(ratio * (points.length - 1))
    setHoverIndex(Math.max(0, Math.min(points.length - 1, index)))
  }

  function handlePointerLeave() {
    setHoverIndex(null)
  }

  if (!chart || !points.length) {
    return (
      <div className={cn("relative", className)}>
        <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
          No data available
        </div>
      </div>
    )
  }

  const activeIndex = hoverIndex ?? points.length - 1
  const activeCoord = chart.coordinates[activeIndex]
  const activePoint = points[activeIndex]

  return (
    <div className={cn("relative", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        className="h-60 w-full text-primary"
        preserveAspectRatio="none"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis labels */}
        {chart.yLabels.map((label, i) => (
          <text
            key={i}
            x={chart.paddingX - 8}
            y={label.y}
            className="fill-muted-foreground text-[11px] font-medium"
            textAnchor="end"
            dominantBaseline="middle"
            style={{ paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 4 }}
          >
            {label.label}
          </text>
        ))}

        {/* Grid lines */}
        {chart.yLabels.map((label, i) => (
          <line
            key={`grid-${i}`}
            x1={chart.paddingX}
            x2={chart.width - chart.paddingX}
            y1={label.y}
            y2={label.y}
            className="stroke-border/30"
            strokeWidth="1"
          />
        ))}

        {/* Area fill */}
        <path d={chart.areaPath} fill="url(#chart-fill)" />

        {/* Line */}
        <path
          d={chart.linePath}
          fill="none"
          className="stroke-current"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Hover line */}
        {hoverIndex !== null && (
          <line
            x1={activeCoord.x}
            x2={activeCoord.x}
            y1={chart.paddingY}
            y2={chart.height - chart.paddingY}
            className="stroke-muted-foreground/50"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}

        {/* Active dot */}
        <circle
          cx={activeCoord.x}
          cy={activeCoord.y}
          r={hoverIndex === null ? 4 : 6}
          className="fill-current stroke-background"
          strokeWidth="2"
        />
      </svg>

      {/* X-axis time labels */}
      <div
        className="text-muted-foreground flex items-center justify-between text-[10px]"
        style={{ paddingLeft: chart.paddingX, paddingRight: chart.paddingX }}
      >
        {xLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      {/* Tooltip */}
      {hoverIndex !== null && (
        <div
          className="bg-popover/95 border-border pointer-events-none absolute rounded-md border px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
          style={{
            left: `${(activeCoord.x / chart.width) * 100}%`,
            top: `${(activeCoord.y / chart.height) * 100}%`,
            transform: "translate(-50%, -120%)",
          }}
        >
          <div className="text-muted-foreground">
            {labelMode === "time"
              ? timeFormatter.format(activePoint.time)
              : dateTimeFormatter.format(activePoint.time)}
          </div>
          <div className="font-medium">
            {priceFormatter.format(activePoint.price)}
            <span className="text-muted-foreground ml-1 text-[10px]">{unitSuffix}</span>
          </div>
        </div>
      )}
    </div>
  )
}
