# Nexara Coffee — GDGoC UNSRI Final Project (Frontend Division)

This repository contains the final project of GDGoC UNSRI (Batch 2025/2026).
The project is an operational dashboard for a multi-branch cafe network: a React + TypeScript Vite SPA backed by an Elysia (Bun) API with Drizzle ORM + Postgres, connected end-to-end via Eden Treaty.

---

## 🎯 About the Project

**Nexara Coffee** is an all-in-one internal dashboard for a fictional multi-branch cafe network based in Palembang, Indonesia — plus a public landing page and a customer self-service portal. It turns still-manual cafe operations (daily cash deposits recorded on paper/chat, untracked order queues, scattered member data) into one integrated digital system.

### Key Highlights:

- 🏠 **Public Landing Page**: brand profile, featured menu, branch list, and reviews with a clear call-to-action
- 🔐 **Authentication & 6 Roles**: email/password, Google OAuth, and password reset — with role-based page and action guards
- 💵 **Cashier & Daily Deposits**: one deposit per branch per day, manager approval, and automatic reconciliation against POS totals
- 🧾 **POS + Live Order Queue**: point-of-sale checkout, kanban order status, realtime updates
- 💎 **Customer Portal & Loyalty**: order history, loyalty points/tiers, self-service account, and per-order reviews
- 📊 **HQ Analytics**: revenue/order charts, branch & franchise management, payouts, employee & payroll, audit log

### Architecture

Monorepo (bun workspaces + turbo) with two packages:

| Package | Role |
|---|---|
| `client/` | Vite SPA dashboard (React 19, TanStack Router file-based). All data via Eden Treaty to `server/`, same-origin |
| `server/` | Elysia 1.4.30 API on Bun (19 modules), Drizzle ORM + `postgres.js`, OpenAPI at `/openapi/json` |

Single Postgres database, single Better Auth setup (server). See `AGENTS.md` for the full contributor context.

---

## 🚀 Tech Stack

### Frontend (`client/`)

- **React 19 + TypeScript** - UI library (fully client-side Vite SPA)
- **TanStack Router** - file-based routing, route guards, search params
- **Vite** - build tool + dev server (proxies `/api`, `/openapi` → `:3000` in dev)
- **Eden Treaty** - type-safe client for the Elysia API (`treaty<App>`, same-origin)
- **TanStack Query** - data fetching, caching, invalidation
- **TanStack Table** - headless tables (sorting, filtering, pagination)
- **Zustand** - client state (active branch, sidebar)
- **React Hook Form + Zod** - form handling and validation
- **Tailwind CSS v4 + shadcn/ui** - styling and components
- **Recharts** - analytics charts
- **MapLibre GL** - interactive branch maps

### Backend (`server/`)

- **Elysia 1.4.30 on Bun** - type-safe API (19 modules: `model.ts` TypeBox schemas → `service.ts` plain functions → `index.ts` routes)
- **Drizzle ORM + `postgres.js`** - typed SQL layer, migrations via `drizzle-kit`
- **Better Auth** - login sessions (email/password, Google OAuth, reset-password emails); `user` / `session` / `account` / `verification` tables live in the same Postgres database
- **OpenAPI + Eden Treaty** - docs at `/openapi/json`, end-to-end types shared with the client

### Supporting Services

- **Ably** - realtime (chat, live orders)
- **Cloudinary** - menu photo upload & CDN
- **Resend** - password-reset emails

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software:

