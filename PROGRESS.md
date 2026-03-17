# 서로북 진행 상황

> MEMO.md 기준. 이 파일만 업데이트하며 진행.

---

## MEMO §6 MVP · §7.11 진행 순서 대비 현황

| §7.11 순서 | 내용 | 상태 |
|------------|------|------|
| 1 | DB 초기 스키마 (profiles, libraries, owner_id unique) | ✅ 적용됨 (Neon MCP/콘솔) |
| 2 | 인증·프로필 유지/확장 (닉네임 등) | ✅ 닉네임 컬럼·API·UI 반영 |
| 3 | 서재 입장·맵·오브젝트 (클론 플로우 검증) | ✅ 입장·에디터·플레이 동작 (params 수정 반영) |
| 4 | 독서 기록·리뷰 (books, reviews) | ✅ 테이블·API·/app/books UI 반영, 브라우저 검증 |
| 5 | 서로(관계)·DM | 🔲 미구현 |
| 6 | 피드 | 🟨 임시 구현 (reviews 기반, 오버레이/패널 이관 예정) |
| 7 | 피드 발행 | 🔲 미구현 |
| 8 | 방문 (독서 모임·음성) | 🟨 방문 세션/라우트/최소 UI 구현, **보이스/멀티는 보류** |
| 9 | BM·캐시 | 🔲 미구현 |

---

## 적용 여부

- [x] **코드·용어**: realms → libraries, RealmData → LibraryData, realmId → libraryId 반영됨
- [x] **초기 스키마**: `scripts/migrations/001_initial_schema.sql` 작성 (profiles, libraries)
- [x] **DB 스키마 적용**: Neon에서 001 실행 완료 (Neon MCP 또는 콘솔)
- [x] **프로필 자동 생성**: `ensureProfile(userId)` 추가, /app·/play 진입 시 호출
- [x] **Next.js 15+ params**: editor/play/manage 동적 라우트에서 `params`/`searchParams` Promise await 반영

---

## 레거시·미구현 정리

### 레거시 (클론 잔여) — 정리 완료

| 항목 | 위치 | 상태 |
|------|------|------|
| 소켓 이벤트명 | backend: `joinRealm` → `joinLibrary` | 완료 |
| 소켓 변수명 | backend: `realmData`/`realmData.realmId` → `joinData`/`joinData.libraryId` | 완료 |
| Editor 타입/변수 | Editor.tsx, PixiEditor: `RealmData`/`realmData` → `LibraryData`/`libraryData` | 완료 |
| 에디터 페이지 | editor/[id]: `RealmEditor` → `LibraryEditorPage`, `realmData` → `libraryData` | 완료 |
| UI 문구 | not-found: "realm" → "library" | 완료 |
| UI 문구 | SpecialTiles: "Realm" → "library" | 완료 |
| 백엔드 주석 | session, index: realm → library | 완료 |
| Supabase/realm 레거시 경로 | `utils/supabase/*`, `/api/realms/*`, `data/realms.ts` 등 | ✅ 정리 완료 (삭제/이관) |

### 아직 구현 안 된 것 (MEMO §6 MVP 기준)

- 인증·계정: 로그인/회원가입(Neon 있음), **프로필 최소 정보(닉네임)** — 닉네임 적용됨. 아바타 등 추가 확장 가능
- 서재: 1유저 1서재 **앱 로직 강제** — **적용됨** (디폴트 서재 getOrCreate, Create Library 플로우 제거)
- 독서 기록: books·reviews 테이블·API·내 독서 기록 페이지 구현됨. 서로·피드·방문·BM: 미구현

---

## 다음 작업 (우선순위)

1. **DB 마이그레이션**: 001·002·003 Neon 적용 완료. 서로·DM·방문·피드 배치 등은 별도 마이그레이션 시 추가.
2. **서로(관계)·DM** (§7.11 순서 5): relationships, direct_messages 테이블·API·UI — 미구현.
3. **/app 기본 홈 재구성**: 레거시 Editor/TopBar/툴 제거 → PlayApp 기반 “서재(가운데) + 패널(우측)” 홈으로 전환. 패널은 URL 라우팅 중심(모바일 고려).
4. **방문 세션(약속/초대/시간 제한)** (§7.11 순서 8): visits/visit_invitees 테이블 및 “링크로 입장”까지는 완료. 초대/수락 UI는 최소 구현 예정. (보이스/멀티는 당분간 보류)
5. **피드·피드 발행·BM·캐시**: MEMO §6·§7.11 순서 6~7·9 — 피드는 임시 구현 중(오버레이→패널로 이관 필요). BM·캐시는 미구현.

