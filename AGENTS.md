# AGENTS.md — Nexara Coffee

> Primary context file for Agents Code agents working on this Nexara project.
> Read this file first before making any changes.
>
> **Split architecture — read the section matching your task:**
> - Frontend work (`client/`) → §About, §Client Structure, §Shared Frontend Rules, §Transition (for direction).
> - Backend work (`server/`) → §Server Structure, §Backend API Conventions, §Transition.
> - Cross-cutting (auth, RBAC, DB, env) → §Better Auth, §RBAC, §Database, §Environment Variables.
>
> **Current status: `client/` (Vite SPA) and `server/` (Elysia API) are NOT yet connected.**
> The frontend still fetches data through its own `createServerFn` + Supabase layer.
> TanStack Start is transitional and will be removed (see §Transition).

## Available Skills

These skills are installed and can be loaded with `skill` tool when working on related tasks:

| Skill | When to use |
|---|---|
| [tanstack-start](skill:tanstack-start) | ⚠️ TRANSITIONAL — legacy `client/` server functions only. Do NOT use for new endpoints/features |
| [tanstack-router](skill:tanstack-router) | File-based routing, route loaders, `beforeLoad`, search params (stays — router is not removed) |
| [tanstack-query-best-practices](skill:tanstack-query-best-practices) | Query keys, staleTime, cache invalidation, mutations (client) |
| [tanstack-table](skill:tanstack-table) | Headless table logic, sorting, filtering, pagination (client) |
| [better-auth-best-practices](skill:better-auth-best-practices) | Auth setup, session management, OAuth, server/client config |
| [shadcn](skill:shadcn) | Adding/fixing shadcn components, styling conventions |
| [elysiajs](skill:elysiajs) | ALL `server/` work — routes, TypeBox validation, macros, guards, plugins, Eden. See `.agents/skills/elysiajs/SKILL.md` |

## About the Project

**Nexara** is an internal operational dashboard for a fictional multi-branch cafe network based in Palembang, Indonesia.

It is primarily an internal tool used by head office admins, branch managers, cashiers, baristas, and franchise owners to operate the entire cafe network — plus a public landing page (`/`) and a customer self-service portal (`/my`) for registered members.

### Split Architecture (read this before touching code)

Monorepo with bun workspaces + turbo (`client/`, `server/`). Root scripts: `dev` (turbo, both), `dev:client`, `dev:server`, `build:api` (`bun build server/src/app.ts` → `server/dist/entry.js`, re-exported by `api/index.ts` for Vercel).

| Package | Role | Status |
|---|---|---|
| `client/` | Vite SPA dashboard (React 19). TanStack Start in **SPA mode** (`spa.enabled: true`), data via own `createServerFn` + Supabase | Standalone, NOT connected to `server/` |
| `server/` | Elysia 1.4.30 API (Bun). Drizzle ORM + `postgres.js`, 19 modules, OpenAPI at `/openapi/json` | Live standalone (`bun run src/index.ts`), NOT consumed by `client/` yet |

Known duplication (conscious, to be unified during §Transition): two DB layers (`client/database` supabase-js vs `server/src/db` Drizzle) and two Better Auth setups (`client/src/lib/auth.ts` vs `server/src/lib/auth.ts`).

### Business Model
- Head office sets menu standards, base prices, and brand guidelines
- Each branch can be managed directly by HQ (corporate-owned) or by partners/franchise owners
- Branches have limited autonomy: they can manage stock, staff schedules, and request restock — but cannot change menu/pricing without HQ approval
- Franchise branch revenue is shared according to a commission scheme, disbursed via the Payouts feature

**Built (client):** overview dashboard (3 tabs, 8 charts, 2 tables), auth flow (login/register/forgot-reset password/Google OAuth), customers (card grid + sheet detail + edit/delete — TANPA manual add, akun lahir via self-register; order count via rpc `get_customer_order_counts`), kasir & setoran harian (input + approve/reject + POS reconciliation), orders (queue + status management + Ably realtime), POS (single-file client + hooks `usePosCart`/`usePosCatalog`/`useChargeOrder`, checkout + member lookup via HP saja — field Customer Name dihapus), chat (realtime messaging, DM, branch channels, Ably integration — staff only), maps (MapLibre GL, branch markers, popup, search), menu CRUD (grid, categories, Cloudinary image upload, RHF forms), branches CRUD (table + form + franchise owner assignment), employee CRUD (TanStack Table + shadcn + FilterToolbar), reviews (list + moderate + customer self-review per completed order), transactions (list + filter), payouts (list + approve), notifications (list + mark read), audit log (timeline with search, action/table filter, expandable metadata), customer portal `/my` (order history infinite scroll 20/page incl. offline cashier-recorded orders, loyalty member card, account self-service, per-order review dialog).

**Built (server):** 19 Elysia modules (overview, kasir, orders, menu, branches, customers, employee, transactions, payouts, reviews, chat, notifications, audit, settings, maps, my-portal, landing, ably + dashboard meta), `requireRole` RBAC macro, `.model()` + string-ref validation (52 named schemas), `ok()/fail()` envelope, token-bucket rate limiting, branch-scope filtering. Refactor log: `PLAN.md` (Fase 0–4 + 3.5 + parsial 5).

**Not yet implemented:** AI Assistant page; frontend↔backend connection (see §Transition).

