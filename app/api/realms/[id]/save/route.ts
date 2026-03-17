import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { saveRealm } from "@/utils/supabase/saveRealm"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => null)
    const realmData = body?.realmData

    if (!realmData) {
      return new NextResponse("realmData is required", { status: 400 })
    }

    const { error } = await saveRealm("", realmData, id)

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return new NextResponse("Failed to save realm", { status: 500 })
  }
}