---

## 확인/결정이 필요한 사항 (사용자 복귀 후)

- **라우팅 구조 확정(Next 기능 적극 활용)**:
  - 옵션 A: `/app`를 `@panel` 병렬 라우트로 재구성해서 **좌측 네비(영속) + 가운데 서재(영속) + 우측 패널(병렬)**을 App Router 표준 패턴으로 고정
  - 옵션 B: `[[...slug]]` 단일 패널 라우트로 합쳐서 `/app/(panel)/[[...slug]]` 형태로 “섹션”만 slug로 관리 (파일 수 감소)
  - 결정 필요: **A/B 중 어떤 방식으로 갈지**

- **방문(visit) UX 범위**:
  - 현재: `/app/visits`에서 생성→링크 입장(로컬 플레이)까지
  - 결정 필요: **초대/수락 UI를 어디에 둘지**(우측 패널 vs 별도 페이지), 그리고 “시간 제한/만료 정책”을 어떤 규칙으로 할지

- **피드(Feed) UX 이관**:
  - 현재: 메일함 오브젝트 클릭 → `FeedOverlay`
  - 결정 필요: `/app/feed` 패널을 “피드 메인”으로 만들고, 오버레이는 링크만 띄우는 정도로 줄일지(오버레이 유지 여부)

---

## UI 원칙(확정)

- **모바일은 캔버스 미사용**: 모바일 앱에서는 성능/UX 최적화를 위해 **서재 맵/그림(캔버스)을 기본적으로 노출하지 않는다.**
- **기능 UI는 오버레이 우선**: 주요 기능(피드/아이템/집사 등)은 “우측 패널 고정”보다 **오버레이(모달/시트)** 형태가 기본.
  - URL 라우팅은 유지하되, 표현은 오버레이 중심으로 재구성한다(딥링크/뒤로가기 고려).

---

## 완료한 작업 로그

