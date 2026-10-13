# AGENTS.md — Nexara Coffee

> Primary context file for Agents Code agents working on this Nexara project.
> Read this file first before making any changes.
>
> **Split architecture — read the section matching your task:**
> - Frontend work (`client/`) → §About, §Client Structure, §Shared Frontend Rules, §Transition (for direction).
> - Backend work (`server/`) → §Server Structure, §Backend API Conventions, §Transition.
> - Cross-cutting (auth, RBAC, DB, env) → §Better Auth, §RBAC, §Database, §Environment Variables.
>
> **Current status: `client/` (pure Vite SPA) calls `server/` (Elysia API)
> via Eden Treaty, same-origin. TanStack Start fully removed
> (server-fns, Nitro/SSR bits, `api/auth/$.ts` — see §Transition, done).

## Available Skills

These skills are installed and can be loaded with `skill` tool when working on related tasks:

| Skill | When to use |
|---|---|
| [tanstack-start](skill:tanstack-start) | 🗄️ ARCHIVED — Start removed from the repo. Do not use; historical reference only |
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

Monorepo with bun workspaces + turbo (`client/`, `server/`). Root scripts: `dev` (turbo, both), `dev:client`, `dev:server`. Deploy via Vercel Services mode (`vercel.json`: service `client` = Vite, service `server` = Elysia via `server/src/app.ts` default export; no manual API bundling).

| Package | Role | Status |
|---|---|---|
| `client/` | Vite SPA dashboard (React 19). No TanStack Start (`index.html` → `src/main.tsx` → `RouterProvider`), data via Eden Treaty to `server/` | Connected to `server/`, same-origin |
| `server/` | Elysia 1.4.30 API (Bun). Drizzle ORM + `postgres.js`, 19 modules, OpenAPI at `/openapi/json` | Live standalone (`bun run src/index.ts`), consumed by `client/` via Eden |

Single DB layer (`server/src/db` Drizzle) and single Better Auth setup (`server/src/lib/auth.ts`, drizzle adapter).

### Business Model
- Head office sets menu standards, base prices, and brand guidelines
- Each branch can be managed directly by HQ (corporate-owned) or by partners/franchise owners
- Branches have limited autonomy: they can manage stock, staff schedules, and request restock — but cannot change menu/pricing without HQ approval
- Franchise branch revenue is shared according to a commission scheme, disbursed via the Payouts feature

**Built (client):** overview dashboard (3 tabs, 8 charts, 2 tables), auth flow (login/register/forgot-reset password/Google OAuth), customers (infinite card grid + sentinel + sheet detail via `GET /customers/:id` + edit/delete — NO manual add, accounts are born only via self-register; order count via LEFT JOIN + server summary), kasir & daily setoran (server-pagination table + board + input + approve/reject + POS reconciliation), orders (server-pagination table + kanban board + status management + Ably realtime), POS (single-file client + hooks `usePosCart`/`usePosCatalog`/`useChargeOrder`, checkout + member lookup by phone only — Customer Name field removed), chat (realtime messaging, DM, branch channels, Ably integration, cursor-pagination `before/limit` — staff only), maps (MapLibre GL, branch markers, popup, server search), menu CRUD (grid + server search + server summary, categories, Cloudinary image upload, RHF forms), branches CRUD (server search + form + franchise owner assignment), employee CRUD (server-pagination TanStack Table + shadcn + FilterToolbar), reviews (server-pagination table + moderate + server avg rating + customer self-review per completed order), transactions (server-pagination table + filter + server sums), payouts (server-pagination table + approve + server sums), notifications (infinite feed + sentinel + server read/unread tab + mark read), audit log (infinite timeline + sentinel, server search/filter + endpoint `/audit/tables` for dropdown, expandable metadata), customer portal `/my` (order history infinite scroll 20/page incl. offline cashier-recorded orders, loyalty member card, account self-service, per-order review dialog).

**Built (server):** 19 Elysia modules (overview, kasir, orders, menu, branches, customers, employee, transactions, payouts, reviews, chat, notifications, audit, settings, maps, my-portal, landing, ably + dashboard meta), `requireRole` RBAC macro, `.model()` + string-ref validation, `ok()/fail()` envelope, token-bucket rate limiting, branch-scope filtering. All lists are server-driven (`serverTableQuery` + `resolveTableParams` + `pageResult` + aggregate `summary`; `q` via `ilike` + `containsPattern`; per-module `sortBy` whitelist). Extra endpoints: `GET /audit/tables`, `GET /customers/:id`.