### Who Uses This Dashboard
| Role | Description |
|---|---|
| Super Admin | HQ directors/management, full access to all branches |
| Branch Manager | Manages operations of one specific branch |
| Cashier | Inputs daily setoran (cash deposits) and views branch data |
| Barista | Views order queue, updates order status |
| Franchise Owner | External partner, limited access to their own branch data (revenue, payout) |
| Visitor | Default role after self-registration = customer. Lives in the `/my` customer portal (own orders, loyalty member card, account self-service, self-review). Locked out of `_dashboard`, `/pos`, and chat entirely (route guard to `/my`) |

This dashboard is **all-in-one** — all daily operations are input directly through the dashboard. Real daily input uses the **setoran** (cash deposit) system — one setoran per branch per day.

### Setoran & POS Reconciliation

Setoran is a **manual cash declaration** — it is NOT automatically derived from POS transactions. This creates an audit trail of physical cash accountability:

- **POS** → records each sale with `paymentMethod` (cash/qris/debit/credit)
- **Setoran** → cashier declares physical cash at end of day; manager approves/rejects. One setoran per branch per day (`UNIQUE(branch_id, date)`). Server `createSetoran` uses SELECT-then-INSERT/UPDATE pattern: checks for existing setoran on same branch+date; if found and pending, updates it; if not found, inserts new. Insert race handled via unique-violation retry. Prevents duplicates when unique constraint exists.
- **Reconciliation**: `getExpectedCash` queries `transactions` grouped by `paymentMethod`. The result auto-fills the setoran form's `amount` so the cashier only confirms or adjusts.
- **Form UX** (`kasir-form-dialog.tsx`): shows a `KasirPosSummary` card with Total/Cash/QRIS/Debit/Credit breakdown + difference indicator. Amount auto-fills to `cashTotal` unless the user manually edits it.
- **Detail dialog** (`kasir-detail-dialog.tsx`): shows POS Comparison section (Declared vs Expected Cash vs Difference/Surplus/Shortage) to help approvers spot discrepancies.

### Customer Portal (`/my`) & Loyalty

Visitor = customer. Separate layout (`routes/my.tsx` + `my/` children, own shell + tab nav) — never enters `_dashboard`.

- **Identity vs CRM**: `user` (Better Auth login) vs `customers` (business profile: name, phone, segment, points, tier). Linked by nullable `customers.user_id → user.id` (`UNIQUE`, `ON DELETE SET NULL` — max 1 profile per login). POS walk-in rows stay `user_id = NULL` forever — by design, never converted to accounts. Accounts are born only via `/register`.
- **Attribution**: portal queries match `created_by = uid OR customer_id IN (own profile ids)` — offline cashier-recorded orders appear. POS member lookup by **phone saja** (matches normalized phone first, then exact name; fallback `fullName = phone`); new POS rows store phone.
- **Infinite scroll** (`/my/orders`, 20/page via `useSuspenseInfiniteQuery` + sentinel `IntersectionObserver`): returns `{ rows, nextPage, total, completedTotal }`. StatCard uses server `total`/`completedTotal` (not `orders.length`). Wajib infinite (bukan tabel sort) karena halaman ini tabel polos tanpa sorting TanStack Table.
- **Accrual** (best-effort, never blocks status update): on transition to `completed` (terminal — no double accrual, cancel of completed rejected) with non-null `customer_id` → `+floor(total / 10_000)` points, tier recomputed. Constants: `POINTS_PER_RP`, `TIER_THRESHOLDS` (silver 100 / gold 500 / platinum 1000), `tierForPoints()`, `earnedPointsForTotal()`, `normalizePhone()`.
- **Self-review**: own-scope, completed own order only, 1 order = 1 review via `order_id` check, `status: "pending"` for staff moderation. No global `reviews` perm for visitor.
- New reviews must also invalidate `myPortalKeys.all` (portal cache) alongside `orderKeys`.

## Project Structure

### `client/` — frontend SPA (TanStack Start, transitional)

