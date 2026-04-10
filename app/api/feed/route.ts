import { NextResponse } from "next/server"

export async function GET(request: Request) {
  void request
  return new NextResponse("Deprecated", { status: 410 })
}

