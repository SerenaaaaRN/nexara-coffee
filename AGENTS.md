# AGENTS.md — Nexara Coffee

> Primary context file for Agents Code agents working on this Nexara project.
> Read this file first before making any changes.

## Available Skills

These skills are installed and can be loaded with `skill` tool when working on related tasks:

| Skill | When to use |
|---|---|
| [tanstack-start](skill:tanstack-start) | SSR, server functions, deployment, Vite/Nitro config |
| [tanstack-router](skill:tanstack-router) | File-based routing, route loaders, `beforeLoad`, search params |
| [tanstack-query-best-practices](skill:tanstack-query-best-practices) | Query keys, staleTime, cache invalidation, mutations |
| [tanstack-table](skill:tanstack-table) | Headless table logic, sorting, filtering, pagination |
| [better-auth-best-practices](skill:better-auth-best-practices) | Auth setup, session management, OAuth, server/client config |
| [shadcn](skill:shadcn) | Adding/fixing shadcn components, styling conventions |

## About the Project

**Nexara** is an internal operational dashboard for a fictional multi-branch cafe network based in Palembang, Indonesia.

It is **not** a public company profile or landing page. It is an internal tool used by head office admins, branch managers, cashiers, baristas, and franchise owners to operate the entire cafe network.

### Business Model
- Head office sets menu standards, base prices, and brand guidelines
- Each branch can be managed directly by HQ (corporate-owned) or by partners/franchise owners
- Branches have limited autonomy: they can manage stock, staff schedules, and request restock — but cannot change menu/pricing without HQ approval
- Franchise branch revenue is shared according to a commission scheme, disbursed via the Payouts feature

**Built:** overview dashboard (3 tabs, 8 charts, 2 tables), auth flow (login/register/forgot-reset password/Google OAuth), customers CRUD (card grid + sheet detail), kasir & setoran harian (input + approve/reject + POS reconciliation), orders (queue + status management + Ably realtime), POS (cart + checkout), chat (realtime messaging, DM, branch channels, Ably integration), maps (MapLibre GL, branch markers, popup, search), menu CRUD (grid, categories, Cloudinary image upload, RHF forms), branches CRUD (table + form + franchise owner assignment), employee CRUD (TanStack Table + shadcn + FilterToolbar), reviews (list + moderate), transactions (list + filter), payouts (list + approve), notifications (list + mark read), audit log (timeline with search, action/table filter, expandable metadata).

**Not yet implemented:** AI Assistant page.

### Who Uses This Dashboard
| Role | Description |
|---|---|
| Super Admin | HQ directors/management, full access to all branches |
| Branch Manager | Manages operations of one specific branch |
| Cashier | Inputs daily setoran (cash deposits) and views branch data |
| Barista | Views order queue, updates order status |
| Franchise Owner | External partner, limited access to their own branch data (revenue, payout) |
| Visitor | Default role after self-registration. All branches read-only, can edit own profile & password, chat: DM only (reply, cannot initiate). No create/update/delete on any business data |

This dashboard is **all-in-one** — all daily operations are input directly through the dashboard. Real daily input uses the **setoran** (cash deposit) system — one setoran per branch per day.

### Setoran & POS Reconciliation

Setoran is a **manual cash declaration** — it is NOT automatically derived from POS transactions. This creates an audit trail of physical cash accountability:

- **POS** → records each sale with `paymentMethod` (cash/qris/debit/credit)
- **Setoran** → cashier declares physical cash at end of day; manager approves/rejects. One setoran per branch per day (`UNIQUE(branch_id, date)`). `createSetoranFn` uses SELECT-then-INSERT/UPDATE pattern: checks for existing setoran on same branch+date; if found and pending, updates it; if not found, inserts new. Insert race handled via unique-violation (`23505`) retry. Prevents duplicates when unique constraint exists.
- **Reconciliation**: `getExpectedCashFn` (`kasir/hooks/useKasirQueries.ts`) queries `transactions` table grouped by `paymentMethod`, filtered by `DATE(createdAt)`. The result auto-fills the setoran form's `amount` so the cashier only confirms or adjusts.
- **Form UX** (`kasir-form-dialog.tsx`): shows a `KasirPosSummary` card with Total/Cash/QRIS/Debit/Credit breakdown + difference indicator. Amount auto-fills to `cashTotal` unless the user manually edits it.
- **Detail dialog** (`kasir-detail-dialog.tsx`): shows POS Comparison section (Declared vs Expected Cash vs Difference/Surplus/Shortage) to help approvers spot discrepancies.

## Project Structure