```
client/
├── database/                      # ⚠️ TRANSITIONAL Supabase layer (supabase-js) — akan dilepas, pindah ke server/
│   ├── schema/                    # DDL SQL per domain — source of truth skema client-era
│   ├── migrations/                # Migrasi SQL bernomor — apply via psql "$DIRECT_URL" -f
│   ├── server.ts                  # supabaseAdmin (service_role, server-only)
│   ├── client.ts                  # supabase browser (publishable key, realtime)
│   └── types.ts                   # Row types + Database (manual, mengikuti SQL)
├── src/
│   ├── routes/                    # TanStack Router file-based routes (STAYS — router tidak dilepas)
│   │   ├── __root.tsx / _auth.tsx / _dashboard.tsx / pos.tsx / my.tsx / api/auth/$.ts
│   │   ├── _dashboard/            # overview, kasir, orders, menu, branches, maps, customers,
│   │   │                          # reviews, transactions, employee, payouts, chat, audit,
│   │   │                          # notifications, settings (+ index → overview)
│   │   └── my/                    # orders.tsx, member.tsx, account.tsx (+ index → orders)
│   ├── components/
│   │   ├── ui/                    # shadcn/ui (styling only)
│   │   ├── layout/                # AppSidebar, NavMain, NavUser, TeamSwitcher
│   │   ├── shared/                # BranchSwitcher, ConfirmDialog, CurrencyInput, DynamicBreadcrumb,
│   │   │                          # FilterToolbar, Kanban, SectionHeader, StatCard, TableSkeleton,
│   │   │                          # ThemeProvider, ThemeSheet, Timeline
│   │   └── fallbacks/             # Auth, Dashboard, POS, error-page (skeletons + shared error/404)
│   ├── features/{domain}/         # Domain logic — self-contained
│   │   ├── hooks/
│   │   │   ├── use{Domain}Queries.ts    # ⚠️ TRANSITIONAL: createServerFn + TanStack Query hooks
│   │   │   ├── use{Domain}Mutations.ts  # ⚠️ TRANSITIONAL: akan diganti Eden Treaty calls
│   │   │   └── ...                      # Domain-specific hooks (table, realtime, etc.)
│   │   ├── components/            # TSX — max 250 lines per file
│   │   ├── types.ts / utils.ts / data.ts
│   ├── features/query-keys.ts     # Centralized TanStack Query keys (STAYS — kunci tidak berubah)
│   ├── features/stale-time.ts     # staleTime constants (STAYS)
│   ├── features/customer-portal/  # Portal /my (visitor)
│   ├── lib/
│   │   ├── auth.ts                # ⚠️ TRANSITIONAL Better Auth instance (client-side Start)
│   │   ├── auth-client.ts         # Client auth client (STAYS — dipakai Eden auth header nanti)
│   │   ├── auth-utils.ts          # ⚠️ TRANSITIONAL getSessionFn, loadDashboardFn (server functions)
│   │   ├── rbac.ts                # Matriks permission — cermin dari server/src/access/rbac.ts
│   │   ├── with-auth.server.ts    # ⚠️ TRANSITIONAL requireAccess* untuk server functions
│   │   ├── rate-limit.ts / resend.ts / ably.server.ts / audit-log.ts / cloudinary.ts
│   │   └── realtime.ts            # Ably Realtime client (browser-side, STAYS)
│   ├── stores/                    # Zustand: branch.ts, sidebar.ts (STAYS)
│   ├── hooks/                     # Shared hooks (STAYS): useConfirmAction, useFormDialog, useImageUpload,
│   │                              # useMobile, useTableState, useTheme, useAblyToken
│   ├── integrations/tanstack-query/ # Query client setup, provider, devtools (STAYS)
│   ├── utils/                     # cn, convert-types, format, branch-scope, group-by, status
│   ├── styles.css / router.tsx / routeTree.gen.ts
├── vite.config.ts                 # tanstackStart({ spa: { enabled: true } }) — SSR off
└── RULES.md                       # Client-side rule detail (server functions pattern, dll.)
```

### `server/` — backend API (Elysia, source of truth untuk API)

```
server/src/
├── app.ts                         # Elysia root: openapiDocs + betterAuth + routes + errorPlugin.
│                                  # Export type App (untuk Eden) + fetch handlers (untuk api/index.ts)
├── index.ts                       # bun run — listen PORT (default 3000)
├── env.ts                         # requireEnv() — throw at startup, no ?? "" on critical vars
├── routes/                        # api.ts (agregasi 19 modul, prefix /api), health.ts,
│                                  # sessions.ts, openapi.ts (/openapi/json — 62 paths / 52 schemas)
├── plugins/
│   ├── auth.ts                    # betterAuth instance + macro auth / requireRole([resource, action])
│   └── error.ts                   # onError: VALIDATION→400, NOT_FOUND→404, else 500 (envelope fail)
├── access/                        # ★ Otorisasi satu pintu — import dari access/index.js saja
│   ├── index.ts                   # Barrel: export * (rbac, scope, user)
│   ├── rbac.ts                    # ROLES/Role/Resource/Action/PERMISSIONS/RESOURCES/ACTIONS/
│   │                              # NAV_GUARDS/can() (pure, tanpa DB)
│   ├── scope.ts                   # branchFilter() + getAccessibleBranchIds() (1 query/request,
│   │                              # null = super_admin) + emptyScope/assertBranchAccess/resolveMyScope
│   └── user.ts                    # CurrentUser { id, role, name?, email?, image? }
├── lib/                           # Inti app murni (tanpa I/O)
│   ├── http.ts                    # ok(data) / fail(code, msg) — satu-satunya envelope
│   ├── schema.ts                  # idParams + paginationQuery/pageResult (shared validators)
│   └── auth.ts                    # Better Auth instance (drizzle adapter)
├── infra/                         # Klien SDK pihak ketiga saja
│   ├── ably.ts / email.ts (resend) / images.ts (cloudinary)
├── utils/
│   ├── effects.ts                 # publishAbly (fire-and-forget) + checkRate + token-bucket
│   │                              # rate limiter O(1) + logAudit (fire-and-forget)
│   └── loyalty.ts                 # POINTS_PER_RP, TIER_THRESHOLDS, tierForPoints(),
│                                  # earnedPointsForTotal(), normalizePhone()
├── db/                            # Drizzle ORM (postgres-js). schema/ per domain + index.ts.
│                                  # Semua id text + $defaultFn(crypto.randomUUID()). SQL via drizzle-kit
└── modules/{domain}/              # 19 modul: index.ts (controller) + service.ts + model.ts
    # overview, kasir, orders, menu, branches, customers, employee, transactions,
    # payouts, reviews, chat, notifications, audit, settings, maps, my, landing, ably
```

Module pattern: `model.ts` (TypeBox schemas, single source of truth) → `.model()` + string-ref di `index.ts` → `service.ts` (plain async function, terima `CurrentUser`, return `ok()/fail()`, tanpa Elysia `Context`, return-jangan-throw). Contoh: `.model({ "menu.createItem": createMenuItemBody })` + `body: "menu.createItem"` + `{ requireRole: ["menu","create"] }`.