**Not yet implemented:** AI Assistant page.

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
- **Attribution**: portal queries match `created_by = uid OR customer_id IN (own profile ids)` — offline cashier-recorded orders appear. POS member lookup by **phone only** (matches normalized phone first, then exact name; fallback `fullName = phone`); new POS rows store phone.
- **Infinite scroll** (`/my/orders`, 20/page via `useSuspenseInfiniteQuery` + sentinel `IntersectionObserver`): returns `{ rows, nextPage, total, completedTotal }`. StatCard uses server `total`/`completedTotal` (not `orders.length`). Infinite is required (not a sortable table) because this page is a plain table without TanStack Table sorting.
- **Accrual** (best-effort, never blocks status update): on transition to `completed` (terminal — no double accrual, cancel of completed rejected) with non-null `customer_id` → `+floor(total / 10_000)` points, tier recomputed. Constants: `POINTS_PER_RP`, `TIER_THRESHOLDS` (silver 100 / gold 500 / platinum 1000), `tierForPoints()`, `earnedPointsForTotal()`, `normalizePhone()`.
- **Self-review**: own-scope, completed own order only, 1 order = 1 review via `order_id` check, `status: "pending"` for staff moderation. No global `reviews` perm for visitor.
- New reviews must also invalidate `myPortalKeys.all` (portal cache) alongside `orderKeys`.

## Project Structure

### `client/` — frontend SPA (Vite murni, TanStack Router)

```
client/
├── index.html / src/main.tsx        # Entry: StrictMode → providers → RouterProvider
├── src/
│   ├── routes/                    # TanStack Router file-based routes
│   │   ├── __root.tsx / _auth.tsx / _dashboard.tsx / pos.tsx / my.tsx
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
│   │   │   ├── use{Domain}Queries.ts    # Eden Treaty queryFn + TanStack Query hooks
│   │   │   ├── use{Domain}Mutations.ts  # Eden Treaty mutationFn
│   │   │   └── ...                      # Domain-specific hooks (table, realtime, etc.)
│   │   ├── components/            # TSX — max 250 lines per file
│   │   ├── types.ts / utils.ts / data.ts
│   ├── features/query-keys.ts     # Centralized TanStack Query keys (STAYS — keys never change)
│   ├── features/stale-time.ts     # staleTime constants (STAYS)
│   ├── features/customer-portal/  # Portal /my (visitor)
│   ├── lib/
│   │   ├── eden.ts                # Eden Treaty client (`treaty<App>`, same-origin) + `Envelope`/`toEnvelope`/`GetData`
│   │   ├── session.ts             # `getSession()` + `loadDashboard()` via server (guards/loaders)
│   │   ├── auth-client.ts         # `createAuthClient()` same-origin, `inferAdditionalFields` from server auth type
│   │   ├── rbac.ts                # Permission matrix — mirrors server/src/access/rbac.ts
│   │   └── realtime.ts            # Ably Realtime client (browser-side, STAYS)
│   ├── stores/                    # Zustand: branch.ts, sidebar.ts (STAYS)
│   ├── hooks/                     # Shared hooks (STAYS): useConfirmAction, useDebounce,
│   │                              # useFormDialog, useImageUpload, useMobile, useTableState,
│   │                              # useTheme, useAblyToken
│   ├── integrations/tanstack-query/ # Query client setup, provider, devtools (STAYS)
│   ├── utils/                     # cn, convert-types, format, group-by, status
│   │                              # (branch scope removed — scope is computed on the server)
│   ├── styles.css / router.tsx / routeTree.gen.ts / main.tsx
├── vite.config.ts                 # Pure Vite + TanStackRouterVite + proxy /api/* → :3000 (dev)
└── RULES.md                       # Client-side rule detail
```

### `server/` — backend API (Elysia, source of truth for the API)

