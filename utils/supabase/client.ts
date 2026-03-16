// Legacy Supabase browser client – now stubbed out.
// Supabase Auth/DB는 더 이상 사용하지 않으므로,
// 기존 컴포넌트가 호출하더라도 앱이 크래시 나지 않게 최소 형태만 유지한다.
// TODO: 모든 호출 지점을 Neon DB/DAL 기반 구현으로 교체한 뒤 이 파일 제거.

type SupabaseStub = {
  auth: {
    getUser: () => Promise<{ data: { user: null }; error: null }>;
    getSession: () => Promise<{ data: { session: null }; error: null }>;
    signOut: () => Promise<void>;
  };
  from: (_table: string) => {
    insert: (_values: any) => Promise<{ data: null; error: { message: string } }>;
    update: (_values: any) => {
      eq: (_col: string, _val: any) => Promise<{ data: null; error: { message: string } }>;
    };
    select: (_cols?: string) => Promise<{ data: null; error: { message: string } }>;
  };
};

export const createClient = (): SupabaseStub => {
  const notImplemented = (op: string) => ({
    data: null,
    error: { message: `Supabase client has been removed. Operation '${op}' is no longer supported.` },
  });

  return {
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
      async getSession() {
        return { data: { session: null }, error: null };
      },
      async signOut() {
        // no-op
      },
    },
    from(_table: string) {
      return {
        async insert(_values: any) {
          return notImplemented("insert");
        },
        update(_values: any) {
          return {
            async eq(_col: string, _val: any) {
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