```
database/                         # Database layer (root, bukan src/)
├── schema/                       # DDL SQL murni per domain (9 file, 22 tabel) — source of truth skema
├── migrations/                    # Migrasi SQL bernomor — apply via psql "$DIRECT_URL" -f
├── server.ts                     # supabaseAdmin (service_role, server-only)
├── client.ts                     # supabase browser (publishable key, realtime)
└── types.ts                      # Row types + Database (tipe manual, mengikuti SQL)
src/
├── routes/                          # TanStack Router file-based routes
│   ├── __root.tsx                   # Root layout (head, shell, providers)
│   ├── _auth.tsx                    # Auth layout (centered card, no sidebar)
│   ├── _auth/                       # Auth pages — no dashboard shell
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   └── reset-password.tsx
│   ├── _dashboard.tsx               # Pathless layout file — wraps all dashboard pages
│   ├── _dashboard/                  # Folder — children inherit _dashboard layout
│   │   ├── index.tsx                # / (dashboard landing, redirects to overview)
│   │   ├── overview.tsx             # /overview
│   │   ├── kasir.tsx                # /kasir
│   │   ├── orders.tsx               # /orders
│   │   ├── menu.tsx                 # /menu
│   │   ├── branches.tsx             # /branches
│   │   ├── maps.tsx                 # /maps
│   │   ├── customers.tsx            # /customers
│   │   ├── reviews.tsx              # /reviews
│   │   ├── transactions.tsx         # /transactions
│   │   ├── employee.tsx             # /employee
│   │   ├── payouts.tsx              # /payouts
│   │   ├── chat.tsx                 # /chat
│   │   ├── audit.tsx                # /audit
│   │   ├── notifications.tsx        # /notifications
│   │   └── settings.tsx             # /settings
│   ├── pos.tsx                      # /pos (separate layout, no sidebar)
│   └── api/
│       └── auth/$.ts                # Better Auth handler (catch-all)
├── components/
│   ├── ui/                          # shadcn/ui (styling only)
│   ├── layout/                      # AppSidebar, NavMain, NavUser, TeamSwitcher
│   ├── shared/                      # BranchSwitcher, ConfirmDialog, CurrencyInput, DynamicBreadcrumb,
│   │                                # FilterToolbar, Kanban, SectionHeader, StatCard, TableSkeleton,
│   │                                # ThemeProvider, ThemeSheet, Timeline
│   └── fallbacks/                   # Auth, Dashboard, POS, error-page (skeletons + shared error/404)
├── features/{domain}/               # All domain logic — self-contained
│   ├── hooks/
│   │   ├── use{Domain}Queries.ts    # Server fns + TanStack Query hooks (GET)
│   │   ├── use{Domain}Mutations.ts  # Mutation hooks (POST/PUT/DELETE)
│   │   └── ...                      # Domain-specific hooks (table, realtime, etc.)
│   ├── components/                  # TSX — max 250 lines per file
│   │   ├── {domain}-table.tsx       # TanStack Table + shadcn styling
│   │   └── ...                      # Dialogs, forms, cards
│   ├── types.ts                     # Types + Zod schemas
│   ├── utils.ts                     # Domain helpers (optional)
│   ├── data.ts                      # Static data/constants (optional)
├── features/query-keys.ts           # Centralized TanStack Query key definitions
├── features/stale-time.ts           # staleTime constants: FREQUENT(30s), NORMAL(60s), SLOW(5min), STATIC(∞)
├── lib/
│   ├── auth.ts                      # Better Auth instance
│   ├── auth-client.ts               # Client-side auth client
│   ├── auth-utils.ts                # getSessionFn, loadDashboardFn (server functions)
│   ├── rbac.ts                      # can() helper + permission matrix
│   ├── with-auth.server.ts          # requireAuth(), requireAccess(), requireAccessAction(), requireAccessRSC()
│   ├── rate-limit.ts                # Rate limiter (LRUCache)
│   ├── resend.ts                    # Resend singleton
│   ├── ably.server.ts               # Ably REST singleton (server-side)
│   ├── audit-log.ts                 # logAudit() helper
│   ├── cloudinary.ts                # Image upload/delete helpers
│   └── realtime.ts                  # Ably Realtime client (browser-side)
├── stores/                          # Zustand
│   ├── branch.ts                    # activeBranch context
│   └── sidebar.ts                   # sidebar isOpen (persisted)
├── hooks/                           # Shared hooks (used by 2+ domains)
│   ├── useConfirmAction.ts          # Generic confirmation dialog
│   ├── useFormDialog.ts             # RHF + Zod form dialog
│   ├── useImageUpload.ts            # Image upload with preview & validation
│   ├── useMobile.ts                 # Responsive/mobile detection
│   ├── useTableState.ts             # TanStack Table state (sort, filter, pagination)
│   ├── useTheme.ts                  # Theme shortcut (D key toggle)
│   └── useAblyToken.ts              # Ably token server function
├── integrations/
│   └── tanstack-query/              # Query client setup, provider, devtools
├── utils/
│   ├── cn.ts                        # clsx + tailwind-merge
│   ├── convert-types.ts             # SnakeToCamel / ToCamelCase type helpers
│   ├── format.ts                    # Date, currency, label formatting (id-ID)
│   ├── branch-scope.ts              # getAccessibleBranchIds() per-request memo + branchFilter()
│   ├── group-by.ts                  # groupByStatus() + groupByDate()
│   └── status.ts                    # Status badge variants & labels
├── styles.css                       # Tailwind v4 + shadcn CSS
├── router.tsx                       # Router creation + SSR query integration
└── routeTree.gen.ts                 # Auto-generated by TanStack Router
```

