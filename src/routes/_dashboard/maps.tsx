import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MapsSkeleton } from "@/components/fallbacks/dashboard";
import { ErrorPage } from "@/components/fallbacks/error-page";
import { MapsPage } from "@/features/maps/components/maps-page";
import { mapBranchesOptions } from "@/features/maps/hooks/useMapsQueries";

const mapsSearchSchema = z.object({
    q: z.string().optional(),
});

export const Route = createFileRoute("/_dashboard/maps")({
    validateSearch: mapsSearchSchema,
    loader: async ({ context: { queryClient } }) => {
        await queryClient.ensureQueryData(mapBranchesOptions());
    },
    component: MapsPage,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
    pendingMs: 0,
    pendingComponent: MapsSkeleton,
});
