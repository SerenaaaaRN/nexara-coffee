import { SectionHeader } from "#/components/shared/section-header";
import { PayoutsTable } from "@/features/payouts/components/payouts-table";
import { useSession } from "@/lib/auth-client";
import { can, type Role } from "@/lib/rbac";

export function PayoutsPage() {
    const { data: session } = useSession();
    const role = session?.user.role as Role | undefined;
    const canApprove = role ? can(role, "approve", "payouts") : false;

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Payouts"
                subtitle="Manage franchise owner payout requests."
            />
            <PayoutsTable canApprove={canApprove} />
        </div>
    );
}
