import { NextResponse } from "next/server"

export async function POST(request: Request) {
  void request
  return new NextResponse("Deprecated", { status: 410 })
}

export async function DELETE(request: Request) {
  void request
  return new NextResponse("Deprecated", { status: 410 })
}
