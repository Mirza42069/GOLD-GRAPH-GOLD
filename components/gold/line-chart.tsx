"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import type { GoldPoint } from "@/lib/gold"

type LineChartProps = {
  points: GoldPoint[]
  className?: string
  ariaLabel?: string
  id?: string
  unitSuffix?: string
  zoom?: "in" | "out"
}

export function LineChart({
  points,
  className,
  ariaLabel = "Gold price trend",
  id = "gold-line",
  unitSuffix = "USD/oz",
  zoom = "in",
}: LineChartProps) {
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
  const [animationKey, setAnimationKey] = React.useState(0)

  React.useEffect(() => {
    if (points.length) {
      setAnimationKey((value) => value + 1)
    }
  }, [points, zoom])

  const chart = React.useMemo(() => {
    if (!points.length) {
      return null
    }

    const width = 900
    const height = 280
    const padding = 28
    const values = points.map((point) => point.value)
    let min = Math.min(...values)
    let max = Math.max(...values)

    if (min === max) {
      min -= 1
      max += 1
    }

    const paddingRatio = zoom === "out" ? 0.18 : 0.06
    const valueRange = max - min
    const valuePadding = valueRange * paddingRatio
    min -= valuePadding
    max += valuePadding

    const innerWidth = width - padding * 2
    const innerHeight = height - padding * 2
    const lastIndex = points.length - 1

    const coordinates = points.map((point, index) => {
      const x =
        points.length === 1
          ? width / 2
          : padding + (index / lastIndex) * innerWidth
      const y =
        padding + (1 - (point.value - min) / (max - min)) * innerHeight
      return { x, y }
    })

    const linePath = coordinates
      .map((point, index) => {
        const command = index === 0 ? "M" : "L"
        return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
      })
      .join(" ")

    const areaPath = `${linePath} L ${coordinates[lastIndex].x.toFixed(2)} ${(
      height - padding
    ).toFixed(2)} L ${coordinates[0].x.toFixed(2)} ${(
      height - padding
    ).toFixed(2)} Z`

    const gridLines = 4
    const gridYs = Array.from({ length: gridLines }).map((_, index) => {
      return padding + (index / (gridLines - 1)) * innerHeight
    })

    return {
      width,
      height,
      padding,
      innerWidth,
      innerHeight,
      coordinates,
      linePath,
      areaPath,
      gridYs,
      min,
      max,
    }
  }, [points, zoom])

  const priceFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    []
  )

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    []
  )

  const gradientId = `${id}-fill`

  const axisLabels = React.useMemo(() => {
    if (!points.length) {
      return [] as string[]
    }

    const totalPoints = points.length
    const lastPoint = points[totalPoints - 1]
    const spanDays = Math.max(
      1,
      Math.round((lastPoint.time - points[0].time) / (24 * 60 * 60 * 1000))
    )
    const options: Intl.DateTimeFormatOptions =
      spanDays <= 60
        ? { month: "short", day: "numeric" }
        : spanDays <= 365 * 2
          ? { month: "short", year: "numeric" }
          : { year: "numeric" }

    const formatter = new Intl.DateTimeFormat("en-US", options)
    const positions = [0, 0.25, 0.5, 0.75, 1]
    return positions.map((ratio) => {
      const index = Math.round(ratio * (totalPoints - 1))
      return formatter.format(new Date(points[index].date))
    })
  }, [points])

  const zoomClass = zoom === "in" ? "chart-zoom-in" : "chart-zoom-out"

  if (!chart) {
    return (
      <div className={cn("relative", className)}>
        <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
          No data available
        </div>
      </div>
    )
  }

  const resolvedChart = chart

  const lastIndex = resolvedChart.coordinates.length - 1
  const activeIndex = hoverIndex ?? lastIndex
  const activePoint = resolvedChart.coordinates[activeIndex]
  const activeValue = points[activeIndex]
  const tooltipDate = dateFormatter.format(new Date(activeValue.date))
  const tooltipValue = priceFormatter.format(activeValue.value)

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current) {
      return
    }

    const rect = svgRef.current.getBoundingClientRect()
    const relativeX = event.clientX - rect.left
    const viewX = (relativeX / rect.width) * resolvedChart.width
    const clampedX = Math.max(
      resolvedChart.padding,
      Math.min(viewX, resolvedChart.width - resolvedChart.padding)
    )
    const ratio = (clampedX - resolvedChart.padding) / resolvedChart.innerWidth
    const index = Math.round(ratio * lastIndex)

    setHoverIndex(Math.max(0, Math.min(lastIndex, index)))
  }

  function handlePointerLeave() {
    setHoverIndex(null)
  }

  return (
    <div className={cn("relative", className)}>
      <div key={animationKey} className={cn("relative", zoomClass)}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${resolvedChart.width} ${resolvedChart.height}`}
          className="h-64 w-full text-primary"
          role="img"
          aria-label={ariaLabel}
          preserveAspectRatio="none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {resolvedChart.gridYs.map((y) => (
            <line
              key={`grid-${y}`}
              x1={resolvedChart.padding}
              x2={resolvedChart.width - resolvedChart.padding}
              y1={y}
              y2={y}
              className="stroke-border/40"
              strokeWidth="1"
            />
          ))}
          <path d={resolvedChart.areaPath} fill={`url(#${gradientId})`} />
          <path
            d={resolvedChart.linePath}
            fill="none"
            className="stroke-current"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {hoverIndex !== null && (
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={resolvedChart.padding}
              y2={resolvedChart.height - resolvedChart.padding}
              className="stroke-muted-foreground/50"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          )}
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r={hoverIndex === null ? 4 : 5}
            className="fill-current stroke-background"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="text-muted-foreground mt-2 flex items-center justify-between text-[11px]">
        {axisLabels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      {hoverIndex !== null && (
        <div
          className="bg-background/90 border-border/70 pointer-events-none absolute rounded-md border px-3 py-2 text-xs shadow-md"
          style={{
            left: `${(activePoint.x / resolvedChart.width) * 100}%`,
            top: `${(activePoint.y / resolvedChart.height) * 100}%`,
            transform: "translate(-50%, -125%)",
          }}
        >
          <div className="text-muted-foreground">{tooltipDate}</div>
          <div className="font-medium">
            {tooltipValue}
            <span className="text-muted-foreground"> {unitSuffix}</span>
          </div>
        </div>
      )}
    </div>
  )
}