- **Bun** (or Node.js 20+) - [Download](https://bun.sh)
- **Git** - [Download](https://git-scm.com/downloads)

### Required Accounts / Services:

- **Postgres** database (provides `DATABASE_URL` pooler + `DIRECT_URL` direct)
- **Google Cloud** OAuth client (for Google login)
- **Resend**, **Ably**, **Cloudinary** accounts (for email, realtime, and image upload)

---

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/nexara-coffee.git
cd nexara-coffee
```

---

### 2. Database Setup

The schema is defined in `server/src/db/schema/` (Drizzle) and applied with `drizzle-kit` migrations in `server/migrations/`.

```bash
cd server
bun run db:migrate   # apply migrations (uses DIRECT_URL)
```

> `DIRECT_URL` must be a **direct** connection (port 5432). Poolers in transaction mode can fail DDL — use the session-mode pooler if a direct host is unreachable.

#### Verify

You should see tables such as `"user"`, `branches`, `menu_items`, `orders`, `order_items`, `daily_setorans`, `transactions`, `customers`, `reviews`, `employee_details`, `payouts`, `chat_channels`, `audit_logs`, and `notifications` — with foreign keys linking them (e.g. `customers.user_id → user.id`, `orders.customer_id → customers.id`, `order_items.order_id → orders.id`).

---

### 3. Configure Environment Variables

```bash
cp server/.env.example server/.env
```

Fill in `server/.env` (see `server/.env.example` for the full reference):

```env
DATABASE_URL=      # Postgres pooler (port 6543) — used by the app at runtime
DIRECT_URL=        # Postgres direct  (port 5432) — used by drizzle-kit migrate/studio

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

RESEND_API_KEY=
EMAIL_FROM=
ABLY_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Important**:
- Credentials stay in `server/.env` (git-ignored); only `*.env.example` files are committed.
- The client needs no env file — it talks to the API same-origin (`window.location.origin`); dev traffic is proxied by Vite.
- For Google OAuth, add `<BETTER_AUTH_URL>/api/auth/callback/google` as an authorized redirect URI in Google Cloud Console.

---

### 4. Install Dependencies

```bash
bun install
```

---

### 5. Run the App

```bash
bun run dev          # both client (:5173) and server (:3000) via turbo
bun run dev:client   # client only
bun run dev:server   # server only (bun --watch src/index.ts)
```

```bash
bun run build      # production client build → client/dist
bun run build:api  # bundle the API for Vercel → server/dist/entry.js
bun run typecheck  # tsc --noEmit in both packages
```

---

### 🔑 Test Accounts

There are no hard-coded demo passwords. Accounts are created through the app, and staff roles are assigned via SQL:

1. **Customer (visitor)** — open `/register` and sign up. New accounts automatically get the `visitor` role and live in the `/my` portal.
2. **Staff (super_admin / branch_manager / cashier / barista / franchise_owner)** — register the same way, then promote the account in the database:
```sql
UPDATE "user" SET role = 'super_admin' WHERE email = 'you@example.com';
```
3. Log back in — the app redirects automatically (`/overview` for staff, `/my` for visitors).

---

## 📱 Features & User Guide

### Public Pages

#### 🏠 Landing Page (`/`)

- **Description**: public homepage describing the brand with a clear call-to-action
- **Features**: featured menu, branch list with search, customer reviews, login/register CTA
- **How to Use**: browse as a guest, then click login or register to enter the app

#### 🔐 Login, Register, Forgot & Reset Password (`/login`, `/register`, `/forgot-password`, `/reset-password`)

- **Description**: authentication pages (email/password + Google OAuth)
- **Features**: self-registration (creates a customer account), show/hide password, reset via emailed link (expires in 30 minutes)
- **How to Use**: new users register first, then log in; each role lands on its own start page automatically

---

### Customer Portal (`/my` — visitor role only)

#### 📋 My Orders (`/my/orders`)

- **Description**: personal order history, including orders recorded offline by cashiers
- **Features**: infinite scroll (20 per page), total/completed counters, per-order review dialog for completed orders
- **How to Use**: scroll to load more; click review on a completed order to rate it (one review per order, moderated by staff)

#### 💎 Member Card (`/my/member`)

- **Description**: loyalty card with points and tier
- **Features**: points accrue automatically (+1 point per Rp10.000 on completed orders); tiers silver (100) / gold (500) / platinum (1000)
- **How to Use**: points grow as your orders complete — no manual claim needed

#### 👤 Account (`/my/account`)

- **Description**: self-service profile and password management
- **Features**: update name/profile, change password
- **How to Use**: edit the fields and save; use the password form for credential changes

---

### Staff Dashboard (role-guarded pages)

#### 📊 Overview (`/overview`)

- **Description**: HQ analytics — 3 tabs, 8 charts, 2 tables, aggregated server-side by a single Elysia service call
- **Features**: revenue trends, order stats, branch filter
- **How to Use**: switch tabs and branch scope to analyze performance

#### 💵 Cashier & Daily Deposits (`/kasir`)

- **Description**: manual end-of-day cash declaration, one deposit per branch per day
- **Features**: amount auto-filled from the day's cash POS total (cashier only confirms/adjusts); manager approve/reject; declared-vs-expected comparison with surplus/shortage indicator
- **How to Use**: (cashier) submit today's deposit → (manager) review the POS comparison → approve or reject

#### 🧾 POS (`/pos` — super_admin / branch_manager / cashier)

- **Description**: point-of-sale screen without sidebar
- **Features**: catalog, cart, checkout (cash/QRIS/debit/credit), member lookup by phone number only
- **How to Use**: add items to cart → optionally link a member via phone → charge

#### 📦 Orders (`/orders`)

- **Description**: live order queue with kanban status management
- **Features**: realtime status sync, loyalty points accrue automatically on completion (terminal state)
- **How to Use**: (barista/cashier) drag or update order status through to completed/cancelled

#### 🍽️ Menu (`/menu`)

- **Description**: menu and category management
- **Features**: full CRUD, category filter, photo upload (Cloudinary)
- **How to Use**: create/edit items with price, category, and photo; staff roles other than HQ are read-only

#### 🏢 Branches (`/branches`)

- **Description**: branch CRUD plus franchise-owner assignment
- **Features**: create/edit branches, assign partner owners
- **How to Use**: (super_admin) manage the branch network and ownership links

#### 👥 Customers (`/customers`)

- **Description**: CRM profiles (name, phone, segment, points, tier)
- **Features**: card grid, detail sheet, edit/delete, order counts; accounts originate from self-registration only
- **How to Use**: search and inspect customer profiles and loyalty standing

#### ⭐ Reviews (`/reviews`)

- **Description**: moderation queue for customer reviews
- **Features**: approve/reject, filter by status
- **How to Use**: moderate pending reviews submitted from the `/my` portal

#### 💳 Transactions (`/transactions`)

- **Description**: full transaction ledger with filters
- **Features**: list, search, filter by branch/method/date
- **How to Use**: audit daily sales records per branch

#### 🧑‍💼 Employee & Payroll (`/employee`)

- **Description**: staff and payroll management per branch
- **Features**: TanStack Table (sort/filter/paginate), employee CRUD, payroll processing
- **How to Use**: (super_admin/manager) manage staff linked to login accounts

#### 🤝 Payouts (`/payouts`)

- **Description**: franchise revenue sharing
- **Features**: owner requests, HQ approval
- **How to Use**: (franchise_owner) request payout → (super_admin) approve

#### 💬 Chat (`/chat` — staff only)

- **Description**: realtime messaging — direct messages and branch channels
- **Features**: live messages via Ably, unread tracking
- **How to Use**: join branch channels or start a DM with another staff member

#### 🗺️ Maps (`/maps`)

- **Description**: interactive map of all branches
- **Features**: markers, popups, search (MapLibre GL)
- **How to Use**: pan/zoom the map or search a branch to locate it

#### 📜 Audit Log (`/audit`) & 🔔 Notifications (`/notifications`)

- **Description**: operational transparency tools
- **Features**: audit timeline with search/action/table filters and expandable metadata; notification list with mark-read
- **How to Use**: trace who changed what; clear notifications as you read them

#### ⚙️ Settings (`/settings`)

- **Description**: profile and password management for staff
- **Features**: update profile, change password
- **How to Use**: same self-service pattern as the customer account page

---

## 🔒 Security Notes

- Passwords are hashed before storage (never plain text); public auth endpoints return generic error messages
- Sessions use signed HTTP-only cookies with CSRF protection and trusted-origin checks
- Sensitive endpoints are rate-limited
- Role-based guards run on every page and every data mutation; branch scoping restricts non-HQ roles to their own branch
- Auth and DB credentials live server-side only and are never shipped to the browser
- Credentials are kept in `server/.env` (git-ignored); only `*.env.example` files are committed

---

## 🚀 Deployment

Deploy to Vercel (single domain, client + API same-origin):

1. `bun run build:api` bundles the Elysia app to `server/dist/entry.js`, re-exported by `api/index.ts` as serverless functions; `bun run build` outputs the client to `client/dist` (see `vercel.json`: `buildCommand`, `outputDirectory`).
2. `vercel.json` rewrites route `/api/*` and `/openapi/*` to the API and everything else to the SPA (`/index.html`).
3. Fill in all environment variables from `server/.env.example` in the project settings. For production, adjust three auth-related values:
   - `BETTER_AUTH_URL` = the production URL (e.g. `https://xxx.vercel.app`), not localhost
   - add the production URL to `BETTER_AUTH_TRUSTED_ORIGINS`
   - register `<production-URL>/api/auth/callback/google` as an authorized redirect URI in Google Cloud Console (otherwise Google login fails in production)
4. Deploy, then smoke-test on the production URL: landing → register → login → one page per role → logout.

---

## 📄 License

This project is developed as a final project for GDGoC UNSRI (Frontend Division, Batch 2025/2026).

---

## 📞 Support

If you encounter any issues:

1. Make sure `server/.env` is complete and migrations are applied (`bun run db:migrate` from `server/`)
2. Check that the dev server URLs match (`:5173` client → `:3000` API via Vite proxy)
3. Open an issue in this repository with the error message and steps to reproduce
