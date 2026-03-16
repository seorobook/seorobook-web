### Full Neon Migration – Phase 2 (Continuation)

We already have the high-level migration plan in `[.cursor/plans/full-neon-migration_2e46bd42.plan.md](/Users/minkeychang/seorobook/.cursor/plans/full-neon-migration_2e46bd42.plan.md)`, with early todos marked completed. This phase focuses on the remaining work: server Supabase utils → Neon DAL, client Supabase usage → API routes + DAL, final Supabase removal, backend Neon/JWT, and regression tests.

---

### 1. Finish server Supabase utils → Neon DAL (`server-utils-to-dal`)

- **1.1. Inventory existing Supabase server utilities**
  - Open `utils/supabase` and list all files (e.g. `getVisitedRealms.ts`, `getPlayRealmData.ts`, `saveRealm.ts`, `updateVisitedRealms.ts`, etc.).
  - For each file, note:
    - Input parameters (including any `access_token`/`userId` assumptions).
    - Tables/columns touched (e.g. `realms`, `profiles`, `visited_realms`).
    - Return shape (raw rows vs. derived DTOs).

- **1.2. Map each util to DAL responsibilities**
  - For each util, decide which DAL module(s) it should correspond to:
    - Navigation/space data → `data/realms.ts` and `data/visitedRealms.ts`.
    - Profile/skin-related data → `data/profiles.ts`.
  - Write a short mapping table (even if just in comments/notes) like:
    - `getPlayRealmData` → `realms.getByShareId`, `profiles.getProfile`, `visitedRealms.addVisitedRealm`.
    - `saveRealm` → `realms.updateRealmMapData` (or similar).
    - `updateVisitedRealms` → `visitedRealms.addVisitedRealm`.
  - Identify any logic that is **not** pure DB (e.g. authorization, redirect decisions) and mark it to stay at the “service layer” or API handler, *not* inside DAL.

- **1.3. Implement missing DAL functions**
  - In `data/realms.ts`, add any functions needed to cover all current Supabase usages:
    - e.g. `getByShareId(shareId)`, `updateRealmMapData(id, payload)`, `updateRealmMeta(id, payload)`.
  - In `data/profiles.ts`, ensure functions for:
    - Reading profile by `userId`; updating `skin`; optionally updating any other profile fields currently touched by Supabase.
  - In `data/visitedRealms.ts`, ensure:
    - `getVisitedRealms(userId)` for listing.
    - `addVisitedRealm(userId, shareId)` with idempotent behavior if the existing Supabase logic expects it (e.g. don’t double-count).

- **1.4. Re-implement server utils on top of DAL (or inline them)**
  - For utilities still used by multiple call sites:
    - Refactor to call DAL functions only, and strip out Supabase-specific concepts (no `createClient`, no `access_token` handling).
    - Keep these utilities as thin orchestration layers that:
      - Take explicit `userId` or other primitives.
      - Call DAL modules and compose results.
  - For utilities used in a single place and now better expressed as a server action or API handler:
    - Inline the logic into the relevant `app/api/.../route.ts` or server component, using DAL directly.
  - Ensure auth is **always** done via `auth.getSession` at the server boundary (API route/server component), not inside DAL.

- **1.5. Remove or alias old Supabase-specific utilities**
  - Once all call sites have been updated:
    - Delete or turn old `utils/supabase/*` functions into simple re-exports of DAL-based implementations (temporary step if needed).
  - Run a project-wide search for `utils/supabase` to confirm:
    - No remaining imports from that directory.
    - No remaining references to Supabase-specific types in server-only code.

---

### 2. Client Supabase usage → API routes + DAL (`client-to-api-routes`)

- **2.1. Inventory client components using Supabase**
  - Confirm all known components:
    - `app/play/SkinMenu/SkinMenu.tsx`
    - `app/app/RealmsMenu/RealmsMenu.tsx`
    - `app/editor/Toolbars/TopBar.tsx`
    - `app/manage/ManageChild.tsx`
    - `components/Modal/CreateRealmModal.tsx`
    - `components/AccountDropdown.tsx`
  - For each, note:
    - What data it reads/writes.
    - Any current assumptions about `access_token`, `user.id`, or `session`.

- **2.2. Design API routes for each client feature**
  - Define minimal, resource-oriented endpoints:
    - `PATCH /api/profile/skin` — Change skin.
    - `POST /api/realms` — Create realm.
    - `PATCH /api/realms/[id]/meta` — Rename realm, toggle visibility/`only_owner`, etc.
    - `POST /api/realms/[id]/save` — Save map data from editor.
    - `POST /api/realms/[id]/share` — Generate/update share link (if needed).
  - For read-heavy features (lists/detail reads), decide whether:
    - To keep them in server components (preferred) using DAL directly, or
    - Expose GET API routes only if the data must be fetched client-side (e.g. live updates).

- **2.3. Implement API route handlers with Neon Auth + DAL**
  - In each `app/api/.../route.ts`:
    - Use `auth.getSession()` to retrieve the current user.
    - Enforce authorization (owner checks vs. share link rules).
    - Call appropriate DAL functions to perform DB writes or reads.
    - Return a minimal JSON schema that matches what the client components expect (or slightly more structured, and adjust client code accordingly).
  - Handle common error cases consistently:
    - 401 for unauthenticated.
    - 403 for unauthorized (e.g. wrong owner).
    - 404 for non-existent resources.