### Architecture Rules

**Client:**
- **Routes are thin** — only routing config: `validateSearch`, `beforeLoad`, `loader`, `head`, `pendingComponent`, `errorComponent`. No inline page components.
- **Feature page components are self-contained** — each route's component lives in `features/{domain}/components/{domain}-page.tsx`, uses `getRouteApi()` + `useSession()` internally.
- **No Shell/Client intermediary layers** — absorb into the page component or split into focused sub-components.
- **No NEW `createServerFn`** — endpoint/fitur data baru WAJIB ke `server/` (Elysia). `createServerFn` existing hanya dirawat sampai migrasi §Transition selesai.
- Each feature is built **vertically**: types → hooks → components → route. Finish each feature 100% (buildable) before moving on; refactor only after complete.
- **TSX files: 250 is the split floor** — below 250 lines do not split; compose same-flow components in 1 file. Split only above ~350 lines or when logic separates cleanly. **Non-TSX files** have no line limit.
- **Global layout components** stay in `src/components/layout/`, not in features.
- **Feature hooks**: split `use{Domain}Queries.ts` / `use{Domain}Mutations.ts`. No custom `useSearch`/`useFilters`/`useSort` — TanStack Table handles it.
- **Arrow functions only** — semua komponen, hook, dan helper sebagai arrow function, bukan `function` declaration.

**Server:**
- Routes (`index.ts`) hanya routing + validasi + delegasi 1 baris ke service. Jangan pass seluruh Elysia `Context` ke service — destructure yang dibutuhkan saja.
- Service = plain async function (bukan class), decoupled dari Elysia agar testable. Tipe input diturunkan dari model (`typeof schema.static`), jangan deklarasi ulang.
- Semua return adalah `ok(data)` / `fail(code, msg)`. Pesan 404 standar: `"{Entity} not found"`.
- Validasi: `t.Number` untuk body JSON, `t.Numeric` hanya untuk query/params (coercion string→number). No `as never` / `user as` di controller.
- Otorisasi hanya lewat macro (`auth` / `requireRole`) + helper `access/` (`can`, `branchFilter`, `assertBranchAccess`, `resolveMyScope`). `/my` portal = own-scope via `session.user.id`, tanpa `can()` global.
- Rate limit via `checkRate()` (token bucket). Tidak ada plugin rate-limit.

### UI Consistency Rule (CRITICAL, client)
- **No unilateral redesign** — no layout changes, no styling differences without explicit approval
- New components must follow the existing design language (spacing, typography, colors, icons, shadcn variants)
- When in doubt between "cleaner" and "consistent with existing UI", choose **consistent**
- **Only exception:** conditional rendering uses `? ... : null` instead of `&&` (see RULES.md) — output DOM is identical
- **Forbidden:** changing padding, margin, colors, fonts, spacing, icons, grid layout, or element order in existing components

### Per-Feature Execution Order
- **Client:** `features/{domain}/types.ts + hooks/` → `components/` → route + `{domain}-page.tsx` (existing features stay; new data needs go to server first).
- **Server:** `modules/{domain}/model.ts` → `service.ts` → `index.ts` + `.model()` registration. Types/hooks/components must match before building UI.
- Before writing server functions, read the feature types and related components first to ensure return types match component expectations.

## Tech Stack

### Core
- React 19 + Vite SPA (client) — TanStack Start in SPA mode, **transitional, will be removed** (SSR/Nitro/server-fns go away; TanStack Router stays)
- Elysia 1.4.30 on Bun (server) — file `server/src/app.ts`, standalone `bun run src/index.ts`, deploy via `bun build` → `api/index.ts`
- TypeScript (strict mode, `tsc --noEmit` must stay green in both packages)

### Database & Backend
- **Better Auth** — dua setup selama transisi (`client/src/lib/auth.ts` vs `server/src/lib/auth.ts`); disatukan saat §Transition. Google OAuth, default role `visitor`, cookie-cache JWT session (`maxAge: 300`, nol query DB per `getSession`).
- **Resend** — password reset emails (`server/src/infra/email.ts`).
- **Postgres (prod)** — DUA lapis akses selama transisi:
  - client: `supabase-js` (`supabaseAdmin`, service_role, server-only) + `client/database/schema/*.sql` + `migrations/` via `psql "$DIRECT_URL"`. `DATABASE_URL` = pooler `6543`, `DIRECT_URL` = direct `5432`.
  - server: Drizzle ORM + `postgres.js` (`server/src/db`), skema per domain dengan `$defaultFn(crypto.randomUUID())`, migrasi via `drizzle-kit` (`db:generate/migrate/push/pull`).
- **Ably** — chat, live orders, activity feed (`server/src/infra/ably.ts` + `publishAbly()` fire-and-forget).
- **Eden Treaty** (`@elysiajs/eden` 1.4.9, sudah di devDeps) — konektor resmi client→server (lihat §Transition). OpenAPI JSON di `/openapi/json` (62 paths / 52 schemas, terverifikasi).
- **Agregat berat** — client-era via `rpc` SQL function (PostgREST tak bisa group-by); server-era via query builder + `Promise.all` (contoh overview: 13 agregat paralel). Expected-cash kasir (volume kecil) di-sum dari baris harian.
- **Batas PostgREST client-era (pelajaran insiden)** — response ke-cap 1000 rows diam-diam; `.in()` > ~100 UUID → 400. Jangan fetch-then-count di JS untuk tabel unbounded.
- **RBAC code-level, RLS off** — di kedua sisi sampai transisi selesai.

