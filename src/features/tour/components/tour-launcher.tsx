import { useLocation, useNavigate } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { useEffect, useRef } from "react";
import "driver.js/dist/driver.css";
import { Button } from "@/components/ui/button";
import { getSavedStepIndex, isTourDone } from "@/features/tour/data";
import { useGuidedTour } from "@/features/tour/hooks/useGuidedTour";
import type { TourHandoffTarget } from "@/features/tour/types";
import { useSession } from "@/lib/auth-client";
import type { Role } from "@/lib/rbac";
import "./tour-styles.css";

/**
 * Tombol bantuan icon-only di header dashboard + auto-start tur sekali
 * untuk semua role staff. Dipasang sekali di layout agar hidup lintas rute
 * dan bisa melanjutkan tur handoff antar-halaman.
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

    // Resume handoff antar-halaman: sengaja bergantung pada pathname agar
    // berjalan ulang setiap navigasi.
    useEffect(() => {
        if (!role || !pathname) return;
        const saved = getSavedStepIndex();
        if (saved !== null) startTour(saved);
    }, [role, pathname, startTour]);

    // Auto-start sekali per sesi bila belum pernah tur.
    useEffect(() => {
        if (!role || autoStartedRef.current) return;
        if (isTourDone() || getSavedStepIndex() !== null) return;
        autoStartedRef.current = true;
        const timer = setTimeout(() => startTour(0), 800);
        return () => clearTimeout(timer);
    }, [role, startTour]);

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-tour="tour-help"
            onClick={() => startTour(0)}
            aria-label="Panduan"
            title="Panduan">
            <CircleHelp className="h-4 w-4" />
            <span className="sr-only">Panduan</span>
        </Button>
    );
};