### Architecture Rules
- **Routes are thin** — only routing config: `validateSearch`, `beforeLoad`, `loader`, `head`, `pendingComponent`, `errorComponent`. No inline page components.
- **Feature page components are self-contained** — each route's component lives in `features/{domain}/components/{domain}-page.tsx`, uses `getRouteApi()` + `useSession()` internally.
- **No Shell/Client intermediary layers** — absorb into the page component or split into focused sub-components.
- SQL is source of truth: `database/schema/*.sql` dulu, `database/types.ts` mengikuti (manual, tanpa generate)
- Each feature is built **vertically**: types → server functions → hooks → components → route
- **TSX files: max 250 lines** — do not split prematurely. Multiple components can be combined in one file.
- **Non-TSX files** (types, utils) have no line limit.
- **Global layout components** stay in `src/components/layout/`, not in features.
- **Feature hooks**: All server functions + query hooks + mutation hooks live in `src/features/{domain}/hooks/`. Hooks are **split** into `use{Domain}Queries.ts` (queries) and `use{Domain}Mutations.ts` (mutations). Additional UI hooks (table state, realtime) use separate files like `use{Domain}Table.tsx`.
- **Data fetching**: TanStack Query hooks (`useSuspenseQuery`) call `createServerFn` directly. No data fetching in route loaders (route loaders optional for SSR prefetch only).
- **Sorting/filtering/pagination**: TanStack Table handles all of these. No custom `useSearch`, `useFilters`, `useSort` hooks.
- **shadcn Table** provides styling markup only. TanStack Table provides the headless logic.

### UI Consistency Rule (CRITICAL)
- **No unilateral redesign** — no layout changes, no styling differences without explicit approval
- New components must follow the existing design language (spacing, typography, colors, icons, shadcn variants)
- When in doubt between "cleaner" and "consistent with existing UI", choose **consistent**
- **Only exception:** conditional rendering uses `? ... : null` instead of `&&` (see RULES.md) — output DOM is identical
- **Forbidden:** changing padding, margin, colors, fonts, spacing, icons, grid layout, or element order in existing components

### Per-Feature Execution Order
Every feature must be completed in this exact order. **Do not skip steps. Finish each step before moving to the next.**

```
1. features/{domain}/types.ts + features/{domain}/hooks/ ← types, server fns, query hooks, mutation hooks
2. features/{domain}/components/                        ← build UI, consistent with existing design
3. route file + features/{domain}/components/{domain}-page.tsx ← thin route imports page component
```

Additional rules:
- Before writing server functions, read the feature types and related components first to ensure return types match component expectations
- Do NOT build hooks for all features first before touching UI — this causes type/data mismatches
- Each feature must be **100% complete** (buildable) before moving to the next feature
- If you find a repeating pattern, refactor only after the feature is complete (no refactoring mid-feature)

## Tech Stack

### Core
- TanStack Start (Vite + Nitro)
- React 19
- TypeScript (strict mode)

### Database & Backend
- **Better Auth** — authentication, session, OAuth (Google). Uses `tanstackStartCookies()` plugin. Client uses `createAuthClient()` from `better-auth/react`. Session di-cache via cookie (JWT) — lihat konvensi Better Auth. Adapter: `kyselyAdapter` (`@better-auth/kysely-adapter` + `kysely` + `pg`, via pooler `DATABASE_URL`).
- **Resend** — email delivery for password reset emails.
- **Supabase Postgres (prod)** — semua DML server function via `supabase-js` (`supabaseAdmin`, service_role, server-only, import dinamis di dalam handler). `DATABASE_URL` = pooler `6543?pgbouncer=true` (dipakai adapter auth), `DIRECT_URL` = direct `5432` (apply migrasi SQL).
- **Ably** — real-time WebSocket untuk chat, live orders, activity feed.
- **DDL SQL murni** — `database/schema/*.sql` per domain adalah source of truth skema. Perubahan baru masuk `database/migrations/` bernomor. `database/types.ts` ditulis manual mengikuti SQL.

