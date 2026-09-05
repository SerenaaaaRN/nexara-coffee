import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MenuSkeleton } from "@/components/fallbacks/dashboard";
import { ErrorPage } from "@/components/fallbacks/error-page";
import { MenuPage } from "@/features/menu/components/menu-page";
import {
    menuCategoriesOptions,
    menuItemsOptions,
} from "@/features/menu/hooks/useMenuQueries";
import { requireAccessRSC } from "@/lib/with-auth.server";

const menuSearchSchema = z.object({
    category: z.string().optional(),
});

export const Route = createFileRoute("/_dashboard/menu")({
    beforeLoad: () => requireAccessRSC("read", "menu"),
    validateSearch: menuSearchSchema,
    loader: async ({ context: { queryClient } }) => {
        await Promise.all([
            queryClient.ensureQueryData(menuCategoriesOptions()),
            queryClient.ensureQueryData(menuItemsOptions()),
        ]);
    },
    component: MenuPage,
    pendingMs: 0,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
    pendingComponent: MenuSkeleton,
});
