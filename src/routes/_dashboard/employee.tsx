import { createFileRoute } from "@tanstack/react-router";
import { EmployeeSkeleton } from "@/components/fallbacks/dashboard";

export const Route = createFileRoute("/_dashboard/employee")({
    component: () => <div>Employee Page</div>,
    pendingComponent: EmployeeSkeleton,
});
