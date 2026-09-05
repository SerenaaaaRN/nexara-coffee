import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { KasirSkeleton } from "@/components/fallbacks/dashboard";
import { branchesOptions } from "@/features/branches/hooks/useBranchQueries";
import { KasirPage } from "@/features/kasir/components/kasir-page";
import { setoransOptions } from "@/features/kasir/hooks/useKasirQueries";
import { requireAccessRSC } from "@/lib/with-auth.server";

const kasirSearchSchema = z.object({
    branch: z.string().optional(),
    view: z.enum(["table", "board"]).optional().catch("table"),
});

export const Route = createFileRoute("/_dashboard/kasir")({
    beforeLoad: () => requireAccessRSC("read", "setoran"),
    validateSearch: kasirSearchSchema,
    loaderDeps: ({ search: { branch } }) => ({ branch }),
    loader: async ({ context: { queryClient }, deps }) => {
        await Promise.all([
            queryClient.ensureQueryData(setoransOptions(deps.branch)),
            queryClient.ensureQueryData(branchesOptions()),
        ]);
    },
    head: () => ({
        meta: [
            { title: "Kasir & Setoran" },
            {
                name: "description",
                content: "Manage daily cash deposits (setoran) from branches.",
            },
        ],
    }),
    component: KasirPage,
    pendingMs: 0,
    pendingComponent: KasirSkeleton,
});
