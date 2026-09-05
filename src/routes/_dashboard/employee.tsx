import { createFileRoute } from "@tanstack/react-router";
import { EmployeeSkeleton } from "@/components/fallbacks/dashboard";
import { ErrorPage } from "@/components/fallbacks/error-page";
import { EmployeePage } from "@/features/employee/components/employee-page";
import { employeesOptions } from "@/features/employee/hooks/useEmployeeQueries";
import { requireAccessRSC } from "@/lib/with-auth.server";

export const Route = createFileRoute("/_dashboard/employee")({
    beforeLoad: () => requireAccessRSC("read", "employee"),
    loader: async ({ context: { queryClient } }) => {
        await queryClient.ensureQueryData(employeesOptions());
    },
    component: EmployeePage,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
    pendingMs: 0,
    pendingComponent: EmployeeSkeleton,
});
