import { NextResponse } from "next/server"

export async function GET() {
  return new NextResponse("Deprecated", { status: 410 })
}

export async function POST(request: Request) {
  void request
  return new NextResponse("Deprecated", { status: 410 })
}
