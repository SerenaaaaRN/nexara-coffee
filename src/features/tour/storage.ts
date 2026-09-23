import type { TourId } from "@/features/tour/types";
import { isKnownTourId } from "./registry";

const LEGACY_DONE_KEY = "nexara-tour-v1-done";
export const TOUR_STEP_KEY = "nexara-tour-step";

export const doneKeyFor = (tourId: TourId): string =>
    `nexara-tour-${tourId}-done`;

export interface SavedResume {
    tourId: TourId;
    index: number;
}

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