```
server/src/
├── app.ts                         # Elysia root: openapiDocs + betterAuth + routes + errorPlugin.
│                                  # Export type App (for Eden) + default export (Elysia service entrypoint on Vercel)
├── index.ts                       # bun run — listen PORT (default 3000)
├── env.ts                         # requireEnv() — throw at startup, no ?? "" on critical vars
├── routes/                        # api.ts (aggregates 19 modules, prefix /api), health.ts,
│                                  # sessions.ts, openapi.ts (/openapi/json)
├── plugins/
│   ├── auth.ts                    # betterAuth instance + macro auth / requireRole([resource, action])
│   ├── session-user.ts            # SessionUser type + toCurrentUser + 401/403 envelopes
│   └── error.ts                   # onError: VALIDATION→400, NOT_FOUND→404, else 500 (envelope fail)
├── access/                        # ★ Single-door authorization — import from access/index.js only
│   ├── index.ts                   # Barrel: export * (rbac, scope, user)
│   ├── rbac.ts                    # ROLES/Role/Resource/Action/PERMISSIONS/RESOURCES/ACTIONS/
│   │                              # NAV_GUARDS/can() (pure, no DB)
│   ├── scope.ts                   # branchFilter() + getAccessibleBranchIds() (1 query/request,
│   │                              # null = super_admin) + emptyScope/assertBranchAccess/resolveMyScope
│   └── user.ts                    # CurrentUser { id, role, name?, email?, image? }
├── lib/                           # Pure app core (no I/O)
│   ├── http.ts                    # ok(data) / fail(code, msg) — the one and only envelope
│   ├── schema.ts                  # idParams + serverTableQuery/resolveTableParams/
│   │                              # pageResult (server-driven list contract)
│   ├── table.ts                   # escapeLikePattern/containsPattern (safe LIKE)
│   ├── sort.ts                    # SortColumnMap + toSort (whitelist sort → ORDER BY)
│   └── auth.ts                    # Better Auth instance (drizzle adapter)
├── infra/                         # Klien SDK pihak ketiga saja
│   ├── ably.ts / email.ts (resend) / images.ts (cloudinary)
├── utils/
│   ├── effects.ts                 # publishAbly (fire-and-forget) + checkRate + token-bucket
│   │                              # rate limiter O(1) + logAudit (fire-and-forget)
│   └── loyalty.ts                 # POINTS_PER_RP, TIER_THRESHOLDS, tierForPoints(),
│                                  # earnedPointsForTotal(), normalizePhone()
├── db/                            # Drizzle ORM (postgres-js). schema/ per domain + index.ts.
│                                  # All ids text + $defaultFn(crypto.randomUUID()). SQL via drizzle-kit
└── modules/{domain}/              # 19 modul: index.ts (controller) + service.ts + repository.ts + model.ts
    # overview, kasir, orders, menu, branches, customers, employee, transactions,
    # payouts, reviews, chat, notifications, audit, settings, maps, my, landing, ably
```

Module pattern: `model.ts` (TypeBox schemas, single source of truth) → `.model()` + string-ref in `index.ts` → `service.ts` (policy + orchestration + envelope/DTO, no SQL, no `db` import) → `repository.ts` (Drizzle queries only, raw rows, no auth/envelopes). Service = plain async function (not a class), decoupled from Elysia so it stays testable. Example: `.model({ "menu.createItem": createMenuItemBody })` + `body: "menu.createItem"` + `{ requireRole: ["menu","create"] }`.

List endpoint pattern (fully server-driven — search/filter/sort/page/count/sum/avg 100% in Postgres): `model.ts` = `t.Composite([...specificFilters, serverTableQuery])` + `typeof query.static` as the service params type → `service.ts` = scope (`getAccessibleBranchIds` + `branchFilter`/`emptyScope`) → exact filters → `q` (`ilike` + `containsPattern`) → `sortBy` mapped through a per-module whitelist to Drizzle columns (values outside the whitelist are ignored) → `count` + aggregates + rows in parallel (`Promise.all`) → `pageResult()` + module `summary` → timestamps as ISO via `.toISOString()`. Three response shapes: tables = `{ rows, total, nextPage }` + `summary`; feeds/grids without sort = infinite + sentinel; small reference data (`menu`, `branches`, `maps`) = server filter without paging.

### Architecture Rules

