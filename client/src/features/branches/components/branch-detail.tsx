import { Link } from "@tanstack/react-router";
import {
    Building2,
    Calendar,
    ExternalLink,
    MapPin,
    Phone,
    Store,
    Timer,
    User,
    Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BranchFormDialog } from "@/features/branches/components/branch-form-dialog";
import type { BranchRow, CreateBranchInput } from "@/features/branches/types";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { formatDate, formatLabel } from "@/utils/format";
import { getBadgeVariant, getStatusLabel } from "@/utils/status";

interface BranchDetailProps {
    branch: BranchRow;
    onDelete: (id: string) => Promise<void>;
    onEdit: (data: CreateBranchInput) => Promise<void>;
}

export const BranchDetail = ({
    branch,
    onDelete,
    onEdit,
}: BranchDetailProps) => {
    const [editOpen, setEditOpen] = useState(false);
    const { setTarget: setDeleteTarget, dialogProps } = useConfirmAction();

    const mapsUrl = useMemo(
        () =>
            branch.lat && branch.lng
                ? `https://www.google.com/maps?q=${branch.lat},${branch.lng}`
                : null,
        [branch.lat, branch.lng],
    );

    const hours = useMemo(
        () =>
            branch.openingTime && branch.closingTime
                ? `${branch.openingTime.slice(0, 5)} - ${branch.closingTime.slice(0, 5)}`
                : null,
        [branch.openingTime, branch.closingTime],
    );

    const handleDelete = async () => {
        try {
            await onDelete(branch.id);
            toast.success("Branch deleted");
        } catch {
            toast.error("Failed to delete branch");
        }
    };

    return (
        <>
            <div className="flex w-full flex-col gap-6 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold tracking-tight">
                                {branch.name}
                            </h2>
                            <Badge variant={getBadgeVariant(branch.status)}>
                                {getStatusLabel(branch.status)}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {formatLabel(branch.ownershipType)}
                        </p>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditOpen(true)}>
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteTarget(branch.id)}>
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">
                                Address
                            </p>
                            <p className="text-sm">{branch.address}</p>
                            {mapsUrl ? (
                                <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                    Open in Maps
                                    <ExternalLink className="size-3" />
                                </a>
                            ) : (
                                <p className="mt-0.5 text-xs text-transparent">
                                    No maps link
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Phone
                            </p>
                            <p className="text-sm">{branch.phone || "—"}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Timer className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Operating Hours
                            </p>
                            <p className="text-sm min-h-[1.25em]">
                                {hours || "—"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Type
                            </p>
                            <p className="text-sm capitalize">
                                {formatLabel(branch.ownershipType)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Manager
                            </p>
                            <div className="min-h-10 text-sm">
                                {branch.manager ? (
                                    <>
                                        <p>{branch.manager.name}</p>
                                        <a
                                            href={`mailto:${branch.manager.email}`}
                                            className="text-xs text-primary hover:underline">
                                            {branch.manager.email}
                                        </a>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground">
                                        Not assigned
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Employees
                            </p>
                            <p className="text-sm">{branch.employeeCount}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">
                                Created
                            </p>
                            <p className="text-sm">
                                {formatDate(branch.createdAt, {
                                    dateStyle: "long",
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t pt-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        render={
                            <Link to="/orders" search={{ branchId: branch.id }}>
                                <Store /> View Orders
                            </Link>
                        }
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        render={
                            <Link to="/kasir" search={{ branch: branch.id }}>
                                <Timer /> View Setoran
                            </Link>
                        }
                    />
                </div>
            </div>

            <ConfirmDialog
                {...dialogProps}
                title="Delete branch?"
                description={
                    <>
                        Are you sure you want to delete{" "}
                        <strong>{branch.name}</strong>? This action cannot be
                        undone.
                    </>
                }
                confirmLabel="Delete"
                onConfirm={handleDelete}
            />

            <BranchFormDialog
                key={branch.id}
                open={editOpen}
                onOpenChange={setEditOpen}
                branch={branch}
                onSubmit={onEdit}
            />
        </>
    );
};
