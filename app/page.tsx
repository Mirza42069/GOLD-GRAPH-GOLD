import { GoldDashboard } from "@/components/gold/gold-dashboard";

export default async function Page({
  searchParams,
}: {
  searchParams?:
    | Promise<{ range?: string | string[]; unit?: string | string[] }>
    | { range?: string | string[]; unit?: string | string[] };
}) {
  const resolved = await Promise.resolve(searchParams)
  return <GoldDashboard range={resolved?.range} unit={resolved?.unit} />
}
