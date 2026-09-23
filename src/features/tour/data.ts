import type { TourStepDef } from "@/features/tour/types";
import { can, type Role } from "@/lib/rbac";

/** Kunci flag "tur pernah selesai" (naikkan versi bila tur berubah total). */
export const TOUR_DONE_KEY = "nexara-tour-v1-done";

/** Kunci indeks resume untuk handoff antar-halaman. */
export const TOUR_STEP_KEY = "nexara-tour-step";

/** Semua langkah tur Fase 1 dalam Bahasa Indonesia, urut dari intro ke outro. */
const ALL_STEPS: TourStepDef[] = [
    {
        id: "intro",
        group: "intro",
        title: "Selamat datang di Nexara",
        description:
            "Ikuti tur singkat untuk mengenal dashboard operasional cafe: navigasi, cabang, ringkasan, orders, hingga setoran kasir.",
    },
    {
        id: "shell-team",
        group: "shell",
        element: '[data-tour="team-switcher"]',
        title: "Pindah aplikasi",
        description:
            "Ganti antara Dashboard, Nexara POS, dan Landing Page dari sini.",
        side: "right",
    },
    {
        id: "shell-nav",
        group: "shell",
        element: '[data-tour="sidebar-nav"]',
        title: "Menu navigasi",
        description:
            "Semua modul operasional ada di sini: Overview, Orders, Kasir, Menu, hingga Pengaturan. Menu menyesuaikan peran Anda.",
        side: "right",
    },
    {
        id: "shell-user",
        group: "shell",
        element: '[data-tour="nav-user"]',
        title: "Akun Anda",
        description: "Lihat profil dan keluar dari aplikasi lewat menu ini.",
        side: "right",
    },
    {
        id: "header-actions",
        group: "header",
        element: '[data-tour="header-actions"]',
        title: "Cabang aktif & tema",
        description:
            "Filter data per cabang atau lihat semua cabang sekaligus. Ikon palet di sebelahnya mengganti tema tampilan.",
        side: "bottom",
        align: "end",
    },
    {
        id: "overview-stats",
        group: "overview",
        element: '[data-tour="overview-stats"]',
        title: "Ringkasan kinerja",
        description:
            "Total omzet, order, cabang aktif, dan rata-rata nilai order jaringan cafe sekilas.",
        side: "bottom",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "reports"),
    },
    {
        id: "overview-tabs",
        group: "overview",
        element: '[data-tour="overview-tabs"]',
        title: "Tab analisis",
        description:
            "Beralih antara Revenue, Orders, dan Analytics untuk melihat grafik yang berbeda.",
        side: "bottom",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "reports"),
    },
    {
        id: "handoff-orders",
        group: "orders",
        element: '[data-tour="sidebar-nav"]',
        title: "Lanjut ke Orders",
        description:
            "Klik Lanjut untuk pindah ke halaman Orders dan melihat antrean order.",
        side: "right",
        navigateTo: "/orders",
        visibleFor: (role) => can(role, "read", "orders"),
    },
    {
        id: "orders-stats",
        group: "orders",
        element: '[data-tour="orders-stats"]',
        title: "Status order",
        description:
            "Pantau Total, Pending, Completed, dan Cancelled secara realtime.",
        side: "bottom",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "orders"),
    },
    {
        id: "orders-toolbar",
        group: "orders",
        element: '[data-tour="orders-toolbar"]',
        title: "Cari & filter",
        description:
            "Cari order, filter kolom, dan ganti tampilan Tabel atau Board (kanban).",
        side: "bottom",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "orders"),
    },
    {
        id: "handoff-kasir",
        group: "kasir",
        element: '[data-tour="sidebar-nav"]',
        title: "Lanjut ke Kasir",
        description:
            "Klik Lanjut untuk pindah ke halaman Kasir & Setoran harian.",
        side: "right",
        navigateTo: "/kasir",
        visibleFor: (role) => can(role, "read", "setoran"),
    },
    {
        id: "kasir-content",
        group: "kasir",
        element: '[data-tour="kasir-content"]',
        title: "Setoran harian",
        description:
            "Setoran adalah deklarasi kas fisik tiap cabang per hari, direkonsiliasi dengan hasil POS. Manager menyetujui atau menolak di sini.",
        side: "top",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "setoran"),
    },
    {
        id: "kasir-record",
        group: "kasir",
        element: '[data-tour="kasir-record"]',
        title: "Catat setoran",
        description:
            "Klik tombol ini setiap akhir hari untuk mencatat setoran. Nominal terisi otomatis dari total tunai POS.",
        side: "bottom",
        align: "end",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "create", "setoran"),
    },
    {
        id: "outro",
        group: "outro",
        title: "Tur selesai",
        description:
            "Anda siap mengoperasikan Nexara. Klik ikon bantuan di header kapan saja untuk mengulang tur ini.",
    },
];

/**
 * Susun langkah tur sesuai izin role. Langkah yang tak berizin
 * (mis. grup kasir untuk barista) dibuang agar tak menarget halaman terlarang.
 */
export const buildTourSteps = (role: Role): TourStepDef[] =>
    ALL_STEPS.filter((step) => step.visibleFor?.(role) ?? true);

/** Baca indeks resume handoff; null bila tidak ada / bukan angka / SSR. */
export const getSavedStepIndex = (): number | null => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(TOUR_STEP_KEY);
    if (raw === null) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

/** Simpan indeks resume sebelum pindah halaman (handoff). */
export const saveStepIndex = (index: number): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOUR_STEP_KEY, String(index));
};

/** Hapus indeks resume (tur selesai normal / keluar). */
export const clearSavedStepIndex = (): void => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOUR_STEP_KEY);
};

/** True bila tur versi ini pernah selesai (atau pengguna keluar lebih awal). */
export const isTourDone = (): boolean => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(TOUR_DONE_KEY) === "1";
};

/** Tandai tur selesai agar auto-start tak mengganggu lagi. */
export const markTourDone = (): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOUR_DONE_KEY, "1");
};
