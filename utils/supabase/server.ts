import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Async-aware Supabase client for Next.js 16+ (cookies() is async)
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SEORO_PUBLIC_SUPABASE_URL!,
    process.env.SEORO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Safe to ignore in Server Components; proxy handles session refresh.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Safe to ignore in Server Components; proxy handles session refresh.
          }
        },
      },
    },
  );
};
