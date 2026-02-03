"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RefreshCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type RefreshDataButtonProps = {
  className?: string
}

export function RefreshDataButton({ className }: RefreshDataButtonProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleRefresh() {
    setIsRefreshing(true)
    setError(null)

    try {
      const response = await fetch("/api/refresh", { method: "POST" })
      if (!response.ok) {
        throw new Error(`Refresh failed (${response.status})`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed")
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        size="xs"
        variant="outline"
        onClick={handleRefresh}
        disabled={isRefreshing}
      >
        <RefreshCcwIcon className={isRefreshing ? "mr-2 size-3.5 animate-spin" : "mr-2 size-3.5"} />
        Refresh
      </Button>
      {error ? <div className="text-destructive mt-1 text-[10px]">{error}</div> : null}
    </div>
  )
}