**Client:**
- **Routes are thin** — only routing config: `validateSearch`, `beforeLoad`, `loader`, `head`, `pendingComponent`, `errorComponent`. No inline page components.
- **Feature page components are self-contained** — each route's component lives in `features/{domain}/components/{domain}-page.tsx`, uses `getRouteApi()` + `useSession()` internally.
- **No Shell/Client intermediary layers** — absorb into the page component or split into focused sub-components.
- Each feature is built **vertically**: types → hooks → components → route. Finish each feature 100% (buildable) before moving on; refactor only after complete.
- **TSX files: 250 is the split floor** — below 250 lines do not split; compose same-flow components in 1 file. Split only above ~350 lines or when logic separates cleanly. **Non-TSX files** have no line limit.
- **Global layout components** stay in `src/components/layout/`, not in features.
- **Feature hooks**: split `use{Domain}Queries.ts` / `use{Domain}Mutations.ts`. No custom `useSearch`/`useFilters`/`useSort` — tables use the shared `useTableState` (the one and only table-state hook: sorting + filters + pagination + `debouncedSearch`/`sortBy`/`sortDir`/`page`/`pageSize`) + `useDebounce`; TanStack Table in manual mode only (no client row models).
- **Arrow functions only** — all components, hooks, and helpers as arrow functions, never `function` declarations.

**Server:**
- Routes (`index.ts`) are routing + validation + 1-line delegation to service only. Never pass the whole Elysia `Context` into service — destructure only what is needed.
- Service = plain async function (not a class), decoupled from Elysia so it stays testable. Derive input types from the model (`typeof schema.static`), never redeclare them.
- Services must not import `db`: policy + orchestration + envelope/DTO only (scope, rate-limit, 404/403/409, ISO mapping, audit). All SQL lives in `repository.ts` (Drizzle queries only, raw rows, no auth/envelopes). Sort-whitelist maps belong to repos; the generic engine lives in `lib/sort.ts` (`toSort`).
- Every return is `ok(data)` / `fail(code, msg)`. Standard 404 message: `"{Entity} not found"`.
- Validation: `t.Number` for JSON bodies, `t.Numeric` for query/params only (string→number coercion). No `as never` / `user as` in controllers.
- Authorization only via macro (`auth` / `requireRole`) + `access/` helpers (`can`, `branchFilter`, `assertBranchAccess`, `resolveMyScope`). `/my` portal = own-scope via `session.user.id`, no global `can()`.
- Rate limit via `checkRate()` (token bucket). No rate-limit plugin.

### UI Consistency Rule (CRITICAL, client)
- **No unilateral redesign** — no layout changes, no styling differences without explicit approval
- New components must follow the existing design language (spacing, typography, colors, icons, shadcn variants)
- When in doubt between "cleaner" and "consistent with existing UI", choose **consistent**
- **Only exception:** conditional rendering uses `? ... : null` instead of `&&` (see RULES.md) — output DOM is identical
- **Loading-state rule:** StatCard/empty/filter bar ALWAYS render; only the content area is conditional (never let an empty state swallow the toolbar + stats)
- **Forbidden:** changing padding, margin, colors, fonts, spacing, icons, grid layout, or element order in existing components

### Per-Feature Execution Order
- **Client:** `features/{domain}/types.ts + hooks/` → `components/` → route + `{domain}-page.tsx` (existing features stay; new data needs go to server first).
- **Server:** `modules/{domain}/model.ts` → `service.ts` + `repository.ts` → `index.ts` + `.model()` registration. Types/hooks/components must match before building UI.
- Before writing server functions, read the feature types and related components first to ensure return types match component expectations.

## Tech Stack

### Core
- React 19 + Vite SPA (client) — TanStack Router file-based; Start fully removed
- Elysia 1.4.30 on Bun (server) — file `server/src/app.ts`, standalone `bun run src/index.ts`, deploy via Vercel Services (`framework: elysia`, entrypoint `src/app.ts`)
- TypeScript (strict mode, `tsc --noEmit` must stay green in both packages)

### Database & Backend
- **Better Auth** — single setup (`server/src/lib/auth.ts`, drizzle adapter). Google OAuth, default role `visitor`, cookie-cache JWT session (`maxAge: 300`, zero DB queries per `getSession`).
- **Resend** — password reset emails (`server/src/infra/email.ts`).
- **Postgres (prod)** — single Drizzle ORM + `postgres.js` layer (`server/src/db`).
Per-domain schema with `$defaultFn(crypto.randomUUID())`, migrations via `drizzle-kit` (`db:generate/migrate/push/pull`).
- **Ably** — chat, live orders, activity feed (`server/src/infra/ably.ts` + `publishAbly()` fire-and-forget).
- **Eden Treaty** — official client→server connector. OpenAPI JSON at `/openapi/json`.
- **Heavy aggregates** — server-side via query builder + `Promise.all` (example overview: 13 parallel aggregates). Kasir expected-cash (small volume) summed from daily rows.
- **RBAC code-level, RLS off**.