### UI & Styling (client, unchanged)
- Tailwind CSS v4
- shadcn/ui (base-vega, neutral) + Base UI primitives + Lucide + `next-themes` + `tw-animate-css` + `class-variance-authority`
- `@dnd-kit/*` — kanban orders

### Data Fetching & State (client)
- Zustand (active branch, sidebar) + TanStack Query (server state).
- **Current (transitional):** TanStack Query hooks call `createServerFn` directly. Route loaders optional SSR prefetch only.
- **Target (§Transition):** TanStack Query hooks call Eden Treaty client (`treaty(app)`). Query keys, staleTime, invalidasi TIDAK berubah.
- TanStack Router search params — URL state (replaces `nuqs`); route `.loader()` optional prefetch only.

### Form & Validation (client)
- `react-hook-form` + `@hookform/resolvers` + `zod` (client forms; server pakai TypeBox — dua validator hidup berdampingan, jangan dicampur)

### Data Visualization / Utilities / Quality (client, unchanged)
- Recharts, MapLibre GL; TanStack Table + shadcn Table; Sonner; `cmdk`; `@tanstack/match-sorter-utils`
- Biome, bun, React Compiler

### Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Frontend | Vite SPA (TanStack Start in SPA mode, transitional) | Router + build tetap; SSR/Nitro/server-fns dilepas |
| API Framework | Elysia 1.4.30 on Bun (not Nitro server-fns) | Type-safe, macro/guard, OpenAPI + Eden dari satu sumber model |
| ORM (server) | Drizzle + `postgres.js` (not Prisma) | Thin typed SQL layer, `$defaultFn`, drizzle-kit migrations |
| Data Access (client, transitional) | supabase-js | Akan diganti Eden calls per fitur (§Transition) |
| Client↔Server | Eden Treaty (not plain fetch) | End-to-end type safety dari `App` type; `eden` sudah di devDeps |
| Auth | Better Auth (not Supabase Auth) | Self-hosted, Google OAuth, disatukan saat transisi |
| RBAC | Custom code-level (not RLS, not CASL/casbin) | Dievaluasi-ditolak: CASL adapter Drizzle masih rc + butuh rewrite relational; RLS tak terkontrol untuk multi-scope |
| State | Zustand (client UI) + TanStack Query (server state) | Tidak berubah saat transisi |
| Data Fetching | TanStack Query (keys/stale/invalidasi tidak berubah) | Hanya `queryFn` diganti: `*Fn` → Eden |
| Routing | TanStack Router (stays) | Type-safe routes/search params; yang dilepas hanya Start |
| Realtime | Ably | Tidak berubah |
| Table | TanStack Table + shadcn/ui | Tidak berubah (server pagination ditunda — lihat PLAN Fase 5) |
| Transaction Input | Daily setoran (one per branch per day, not POS) | Audit trail kas fisik |
| Email / Storage | Resend / Cloudinary | Via `server/src/infra/` |
| Rate Limit | Native token-bucket `checkRate` (not plugin) | Per-user-per-aksi butuh user terautentikasi; plugin hanya cocok lapis luar per-IP |
| Form Validation | React Hook Form + Zod (client) / TypeBox (server) | Masing-masing sisi pakai yang idiomatis |

## Backend API Conventions (`server/`)

Wajib dibaca sebelum menyentuh `server/`. Skill: `elysiajs`.

### Module vertical

```
modules/{domain}/model.ts   → TypeBox schemas (single source: runtime + TS via typeof .static + OpenAPI)
modules/{domain}/service.ts → plain async fns (user: CurrentUser, ...) → ok()/fail()
modules/{domain}/index.ts   → new Elysia({ prefix }) + .use(authPlugin) + .model({ "ns.name": schema })
                              + route 1-baris + { params|query|body: "ns.name", requireRole: [res, act] }
```

### Auth macro (`plugins/auth.ts`)

- `auth: true` — login saja (untuk `/my` own-scope, `/ably/token`, `/dashboard/meta`).
- `requireRole: [resource, action]` — login + `can(role, action, resource)`, 401/403 otomatis. Satu-satunya cara otorisasi route staff.
- `user` terinferensi `CurrentUser` — tidak ada cast di controller.

### Access helpers (`access/index.js` — satu-satunya pintu import otorisasi)

- `can(role, action, resource)` — pure, tanpa DB. `Resource`/`Action` types + `PERMISSIONS` matrix + `NAV_GUARDS`/`RESOURCES`/`ACTIONS` (untuk dashboard meta).
- `getAccessibleBranchIds(userId, role)` — **tepat 1 query/request** (0 untuk super_admin → `null` = semua cabang). Jangan di-cache lintas request (risiko scope basi = kebocoran data cabang).
- `branchFilter(col, branchId, ids)` — wajib dipakai di semua query bercabang (`eq`/`inArray`/`sql 1=0` manual dilarang).
- `emptyScope()` / `assertBranchAccess()` / `resolveMyScope()` — guard + own-scope portal (catatan: `customers.user_id` UNIQUE → 1 profil per login, jadi `IN (...)` selalu ≤1 elemen — jangan di-"optimasi" jadi subquery).

### Envelope, validation, effects