### UI & Styling
- Tailwind CSS v4
- shadcn/ui — primary UI components (base-vega style, neutral base)
- Base UI (`@base-ui/react`) — accessible primitives
- Lucide React (icons)
- `next-themes` — dark/light mode
- `tw-animate-css` — animation utilities
- `class-variance-authority` — component variants

### Drag & Drop
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — kanban board (orders)

### Data Fetching & State
- Zustand — global client state (active branch context, sidebar state)
- TanStack Query — server state, caching, mutations, cache invalidation
- **Server functions** (`createServerFn`) — data fetching + mutations, called from TanStack Query hooks
- TanStack Router search params — URL state for filter & search (replaces `nuqs`)
- Route `.loader()` — optional, for SSR prefetch only (not primary data source)

### Form & Validation
- `react-hook-form` — performant form library with `register`/`Controller`/`useFieldArray`
- `@hookform/resolvers` — Zod resolver (`zodResolver`)
- `zod` — shared schema validation

### Data Visualization
- Recharts — chart analytics (overview page)
- MapLibre GL (via `maplibre-gl`)

### UI Utilities
- TanStack Table — headless table logic (sorting, filtering, pagination). Styled with shadcn Table
- Sonner — toast notifications
- Command palette — `cmdk` (via shadcn/ui Command component)
- `@tanstack/match-sorter-utils` — fuzzy search filtering in tables

### Quality & Tooling
- Biome — linting + formatting
- bun — package manager
- React Compiler — via `babel-plugin-react-compiler` + `@rolldown/plugin-babel`

### Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Framework | TanStack Start (Vite + Nitro) | File-based routing, SSR, server functions, full-stack TypeScript |
| Auth | Better Auth (not Supabase Auth) | Self-hosted, Kysely adapter, Google OAuth |
| Data Access | supabase-js (not Prisma/Drizzle) | PostgREST client, service_role server-only, SQL files as schema source |
| Database | Supabase Postgres (pooler + direct) | DML via PostgREST; pooler `6543` for auth adapter, direct `5432` for SQL migrations |
| RBAC | Custom (not RLS) | RLS complex for multi-role + multi-scope, code-level logic more controllable |
| State Management | Zustand + TanStack Query | Zustand for client UI state, TanStack Query for server state & caching |
| Data Fetching | TanStack Query (`useSuspenseQuery`) | Replaces RSC data-as-props pattern, explicit cache invalidation |
| Routing | TanStack Router | Type-safe routes/search params, file-based, loader/middleware chain |
| Realtime | Ably | Chat, live orders, activity feed via WebSocket |
| Table | TanStack Table + shadcn/ui | Headless logic (sort/filter/pagination) + shadcn styling markup |
| Transaction Input | Daily setoran (one per branch per day, not POS) | All-in-one dashboard, no POS integration needed |
| Email | Resend | Simple API, React email templates, free tier sufficient |
| Storage | Cloudinary (not Uploadthing) | Reliable CDN, transformation API, generous free tier |
| UI Framework | shadcn/ui + Tailwind v4 | Accessible components, copy-paste (not a dependency) |
| Form Validation | React Hook Form + Zod | Performant forms, shared schemas client & server |
| URL State | TanStack Router search params (not nuqs) | First-class validated search params, full type inference from Zod |

## Better Auth — Conventions

1. **Route handler**: use `auth.handler(request)` in API route `src/routes/api/auth/$.ts` (catch-all)
2. **Cookie**: `tanstackStartCookies()` plugin from `better-auth/tanstack-start` — sets cookies automatically.
3. **Server function/RSC**: call `auth.api.getSession({ headers: await getWebRequest()?.headers })`
4. **Client**: use `createAuthClient()` from `better-auth/react`, all methods
5. **Google OAuth**: Provider in `socialProviders.google`. Redirect URI: `http://localhost:5173/api/auth/callback/google`.
7. **Default role visitor**: `role` column defaults to `"visitor"`. New registrations (email + Google OAuth) automatically get `visitor` role.
8. **Auth simplification**: No email OTP flow. Standard `signUp.email()` with password directly.
9. **CSRF**: Better Auth: `csrf: { enabled: true, origin: BETTER_AUTH_URL }`.
10. **Rate limiting**: sensitive endpoints use `rateLimit(key, max, windowMs)`.
11. **Uniform error messages**: avoid leaking detail on public endpoints. OTP verify, login, and other public endpoints give generic messages (does not say "OTP wrong" vs "email not found").
12. **Runtime env validation**: `lib/auth.ts`, `lib/rbac.ts`, and `lib/realtime.ts` throw errors at startup if important env vars are missing. Do NOT use `?? ""` on critical env vars.
13. **CSRF**: configured as `csrf: { enabled: true, origin: BETTER_AUTH_URL }`. Cross-origin requests rejected automatically.
14. **Rate limiting**: sensitive endpoints (auth, role change) use `rateLimit(key, max, windowMs)` from `@/lib/rate-limit`. Returns 429 if exceeded.
15. **Google OAuth redirect URI**: `http://localhost:5173/api/auth/callback/google`. Add `http://<IP>:5173/api/auth/callback/google` to Authorized redirect URIs in Google Cloud Console when developing via IP.
16. **Visitor**: Default role for all new registrations (email + Google OAuth). All branches read-only, can edit own profile & password, chat read-only for group/branch channels, can reply in DM (cannot initiate new DMs). No create/update/delete on any business data.
17. **Session cookie cache**: `auth.ts` punya `session.cookieCache { enabled, maxAge: 300, strategy: "jwt", refreshCache: true }` → `auth.api.getSession()` diverifikasi dari cookie (HS256), **nol query DB** per pemanggilan. `session.user.role` ikut ter-cache untuk RBAC.