### UI & Styling (client, unchanged)
- Tailwind CSS v4
- shadcn/ui (base-vega, neutral) + Base UI primitives + Lucide + `next-themes` + `tw-animate-css` + `class-variance-authority`
- `@dnd-kit/*` — kanban orders

### Data Fetching & State (client)
- Zustand (active branch, sidebar) + TanStack Query (server state).
- TanStack Query hooks call Eden Treaty client (`treaty(app)`). Query keys, staleTime, invalidation UNCHANGED.
- TanStack Router search params — URL state (replaces `nuqs`); route `.loader()` optional prefetch only.

### Form & Validation (client)
- `react-hook-form` + `@hookform/resolvers` + `zod` (client forms; server uses TypeBox — the two validators coexist, never mix them)

### Data Visualization / Utilities / Quality (client, unchanged)
- Recharts, MapLibre GL; TanStack Table + shadcn Table; Sonner; `cmdk`; `@tanstack/match-sorter-utils`
- Biome, bun, React Compiler

### Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| Frontend | Pure Vite SPA (Start fully removed) | File-based router + build intact; no SSR/Nitro/server-fns |
| API Framework | Elysia 1.4.30 on Bun (not Nitro server-fns) | Type-safe, macro/guard, OpenAPI + Eden from a single model source |
| ORM (server) | Drizzle + `postgres.js` (not Prisma) | Thin typed SQL layer, `$defaultFn`, drizzle-kit migrations |
| Data Access (client) | Eden Treaty calls | All `queryFn`/`mutationFn` via `treaty` to Elysia |
| Client↔Server | Eden Treaty (not plain fetch) | End-to-end type safety from the `App` type; `eden` already in devDeps |
| Auth | Better Auth (not Supabase Auth) | Self-hosted, Google OAuth, single setup on the server |
| RBAC | Custom code-level (not RLS, not CASL/casbin) | Evaluated and rejected: Drizzle CASL adapter still RC + needs relational rewrite; RLS uncontrollable for multi-scope |
| State | Zustand (client UI) + TanStack Query (server state) | Unchanged since transition |
| Data Fetching | TanStack Query (keys/stale/invalidation unchanged) | Only `queryFn` changed: `*Fn` → Eden |
| Routing | TanStack Router (stays) | Type-safe routes/search params; only Start was removed |
| Realtime | Ably | Unchanged |
| Table | TanStack Table + shadcn/ui | Server pagination (`manualSorting/manualFiltering/manualPagination`, no client row models); feed = infinite; small reference data = no paging |
| Transaction Input | Daily setoran (one per branch per day, not POS) | Audit trail kas fisik |
| Email / Storage | Resend / Cloudinary | Via `server/src/infra/` |
| Rate Limit | Native token-bucket `checkRate` (not plugin) | Per-user-per-action needs an authenticated user; plugins only fit the outer per-IP layer |
| Form Validation | React Hook Form + Zod (client) / TypeBox (server) | Each side uses its idiomatic one |

## Backend API Conventions (`server/`)

Must-read before touching `server/`. Skill: `elysiajs`.

### Module vertical

```
modules/{domain}/model.ts   → TypeBox schemas (single source: runtime + TS via typeof .static + OpenAPI)
modules/{domain}/service.ts → plain async fns (user: CurrentUser, ...) → ok()/fail()
modules/{domain}/index.ts   → new Elysia({ prefix }) + .use(authPlugin) + .model({ "ns.name": schema })
                              + route 1-baris + { params|query|body: "ns.name", requireRole: [res, act] }
```

### Auth macro (`plugins/auth.ts`)

- `auth: true` — login only (for `/my` own-scope, `/ably/token`, `/api/dashboard/meta`).
- `requireRole: [resource, action]` — login + `can(role, action, resource)`, automatic 401/403. The only way to authorize staff routes.
- `user` infers `CurrentUser` — no casts in controllers.

### Access helpers (`access/index.js` — the only authorization import door)

