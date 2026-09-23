import { useLocation, useNavigate } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { useEffect, useRef } from "react";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { useGuidedTour } from "@/features/tour/hooks/useGuidedTour";
import { TOURS, tourForPathname } from "@/features/tour/registry";
import { getSavedResume, isTourDone } from "@/features/tour/storage";
import type { TourHandoffTarget, TourId } from "@/features/tour/types";
import { useSession } from "@/lib/auth-client";
import type { Role } from "@/lib/rbac";
import "./tour-styles.css";

/**
 * Tur halaman layak auto-start: pengenalan sudah selesai (anti tabrakan),
 * tak ada resume handoff yang menunggu, ada langkah untuk role ini, belum
 * pernah selesai/dismiss, dan belum di-auto sesi ini.
 */
const isPageTourDue = (
    role: Role,
    tourId: TourId,
    autoStarted: Set<TourId>,
): boolean =>
    isTourDone("pengenalan") &&
    getSavedResume() === null &&
    tourId !== "pengenalan" &&
    !autoStarted.has(tourId) &&
    TOURS[tourId].buildSteps(role).length > 0 &&
    !isTourDone(tourId);

/**
 * Tombol bantuan icon-only di header dashboard. Context-aware: menjalankan
 * tur pendek halaman aktif, fallback ke tur
 * pengenalan di halaman lain. Tur pengenalan auto-start sekali; tiap tur
 * per-halaman juga auto-start sekali (kunjungan pertama) setelah pengenalan
 * selesai — dismiss (Esc/backdrop/×) tercatat selesai via markTourDone.
 */
export const TourLauncher = () => {
    const { data: session } = useSession();
    const role = (session?.user as { role?: Role } | undefined)?.role;
    const navigate = useNavigate();
    const pathname = useLocation({
        select: (location) => location.pathname,
    });
    const autoStartedRef = useRef(false);
    const autoPageRef = useRef<Set<TourId>>(new Set());

    const { startTour } = useGuidedTour(role, (to: TourHandoffTarget) => {
        void navigate({ to });
    });

    const candidate = tourForPathname(pathname);
    const activeTourId =
        role && TOURS[candidate].buildSteps(role).length > 0
            ? candidate
            : "pengenalan";

    useEffect(() => {
        if (!role || !pathname) return;
        const saved = getSavedResume();
        if (saved) startTour(saved.tourId, saved.index);
    }, [role, pathname, startTour]);

    useEffect(() => {
        if (!role || autoStartedRef.current) return;
        if (isTourDone("pengenalan") || getSavedResume() !== null) return;
        autoStartedRef.current = true;
        const timer = setTimeout(() => startTour("pengenalan", 0), 800);
        return () => clearTimeout(timer);
    }, [role, startTour]);

    // Auto sekali per tur halaman, dijalankan tiap pindah halaman.
    useEffect(() => {
        if (
            !role ||
            !pathname ||
            !isPageTourDue(role, candidate, autoPageRef.current)
        )
            return;
        autoPageRef.current.add(candidate);
        const timer = setTimeout(() => startTour(candidate, 0), 800);
        return () => clearTimeout(timer);
    }, [role, pathname, candidate, startTour]);

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-tour="tour-help"
            onClick={() => startTour(activeTourId, 0)}
            aria-label={TOURS[activeTourId].title}
            title={TOURS[activeTourId].title}>
            <CircleHelp className="h-4 w-4" />
            <span className="sr-only">{TOURS[activeTourId].title}</span>
        </Button>
    );
};
