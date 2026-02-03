import { GoldDashboard } from "@/components/gold/gold-dashboard"

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ unit?: string | string[] }> | { unit?: string | string[] }
}) {
  const resolved = await Promise.resolve(searchParams)
  return <GoldDashboard unit={resolved?.unit} />
}
