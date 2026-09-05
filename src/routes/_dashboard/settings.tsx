import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsSkeleton } from "@/components/fallbacks/dashboard";
import { SettingsPage } from "@/features/settings/components/settings-page";
import { usersOptions } from "@/features/settings/hooks/useSettingsQueries";

const settingsSearchSchema = z.object({
    section: z
        .enum(["profile", "account", "appearance", "users"])
        .optional()
        .catch("profile"),
});

export const Route = createFileRoute("/_dashboard/settings")({
    validateSearch: settingsSearchSchema,
    loader: async ({ context: { queryClient } }) => {
        const { getSessionFn } = await import("@/lib/auth-utils");
        const session = await getSessionFn();
        if (
            session &&
            (session.user.role === "super_admin" ||
                session.user.role === "branch_manager")
        ) {
            await queryClient.ensureQueryData(usersOptions());
        }
    },
    head: () => ({
        meta: [
            { title: "Settings" },
            {
                name: "description",
                content: "Manage your account settings and preferences.",
            },
        ],
    }),
    component: SettingsPage,
    pendingMs: 0,
    pendingComponent: SettingsSkeleton,
});
