import { type Driver, type DriveStep, driver } from "driver.js";
import { useCallback, useEffect, useRef } from "react";
import {
    buildTourSteps,
    clearSavedStepIndex,
    markTourDone,
    saveStepIndex,
} from "@/features/tour/data";
import type { TourHandoffTarget } from "@/features/tour/types";
import type { Role } from "@/lib/rbac";

/**
 * Hook instance driver.js untuk tur dashboard. Membuat instance saat
 * `startTour` dipanggil dan  menghancurkannya saat unmount agar overlay
 * tak tertinggal pindah rute.
 */
export const useGuidedTour = (
    role: Role | undefined,
    onNavigate: (to: TourHandoffTarget) => void,
) => {
    const driverRef = useRef<Driver | null>(null);
    const navigatingRef = useRef(false);
    const unmountingRef = useRef(false);
    const onNavigateRef = useRef(onNavigate);
    onNavigateRef.current = onNavigate;

    /** Hancurkan tur aktif bila ada. */
    const destroyTour = useCallback(() => {
        driverRef.current?.destroy();
        driverRef.current = null;
    }, []);

    /**
     * Mulai tur dari indeks tertentu. Langkah handoff menyimpan indeks
     * berikutnya lalu pindah rute; halaman tujuan melanjutkan via resume.
     */
    const startTour = useCallback(
        (stepIndex = 0) => {
            if (typeof document === "undefined" || !role) return;
            destroyTour();
            const defs = buildTourSteps(role);
            if (defs.length === 0 || stepIndex >= defs.length) return;

            const steps: DriveStep[] = defs.map((def, idx) => ({
                element: def.element,
                waitForElement: def.waitForElement,
                popover: {
                    title: def.title,
                    description: def.description,
                    side: def.side,
                    align: def.align,
                    ...(def.navigateTo
                        ? {
                              onNextClick: (_el, _step, opts) => {
                                  const tour = driverRef.current;
                                  if (!tour || !def.navigateTo) return;
                                  // Sudah di halaman tujuan: lanjut biasa.
                                  if (
                                      window.location.pathname ===
                                      def.navigateTo
                                  ) {
                                      tour.moveNext();
                                      return;
                                  }
                                  navigatingRef.current = true;
                                  saveStepIndex((opts.index ?? idx) + 1);
                                  tour.destroy();
                                  onNavigateRef.current(def.navigateTo);
                              },
                          }
                        : {}),
                },
            }));

            const tour = driver({
                showProgress: true,
                progressText: "Langkah {{current}} dari {{total}}",
                nextBtnText: "Lanjut",
                prevBtnText: "Kembali",
                doneBtnText: "Selesai",
                popoverClass: "nexara-tour",
                allowClose: true,
                smoothScroll: true,
                stagePadding: 8,
                stageRadius: 8,
                skipMissingElement: true,
                onDestroyed: () => {
                    driverRef.current = null;
                    // Handoff / unmount: jangan tandai selesai, simpan resume.
                    if (navigatingRef.current) {
                        navigatingRef.current = false;
                        return;
                    }
                    if (unmountingRef.current) {
                        unmountingRef.current = false;
                        return;
                    }
                    clearSavedStepIndex();
                    markTourDone();
                },
                steps,
            });
            driverRef.current = tour;
            tour.drive(stepIndex);
        },
        [role, destroyTour],
    );

    useEffect(
        () => () => {
            unmountingRef.current = true;
            driverRef.current?.destroy();
            driverRef.current = null;
        },
        [],
    );

    return { startTour, destroyTour };
};
