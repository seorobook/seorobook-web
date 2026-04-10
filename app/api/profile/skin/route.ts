import { NextResponse } from "next/server"

export async function PATCH(request: Request) {
  void request
  return new NextResponse("Deprecated", { status: 410 })
}

