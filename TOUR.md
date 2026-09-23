# TOUR.md — Guided Tour Dashboard Nexara (driver.js)

> Dokumen perencanaan + implementasi tur terpandu dashboard internal.
> Status: **Fase 1 + Opsi A + Fase 2 (menu/transactions/branches) + Fase 3 selesai —
> seluruh halaman dashboard internal + `/pos` punya tur sendiri. Portal `/my`
> sengaja tidak disentuh (beda branch).**
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
├── data.ts                   # ALL_STEPS saja (data murni, tanpa function)
├── registry.ts               # stepsFor + TOURS + tourForPathname + isKnownTourId
├── storage.ts                # Key + helper localStorage (resume & done flag)
├── hooks/useGuidedTour.ts    # Instance driver, handoff navigate, destroy/cleanup
└── components/
    ├── tour-launcher.tsx     # Tombol Help context-aware + auto-start + resume
    └── tour-styles.css       # Tema popover .nexara-tour dari token shadcn
```

Pemisahan data vs function: `data.ts` hanya berisi array langkah;
`registry.ts` + `storage.ts` sejajar di folder yang sama (tanpa subfolder
`data/` — redundan dengan `data.ts`).

### 2a. Model Opsi A — tur per halaman (pengganti append satu tur panjang)

Satu tur 40+ langkah tidak dipakai. Sebagai gantinya ada registry tur:

| TourId | Isi | Pemicu |
|---|---|---|
| `pengenalan` | 14 langkah multi-halaman (intro → … → kasir → outro), satu-satunya yang punya langkah handoff | Auto-start sekali + tombol Help di halaman tanpa tur sendiri |
| `overview` | Shell (3) + header (1) + overview (2) = 6 langkah — satu-satunya tur halaman yang menyertakan shell karena overview adalah halaman pertama user | Tombol Help saat di `/overview` |
| `orders` | Konten orders saja (2 langkah) | Tombol Help saat di `/orders` |
| `kasir` | Konten kasir saja (1–2 langkah, role-filtered) | Tombol Help saat di `/kasir` |
| `menu` | Konten menu saja (2–3 langkah; tambah-item hanya `create menu`) | Tombol Help saat di `/menu` |
| `transactions` | Konten transactions saja (2 langkah; barista terskip — tanpa `read finance`) | Tombol Help saat di `/transactions` |
| `branches` | Daftar + tambah (super_admin) + detail (2–3 langkah) | Tombol Help saat di `/branches` |
| `maps` | Cari + kanvas peta + legenda (3 langkah, semua staff) | Tombol Help saat di `/maps` |
| `customers` | Stats + toolbar + grid kartu (3 langkah; tanpa `read customers` → fallback pengenalan) | Tombol Help saat di `/customers` |
| `reviews` | Stats + toolbar + daftar (3 langkah; anchor ganda Empty vs tabel) | Tombol Help saat di `/reviews` |
| `employee` | Stats + toolbar + tambah (2–3 langkah; hanya super_admin & branch_manager bisa buka halaman) | Tombol Help saat di `/employee` |
| `payouts` | Stats + toolbar + daftar (3 langkah; anchor ganda Empty vs tabel) | Tombol Help saat di `/payouts` |
| `chat` | Inbox + percakapan + form kirim (2–3 langkah; form hanya `create chat`) | Tombol Help saat di `/chat` |
| `audit` | Toolbar + linimasa (2 langkah; hanya super_admin & branch_manager) | Tombol Help saat di `/audit` |
| `notifications` | Tab filter + daftar (2 langkah; anchor ganda Empty vs list) | Tombol Help saat di `/notifications` |
| `settings` | Nav + foto + klik Account + password + klik Appearance + tema (7 langkah; user pindah bagian dengan klik sesuai panduan) | Tombol Help saat di `/settings` |
| `pos` | Katalog + keranjang + tombol Charge (3 langkah; hanya super_admin/branch_manager/cashier; launcher di-mount di header POS) | Tombol Help saat di `/pos` |

Hanya tur `overview` yang menyertakan grup `shell` + `header`. Tur halaman lain
konten saja (tanpa intro/outro/handoff).

Aturan yang dipatuhi: arrow function only, TSX < 250 baris, anchor via atribut
`data-tour="..."` saja (tanpa ubah layout/styling — UI consistency rule),
instance `driver()` hanya dibuat di effect/event handler (aman SSR),
`destroy()` saat unmount agar overlay tak tertinggal pindah rute.

### 2b. Flag, resume & auto-start per tour

- Auto-start dua tingkat di `tour-launcher.tsx`: tur `pengenalan` sekali
  (kunjungan pertama), lalu tiap tur halaman auto-start sekali di kunjungan
  pertama halaman itu — hanya setelah pengenalan selesai, hanya bila ada
  langkah untuk role tersebut (helper `isPageTourDue`), dan resume handoff
  selalu prioritas. Dismiss (Esc/backdrop/×) tercatat selesai sehingga tak
  muncul lagi.

- Flag selesai per tur: `nexara-tour-{id}-done` (fungsi `doneKeyFor`)
  (`pengenalan`, `overview`, `orders`, `kasir`, `menu`, `transactions`,
  `branches`, `maps`, `customers`, `reviews`, `employee`, `payouts`, `chat`,
  `audit`, `notifications`, `settings`, `pos`).
  Flag model lama `nexara-tour-v1-done` tetap dihormati untuk `pengenalan`.
- Resume handoff: `localStorage["nexara-tour-step"]` berisi `tourId:index`
  (fungsi `saveResume`/`getSavedResume`); format lama (angka polos) dianggap
  milik `pengenalan`. Hanya tur `pengenalan` yang menulis resume.
- `tourForPathname(pathname)` memetakan halaman aktif ke tur; bila tur
  halaman membangun 0 langkah untuk role tersebut, fallback ke `pengenalan`.
- Menambah tur halaman baru = 1 entry di `TOURS` + anchor `data-tour` —
  mapping route terderivasi otomatis dari key `TOURS` (konvensi `/${id}`,
  exception via `ROUTE_OVERRIDES`), mekanisme handoff/resume tak berubah.

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
| `features/menu/components/menu-page.tsx` | `menu-stats`, `menu-tabs`, `menu-add` (tambah-item) |
| `features/transactions/components/transactions-table.tsx` | `transactions-content`, `transactions-stats`, wrapper `transactions-toolbar` |
| `features/branches/components/branch-list-panel.tsx` | `branches-list`, `branches-add` |
| `features/branches/components/branches-page.tsx` | `branches-detail` (kolom detail) |
| `features/maps/components/maps-page.tsx` | `maps-canvas` (kontainer peta) |
| `features/maps/components/branch-sidebar-panel.tsx` | `maps-search`, `maps-legend` |
| `features/customers/components/customers-page.tsx` | `customers-stats` (cabang ada-data), `customers-toolbar` |
| `features/customers/components/customer-grid.tsx` | `customers-grid` (ketiga cabang: kosong, filter-kosong, grid) |
| `features/reviews/components/reviews-table.tsx` | `reviews-stats`, wrapper `reviews-toolbar`, wrapper `reviews-content` + `Empty` cabang kosong |
| `features/employee/components/employee-table.tsx` | `employee-stats`, wrapper `employee-toolbar`, `employee-add` (kedua cabang) |
| `features/payouts/components/payouts-table.tsx` | `payouts-stats`, wrapper `payouts-toolbar`, wrapper `payouts-content` + `Empty` cabang kosong |
| `features/chat/components/chat-channel-list.tsx` | `chat-inbox` |
| `features/chat/components/chat-layout.tsx` | `chat-conversation` (kedua cabang: panel aktif + placeholder) |
| `features/chat/components/chat-panel.tsx` | `chat-form` (cabang bisa-kirim) |
| `features/audit/components/audit-filter-bar.tsx` | `audit-toolbar` |
| `features/audit/components/audit-page.tsx` | `audit-list` (kedua cabang: Empty + ScrollArea) |
| `features/notifications/components/notifications-list.tsx` | `notifications-tabs`, `notifications-list` (Empty + ScrollArea) |
| `features/settings/components/settings-page.tsx` | `settings-nav` (aside, stabil mobile+desktop), `settings-content` |
| `features/settings/components/profile-form-section.tsx` | `settings-avatar` (hanya saat bagian Profile aktif) |
| `features/settings/components/account-form-section.tsx` | `settings-password` (hanya saat bagian Account aktif) |
| `features/settings/components/appearance-form-section.tsx` | `settings-theme` (hanya saat bagian Appearance aktif) |
| `features/settings/components/settings-page.tsx` (nav desktop) | `settings-goto-account`, `settings-goto-appearance` (langkah klik `advanceOnClick`) |
| `features/pos/components/pos-page.tsx` | mount `<TourLauncher />` di header kanan |
| `features/pos/components/pos-client.tsx` | `pos-catalog`, `pos-cart`, `pos-charge` |

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
- Auto per halaman: user baru selesaikan pengenalan → buka `/chat` pertama
  kali → tur chat muncul sendiri; kunjungan berikutnya tidak. Barista buka
  `/transactions` → tidak ada auto (nol langkah untuk role itu).
- Reset: hapus `nexara-tour-{id}-done` di localStorage
  (`pengenalan`, `overview`, `orders`, `kasir`, `menu`, `transactions`,
  `branches`, `maps`, `customers`, `reviews`, `employee`, `payouts`, `chat`,
  `audit`, `notifications`, `settings`, `pos`).

## 8. Backlog (belum dikerjakan)

Portal `/my` (visitor) **sengaja tidak disentuh** — beda branch, bukan
dashboard internal. Bila nanti dibutuhkan, polanya sama (mount launcher di
`my-portal-shell` + grup/tur per tab), tanpa mengubah mekanisme yang ada.

## 9. Catatan Fase 3 (tur tersisa dashboard + POS)

- `/pos` tidak ikut layout `_dashboard`, jadi `<TourLauncher />` di-mount
  terpisah di header `pos-page.tsx`. Auto-start pengenalan tetap global;
  tur `pos` hanya manual via tombol Help.
- Tidak ada handoff menuju/pindah dari `/pos` (guard role antar-layout akan
  me-redirect) — semua tur halaman konten saja, tanpa `navigateTo`.
- `settings-nav` dipasang di `<aside>` (bukan nav desktop) agar stabil di
  mobile + desktop — nav desktop `hidden` di mobile sehingga selector ganda
  akan menunjuk elemen tersembunyi.
- `chat-conversation` satu anchor di kedua cabang layout (panel aktif vs
  placeholder) — keduanya tak pernah render bersamaan.
- Tur `settings` 7 langkah lintas 3 bagian. Pola bawaan driver.js
  **click-driven tour** (`advanceOnClick`, lihat
  `.agents/skills/driverjs-tours/references/recipes.md`): di antara panduan
  tiap bagian ada langkah klik ("Klik tombol Account/Appearance") — klik user
  tetap menjalankan pindah bagian via search param sekaligus memajukan tur,
  dan `waitForElement` menyerap delay render. Tanpa event custom / field
  khusus: `TourStepDef.advanceOnClick` generik, anchor via `data-tour` di
  tombol nav desktop. Di mobile (nav berupa Select) kedua langkah klik
  ter-skip — batasan yang didokumentasikan, bukan bug.
- Label "Lanjut" dipaksa di semua langkah non-terakhir (`useGuidedTour`):
  driver.js menampilkan `doneBtnText` ("Selesai") begitu langkah berikut belum
  ter-render — mis. langkah klik Appearance sebelum bagian Appearance dibuka.
  Pemaksaan berbasis indeks (generik, bukan hardcode section).
