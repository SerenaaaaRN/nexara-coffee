import { createServerFn } from "@tanstack/react-start";

export const getSessionFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { getRequest } = await import("@tanstack/react-start/server");
        const { auth } = await import("./auth");
        const request = getRequest();
        return auth.api.getSession({ headers: request.headers });
    },
);

export const loadDashboardFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { getRequest } = await import("@tanstack/react-start/server");
        const { auth } = await import("./auth");
        const request = getRequest();
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session) throw new Error("Unauthorized");

        const role = session.user.role as string;
        const isSuperAdmin = role === "super_admin";

        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
        const ids = await getAccessibleBranchIds(session.user.id, role);

        const { supabaseAdmin } = await import("@database/server");

        let branchList: { id: string; name: string }[] = [];
        if (ids === null || ids.length > 0) {
            let branchQuery = supabaseAdmin
                .from("branches")
                .select("id, name")
                .order("name");
            if (ids !== null) branchQuery = branchQuery.in("id", ids);
            const { data, error } = await branchQuery;
            if (error) throw new Error(error.message);
            branchList = data ?? [];
        }

        const defaultBranchId =
            ids === null ? null : (branchList[0]?.id ?? null);
        return { session, isSuperAdmin, branchList, defaultBranchId };
    },
);
