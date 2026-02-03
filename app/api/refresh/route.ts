import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

export async function POST() {
  revalidateTag("gold-data", "default")
  revalidateTag("fx-usd-idr", "default")

  return NextResponse.json({ ok: true })
}