- `can(role, action, resource)` — pure, no DB. `Resource`/`Action` types + `PERMISSIONS` matrix + `NAV_GUARDS`/`RESOURCES`/`ACTIONS` (for dashboard meta).
- `getAccessibleBranchIds(userId, role)` — **exactly 1 query/request** (0 for super_admin → `null` = all branches). Never cache across requests (stale-scope risk = branch data leak).
- `branchFilter(col, branchId, ids)` — required in every branched query (manual `eq`/`inArray`/`sql 1=0` forbidden).
- `emptyScope()` / `assertBranchAccess()` / `resolveMyScope()` — guards + portal own-scope (note: `customers.user_id` UNIQUE → max 1 profile per login, so `IN (...)` always holds ≤1 element — don't "optimize" it into a subquery).

### Envelope, validation, effects

- Success `ok(data)`, failure `fail(code, msg)` (`lib/http.ts`). Business errors are returned, never thrown.
- `t.Number` = JSON bodies; `t.Numeric` = query/params only. 404 message = `"{Entity} not found"`.
- `publishAbly()` + `logAudit()` = fire-and-forget via `void` (never throw into the request).
- `checkRate(key, max, windowMs)` per-user-per-action in sensitive services (chat, customers, settings, public landing).
- Shared validators `lib/schema.ts` (`idParams`, `serverTableQuery`, `resolveTableParams`, `pageResult`) + `lib/table.ts` — use these, don't create new `*IdParams` or new paging validators.

### Constraints (server)

- DO NOT pass Elysia `Context` into service. DO NOT use classes for services (plain functions).
- DO NOT use `as never` / `user as` in controllers — register models via `.model()`.
- DO NOT add Prisma, RLS, Pusher, Uploadthing, CASL/casbin, rate-limit plugin, Zod (server), `nuqs`.
- DO NOT use `?? ""` on critical env vars — throw at startup (`env.ts`).
- New schemas = write the Drizzle schema first (`server/src/db/schema/`), migrate via `drizzle-kit`. Every FK requires a manual index (`{table}_{column}_idx`).

## Transition: Client → Server (Eden Treaty) — ✅ SELESAI

Status: pure Vite SPA frontend calling Elysia; TanStack Start (server-fns, Nitro, SSR bits) fully removed. TanStack Router, Query keys, staleTime, invalidation, and UI **unchanged**. This section stays as connection-pattern documentation.

### Server-driven tables — ✅ SELESAI

Follow-up migration, also done: every staff list moved from get-all + client filter to server queries (`q`, filters, `sortBy`/`sortDir`, `page`/`pageSize`, server `total`). Six sortable tables in manual mode (orders, transactions, reviews, kasir, payouts, employee); feeds/grids via infinite query (audit, customers, notifications, `/my/orders`); chat stays cursor-pagination (`before`/`limit`); small reference data (`menu`, `branches`, `maps`) server-filtered without paging. Client row-model engines read zero usages in `features/`; one shared table hook (`useTableState` + `useDebounce`); dead suspense variants and `paginationQuery` removed.

### Connection pattern

```ts
// client/src/lib/eden.ts
import { treaty } from "@elysiajs/eden";
import type { App } from "../../../server/src/app";
export const api = treaty<App>(window.location.origin).api;

// in hooks (keys + invalidation unchanged, queryFn via Eden):
useSuspenseQuery({ queryKey: menuKeys.lists(), queryFn: () => api.menu.items.get({ query }) })
useMutation({ mutationFn: (b) => api.menu.items.post(b),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }) })
```

Same-origin single domain: no CORS, no `VITE_API_URL`. Dev via Vite proxy (`/api`, `/openapi` catch-all) → `:3000`; prod via `vercel.json` rewrites. Auth: Better Auth cookie sent automatically. Ably stays direct from the browser (`realtime.ts`).

### Type conventions (Eden boundary)

- Backend is the source of truth for types. Client entities derive via `GetData<typeof api...>` (slim types), never manual duplicates.
- Wrapper `queryFn`/`mutationFn` without return annotations — Eden inference flows through. Annotations only at deliberate adapter points (client-side filter/sort, `Number()` aggregate coercion).
- Envelope consumption in components requires narrowing: `data && data.success ? data.data : []`.
- Service boundary returns JSON-safe: `timestamp` columns → ISO strings via `.toISOString()` in service (wire format unchanged, types made honest). DB schema untouched.

## Better Auth — Conventions

**Server (`server/src/lib/auth.ts`, drizzle adapter):** handler mounted via `plugins/auth.ts` (`.mount(auth.handler)`); `macro auth/requireRole` resolves `auth.api.getSession({ headers })`; cookie-cache JWT (`maxAge: 300`, zero DB queries, `role` cached too).

**Client (`client/src/lib/auth-client.ts`):** `createAuthClient()` same-origin (no `baseURL` → `/api/auth/*`), `inferAdditionalFields` from the **server** auth type. Guards/loaders via `lib/session.ts` (`GET /api/auth/session`, `GET /api/dashboard/meta`), never via the local instance.

**Conventions:** Google OAuth redirect `http://localhost:5173/api/auth/callback/google` (+ IP variant when developing via IP); default role `visitor`; no email OTP (`signUp.email` directly); CSRF `csrf: { enabled: true, origin: BETTER_AUTH_URL }`; uniform error messages on public endpoints; sensitive endpoints use `checkRate` (server).

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
- Server: `can()` + `requireRole` macro in `server/src/access/` + `getAccessibleBranchIds()` (no visitor case — unknown roles → `[]`).
- Client (mirror): `can()` in `client/src/lib/rbac.ts`; `getDefaultRouteForRole(role)`: staff → `/overview`, visitor → `/my`.
- Visitor lockout: `_dashboard.tsx` and `my.tsx` `beforeLoad` redirect by role (`_dashboard` rejects visitor → `/my`, `/my` rejects staff → `/overview`, `/pos` allows super_admin/branch_manager/cashier only).
- Customer portal own-scope: filter by `session.user.id`, never grant visitor global perms. Visitor matrix keeps only `users: ["read","update"]`.
- RBAC is staff-only by design — no visitor branches in feature code.

## Data Fetching Pattern

**Current (client):** TanStack Query hooks call Eden Treaty directly. The server computes, the client renders — search/filter/sort/page/count/sum/avg 100% in Postgres. The client only owns: input state, debounce, display grouping (`groupByStatus`, `groupByDate`), formatting, ephemeral mirrors (realtime prepend, optimistic flags, POS cart).

```
Reactive tables
  └→ useQuery({ queryKey, queryFn }) + placeholderData: prev => prev   # no suspense, avoids flicker
Feeds/grids
  └→ useInfiniteQuery + sentinel IntersectionObserver                   # audit, customers, notifications, /my/orders
Details
  └→ useSuspenseQuery                                                  # wrapped in route errorComponent
Mutation: useMutation({ mutationFn, onSuccess: invalidateQueries })
```

`queryKey` includes ALL deps; the route loader key must exactly match the component's initial key (otherwise the prefetch is wasted + skeleton flashes). Search via `useTableState().debouncedSearch` (300ms). `pageIndex` resets to 0 when filters change (inside the hook).

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

### TanStack Table (server-driven)

`manualSorting + manualFiltering + manualPagination: true`, only `getCoreRowModel()` — `getSortedRowModel`/`getFilteredRowModel`/`getPaginationRowModel`/`globalFilterFn` are FORBIDDEN (zero usage in `features/`). `pageCount = ceil(total/pageSize)` from the server; columns outside the sort whitelist get `enableSorting: false`. `createColumnHelper<T>()`; `getRowId`; `header.isPlaceholder`; FilterToolbar wired to table state; pageIndex from controlled state.
**Infinite vs tables**: `useInfiniteQuery` ONLY for feeds/grids without sorting (`/my/orders`, notifications, audit timeline, customers grid, chat). Sorted tables REQUIRE **server pagination** (`manualSorting` + `manualPagination`, `page/pageSize/sortBy/sortDir` validator + count) — never infinite. Infinite + `getPaginationRowModel` is forbidden. Small reference data (`menu`, `branches`, `maps`) = server filter WITHOUT paging.

## Database

- **Postgres (prod)** — single cluster, single access layer: Drizzle + `postgres.js` (`server/src/db`). Schema changes go in `server/src/db/schema/` + `drizzle-kit` migrations.
- **Server layer:** all ids `text` + `$defaultFn(crypto.randomUUID())`; FKs require manual indexes (`{table}_{column}_idx`); aggregates via query builder + `Promise.all`.
- **RBAC code-level, RLS off**.
- Connection: `DATABASE_URL` (pooler `6543`) + `DIRECT_URL` (direct `5432`) from the environment.

## TanStack Query Best Practices (client — fully applicable during transition)

### Query Keys
- **Always arrays**: `['menu']`, not `'menu'` or `{ entity: 'menu' }`
- **Include all dependencies**: `['kasir', branchId]`, `['kasir', 'expected-cash', branchId, date]`, `['chat', channelId, 'messages']`, `['my', 'orders']`
- **Centralized in `features/query-keys.ts`** — keys NEVER change when moving to Eden
- **JSON-serializable only**

### staleTime & gcTime — see table above. `staleTime: 0` = refetch on mount; `Infinity` = manual invalidation only.

### Invalidation
- **Always invalidate after mutations**; be specific (`['menu']` vs `['menu', itemId]`); cross-entity invalidate all affected; prefix matching applies.

### Mutations
- `useMutation` + `invalidateQueries` standard. Optimistic: `onMutate` → cancel → snapshot → `setQueryData` → rollback `onError`.
- Server envelope `ok()/fail()` maps 1:1 to `{ success, data } | { success, error }` used by hooks.

### Error & NotFound Handling
- `useSuspenseQuery` wrapped in route `errorComponent`; `ErrorPage`/`NotFoundPage` from `@/components/fallbacks/error-page` (slot `children`, prop `to`).
- Inline handling only for non-critical data.

### Important Constraints
- **DO NOT use Supabase Auth / RLS / Pusher / Uploadthing / Prisma / `nuqs`** (client) — and no CASL/casbin/rate-limit-plugin/Zod on `server/`

## Database Schema (ERD)

All IDs use text with `crypto.randomUUID()`. All FKs must be indexed manually.

Key entities (same in both layers):
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
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | — (dilepas) | — |
| `PORT` (default 3000) | — | ✅ |

## Common Mistakes to Avoid

### Feature Hooks (client)
- ✅ Return shape `{ success: true, data } | { success: false, error }` — matches the server envelope.
- ✅ Split `use{Domain}Queries.ts` / `use{Domain}Mutations.ts`. Indonesian JSDoc for query/mutation wrappers, `@see {@link}` for hook wrappers.
- ✅ `useQuery` + `placeholderData` for reactive tables/input-driven data; `useSuspenseQuery` for route-level details; `useInfiniteQuery` + sentinel for feeds.
- ✅ Never filter/sort/paginate rows on the client; aggregates (`total`/sums/averages) come from the server `summary`.
- ✅ Form values use concrete `z.infer` types (e.g. `MenuItemSubmitData`) — no `Record<string, unknown>`, no `Parameters<typeof ...>` casts.

### RBAC
- ❌ Do NOT forget new resources in `Resource` type (server `access/rbac.ts`; mirror client).
- ❌ Branch Manager should NOT have access to Payouts.
- ❌ Cashier SHOULD have `finance: ["create", "read"]`.

### Server (`server/`)
- ❌ Do NOT pass Elysia `Context` to service; no service classes; no `as never`/`user as` in controllers.
- ❌ Do NOT throw business errors — return `fail()`. Do NOT `t.Numeric` in JSON bodies.
- ❌ No new `*IdParams` — use shared `idParams`. No new rate-limit store — use `checkRate`.
- ✅ `.model()` + string-ref for all schemas; 404 message = `"{Entity} not found"`.

### Drizzle
- Server: Drizzle schema-first, `$defaultFn` for ids, migrations via `drizzle-kit`.

### Env & Config / Router (unchanged)
- ❌ Do NOT use `?? ""` on critical env vars.
- ❌ Router: register type, no `useEffect` fetching, `loaderDeps` for search-param deps, auth in `beforeLoad` not in components.

## Loading & Skeleton Strategy (client, unchanged)

Single-layer: `pendingMs: 0` + `pendingComponent: XxxSkeleton` per route; `defaultPendingMs: 0` safety net; skeletons in `src/components/fallbacks/dashboard.tsx` (Overview/Menu/Branches/Maps/Customers/Employee/Chat/Audit/Notifications/Settings/Kasir/Orders/Reviews/Transactions/Payouts/MyPortal); `ErrorPage`/`NotFoundPage` from `error-page.tsx`.

## Performance & Latency

**Historical (client era, kept as a lesson):** `/overview` ±8000ms → ±300ms via: pooler DB driver, cookie-cache JWT session, per-request branch-scope memo, merging 4 hooks → 1 rpc `get_overview_dashboard`. Rules: merge server-fns sharing scope/auth; `Promise.all` for parallel; `useSuspenseQuery` + `ensureQueryData` for full SSR.

**Server:** equivalent pattern — 1x auth macro + 1x scope resolve + parallel aggregates in one service (example `getOverviewDashboard`: 13 aggregates via query builder). No N+1: `getAccessibleBranchIds` = exactly 1 query/request; `resolveMyScope` safe because `customers.user_id` UNIQUE (≤1 id in `IN`).
