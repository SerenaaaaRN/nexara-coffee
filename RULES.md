# Standar Clean Code untuk File Feature

## Arsitektur

### Struktur File (per domain)
```
features/{domain}/
├── components/
│   ├── {domain}-page.tsx         ← orchestrator, hooks → sub-components
│   ├── {domain}-{component}.tsx  ← dumb UI / sub-component fokus
│   └── ...
├── hooks/
│   ├── use{Domain}Queries.ts     ← server fns + query hooks
│   ├── use{Domain}Mutations.ts   ← mutation hooks
│   └── use{Domain}{Logic}.ts     ← UI logic hook (optional)
├── types.ts                     ← types + Zod schemas
└── utils.ts                     ← helpers (optional)
```

### Tiga lapisan
| Lapisan | File | Tanggung jawab |
|---|---|---|
| Data fetching | `use{Domain}Queries.ts` / `use{Domain}Mutations.ts` | Server fns, TanStack Query hooks |
| UI Logic | `use{Domain}{Logic}.ts` | State, filtering, derived data (tanpa JSX) |
| Orchestrator | `{domain}-page.tsx` | Hook → sub-components. Pake `getRouteApi()` + `useSession()` |
| Dumb UI | `{domain}-{component}.tsx` | Render murni, terima props, ga fetching data |

### Aturan
- **Routes tipis**: cuma `validateSearch`, `beforeLoad`, `loader`, `head`, `pendingComponent`, `errorComponent`. Ga boleh ada komponen page di dalem route.
- **No Shell/Client/Grid**: serap ke page component atau split ke sub-component.
- **Page component self-contained**: pake `getRouteApi()` + `useSession()` langsung, bukan props dari route.

---

## Standar Coding

### Conditional rendering
Pake `? ... : null`, jangan `&&`:

```tsx
// ❌ Salah
{log.branchName && <span>{log.branchName}</span>}
{hasFilters && <Button>Clear</Button>}

// ✅ Bener
{log.branchName ? <span>{log.branchName}</span> : null}
{hasFilters ? <Button>Clear</Button> : null}
```

### Function declarations
Pake `const` arrow function konsisten:

```tsx
// ❌ Salah
export function AuditPage() { ... }

// ✅ Bener
export const AuditPage = () => { ... };
```

### Hook buat UI logic
Extract state + derived data ke custom hook. File hook **gaboleh ada JSX**:


### Memoize derived values
```tsx
const mapsUrl = useMemo(
  () => branch.lat && branch.lng
    ? `https://www.google.com/maps?q=${branch.lat},${branch.lng}`
    : null,
  [branch.lat, branch.lng],
);
```

### Types
- Pake type konkrit, jangan `Record<string, unknown>` atau `Parameters<typeof ...>`:

```tsx
// ❌ Salah
interface Props {
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

// ✅ Bener
interface Props {
  onSubmit: (data: CreateBranchInput) => Promise<void>;
}
```

### Error handling
- Jangan re-throw error di antara layer. Tangani di level yang tepat:

```tsx
// ❌ Salah — re-throw cuma buat ditangkep lagi
async function handleDelete(id: string) {
  try {
    await deleteBranch.mutateAsync(id);
  } catch {
    throw new Error("Failed");
  }
}

// ✅ Bener — biarin caller yg handle
async function handleDelete(id: string) {
  await deleteBranch.mutateAsync(id);
}
```

### Imports
- Pake `@/` alias, jangan `#/`:
```tsx
// ❌ Salah
import { SectionHeader } from "#/components/shared/section-header";

// ✅ Bener
import { SectionHeader } from "@/components/shared/section-header";
```

### Formatting
- Biome adalah source of truth (indent 4 spasi). Jangan format manual beda style.
- Jalankan `bun run format` sebelum commit bila menyentuh banyak file.

---

## Kapan Extract Hook vs Tetap Inline

| Skenario | Keputusan |
|---|---|
| State + derived data cuma dipake 1 komponen | Tetap di page |
| State dipake banyak komponen | Extract hook |
| Logic filter/search/group kompleks | Extract hook (contoh: `useAuditFilters`) |
| State simpel (contoh: `expandedId`) | Tetap di page |
| `useMemo` tunggal (contoh: `mapsUrl`, `hours`) | Tetap di page |
| Handler pendek (<5 baris) | Tetap di page |

---

## Batas Baris TSX

- **250 is the floor, not the ceiling:** while a file is under 250 lines, DO NOT split components into new files
- **Non-TSX files:** no limit
- **Compose first** — small components in the same flow must live in 1 file (composite pattern, e.g. primitives together with the section that uses them)
- **Split when:** 1 file >350 lines OR logic separates cleanly into dumb UI + parent orchestrator

---

## JSDoc

### Server functions (`createServerFn`)
Wajib. Pake **Bahasa Indonesia**:

```tsx
/**
 * Mengambil daftar semua cabang dengan detail manajer.
 *
 * Data di-filter berdasarkan hak akses user.
 *
 * @returns {BranchRow[]} Daftar cabang
 */
export const getBranchesFn = createServerFn({ method: "GET" }).handler(...)
```

### Query options + hooks
Cukup referensi ke server function:

```tsx
/** @see {@link getBranchesFn} */
export const branchesOptions = () => queryOptions({ ... });

/** @see {@link getBranchesFn} */
export function useBranches() { ... }
```

### UI logic hooks (custom hooks)
Pake **Bahasa Indonesia** (singkat):

```tsx
/**
 * Filter & search audit log di sisi client.
 * Ngatur state pencarian, filter aksi, dan filter tabel.
 *
 * @param logs - Seluruh data audit log
 * @returns State, setter, hasil filter/group
 */
export function useAuditFilters(logs: AuditLogRow[]) { ... }
```

---

## UI Consistency

- **No redesign sepihak**: ikuti design language yang sudah ada (spacing, typography, warna, icon, shadcn variants)
- **Dilarang**: ganti padding, margin, warna, font, spacing, icon, grid layout, atau urutan elemen di komponen yang sudah ada tanpa persetujuan eksplisit
- `&&` → `? ... : null` adalah pengecualian yang diizinkan — output DOM-nya identik
