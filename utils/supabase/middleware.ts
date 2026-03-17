import { type NextRequest, NextResponse } from "next/server";

/** Legacy Supabase session refresh. Auth is Neon Auth now; no-op. */
export const updateSession = async (request: NextRequest) => {
  return NextResponse.next({
    request: { headers: request.headers },
  });
};
