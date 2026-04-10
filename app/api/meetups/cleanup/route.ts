import { NextResponse } from "next/server"
import { cleanupExpiredGuests } from "@/data/meetups"

function isAllowed(request: Request): boolean {
  const token = process.env.SEORO_CLEANUP_TOKEN
  if (!token) return process.env.NODE_ENV !== "production"

  const auth = request.headers.get("authorization") || ""
  return auth === `Bearer ${token}`
}

export async function POST(request: Request) {
  if (!isAllowed(request)) return new NextResponse("Forbidden", { status: 403 })

  try {
    const deletedMembers = await cleanupExpiredGuests()
    return NextResponse.json({ deletedMembers })
  } catch {
    return new NextResponse("Cleanup failed", { status: 500 })
  }
}