- Sukses `ok(data)`, gagal `fail(code, msg)` (`lib/http.ts`). Bisnis error di-return, bukan throw.
- `t.Number` = body JSON; `t.Numeric` = query/params saja. Pesan 404 = `"{Entity} not found"`.
- `publishAbly()` + `logAudit()` = fire-and-forget via `void` (tidak pernah throw ke request).
- `checkRate(key, max, windowMs)` per-user-per-aksi di service yang sensitif (chat, customers, settings, landing publik).
- Shared validators `lib/schema.ts` (`idParams`, `paginationQuery`, `pageResult`) — pakai ini, jangan bikin `*IdParams` baru.

### Constraints (server)

- DO NOT pass Elysia `Context` into service. DO NOT use classes for services (plain functions).
- DO NOT use `as never` / `user as` in controllers — daftarkan model via `.model()`.
- DO NOT add Prisma, RLS, Pusher, Uploadthing, CASL/casbin, rate-limit plugin, Zod (server), `nuqs`.
- DO NOT use `?? ""` on critical env vars — throw at startup (`env.ts`).
- Skema baru = tulis Drizzle schema dulu (`server/src/db/schema/`), migrasi via `drizzle-kit`. Semua FK wajib ada index (`{table}_{column}_idx`).

## Transition: Client → Server (Eden Treaty)

Target: frontend Vite SPA murni memanggil Elysia; TanStack Start (server-fns, Nitro, SSR bits) dilepas. TanStack Router, Query keys, staleTime, invalidasi, dan UI **tidak berubah**.

### Connection pattern (target)

```ts
// client/src/lib/eden.ts (akan dibuat)
import { treaty } from "@elysiajs/eden";
import type { App } from "../../server/src/app"; // via workspace/bundled types
export const api = treaty<App>(import.meta.env.VITE_API_URL);

// di hook (ganti queryFn, kunci + invalidasi tetap):
useSuspenseQuery({ queryKey: menuKeys.lists(), queryFn: () => api.menu.items.get({ query }) })
useMutation({ mutationFn: (b) => api.menu.items.post(b),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }) })
```

Auth: cookie Better Auth dikirim otomatis (same-site/fetch `credentials`), atau Bearer — diputuskan saat migrasi auth pertama (login). Ably tetap langsung dari browser (`realtime.ts`).

### Migration order (modul mandiri dulu)

1. `maps`, `landing`, `notifications` (read-heavy, tanpa own-scope rumit)
2. CRUD: `menu`, `branches`, `customers`, `reviews`, `transactions`, `employee`, `payouts`, `settings`, `audit`
3. Terakhir: `orders`, `kasir`, `chat` (realtime), `my` (own-scope + infinite scroll), `overview` (agregat), auth flow

Per fitur: server endpoint sudah ada → ganti `queryFn`/`mutationFn` → hapus `*Fn` lama → typecheck + smoke route-nya.

### Drop list (berurutan, jangan sekaligus)

1. Mulai sekarang: **dilarang menambah `createServerFn` baru**.
2. Per fitur termigrasi: hapus `*Fn` + `with-auth.server` usage-nya.
3. Setelah semua fitur: hapus `client/database/`, `auth-utils.ts`, `with-auth.server.ts`, `tanstackStartCookies`, `@tanstack/react-start` + `ssr-query` + plugin Nitro/Netlify-Start, `api/auth/$.ts` (pindah ke server Better Auth handler).
4. RBAC matrix client (`lib/rbac.ts`) jadi cermin read-only dari server (atau di-serve via `/dashboard/meta` abilities — sudah ada).

## Better Auth — Conventions

**Server (`server/src/lib/auth.ts`, drizzle adapter):** handler di-mount via `plugins/auth.ts` (`.mount(auth.handler)`); `macro auth/requireRole` resolve `auth.api.getSession({ headers })`; cookie-cache JWT (`maxAge: 300`, nol query DB, `role` ikut ter-cache).

**Client (`client/src/lib/auth.ts`, kysely adapter — transitional):** `auth.handler(request)` di `src/routes/api/auth/$.ts`; `tanstackStartCookies()`; client via `createAuthClient()` dari `better-auth/react`.

**Keduanya:** Google OAuth redirect `http://localhost:5173/api/auth/callback/google` (+ IP variant saat dev via IP); default role `visitor`; no email OTP (`signUp.email` langsung); CSRF `csrf: { enabled: true, origin: BETTER_AUTH_URL }`; uniform error messages di endpoint publik; sensitive endpoints pakai `checkRate` (server) — client-era pakai `rateLimit()` dari `@/lib/rate-limit`.

## RBAC — Permission Matrix

### Role & Level
| Role | Level | Scope |
|---|---|---|
| `super_admin` | 0 | All branches |
| `branch_manager` | 1 | Single branch |
| `franchise_owner` | 2 | One/more owned branches |
| `cashier` | 3 | Single branch |
| `barista` | 4 | Single branch |
| `visitor` | 5 | Own data only (customer portal `/my`, default role) |

