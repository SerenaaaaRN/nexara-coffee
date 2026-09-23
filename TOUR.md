# TOUR.md — Guided Tour Dashboard Nexara (driver.js)

> Dokumen perencanaan + implementasi tur terpandu dashboard internal.
> Status: **Fase 1 selesai + refactor Opsi A (tur per halaman)**.
> Library: `driver.js@^1.8.0` (sudah ada di `package.json`, tanpa install tambahan).
> Referensi API: `.agents/skills/driverjs-tours/` (SKILL.md + `references/`).
> Aturan validasi: pemilik repo validasi sendiri — agen tidak menjalankan
> build/lint/tsc (instruksi eksplisit).

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
├── types.ts                  # TourStepDef, TourGroup, TourId, TourDef
├── data.ts                   # ALL_STEPS + TOURS registry + storage helpers
├── hooks/useGuidedTour.ts    # Instance driver, handoff navigate, destroy/cleanup
└── components/
    ├── tour-launcher.tsx     # Tombol Help context-aware + auto-start + resume
    └── tour-styles.css       # Tema popover .nexara-tour dari token shadcn
```

### 2a. Model Opsi A — tur per halaman (pengganti append satu tur panjang)

Satu tur 40+ langkah tidak dipakai. Sebagai gantinya ada registry tur:

| TourId | Isi | Pemicu |
|---|---|---|
| `pengenalan` | 14 langkah multi-halaman (intro → … → kasir → outro), satu-satunya yang punya langkah handoff | Auto-start sekali + tombol Help di halaman tanpa tur sendiri |
| `overview` | Shell (3) + header (1) + overview (2) = 6 langkah — satu-satunya tur halaman yang menyertakan shell karena overview adalah halaman pertama user | Tombol Help saat di `/overview` |
| `orders` | Konten orders saja (2 langkah) | Tombol Help saat di `/orders` |
| `kasir` | Konten kasir saja (1–2 langkah, role-filtered) | Tombol Help saat di `/kasir` |

Hanya tur `overview` yang menyertakan grup `shell` + `header`. Tur halaman lain
konten saja (tanpa intro/outro/handoff).

Aturan yang dipatuhi: arrow function only, TSX < 250 baris, anchor via atribut
`data-tour="..."` saja (tanpa ubah layout/styling — UI consistency rule),
instance `driver()` hanya dibuat di effect/event handler (aman SSR),
`destroy()` saat unmount agar overlay tak tertinggal pindah rute.

### 2b. Flag & resume per tour

- Flag selesai per tur: `nexara-tour-{id}-done` (fungsi `doneKeyFor`).
  Flag model lama `nexara-tour-v1-done` tetap dihormati untuk `pengenalan`.
- Resume handoff: `localStorage["nexara-tour-step"]` berisi `tourId:index`
  (fungsi `saveResume`/`getSavedResume`); format lama (angka polos) dianggap
  milik `pengenalan`. Hanya tur `pengenalan` yang menulis resume.
- `tourForPathname(pathname)` memetakan halaman aktif ke tur; bila tur
  halaman membangun 0 langkah untuk role tersebut, fallback ke `pengenalan`.
- Menambah tur halaman baru = 1 entry di `TOURS` + 1 cabang di
  `tourForPathname` + anchor `data-tour` — mekanisme handoff/resume tak berubah.

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

> Validasi dilakukan pemilik repo sendiri (agen dilarang validasi).

- Manual per role: Help → tur sesuai halaman (overview/orders/kasir) atau
  pengenalan di halaman lain; langkah terlarang ter-skip; reload di tengah
  tur pengenalan → resume di halaman benar; Esc → flag selesai per-tour +
  replay via tombol.
- Reset: hapus `nexara-tour-{id}-done` di localStorage
  (`pengenalan`, `overview`, `orders`, `kasir`).

## 8. Backlog Fase 2 (belum dikerjakan)

Halaman tanpa tur sendiri (tombol Help di sana menjalankan tur pengenalan):
Menu, Branches, Maps, Customers, Reviews, Transactions, Employee, Payouts,
Chat, Audit, Notifications, Settings, POS (`/pos`), portal `/my`.
Cara menambah: langkah baru di `ALL_STEPS` dengan `group` baru + 1 entry di
`TOURS` + 1 cabang di `tourForPathname` + anchor `data-tour` — mekanisme
handoff/resume tidak perlu diubah. Keputusan: tidak di-append ke satu tur
panjang (melebihi batas retensi); tiap halaman punya tur pendek 2–4 langkah.
