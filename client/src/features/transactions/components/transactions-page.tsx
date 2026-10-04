import { SectionHeader } from "#/components/shared/section-header";
import { TransactionsTable } from "@/features/transactions/components/transactions-table";
import { useSession } from "@/lib/auth-client";
import { can, type Role } from "@/lib/rbac";

export function TransactionsPage() {
    const { data: session } = useSession();
    const role = session?.user.role as Role | undefined;
    const canRefund = role ? can(role, "update", "finance") : false;

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Transactions"
                subtitle="Manage financial transactions and refunds."
            />
            <TransactionsTable canRefund={canRefund} />
        </div>
    );
}