### Permissions per Page
| Page | Super Admin | Branch Manager | Cashier | Barista | Franchise Owner | Visitor |
|---|---|---|---|---|---|---|
| Overview & Analytics | F | R | R | R | R | — |
| Kasir (Setoran) | F | F | C+R | — | R | — |
| Orders | F | F | F | R+update | R | — |
| Menu | F | R | R | R | — | — |
| Branches & Mitra | F | R | — | — | R | — |
| Maps | R | R | R | R | R | — |
| Customers | F | R | R | — | — | — |
| Reviews | F | R | — | — | — | — (self-review via `/my` portal only) |
| Transactions | F | R | F | — | — | — |
| Employee & Payroll | F | F | — | — | — | — |
| Payouts | F | — | — | — | R (request) | — |
| Chat | F | F | F | F | F | — |
| Audit Log | F | R | — | — | — | — |
| Notifications | F | R | R | R | R | — |
| Settings | F | F | R+update | R+update | R+update | — (use `/my/account` instead) |
| Customer Portal (`/my`) | — | — | — | — | — | F (own orders, loyalty, account, reviews) |
| AI Assistant (not yet implemented) | F | F | — | — | — | — |

### RBAC Implementation
- Server: `can()` + `requireRole` macro di `server/src/access/` + `getAccessibleBranchIds()` (tanpa visitor case — unknown roles → `[]`).
- Client (transitional mirror): `can()` di `client/src/lib/rbac.ts`; `getDefaultRouteForRole(role)`: staff → `/overview`, visitor → `/my`.
- Visitor lockout: `_dashboard.tsx` and `my.tsx` `beforeLoad` redirect by role (`_dashboard` rejects visitor → `/my`, `/my` rejects staff → `/overview`, `/pos` allows super_admin/branch_manager/cashier only).
- Customer portal own-scope: filter by `session.user.id`, never grant visitor global perms. Visitor matrix keeps only `users: ["read","update"]`.
- RBAC is staff-only by design — no visitor branches in feature code.

## Data Fetching Pattern

**Current (client, transitional):** TanStack Query hooks call `createServerFn` directly.

```
Component
  └→ useSuspenseQuery({ queryKey, queryFn: () => serverFn({ branch }) })
Mutation: useMutation({ mutationFn, onSuccess: invalidateQueries })
```

**Target (Eden, see §Transition):** same shape, `queryFn`/`mutationFn` call `treaty` client. Keys, staleTime, invalidation unchanged.

### Caching & staleTime (client, unchanged)

`src/features/stale-time.ts`: `FREQUENT` 30s, `NORMAL` 60s, `SLOW` 5min, `STATIC` ∞.

| Feature Type | staleTime | gcTime |
|---|---|---|
| Read-only (overview, maps) | SLOW | 10min |
| CRUD (menu, branches, customers, ...) | FREQUENT | 5min |
| High-write (kasir, orders) | 0 | 5min |
| Realtime (chat, notifications) | 0 | 5min |
| Settings | FREQUENT | 5min |
| Customer portal | FREQUENT | 5min |

### TanStack Table (client, unchanged)

Sorting `getSortedRowModel()`, filtering `getFilteredRowModel()`, global search, pagination `getPaginationRowModel()`; `createColumnHelper<T>()`; `getRowId`; `header.isPlaceholder`; FilterToolbar wired to table state; pageIndex from controlled state.
**Infinite vs tabel**: `useInfiniteQuery` HANYA untuk feed tanpa sorting (`/my/orders`, notifications, chat). Tabel bersort wajib **server pagination** (`manualSorting` + `manualPagination`, validator `page/pageSize/sortBy/sortDir` + count) — bukan infinite. Infinite + `getPaginationRowModel` dilarang. (Server pagination staff tables: ditunda — PLAN Fase 5.)

## Database

- **Postgres (prod)** — single cluster, dua lapis akses selama transisi (lihat §About). Baru: perubahan skema untuk API ditulis di `server/src/db/schema/` + migrasi `drizzle-kit`.
- **Client layer (transitional):** `client/database/schema/*.sql` (9 file, 22 tabel) source of truth era-client; `migrations/` via `psql "$DIRECT_URL"`; `supabaseAdmin` service_role, import dinamis di handler; agregat berat via `rpc`; pelajaran insiden PostgREST (cap 1000 rows, `.in()` > ~100 UUID → 400) tetap berlaku untuk kode client yang tersisa.
- **Server layer:** Drizzle + `postgres.js` (`server/src/db/index.ts`, pool `max: 20`); semua id `text` + `$defaultFn(crypto.randomUUID())`; FK wajib index manual (`{table}_{column}_idx`); agregat via query builder + `Promise.all`.
- **RBAC code-level, RLS off** — di kedua sisi.
- Connection: `DATABASE_URL` (pooler `6543`, adapter auth) + `DIRECT_URL` (direct `5432`, migrasi SQL) + `SUPABASE_SERVICE_ROLE_KEY` (client server-only) dari `.env.local`.

## TanStack Query Best Practices (client — tetap berlaku penuh saat transisi)

### Query Keys
- **Always arrays**: `['menu']`, not `'menu'` or `{ entity: 'menu' }`
- **Include all dependencies**: `['kasir', branchId]`, `['kasir', 'expected-cash', branchId, date]`, `['chat', channelId, 'messages']`, `['my', 'orders']`
- **Centralized in `features/query-keys.ts`** — kunci TIDAK berubah saat pindah ke Eden
- **JSON-serializable only**

### staleTime & gcTime — see table above. `staleTime: 0` = refetch on mount; `Infinity` = manual invalidation only.

### Invalidation
- **Always invalidate after mutations**; be specific (`['menu']` vs `['menu', itemId]`); cross-entity invalidate all affected; prefix matching applies.

