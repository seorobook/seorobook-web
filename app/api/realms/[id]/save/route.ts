import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { saveRealm } from "@/utils/supabase/saveRealm"

type Params = {
  params: {
    id: string
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const realmData = body?.realmData

    if (!realmData) {
      return new NextResponse("realmData is required", { status: 400 })
    }

    const { error } = await saveRealm("", realmData, params.id)

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return new NextResponse("Failed to save realm", { status: 500 })
  }
}