- **2.4. Refactor client components off Supabase**
  - Replace `createClient()` and all Supabase-specific calls with `fetch` to the new API routes.
  - For each component:
    - `SkinMenu`: call `PATCH /api/profile/skin` with new skin value, update local UI state optimistically.
    - `RealmsMenu`: ensure it no longer needs to call Supabase for session/access token; rely on server-rendered data or a lightweight API for counts.
    - `TopBar`: on save, call `POST /api/realms/[id]/save` instead of `saveRealm(session.access_token, ...)`.
    - `ManageChild`: use `PATCH /api/realms/[id]/meta` and any share endpoint instead of direct `supabase.from('realms').update(...)`.
    - `CreateRealmModal`: call `POST /api/realms` to create a realm, then close modal and navigate using returned ID.
    - `AccountDropdown`: invoke Neon Auth sign-out via client auth helper (e.g. `authClient.signOut()` or redirect to `/api/auth/signout` depending on your current auth wiring).
  - Remove all `@supabase/*` imports from client components once they’re using API routes.

- **2.5. Validate client flows end-to-end**
  - For each feature, manually verify:
    - It behaves correctly in the browser (including error states).
    - No Supabase client is created; network tab shows only your new `/api/...` calls.
    - Neon Auth session state (login/logout) is honored by these routes.

---

### 3. Final Supabase removal (`remove-supabase-final`)

- **3.1. Remove Supabase imports and utilities**
  - Run a full-text search for:
    - `@supabase/`, `supabase-js`, `createClient`, `utils/supabase`.
  - For any remaining references:
    - Migrate them to DAL/API route equivalents or delete if dead code.
  - Once confirmed:
    - Delete `utils/supabase` directory entirely.
    - Remove any `backend/src/supabase.ts` or similar, if not already handled in the backend step.

- **3.2. Clean up environment variables**
  - In root `.env.local` and `.env.example`:
    - Delete all Supabase-related keys (e.g. `SEORO_PUBLIC_SUPABASE_URL`, `SEORO_SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_*`).
  - In `backend/.env.local` and `backend/.env.example`:
    - Remove any Supabase-related keys.
    - Ensure only Neon-related variables (e.g. `BACKEND_DATABASE_URL`) remain.

- **3.3. Remove Supabase packages**
  - From `package.json`:
    - Remove `@supabase/ssr`, `@supabase/supabase-js`, and any other Supabase-related dependencies.
  - Reinstall dependencies and run typecheck/build to confirm removal:
    - `pnpm install` / `npm install` / `yarn` as appropriate.
    - `next build` to surface any missed references.

---

### 4. Backend (Express/Socket.IO) → Neon DB + Neon Auth JWT (`backend-neon-jwt`)

- **4.1. Introduce Neon DB client in backend**
  - Create `backend/src/db.ts` (or confirm existing) with:
    - A Neon/Postgres client wired to `BACKEND_DATABASE_URL`.
    - A small query helper (`query(text, params?)`) consistent with the frontend DAL style, if desired.
  - Identify which backend routes/socket handlers hit Supabase today and plan equivalent Neon queries.

- **4.2. Switch backend auth to Neon Auth JWT**
  - Decide on the JWT entrypoint:
    - Access tokens from Neon Auth stored in the frontend session, passed as `Authorization: Bearer <jwt>` for backend calls, or
    - Another officially recommended Neon Auth token mechanism (confirm via docs if needed).
  - Implement middleware or a utility in `backend` to:
    - Fetch JWKS from `/api/auth/jwks` (or Neon Auth’s configured JWKS endpoint).
    - Verify incoming `Authorization` header, decode JWT, and extract user identifier (`sub` or `user.id`).
    - Attach the user identity to `req`/socket context for downstream handlers.

- **4.3. Replace Supabase-based user checks with JWT checks**
  - In HTTP handlers and Socket.IO connection handlers:
    - Remove Supabase `getUser`/`uid` validation.
    - Replace with your JWT verification helper.
  - Ensure all operations that previously relied on Supabase user identity now rely on JWT-derived `userId`.

- **4.4. Update backend data access to Neon**
  - For each backend route/socket event that hits Supabase tables:
    - Rewrite the logic to use `backend/src/db.ts` and SQL queries that match the Neon schema.
  - Keep the backend schema assumptions aligned with the same tables as the frontend DAL (`realms`, `profiles`, `visited_realms`, etc.).

- **4.5. Smoke test backend flows**
  - Validate:
    - Auth-required backend routes return 401/403 when they should.
    - Socket connections with and without valid JWT behave as expected.
    - Any real-time features still work with Neon DB as the source of truth.

---

### 5. Regression testing and stabilization (`neon-regression-test`)

- **5.1. Define core regression scenarios**
  - Based on the high-level plan, confirm at least:
    1. Sign up and login via Neon Auth.
    2. `/app`: list realms for the logged-in user; create a new realm and see it appear.
    3. `/editor/[id]`: open editor, modify map, save; reload to confirm persistence.
    4. `/play/[id]`: enter realm via direct link or share link; skin changes persist via profile/visited-realms logic.
    5. Logout and attempt to access protected routes; verify redirect to `/signin`.

- **5.2. Run end-to-end manual tests**
  - Use a fresh user where possible to avoid legacy Supabase data assumptions.
  - For each step:
    - Watch the network panel to verify:
      - Only Neon/Auth-related endpoints and your own `/api/...` routes are used.
      - No Supabase endpoints are ever called.
  - Capture any discrepancies (unexpected 4xx/5xx, missing data) and trace them back to DAL/API/backend layers.

- **5.3. Address issues and finalize cleanup**
  - For any bug found:
    - Identify whether it’s:
      - A DAL schema mismatch,
      - An auth/session mismatch,
      - Or a client component still assuming Supabase-style responses.
    - Fix in the narrowest layer possible (prefer DAL/API adjustments over hacking around in UI).
  - Once tests pass:
    - Re-run `next build` and backend build to ensure no remaining type or runtime errors related to Supabase.
    - Optionally add a short internal checklist to re-run after future refactors (auth, create realm, edit, play, logout).