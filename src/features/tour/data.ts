import type {
    TourDef,
    TourGroup,
    TourId,
    TourStepDef,
} from "@/features/tour/types";
import { can, type Role } from "@/lib/rbac";

/** Flag "tur pernah selesai" model lama (sebelum registry per-tour). */
const LEGACY_DONE_KEY = "nexara-tour-v1-done";

/** Kunci indeks resume untuk handoff antar-halaman. */
export const TOUR_STEP_KEY = "nexara-tour-step";

/** Kunci flag selesai per tur, mis. `nexara-tour-kasir-done`. */
export const doneKeyFor = (tourId: TourId): string =>
    `nexara-tour-${tourId}-done`;

/** Semua langkah tur pengenalan dalam Bahasa Indonesia, urut intro ke outro. */
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
 * Ambil langkah dari grup tertentu. Tur per-halaman membuang langkah handoff
 * (tak perlu pindah halaman); tur pengenalan memakai semuanya.
 */
const stepsFor = (
    role: Role,
    groups: TourGroup[],
    excludeHandoff: boolean,
): TourStepDef[] =>
    ALL_STEPS.filter(
        (step) =>
            groups.includes(step.group) &&
            (!excludeHandoff || !step.navigateTo) &&
            (step.visibleFor?.(role) ?? true),
    );

/** Registry tur: pengenalan multi-halaman + tur pendek per halaman. */
export const TOURS: Record<TourId, TourDef> = {
    pengenalan: {
        id: "pengenalan",
        title: "Tur Pengenalan Nexara",
        buildSteps: (role) =>
            stepsFor(
                role,
                [
                    "intro",
                    "shell",
                    "header",
                    "overview",
                    "orders",
                    "kasir",
                    "outro",
                ],
                false,
            ),
    },
    overview: {
        id: "overview",
        title: "Tur Halaman Overview",
        buildSteps: (role) => stepsFor(role, ["shell", "header", "overview"], true),
    },
    orders: {
        id: "orders",
        title: "Tur Halaman Orders",
        buildSteps: (role) => stepsFor(role, ["orders"], true),
    },
    kasir: {
        id: "kasir",
        title: "Tur Halaman Kasir",
        buildSteps: (role) => stepsFor(role, ["kasir"], true),
    },
};

/** Petakan pathname aktif ke tur per-halaman; default tur pengenalan. */
export const tourForPathname = (pathname: string): TourId => {
    if (pathname.startsWith("/orders")) return "orders";
    if (pathname.startsWith("/kasir")) return "kasir";
    if (pathname.startsWith("/overview")) return "overview";
    return "pengenalan";
};

export interface SavedResume {
    tourId: TourId;
    index: number;
}

const isKnownTourId = (value: string): value is TourId => value in TOURS;

/**
 * Baca resume handoff (`tourId:index`). Format lama (angka polos) dianggap
 * milik tur pengenalan agar resume sebelum update registry tetap jalan.
 */
export const getSavedResume = (): SavedResume | null => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(TOUR_STEP_KEY);
    if (raw === null) return null;
    const sep = raw.indexOf(":");
    if (sep === -1) {
        const index = Number.parseInt(raw, 10);
        if (Number.isNaN(index)) return null;
        return { tourId: "pengenalan", index };
    }
    const tourId = raw.slice(0, sep);
    const index = Number.parseInt(raw.slice(sep + 1), 10);
    if (!isKnownTourId(tourId) || Number.isNaN(index)) return null;
    return { tourId, index };
};

/** Simpan resume sebelum pindah halaman (handoff). */
export const saveResume = (tourId: TourId, index: number): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOUR_STEP_KEY, `${tourId}:${index}`);
};

/** Hapus resume (tur selesai normal / keluar). */
export const clearSavedResume = (): void => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOUR_STEP_KEY);
};

/** True bila tur ini pernah selesai (termasuk flag model lama). */
export const isTourDone = (tourId: TourId): boolean => {
    if (typeof window === "undefined") return true;
    if (window.localStorage.getItem(doneKeyFor(tourId)) === "1") return true;
    return (
        tourId === "pengenalan" &&
        window.localStorage.getItem(LEGACY_DONE_KEY) === "1"
    );
};

/** Tandai tur ini selesai agar auto-start tak mengganggu lagi. */
export const markTourDone = (tourId: TourId): void => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(doneKeyFor(tourId), "1");
};