## RBAC — Permission Matrix

### Role & Level
| Role | Level | Scope |
|---|---|---|
| `super_admin` | 0 | All branches |
| `branch_manager` | 1 | Single branch |
| `franchise_owner` | 2 | One/more owned branches |
| `cashier` | 3 | Single branch |
| `barista` | 4 | Single branch |
| `visitor` | 5 | All branches (read-only, default role) |

### Permissions per Page
| Page | Super Admin | Branch Manager | Cashier | Barista | Franchise Owner | Visitor |
|---|---|---|---|---|---|
| Overview & Analytics | F | R | R | R | R | R |
| Kasir (Setoran) | F | F | C+R | — | R | R |
| Orders | F | F | F | R+update | R | R |
| Menu | F | R | R | R | — | R |
| Branches & Mitra | F | R | — | — | R | R |
| Maps | R | R | R | R | R | R |
| Customers | F | R | R | — | — | R |
| Reviews | F | R | — | — | — | R |
| Transactions | F | R | F | — | — | R |
| Employee & Payroll | F | F | — | — | — | R |
| Payouts | F | — | — | — | R (request) | R |
| Chat | F | F | F | F | F | DM reply |
| Audit Log | F | R | — | — | — | R |
| Notifications | F | R | R | R | R | R |
| Settings | F | F | R+update | R+update | R+update | R+update |
| AI Assistant (not yet implemented) | F | F | — | — | — | R |

### RBAC Implementation
- `can(role, action, resource)` — helper in `src/lib/rbac.ts`
- `requireAccess(action, resource)` — for API routes, throws 403
- `requireAccessAction(action, resource)` — for server functions, returns discriminated union
- `requireAccessRSC(action, resource)` — for route loaders, redirects on failure
- Branch scope via `src/utils/branch-scope.ts` → `getAccessibleBranchIds(userId, role)`

## Data Fetching Pattern

TanStack Query hooks call `createServerFn` directly. Route loaders are NOT the primary data source — they're optional SSR prefetch optimization.

```
Component
  └→ useSuspenseQuery({ queryKey, queryFn: () => serverFn({ branch }) })
       └→ createServerFn({ method: 'GET' }).handler(async ({ data: { branch } }) => ...)
            └→ handler receives { data } wrapper from createServerFn automatically
            └→ DB query with branch filter

Mutation flow:
useMutation({ mutationFn, onSuccess: invalidateQueries })
  └→ createServerFn({ method: 'POST' }).handler(...)
       └→ requireAccessAction → Zod → DB mutation → return
  └→ queryClient.invalidateQueries({ queryKey: [domain] })
```

### Caching & staleTime

Uses centralized constants from `src/features/stale-time.ts`:
- `STALE.FREQUENT` = 30_000ms (30s)
- `STALE.NORMAL` = 60_000ms (60s)
- `STALE.SLOW` = 300_000ms (5min)
- `STALE.STATIC` = `Infinity`

| Feature Type | staleTime | gcTime | Pages |
|---|---|---|---|
| Read-only | SLOW (5min) | 10min | overview, maps |
| CRUD | FREQUENT (30s) | 5min | menu, branches, customers, reviews, transactions, employee, payouts |
| High-write | 0 | 5min | kasir, orders |
| Realtime | 0 (initial via query) | 5min | chat, notifications |
| Settings | FREQUENT (30s) | 5min | settings |

**Key:** TanStack Query replaces all Next.js caching (`"use cache"`, `unstable_cache`, `updateTag`). Invalidation is explicit via `queryClient.invalidateQueries()`. No more `"use server"` directive — `createServerFn` handles it.

### TanStack Table (sorting/filtering/pagination)

