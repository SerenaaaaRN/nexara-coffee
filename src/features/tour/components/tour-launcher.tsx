import { useLocation, useNavigate } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { useEffect, useRef } from "react";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import {
    getSavedResume,
    isTourDone,
    TOURS,
    tourForPathname,
} from "@/features/tour/data";
import { useGuidedTour } from "@/features/tour/hooks/useGuidedTour";
import type { TourHandoffTarget } from "@/features/tour/types";
import { useSession } from "@/lib/auth-client";
import type { Role } from "@/lib/rbac";
import "./tour-styles.css";

/**
 * Tombol bantuan icon-only di header dashboard. Context-aware: menjalankan
 * tur pendek halaman aktif, fallback ke tur
 * pengenalan di halaman lain. Tur pengenalan auto-start sekali; tur
 * per-halaman hanya manual agar tak mengganggu.
 */
export const TourLauncher = () => {
    const { data: session } = useSession();
    const role = (session?.user as { role?: Role } | undefined)?.role;
    const navigate = useNavigate();
    const pathname = useLocation({
        select: (location) => location.pathname,
    });
    const autoStartedRef = useRef(false);

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