### Mutations
- `useMutation` + `invalidateQueries` standard. Optimistic: `onMutate` → cancel → snapshot → `setQueryData` → rollback `onError`.
- Server envelope `ok()/fail()` maps 1:1 ke `{ success, data } | { success, error }` yang dipakai hooks.

### Error & NotFound Handling
- `useSuspenseQuery` dibungkus route `errorComponent`; `ErrorPage`/`NotFoundPage` dari `@/components/fallbacks/error-page` (slot `children`, prop `to`).
- Inline handling hanya untuk data non-kritis.

### Important Constraints
- **DO NOT add new `createServerFn`** — new data needs go to `server/`
- **DO NOT use Supabase Auth / RLS / Pusher / Uploadthing / Prisma / `nuqs`** (client) — dan no CASL/casbin/rate-limit-plugin/Zod di `server/`

## Database Schema (ERD)

All IDs use text with `crypto.randomUUID()`. All FKs must be indexed manually.

Key entities (sama di kedua lapis):
- `user` (Better Auth), `account`, `session`, `verification`
- `customers.user_id → user.id` (nullable, UNIQUE, `ON DELETE SET NULL`)
- `branches`, `franchise_branches` (junction)
- `menu_categories`, `menu_items`
- `orders`, `order_items`, `daily_setorans`, `transactions`
- `customers`, `reviews`
- `employee_details`, `payrolls`
- `payouts`
- `chat_channels`, `chat_channel_members`, `chat_messages`
- `audit_logs`, `notifications`

## Environment Variables

| Variable | Client | Server |
|---|---|---|
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` / `BETTER_AUTH_TRUSTED_ORIGINS` | ✅ | ✅ |
| `DATABASE_URL` (pooler 6543) / `DIRECT_URL` (direct 5432) | ✅ | ✅ |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ✅ | ✅ |
| `RESEND_API_KEY` / `EMAIL_FROM` | ✅ | ✅ |
| `ABLY_API_KEY` | ✅ | ✅ |
| `CLOUDINARY_*` / `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ | ✅ |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | ✅ (transitional) | — |
| `VITE_API_URL` (target transisi Eden) | ✅ (akan dipakai) | — |
| `PORT` (default 3000) | — | ✅ |

## Common Mistakes to Avoid

### Feature Hooks (client)
- ❌ Do NOT add new `createServerFn` — use `server/` + Eden (see §Transition).
- ✅ Return shape `{ success: true, data } | { success: false, error }` — cocok dengan envelope server.
- ✅ Split `use{Domain}Queries.ts` / `use{Domain}Mutations.ts`. JSDoc Indonesia untuk `getXxxFn`, `@see {@link}` untuk hook wrapper.
- ✅ `.validator()` → panggil `fn({ data: { branch } })`, bukan `fn({ branch })`.
- ✅ `useQuery` untuk data reaktif terhadap input user; `useSuspenseQuery` untuk data route-level.

### RBAC
- ❌ Do NOT forget new resources in `Resource` type (server `access/rbac.ts`; mirror client).
- ❌ Branch Manager should NOT have access to Payouts.
- ❌ Cashier SHOULD have `finance: ["create", "read"]`.

### Server (`server/`)
- ❌ Do NOT pass Elysia `Context` to service; no service classes; no `as never`/`user as` in controllers.
- ❌ Do NOT throw business errors — return `fail()`. Do NOT `t.Numeric` in JSON bodies.
- ❌ No new `*IdParams` — use shared `idParams`. No new rate-limit store — use `checkRate`.
- ✅ `.model()` + string-ref untuk semua schema; pesan 404 = `"{Entity} not found"`.

### Supabase / Drizzle
- Client-era rules (supabaseAdmin dinamis, join types manual, `updates` typed, agregat via `rpc`, FK index, SQL-dulu) tetap berlaku untuk kode client tersisa.
- Server: Drizzle schema-first, `$defaultFn` untuk id, migrasi via `drizzle-kit`.

### Env & Config / Router (unchanged)
- ❌ Do NOT use `?? ""` on critical env vars.
- ❌ Router: register type, no `useEffect` fetching, `loaderDeps` untuk search-param deps, auth di `beforeLoad` bukan komponen.

## Loading & Skeleton Strategy (client, unchanged)

Single-layer: `pendingMs: 0` + `pendingComponent: XxxSkeleton` per route; `defaultPendingMs: 0` safety net; skeletons di `src/components/fallbacks/dashboard.tsx` (Overview/Menu/Branches/Maps/Customers/Employee/Chat/Audit/Notifications/Settings/Kasir/Orders/Reviews/Transactions/Payouts/MyPortal); `ErrorPage`/`NotFoundPage` dari `error-page.tsx`.

## Performance & Latency

**Historis (era client, dipertahankan sebagai pelajaran):** `/overview` ±8000ms → ±300ms via: driver DB pooler, session cookie-cache JWT, branch-scope memo per-request, merger 4 hook → 1 rpc `get_overview_dashboard`. Rules: gabung server-fn berbagi scope/auth; `Promise.all` untuk paralel; `useSuspenseQuery` + `ensureQueryData` untuk SSR penuh.

**Server:** pola setara — 1x auth macro + 1x scope resolve + agregat paralel dalam satu service (contoh `getOverviewDashboard`: 13 agregat via query builder). Tidak ada N+1: `getAccessibleBranchIds` = tepat 1 query/request; `resolveMyScope` aman karena `customers.user_id` UNIQUE (≤1 id di `IN`).
