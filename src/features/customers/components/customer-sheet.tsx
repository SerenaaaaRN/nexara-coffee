import { Edit, Loader2, Mail, Phone, Star, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { CustomerFormDialog } from "@/features/customers/components/customer-form-dialog";
import { useCustomerSheet } from "@/features/customers/hooks/useCustomerSheet";
import type { CustomerRow, LoyaltyTier } from "@/features/customers/types";
import {
    getAvatarColor,
    getInitials,
    TIER_COLORS,
} from "@/features/customers/utils";
import { cn } from "@/utils/cn";
import { formatDate, formatLabel } from "@/utils/format";

type CustomerSheetProps = {
    customer: CustomerRow;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const CustomerSheet = ({
    customer,
    open,
    onOpenChange,
}: CustomerSheetProps) => {
    const {
        editingPoints,
        pointsValue,
        setPointsValue,
        editOpen,
        setEditOpen,
        deleteTarget,
        setDeleteTarget,
        updateLoyaltyPending,
        startEditingPoints,
        handlePointsSave,
        handlePointsKeyDown,
        handleDelete,
    } = useCustomerSheet(customer, onOpenChange);

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Customer Detail</SheetTitle>
                    </SheetHeader>

                    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4 scrollbar-gutter-stable">
                        {/* Avatar + Name + Badges */}
                        <div className="flex flex-col items-center gap-3 pt-2">
                            <div
                                className={cn(
                                    "flex size-16 items-center justify-center rounded-full text-xl font-bold",
                                    getAvatarColor(customer.fullName),
                                )}>
                                {getInitials(customer.fullName)}
                            </div>
                            <div className="text-center">
                                <h2 className="text-lg font-semibold">
                                    {customer.fullName}
                                </h2>
                                <div className="mt-1 flex items-center justify-center gap-1.5">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "h-5 gap-0.5 border-0 px-1.5 text-[10px] font-medium",
                                            TIER_COLORS[
                                                customer.loyaltyTier as LoyaltyTier
                                            ] ?? TIER_COLORS.bronze,
                                        )}>
                                        <Star className="size-2.5" />
                                        {formatLabel(customer.loyaltyTier)}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="h-5 px-1.5 text-[10px] font-medium capitalize">
                                        {formatLabel(customer.segment)}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <section>
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Contact
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2">
                                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="text-sm">
                                        {customer.email ?? (
                                            <span className="text-muted-foreground italic">
                                                No email
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2">
                                    <Phone className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="text-sm">
                                        {customer.phone ?? (
                                            <span className="text-muted-foreground italic">
                                                No phone
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Loyalty */}
                        <section>
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Loyalty
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                                    <span className="text-sm text-muted-foreground">
                                        Points
                                    </span>
                                    {editingPoints ? (
                                        <div className="flex items-center gap-1.5">
                                            <Input
                                                type="number"
                                                min={0}
                                                value={pointsValue}
                                                onChange={(e) =>
                                                    setPointsValue(
                                                        e.target.value,
                                                    )
                                                }
                                                onKeyDown={handlePointsKeyDown}
                                                className="h-7 w-24 text-right text-sm"
                                                autoFocus
                                            />
                                            <Button
                                                size="icon-sm"
                                                variant="ghost"
                                                onClick={handlePointsSave}
                                                disabled={updateLoyaltyPending}>
                                                {updateLoyaltyPending ? (
                                                    <Loader2 className="size-3 animate-spin" />
                                                ) : (
                                                    <span className="text-xs font-medium">
                                                        Save
                                                    </span>
                                                )}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium tabular-nums">
                                                {customer.loyaltyPoints.toLocaleString(
                                                    "id-ID",
                                                )}
                                            </span>
                                            <Button
                                                size="icon-sm"
                                                variant="ghost"
                                                onClick={startEditingPoints}>
                                                <Edit className="size-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                                    <span className="text-sm text-muted-foreground">
                                        Tier
                                    </span>
                                    <span className="text-sm font-medium capitalize">
                                        {formatLabel(customer.loyaltyTier)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                                    <span className="text-sm text-muted-foreground">
                                        Segment
                                    </span>
                                    <span className="text-sm font-medium capitalize">
                                        {formatLabel(customer.segment)}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Activity */}
                        <section>
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Activity
                            </h3>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="size-4" />
                                        Total Orders
                                    </span>
                                    <span className="text-sm font-medium">
                                        {customer.orderCount}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                                    <span className="text-sm text-muted-foreground">
                                        Member Since
                                    </span>
                                    <span className="text-sm font-medium">
                                        {formatDate(customer.createdAt, {
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-t p-4">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setEditOpen(true)}>
                            <Edit className="size-4" />
                            Edit Customer
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setDeleteTarget(true)}>
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            <CustomerFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                customer={customer}
                onSuccess={() => {
                    setEditOpen(false);
                }}
            />

            <Sheet open={deleteTarget} onOpenChange={setDeleteTarget}>
                <SheetContent side="right" className="w-full sm:max-w-sm">
                    <SheetHeader>
                        <SheetTitle>Remove customer?</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 p-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to remove{" "}
                            <strong>{customer.fullName}</strong>? This action
                            cannot be undone.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setDeleteTarget(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={handleDelete}>
                                Remove
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};
