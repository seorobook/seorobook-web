import type { SupabaseStub } from "./client";

// Legacy Supabase server client. Auth is Neon Auth; use auth from @/lib/auth instead.
export const createClient = async (): Promise<SupabaseStub> => {
  const notImplemented = (op: string) => ({
    data: null,
    error: { message: `Supabase server client removed. Use auth from @/lib/auth. (${op})` },
  });

  return {
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async signOut() {},
    },
    from(_table: string) {
      return {
        async insert(_values: unknown) {
          return notImplemented("insert");
        },
        update(_values: unknown) {
          return {
            async eq(_col: string, _val: unknown) {
              return notImplemented("update");
            },
          };
        },
        async select(_cols?: string) {
          return notImplemented("select");
        },
      };
    },
  };
};