- 초기 스키마 파일 작성 (profiles, libraries)
- PROGRESS.md 초안 + 레거시/미구현 목록
- 백엔드 소켓: `joinRealm` → `joinLibrary`, `realmData` → `joinData`, "Space" → "Library"
- Editor·PixiEditor·editor 페이지: RealmData → LibraryData, realmData → libraryData, RealmEditor → LibraryEditorPage
- UI 문구: not-found, SpecialTiles, backend 메시지 realm/Space → library
- 프로필 보장: `ensureProfile()` 추가, /app·/play 진입 시 호출
- **디폴트 서재**: 서재 생성 플로우 제거. `getOrCreateDefaultLibrary(ownerId)` 추가. /app 진입 시 "서재로 돌아가기" 버튼으로 에디터 이동. CreateLibraryModal 미노출.
- **Next.js 15+ params**: editor·play·manage 동적 라우트에서 `params`/`searchParams` Promise await 반영.
- **프로필 닉네임 (MEMO §7.11 순서 2)**: 002_profiles_nickname, GET/PATCH `/api/profile`·nickname, AccountDropdown·네비바 표시 이름.
- **독서 기록·리뷰 (MEMO §7.11 순서 4)**: books·reviews 테이블·API·/app/books 목록·추가·감상(기본 비공개).
- **책장 오브젝트 (MEMO §6·§7.2)**: 에디터 object 팔레트 bookshelf. 플레이 시 책장 클릭 → 오버레이(BooksList embedded). 내 서재만 목록·추가·감상, 타인 서재 "주인만 볼 수 있어요". 클릭 판정: `village-bookshelf` 등 스프라이트명 인식.
- **메일함(피드) 오브젝트**: 메일함 타일 클릭 → FeedOverlay. GET `/api/feed?userId=` (서재 주인). 기존 reviews 기반 임시 피드(주인=전체, 방문자=public만). 테이블 없이 동작.
- **/app 진입 UX**: 레거시 "Your Libraries" 선택 화면 제거. `/app` 진입 시 **기본 서재 에디터(`/editor/:id`)로 즉시 redirect**.
- **/app 진입 UX (업데이트)**: `/app`은 “기본 홈” 레이아웃으로 전환됨(좌측 네비 + 가운데 서재 캔버스 + 우측 패널). 레거시 `/editor`, `/manage`는 `/app`으로 리다이렉트.
- **홈/방문 모드 합의**: 기본 홈(`/app`)은 **싱글/로컬(가볍게)**. 방문은 **방문 세션(약속/초대/시간 제한)**로 분리하고, **보이스는 방문 세션에서만** 사용. 초기 방문자는 “입장 + 보이스 대화만”.
- **상태(임시 변경)**: 안정성 우선으로 **보이스/웹소켓은 당분간 비활성화**. 플레이/방문 화면은 로컬 모드에서 동작하도록 유지.
- **/app 홈 UI(초안)**: `/app` 하위에 레이아웃 추가. 좌측 네비(서재/아이템/집사/피드) + (데스크톱) 가운데 서재 캔버스(PlayApp, multiplayer=false) + 우측 패널(라우팅) 구성. TopBar/툴/맵편집 없이 “홈”으로 전환 시작.
- **네비바 문구**: "내 서재 꾸미기" → "서재로 돌아가기" (NavbarChild).
- **플레이 오브젝트 표시**: object 레이어는 스프라이트 대신 32×32 채운 사각형+아웃라인 placeholder (기능 우선).
- **안정성**: room/tilemap/rooms 옵셔널·NaN 스킵. floor/above_floor 타일 로드 실패 시 해당 타일만 스킵. Player changeAnimationState·sheet/animations 방어. feed 테이블 없음(42P01) 시 빈 배열. profiles 테이블 없음 시 no-op/null.
- **리뷰 선택적 공개 (MEMO §6·§3.1)**: 감상 작성 시 비공개/공개 라디오 선택. 목록에 감상별 "비공개"/"공개" 표시. API는 기존 POST body visibility 사용. 서로만(sero)은 관계 테이블 후 추가 예정.

---

## 테스트 검증 (실행 환경)

- **백엔드**: `cd backend && npm run dev` → `Server is running on port 3001` 정상 기동
- **프론트**: `npm run dev` → Next.js 16, `http://localhost:3000` Ready
- **라우트**: `GET /` 200 (랜딩 "서로북에 오신 것을 환영합니다!"), `GET /signin` 200, `GET /app` → 비로그인 시 `/signin`으로 리다이렉트(200)
- **API**: `POST /api/libraries` (비인증) → 401 Unauthorized 기대대로 동작
- **백엔드 API**: `GET /getPlayersInRoom` (비인증) → 401
- **참고**: 로컬 fetch 도구는 localhost 미지원이라 curl로 검증. 로그인·서재 진입·플레이 등은 Neon Auth 세션 필요 → 브라우저에서 수동 로그인 후 /app → "서재로 돌아가기" 또는 서재 카드로 /editor, /play 진입까지 확인 권장. **DB에 001_initial_schema.sql 미적용 시** 최초 로그인 후 ensureProfile/library 쿼리에서 에러 날 수 있음.
- **브라우저 스모크 테스트(추가)**: `/app` → `/app/visits` 방문 생성 → `/visit/[id]` 입장(로컬 플레이) → `/app/items`, `/app/feed` 라우팅 확인. Next 런타임 에러 없음.
- **참고(방어 로직)**: 개발 환경에서 `profiles` 테이블이 아직 없을 때 `/app`이 완전히 죽지 않도록 `ensureProfile/getProfileById`는 테이블 미존재(42P01) 시 no-op/null 처리.
- **테스트 계정**: E2E/브라우저 로그인 테스트 시 `.env.test`의 `TEST_EMAIL`, `TEST_PASSWORD` 사용. 코드/문서에 값 하드코딩 금지. example.com 등 의심 도메인 사용 금지.

---

## 최근 정리 (레거시 제거)

- `utils/supabase/*`, `/api/realms/*`, `data/realms.ts`, `RealmsMenu` 등 **레거시 realm/supabase 경로 제거 완료**
- `saveLibrary`는 `utils/server-actions/saveLibrary.ts`로 이관하여 네이밍/레이어 정리