All tables use TanStack Table for headless logic + shadcn Table for styling:
- Sorting: `getSortedRowModel()`
- Column filtering: `getFilteredRowModel()`
- Global search: `globalFilterFn`
- Pagination: `getPaginationRowModel()`
- No custom `useSearch`, `useFilters`, `useSort` hooks needed
- Column definitions via `createColumnHelper<T>()` (recommended over raw `ColumnDef[]`)
- `getRowId: (row) => row.id` required for stable row keys
- `header.isPlaceholder` check required in header render loop
- FilterToolbar wired to `globalFilter` / `columnFilters` state (not local data filtering)
- **Pagination display**: read `pageIndex` from `tableState.pagination.pageIndex` (controlled React state), NOT from `table.getState().pagination.pageIndex` which can desync

## Database

- **Supabase Postgres (prod)** — tabel sudah ada dengan semua data. Semua DML server function memakai `supabaseAdmin` dari `@database/server` (service_role, `auth: { persistSession: false }`, server-only, import **dinamis** di dalam handler). Browser tidak menyentuh DB langsung.
- **DDL SQL murni** — `database/schema/*.sql` per domain adalah source of truth skema (9 file, 22 tabel). Perubahan baru masuk `database/migrations/` bernomor, apply via `psql "$DIRECT_URL" -f`. Aturan besi: **SQL dulu, `database/types.ts` mengikuti** (manual, tanpa generate).
- **Agregat berat via `rpc`** — query `SUM/AVG/COUNT/GROUP BY` (overview) dikerjakan di database sebagai SQL function (lihat `database/migrations/`), dipanggil via `.rpc()`. PostgREST tidak bisa group-by dalam 1 request. Expected-cash kasir (volume kecil) di-sum di JS dari baris harian.
- **RBAC code-level, RLS off** — otorisasi tetap `requireAccessAction()` + `can()` + `getAccessibleBranchIds()`. Service_role dipakai justru agar RLS tidak menghalangi; keamanan di level kode.
- **Tipe join manual** — select polos terinferensi otomatis; hasil join/embedded diketik manual sebagai `XxxJoined` di `features/{domain}/types.ts` lalu cast `as unknown as XxxJoined[]`. Jangan taruh tipe join inline di hook.
- Connection: `DATABASE_URL` (pooler, dipakai adapter auth) dan `SUPABASE_SERVICE_ROLE_KEY` (server-only, wajib) dari `.env.local`.

## TanStack Query Best Practices (Critical Rules)

### Query Keys
- **Always arrays**: `['menu']`, not `'menu'` or `{ entity: 'menu' }`
- **Include all dependencies**: if query fn uses `branchId`, include in key: `['kasir', branchId]`
- **Hierarchical structure**: `['entity']` → `['entity', id]` → `['entity', id, 'sub']`
- **JSON-serializable only**: strings, numbers, booleans, plain objects. No functions, class instances, Symbols, or Date objects (use ISO strings)
- **Centralized in `src/features/query-keys.ts`**: all query keys are defined as structured objects (e.g., `menuKeys.all`, `menuKeys.lists()`, `menuKeys.detail(id)`)
- **Pattern for this project**: `['menu']`, `['menu', itemId]`, `['kasir', { branchId, date }]`, `['kasir', 'expected-cash', branchId, date]`, `['chat', channelId, 'messages']`

### staleTime & gcTime

Centralized constants at `src/features/stale-time.ts`:
- `STALE.FREQUENT` = 30s, `STALE.NORMAL` = 60s, `STALE.SLOW` = 5min, `STALE.STATIC` = Infinity

| Data Type | staleTime | gcTime |
|---|---|---|
| Read-only (overview, maps) | SLOW (5min) | 10min |
| CRUD (menu, branches, customers) | FREQUENT (30s) | 5min |
| High-write (kasir, orders) | 0 | 5min |
| Low-write (settings) | FREQUENT (30s) | 5min |
| Realtime (chat, notifications) | 0 | 5min |

- `staleTime: 0` = always refetch on mount
- `staleTime: Infinity` = never refetch (manual invalidation only)
- Stale data is still returned instantly — refetch happens in background

### Invalidation
- **Always invalidate after mutations**: `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu'] })`
- **Be specific**: `['menu']` (all menu) vs `['menu', itemId]` (single item)
- **Cross-entity**: if an action affects multiple entities, invalidate all relevant keys
- **Prefix matching**: `invalidateQueries({ queryKey: ['menu'] })` matches `['menu']`, `['menu', 1]`, `['menu', { cat: 'drink' }]`

### Mutations
- `useMutation` + `invalidateQueries` is the standard flow (no more `router.refresh()`)
- For optimistic updates: `onMutate` → cancel queries → snapshot → setQueryData → rollback in `onError`
- All server functions called from mutations must return `{ success, data } | { success, error }`

