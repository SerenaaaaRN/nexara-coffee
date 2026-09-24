import { type Driver, type DriveStep, driver } from "driver.js";
import { useCallback, useEffect, useRef } from "react";
import { TOURS } from "@/features/tour/registry";
import {
    clearSavedResume,
    markTourDone,
    saveResume,
} from "@/features/tour/storage";
import type { TourHandoffTarget, TourId } from "@/features/tour/types";
import type { Role } from "@/lib/rbac";

/**
 * Hook instance driver.js untuk tur dashboard.
 *
 */
export const useGuidedTour = (
    role: Role | undefined,
    onNavigate: (to: TourHandoffTarget) => void,
) => {
    const driverRef = useRef<Driver | null>(null);
    const activeTourRef = useRef<TourId>("pengenalan");
    const navigatingRef = useRef(false);
    const unmountingRef = useRef(false);
    const onNavigateRef = useRef(onNavigate);
    onNavigateRef.current = onNavigate;

    const destroyTour = useCallback(() => {
        driverRef.current?.destroy();
        driverRef.current = null;
    }, []);

    /**
     * Mulai tur dari registry berdasarkan id. Langkah handoff menyimpan
     * resume (tourId + indeks berikut) lalu pindah rute; halaman tujuan
     * melanjutkan via resume.
     */
    const startTour = useCallback(
        (tourId: TourId, stepIndex = 0) => {
            if (typeof document === "undefined" || !role) return;
            destroyTour();
            const defs = TOURS[tourId].buildSteps(role);
            if (defs.length === 0 || stepIndex >= defs.length) return;
            activeTourRef.current = tourId;

            const steps: DriveStep[] = defs.map((def, idx) => ({
                element: def.element,
                waitForElement: def.waitForElement,
                advanceOnClick: def.advanceOnClick,
                popover: {
                    title: def.title,
                    description: def.description,
                    side: def.side,
                    align: def.align,
                    nextBtnText: idx < defs.length - 1 ? "Lanjut" : undefined,
                    ...(def.navigateTo
                        ? {
                              onNextClick: (_el, _step, opts) => {
                                  const tour = driverRef.current;
                                  if (!tour || !def.navigateTo) return;
                                  if (
                                      window.location.pathname ===
                                      def.navigateTo
                                  ) {
                                      tour.moveNext();
                                      return;
                                  }
                                  navigatingRef.current = true;
                                  saveResume(tourId, (opts.index ?? idx) + 1);
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
                smoothScroll: false,
                stagePadding: 8,
                stageRadius: 8,
                skipMissingElement: true,
                onDestroyed: () => {
                    driverRef.current = null;
                    if (navigatingRef.current) {
                        navigatingRef.current = false;
                        return;
                    }
                    if (unmountingRef.current) {
                        unmountingRef.current = false;
                        return;
                    }
                    clearSavedResume();
                    markTourDone(activeTourRef.current);
                    if (activeTourRef.current === "pengenalan") {
                        markTourDone("overview");
                        markTourDone("orders");
                        markTourDone("kasir");
                    }
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
