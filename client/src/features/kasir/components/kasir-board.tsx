import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    Kanban,
    KanbanBoard,
    KanbanColumn,
    KanbanColumnContent,
    KanbanItem,
    KanbanItemHandle,
    type KanbanMoveEvent,
    KanbanOverlay,
} from "@/components/shared/kanban";
import { Badge } from "@/components/ui/badge";
import { KASIR_STATUS_ICONS, KASIR_STATUSES } from "@/features/kasir/data";
import {
    useApproveSetoran,
    useRejectSetoran,
} from "@/features/kasir/hooks/useKasirMutations";
import type { SetoranRow } from "@/features/kasir/types";
import { capitalize, formatCurrency, formatDate } from "@/utils/format";
import { groupByStatus } from "@/utils/group-by";
import { getBadgeVariant } from "@/utils/status";

interface Props {
    setorans: SetoranRow[];
    canApprove: boolean;
    onSelectSetoran: (setoran: SetoranRow) => void;
}

export const KasirBoard = ({
    setorans: allSetorans,
    canApprove,
    onSelectSetoran,
}: Props) => {
    const initialColumns = useMemo(
        () => groupByStatus(allSetorans, KASIR_STATUSES),
        [allSetorans],
    );
    const [columns, setColumns] = useState<Record<string, SetoranRow[]>>(
        () => initialColumns,
    );

    const approveMutation = useApproveSetoran();
    const rejectMutation = useRejectSetoran();

    useEffect(() => {
        setColumns(groupByStatus(allSetorans, KASIR_STATUSES));
    }, [allSetorans]);

    function handleMove(e: KanbanMoveEvent) {
        if (e.activeContainer === e.overContainer) return;
        const setId = e.event.active.id as string;
        const newStatus = e.overContainer as (typeof KASIR_STATUSES)[number];

        if (newStatus === "pending") return;
        if (approveMutation.isPending || rejectMutation.isPending) return;

        // Find moved item to verify it was pending
        const movedItem = allSetorans.find((s) => s.id === setId);
        if (!movedItem || movedItem.status !== "pending") return;

        const prevSnapshot = columns;
        setColumns((prev) => {
            const next: Record<string, SetoranRow[]> = {};
            for (const s of KASIR_STATUSES) next[s] = [...prev[s]];
            let moved: SetoranRow | undefined;
            for (const s of KASIR_STATUSES) {
                const idx = next[s].findIndex((o) => o.id === setId);
                if (idx !== -1) {
                    [moved] = next[s].splice(idx, 1);
                    break;
                }
            }
            if (moved) next[newStatus].splice(e.overIndex, 0, moved);
            return next;
        });

        const mutation =
            newStatus === "approved"
                ? approveMutation
                : newStatus === "rejected"
                  ? rejectMutation
                  : null;
        if (!mutation) {
            setColumns(prevSnapshot);
            return;
        }
        mutation
            .mutateAsync({ id: setId, formData: {} })
            .then((res) => {
                if (!res.success) {
                    setColumns(prevSnapshot);
                    toast.error(res.error ?? "Failed to update setoran");
                } else {
                    toast.success(
                        newStatus === "approved"
                            ? "Setoran approved"
                            : "Setoran rejected",
                    );
                }
            })
            .catch((err) => {
                setColumns(prevSnapshot);
                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Failed to update setoran",
                );
            });
    }

    return (
        <Kanban
            value={columns}
            onValueChange={setColumns}
            getItemValue={(o) => o.id}
            onMove={handleMove}>
            <KanbanBoard className="grid-cols-3 h-[calc(100vh-20rem)]">
                {KASIR_STATUSES.map((colId) => {
                    const items = columns[colId] ?? [];
                    const Icon = KASIR_STATUS_ICONS[colId];
                    return (
                        <KanbanColumn
                            key={colId}
                            value={colId}
                            disabled={!canApprove}>
                            <div className="bg-card flex h-full flex-col rounded-lg border">
                                <div className="flex items-center gap-2 border-b px-4 py-3">
                                    <Icon className="text-muted-foreground size-4" />
                                    <span className="text-sm font-medium capitalize">
                                        {colId}
                                    </span>
                                    <Badge
                                        variant={getBadgeVariant(colId)}
                                        className="ml-auto">
                                        {items.length}
                                    </Badge>
                                </div>
                                <KanbanColumnContent
                                    value={colId}
                                    className="flex-1 gap-2 overflow-y-auto p-3">
                                    {items.map((setoran) => (
                                        <KanbanItem
                                            key={setoran.id}
                                            value={setoran.id}
                                            disabled={
                                                !canApprove ||
                                                setoran.status !== "pending"
                                            }>
                                            <KanbanItemHandle>
                                                <button
                                                    type="button"
                                                    className="bg-muted/50 hover:bg-muted w-full cursor-pointer rounded-md border p-3 text-left transition-colors"
                                                    onClick={() =>
                                                        onSelectSetoran(setoran)
                                                    }>
                                                    <div className="mb-1.5 flex items-start justify-between">
                                                        <p className="text-sm font-medium">
                                                            {formatCurrency(
                                                                setoran.amount,
                                                            )}
                                                        </p>
                                                        <Badge
                                                            variant={getBadgeVariant(
                                                                setoran.status,
                                                            )}>
                                                            {capitalize(
                                                                setoran.status,
                                                            )}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground text-xs">
                                                            {setoran.cashierName ??
                                                                "—"}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        {setoran.branchName} ·{" "}
                                                        {formatDate(
                                                            setoran.date,
                                                        )}
                                                    </div>
                                                </button>
                                            </KanbanItemHandle>
                                        </KanbanItem>
                                    ))}
                                    {items.length === 0 && (
                                        <div className="text-muted-foreground flex items-center justify-center py-8 text-xs">
                                            No setorans
                                        </div>
                                    )}
                                </KanbanColumnContent>
                            </div>
                        </KanbanColumn>
                    );
                })}
            </KanbanBoard>
            <KanbanOverlay className="bg-muted/10 rounded-md border-2 border-dashed" />
        </Kanban>
    );
};
