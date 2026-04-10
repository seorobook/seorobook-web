import { NextResponse } from "next/server"

export async function GET() {
  return new NextResponse("Deprecated", { status: 410 })
}

export async function PATCH(request: Request) {
  void request
  return new NextResponse("Deprecated", { status: 410 })
}

export async function DELETE() {
  return new NextResponse("Deprecated", { status: 410 })
}