### Error & NotFound Handling
- All `useSuspenseQuery` calls are wrapped by route `errorComponent` — no inline error boundaries needed
- Gunakan `ErrorPage` dari `@/components/fallbacks/error-page` untuk error component di route — konsisten di seluruh app
- `ErrorPage` punya slot `children` buat tombol tambahan (contoh: `_dashboard.tsx` nambah tombol Home, `pos.tsx` nambah Go back)
- `NotFoundPage` dari file yang sama untuk 404 — prop `to` untuk arahkan link (default `"/"`)
- Inline error handling untuk data non-kritis (gunakan state lokal, jangan route errorComponent)

### Important Constraints
- **DO NOT use Supabase Auth** — auth is fully handled by Better Auth. Supabase hanya sebagai hosting Postgres (+ rencana Realtime `broadcast`), bukan Auth/RLS/Storage.
- **DO NOT use RLS** — RBAC is code-level only
- **DO NOT use Pusher** — realtime is via Ably
- **DO NOT use Uploadthing** — storage is via Cloudinary
- **DO NOT use Prisma** — supabase-js only, no ORM
- **DO NOT use `nuqs`** — TanStack Router search params replace it

## Database Schema (ERD)

All IDs use text with `crypto.randomUUID()`. All FKs must be indexed manually.

See `database/schema/` for full schemas. Key entities:
- `user` (Better Auth), `account`, `session`, `verification`
- `branches`, `franchise_branches` (junction)
- `menu_categories`, `menu_items`
- `orders`, `order_items`, `daily_setorans`, `transactions`
- `customers`, `reviews`
- `employee_details`, `payrolls`
- `payouts`
- `chat_channels`, `chat_channel_members`, `chat_messages`
- `audit_logs`, `notifications`

