import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { CircleDollarSign, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyDescription,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { useBranches } from "@/features/branches/hooks/useBranchQueries";
import { KasirDetailDialog } from "@/features/kasir/components/kasir-detail-dialog";
import { KasirFormDialog } from "@/features/kasir/components/kasir-form-dialog";
import { KasirTable } from "@/features/kasir/components/kasir-table";
import {
    useApproveSetoran,
    useDeleteSetoran,
    useRejectSetoran,
} from "@/features/kasir/hooks/useKasirMutations";
import { useSetorans } from "@/features/kasir/hooks/useKasirQueries";
import { useKasirTable } from "@/features/kasir/hooks/useKasirTable";
import type { SetoranRow } from "@/features/kasir/types";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { useSession } from "@/lib/auth-client";
import { can, type Role } from "@/lib/rbac";

const routeApi = getRouteApi("/_dashboard/kasir");

const KasirContent = () => {
    const { branch, view } = routeApi.useSearch();
    const navigate = useNavigate();
    const { data: session } = useSession();
    const { data: response } = useSetorans(branch);

    const setorans = response.success ? response.data : [];
    const [detailTarget, setDetailTarget] = useState<SetoranRow | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const approve = useConfirmAction<{
        id: string;
        action: "approve" | "reject";
    }>();
    const deleteAction = useConfirmAction<string>();

    const approveMutation = useApproveSetoran();
    const rejectMutation = useRejectSetoran();
    const deleteMutation = useDeleteSetoran();

    const { data: branchRes } = useBranches();
    const branches = branchRes?.success ? branchRes.data : [];
    const effectiveBranchId = branch || branches[0]?.id;

    const role = session?.user?.role as Role | undefined;
    const currentUserId = session?.user?.id ?? "";
    const canApprove = role ? can(role, "approve", "setoran") : false;

    const onViewChange = useCallback(
        (v: "table" | "board") => {
            navigate({
                to: ".",
                search: (prev) => ({ ...prev, view: v }),
                replace: true,
            });
        },
        [navigate],
    );

    async function handleApproveReject() {
        if (!approve.target) return;
        const mutation =
            approve.target.action === "approve"
                ? approveMutation
                : rejectMutation;
        const res = await mutation
            .mutateAsync({ id: approve.target.id, formData: {} })
            .catch(() => null);
        if (res?.success) {
            toast.success(
                approve.target.action === "approve"
                    ? "Setoran approved"
                    : "Setoran rejected",
            );
        } else {
            toast.error(res?.error ?? "Failed to update setoran");
        }
        approve.clearTarget();
    }

    async function handleDelete() {
        if (!deleteAction.target) return;
        const id = deleteAction.target;
        deleteAction.clearTarget();
        const res = await deleteMutation.mutateAsync(id).catch(() => null);
        if (res?.success) {
            toast.success("Setoran deleted");
        } else {
            toast.error(res?.error ?? "Failed to delete");
        }
    }

    const handleApproveRejectCb = useCallback(
        (id: string, action: "approve" | "reject") =>
            approve.setTarget({ id, action }),
        [approve],
    );
    const handleDeleteCb = useCallback(
        (id: string) => deleteAction.setTarget(id),
        [deleteAction],
    );

    const { table, tableState, filterConfigs, searchPlaceholder } =
        useKasirTable(setorans, {
            canApprove,
            currentUserId,
            onApproveReject: handleApproveRejectCb,
            onDelete: handleDeleteCb,
        });

    const canRecord =
        !!effectiveBranchId && (role ? can(role, "create", "setoran") : false);

    return (
        <div className="flex flex-col gap-4" data-tour="kasir-content">
            {setorans.length === 0 ? (
                <>
                    <div className="flex justify-end">
                        <Button
                            onClick={() => setCreateOpen(true)}
                            disabled={!canRecord}
                            data-tour="kasir-record">
                            <Plus data-icon="inline-start" /> Record Setoran
                        </Button>
                    </div>
                    <Empty>
                        <EmptyMedia variant="icon">
                            <CircleDollarSign />
                        </EmptyMedia>
                        <EmptyTitle>No setorans yet</EmptyTitle>
                        <EmptyDescription>
                            Record your first cash deposit to get started.
                        </EmptyDescription>
                    </Empty>
                </>
            ) : (
                <KasirTable
                    table={table}
                    tableState={tableState}
                    filterConfigs={filterConfigs}
                    searchPlaceholder={searchPlaceholder}
                    view={view ?? "table"}
                    onViewChange={onViewChange}
                    onRecord={() => setCreateOpen(true)}
                    canRecord={canRecord}
                    onRowClick={setDetailTarget}
                    canApprove={canApprove}
                    allSetorans={setorans}
                />
            )}

            <KasirDetailDialog
                setoran={detailTarget}
                open={!!detailTarget}
                onOpenChange={(open) => {
                    if (!open) setDetailTarget(null);
                }}
                canApprove={canApprove}
            />

            {effectiveBranchId && (
                <KasirFormDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    branchId={effectiveBranchId}
                    onSuccess={() => setCreateOpen(false)}
                />
            )}

            <ConfirmDialog
                {...approve.dialogProps}
                title={
                    approve.target?.action === "approve"
                        ? "Approve setoran?"
                        : "Reject setoran?"
                }
                description={
                    approve.target?.action === "approve"
                        ? "Are you sure you want to approve this setoran?"
                        : "Are you sure you want to reject this setoran?"
                }
                confirmLabel={
                    approve.target?.action === "approve" ? "Approve" : "Reject"
                }
                variant={
                    approve.target?.action === "approve"
                        ? "default"
                        : "destructive"
                }
                onConfirm={handleApproveReject}
            />

            <ConfirmDialog
                {...deleteAction.dialogProps}
                title="Delete setoran?"
                description="This action cannot be undone. Only pending setoran can be deleted."
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </div>
    );
};

export const KasirPage = () => {
    return (
        <div className="space-y-6">
            <SectionHeader
                title="Kasir & Setoran"
                subtitle="Manage daily cash deposits from branches."
            />
            <KasirContent />
        </div>
    );
};
