# TOUR.md — Guided Tour Dashboard Nexara (driver.js)

> Dokumen perencanaan + implementasi tur terpandu dashboard internal.
> Status: **Fase 1 selesai** (berhenti di Kasir, 7 grup langkah).
> Library: `driver.js@^1.8.0` (sudah ada di `package.json`, tanpa install tambahan).
> Referensi API: `.agents/skills/driverjs-tours/` (SKILL.md + `references/`).

## 1. Keputusan Desain (mengikat)

| Aspek | Keputusan |
|---|---|
| Scope Fase 1 | Full multi-page tour, berhenti di Kasir (7 grup, 14 langkah) |
| Trigger | Ikon bantuan icon-only di header + auto-start sekali per user |
| Role | Semua staff, langkah difilter per role (`can()` + `skipMissingElement`) |
| Bahasa popover | Bahasa Indonesia |
| Tanpa build | Verifikasi via `biome lint` + `tsc --noEmit` saja |

## 2. Arsitektur

Fitur vertikal `src/features/tour/` (ikut execution order AGENTS.md):

```
src/features/tour/
├── types.ts                  # TourStepDef, TourGroup, TourHandoffTarget
├── data.ts                   # 14 langkah + buildTourSteps(role) + storage helpers
├── hooks/useGuidedTour.ts    # Instance driver, handoff navigate, destroy/cleanup
└── components/
    ├── tour-launcher.tsx     # Tombol Help + auto-start + resume antar-halaman
    └── tour-styles.css       # Tema popover .nexara-tour dari token shadcn
```

Aturan yang dipatuhi: arrow function only, TSX < 250 baris, anchor via atribut
`data-tour="..."` saja (tanpa ubah layout/styling — UI consistency rule),
instance `driver()` hanya dibuat di effect/event handler (aman SSR),
`destroy()` saat unmount agar overlay tak tertinggal pindah rute.

## 3. Daftar Langkah (14, Bahasa Indonesia)

| # | id | Grup | Anchor | Khusus role |
|---|---|---|---|---|
| 1 | intro | intro | centered | semua |
| 2 | shell-team | shell | `team-switcher` | semua |
| 3 | shell-nav | shell | `sidebar-nav` | semua |
| 4 | shell-user | shell | `nav-user` | semua |
| 5 | header-actions | header | `header-actions` | semua |
| 6 | overview-stats | overview | `overview-stats` | `read reports` |
| 7 | overview-tabs | overview | `overview-tabs` | `read reports` |
| 8 | handoff-orders | orders | `sidebar-nav` → navigate `/orders` | `read orders` |
| 9 | orders-stats | orders | `orders-stats` | `read orders` |
| 10 | orders-toolbar | orders | `orders-toolbar` | `read orders` |
| 11 | handoff-kasir | kasir | `sidebar-nav` → navigate `/kasir` | `read setoran` |
| 12 | kasir-content | kasir | `kasir-content` | `read setoran` |
| 13 | kasir-record | kasir | `kasir-record` | `create setoran` |
| 14 | outro | outro | centered | semua |

Implikasi per role: barista (tanpa `read setoran`) melewati grup kasir +
handoff-nya; franchise_owner (tanpa `create setoran`) melewati step 13;
super_admin melihat semua 14 langkah.

## 4. Mekanisme Handoff Antar-Halaman (resumable)

1. Step handoff (`navigateTo`) override `onNextClick`: simpan indeks berikut ke
   `localStorage["nexara-tour-step"]` → `destroy()` (flag `navigating`,
   tidak menandai selesai) → `navigate()` ke rute target.
2. `TourLauncher` hidup di layout `_dashboard` (persisten lintas navigasi SPA);
   effect resume berjalan tiap `pathname` berubah → `drive(savedStep)`.
3. Bila sudah di halaman tujuan, handoff lanjut biasa (`moveNext`, tanpa navigasi).
4. `waitForElement: 5000` menyerap delay render loader; `skipMissingElement: true`
   melewati anchor yang tak ada (mis. halaman kosong / tak berizin).
5. Selesai normal / keluar (Esc, backdrop, tombol ×): hapus resume key +
   set `localStorage["nexara-tour-v1-done"] = "1"` agar auto-start tak mengganggu.
   Replay kapan saja via tombol Help.

## 5. Anchor `data-tour` (file yang disentuh)

| File | Anchor |
|---|---|
| `routes/_dashboard.tsx` | `header-actions` + render `<TourLauncher />` di sebelah `ThemeSheet` |
| `components/layout/app-sidebar.tsx` | `team-switcher`, `sidebar-nav`, `nav-user` |
| `features/overview/components/overview-stats.tsx` | `overview-stats` (termasuk skeleton) |
| `features/overview/components/overview-page.tsx` | `overview-tabs` (Tabs teruskan props ✓) |
| `features/orders/components/orders-page.tsx` | `orders-stats`, wrapper `orders-toolbar` |
| `features/kasir/components/kasir-page.tsx` | `kasir-content`, `kasir-record` (cabang kosong) |
| `features/kasir/components/kasir-table.tsx` | `kasir-record` (cabang tabel) |

## 6. Pelajaran Insiden

**Bug: macet langkah 12 → 13.** Anchor `kasir-record` awalnya hanya ada di
cabang kosong (`kasir-page.tsx`); saat data setoran ada, cabang tabel
(`kasir-table.tsx`) yang render tanpa anchor. driver.js menunggu
`waitForElement` 5 detik (tampak macet), dan tiap klik Lanjut me-restart timer
(`d()` membatalkan wait lalu memulai ulang) sehingga macet permanen.
Fix: anchor yang sama ditambahkan ke tombol Record di `kasir-table.tsx`
(kedua cabang tak pernah render bersamaan — selector tetap unik).
Aturan: **setiap anchor tur yang berada di cabang kondisional wajib ada di
semua cabang render-nya.**

## 7. Verifikasi

- `bunx biome check src/features/tour` + `biome lint` file edit: bersih.
  (Error `format` CRLF adalah bawaan repo — file tak tersentuh pun gagal sama.)
- `bunx tsc --noEmit`: hanya 2 error pre-existing (`kanban.tsx`, `my-orders-page.tsx`).
- Manual per role: Help → tur penuh, langkah terlarang ter-skip, reload di tengah
  tur → resume di halaman benar, Esc → flag selesai + replay via tombol.
- Reset auto-start: hapus `nexara-tour-v1-done` di localStorage.

## 8. Backlog Fase 2 (belum dikerjakan)

Halaman tanpa langkah tur: Menu, Branches, Maps, Customers, Reviews,
Transactions, Employee, Payouts, Chat, Audit, Notifications, Settings,
POS (`/pos`), portal `/my`. Cara menambah: entry baru di `ALL_STEPS`
(`data.ts`) + 1 atribut `data-tour` di komponen target — mekanisme
handoff/resume tidak perlu diubah.