## Environment Variables
```bash
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:5173
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:4173,http://172.21.216.124:3000
DATABASE_URL=
DIRECT_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
EMAIL_FROM=noreply@rillah.dev
ABLY_API_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
VITE_SUPABASE_URL=
VITE_SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Common Mistakes to Avoid

### Feature Hooks (`features/{domain}/hooks/`)
- ❌ Do NOT use `requireAccess()` in server functions — it throws. Use `requireAccessAction()` instead.
- ✅ All server functions must return `{ success: true, data: T } | { success: false, error: string }`.
- ✅ Hooks are **split** into separate files: `use{Domain}Queries.ts` (server fns + TanStack Query hooks) and `use{Domain}Mutations.ts` (mutation hooks). Additional UI hooks (table, realtime) go in separate files.
- ✅ Setiap `createServerFn` (`getXxxFn`) wajib dikasih JSDoc bahasa Indonesia: jelaskan apa yang dilakukan, parameter, return value.
  Hook wrapper (`useXxx`) cukup `/** @see {@link getXxxFn} */` — ga usah deskripsi ulang.

- ✅ When using `.validator()`: you **MUST** wrap the arguments in a `data` property: call `fn({ data: { branch } })`.
- ❌ Do NOT call `fn({ branch })` directly without the `data` wrapper if there is a validator. This will cause a TypeScript error because the TanStack Start client requires the `{ data }` object.

### Data Fetching
- ✅ Use `useQuery` (not `useSuspenseQuery`) when data depends on user input (form fields, dropdown selections) that can change dynamically — prevents blocking UI while refetching.
- ✅ Use `useSuspenseQuery` for data that loads on page mount and doesn't change based on user interaction (route-level data).

### RBAC
- ❌ Do NOT forget to add new resources to the `Resource` type in `lib/rbac.ts`.
- ❌ Branch Manager should NOT have access to Payouts.
- ❌ Cashier SHOULD have `finance: ["create", "read"]`.

### Supabase (`database/` + feature hooks)
- ✅ Semua DML server function memakai `supabaseAdmin` dari `@database/server` — import **dinamis** di dalam handler, tidak pernah di top-level / komponen browser.
- ✅ Select polos terinferensi otomatis; hasil join/embedded diketik manual sebagai `XxxJoined` di `features/{domain}/types.ts`, lalu cast `as unknown as XxxJoined[]`. Jangan taruh tipe join inline di hook.
- ✅ Objek `updates` diketik `Database["public"]["Tables"]["t"]["Update"]` — jangan `Record<string, unknown>`.
- ✅ Insert selalu sertakan `id: crypto.randomUUID()`.
- ✅ `update().select().single()` dengan 0 row cocok = `data: null` tanpa error — selalu cek `if (error || !data)`. `maybeSingle()` untuk select 0/1 baris.
- ✅ Agregat (`SUM/AVG/COUNT/GROUP BY`) via SQL function + `.rpc()`, bukan N query + sum di JS (kecuali volume kecil seperti expected-cash kasir).
- ❌ Semua FK harus ada index-nya. Name pattern: `{table}_{column}_idx`.
- ❌ Perubahan skema = tulis SQL di `database/schema/` + `database/migrations/` dulu, `database/types.ts` mengikuti manual.

### Env & Config
- ❌ Do NOT use `?? ""` on critical env vars — throw at startup.

### TanStack Router
- ❌ Do NOT forget to register the router type (`declare module '@tanstack/react-router'`).
- ❌ Do NOT use `useEffect` for data fetching — use route loaders + TanStack Query.
- ❌ Do NOT forget `loaderDeps` when loader depends on search params.
- ❌ Do NOT put auth checks in components instead of `beforeLoad` — causes flash of protected content.

## Loading & Skeleton Strategy

Single-layer approach — all loading states handled by router `pendingComponent`:

| Mekanisme | File | Aktif pas |
|---|---|---|
| `pendingMs: 0` + `pendingComponent: XxxSkeleton` | Setiap route file | Navigasi antar route & search param change via loaderDeps |

No `<Suspense>` boundaries in page components. Route loader (`ensureQueryData`) pre-populates TanStack Query cache before component renders, so `useSuspenseQuery` never suspends.

### Rules
- **Semua route** wajib punya `pendingMs: 0` + `pendingComponent: SomeSkeleton`
- `defaultPendingMs: 0` di router config sebagai safety net
- Skeleton untuk route didaftarkan di `src/components/fallbacks/dashboard.tsx`

### Skeleton Components

| Skeleton | Lokasi | Dipake route |
|---|---|---|
| `OverviewSkeleton` | `dashboard.tsx` | overview |
| `MenuSkeleton` | `dashboard.tsx` | menu |
| `BranchesSkeleton` | `dashboard.tsx` | branches |
| `MapsSkeleton` | `dashboard.tsx` | maps |
| `CustomersSkeleton` | `dashboard.tsx` | customers |
| `EmployeeSkeleton` | `dashboard.tsx` | employee |
| `ChatSkeleton` | `dashboard.tsx` | chat |
| `AuditSkeleton` | `dashboard.tsx` | audit |
| `NotificationsSkeleton` | `dashboard.tsx` | notifications |
| `SettingsSkeleton` | `dashboard.tsx` | settings |
| `KasirSkeleton` | `dashboard.tsx` | kasir |
| `OrdersSkeleton` | `dashboard.tsx` | orders |
| `ReviewsSkeleton` | `dashboard.tsx` | reviews |
| `TransactionsSkeleton` | `dashboard.tsx` | transactions |
| `PayoutsSkeleton` | `dashboard.tsx` | payouts |

### Error & NotFound Components

Semua route pake `ErrorPage` dan `NotFoundPage` dari `src/components/fallbacks/error-page.tsx`:

| Komponen | Lokasi | Dipake di |
|---|---|---|
| `ErrorPage` | `error-page.tsx` | Semua route (`errorComponent`) — punya slot `children` buat tombol tambahan |
| `NotFoundPage` | `error-page.tsx` | `__root.tsx`, `_dashboard.tsx` — prop `to` atur arah link |

## Performance & Latency (Dashboard)

Latensi `/overview` turun dari **±8000ms → ±300ms** (SSR, 5 hit test) lewat 4 refactor:

1. **Driver DB** (`@database/server`) — `supabase-js` (PostgREST, HTTP) ke Supabase pooler `6543`. Tanpa prepared-statement clash vs direct TCP+TLS handshake.
2. **Session cookie cache** (`src/lib/auth.ts`) — `strategy: "jwt"` → `getSession()` tidak query DB; RBAC dibaca dari cookie.
3. **Branch-scope memo** (`src/utils/branch-scope.ts`) — `getAccessibleBranchIds()` di-memoize per-HTTP-request (`WeakMap<Request>` via `getRequest()` di luar try) → 1 query scope per request-lifecycle, bukan 3–4.
4. **Merger server-fn overview** — 4 hook terpisah (`useOverviewStats/Revenue/Orders/Analytics`) digabung jadi **satu** `getOverviewDashboardFn` di `src/features/overview/hooks/useOverviewDashboard.ts` → 1x auth + 1x scope + **1x `.rpc("get_overview_dashboard")`** (13 agregat dikerjakan di DB), return `OverviewData`. Query key: `overviewKeys.dashboard(branch)`.

Rules tambahan dari refactor ini:
- Server function yang berbagi scope/auth boleh digabung (1x `resolveOverviewScope`), jangan dibiarkan masing-masing memanggil `getSession` + `getAccessibleBranchIds` sendiri-sendiri.
- Tetap `Promise.all` untuk query paralel di dalam satu server fn.
- Hook murni data-dashboard bisa pakai `useSuspenseQuery` + route loader `ensureQueryData` (semua dataset ter-render penuh di SSR).
