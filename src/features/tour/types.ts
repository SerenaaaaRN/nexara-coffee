import type { Alignment, Side } from "driver.js";
import type { Role } from "@/lib/rbac";

/** 7 grup langkah tur Fase 1: intro → shell → header → overview → orders → kasir → outro. */
export type TourGroup =
    | "intro"
    | "shell"
    | "header"
    | "overview"
    | "orders"
    | "kasir"
    | "outro";

/** Rute tujuan untuk langkah handoff antar-halaman (tur resumable). */
export type TourHandoffTarget = "/orders" | "/kasir";

export interface TourStepDef {
    id: string;
    group: TourGroup;
    /** Selector anchor `[data-tour="..."]`. Kosong = popover terpusat (intro/outro). */
    element?: string;
    title: string;
    description: string;
    side?: Side;
    align?: Alignment;
    /** Tunggu anchor async (chart/tabel) muncul sebelum highlight. */
    waitForElement?: number;
    /** Jika diisi, tombol Lanjut menyimpan progres + pindah ke rute ini. */
    navigateTo?: TourHandoffTarget;
    /** Filter per role. Undefined = semua role staff. */
    visibleFor?: (role: Role) => boolean;
}

/** Id tur: satu tur pengenalan multi-halaman + satu tur pendek per halaman. */
export type TourId = "pengenalan" | "overview" | "orders" | "kasir";

export interface TourDef {
    id: TourId;
    /** Judul untuk tooltip tombol Help yang context-aware. */
    title: string;
    /** Susun langkah sesuai izin role (langkah terlarang dibuang). */
    buildSteps: (role: Role) => TourStepDef[];
}
