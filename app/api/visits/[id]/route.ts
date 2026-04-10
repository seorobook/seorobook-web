import { NextResponse } from "next/server"

export async function GET() {
  return new NextResponse("Deprecated", { status: 410 })
}

