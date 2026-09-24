import { createFileRoute } from "@tanstack/react-router";
import { LandingSkeleton } from "@/components/fallbacks/dashboard";
import { ErrorPage } from "@/components/fallbacks/error-page";
import { LandingPage } from "@/features/landing/components/landing-page";
import {
    publicBranchesOptions,
    publicMenuOptions,
    publicReviewsOptions,
} from "@/features/landing/hooks/useLandingQueries";

export const Route = createFileRoute("/")({
    loader: async ({ context: { queryClient } }) => {
        await Promise.all([
            queryClient.ensureQueryData(publicBranchesOptions()),
            queryClient.ensureQueryData(publicMenuOptions()),
            queryClient.ensureQueryData(publicReviewsOptions()),
        ]);
    },
    head: () => ({
        meta: [
            { title: "Nexara Coffee" },
            {
                name: "description",
                content:
                    "Jelajahi menu andalan dan cabang Nexara Coffee terdekat di Palembang.",
            },
        ],
    }),
    component: LandingPage,
    pendingMs: 0,
    pendingComponent: LandingSkeleton,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
});
