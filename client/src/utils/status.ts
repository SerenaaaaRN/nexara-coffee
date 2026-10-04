type BadgeVariant =
    | "default"
    | "secondary"
    | "destructive"
    | "success"
    | "outline"
    | "bronze"
    | "silver"
    | "gold"
    | "platinum"
    | "ghost"
    | "link";

const STATUS_CONFIG = {
    pending: { variant: "secondary", label: "Pending" },
    confirmed: { variant: "default", label: "Confirmed" },
    preparing: { variant: "secondary", label: "Preparing" },
    completed: { variant: "success", label: "Completed" },
    cancelled: { variant: "destructive", label: "Cancelled" },
    approved: { variant: "success", label: "Approved" },
    rejected: { variant: "destructive", label: "Rejected" },
    active: { variant: "success", label: "Active" },
    inactive: { variant: "destructive", label: "Inactive" },
    maintenance: { variant: "secondary", label: "Maintenance" },
    paid: { variant: "success", label: "Paid" },
    refunded: { variant: "destructive", label: "Refunded" },
    available: { variant: "success", label: "Available" },
    hidden: { variant: "secondary", label: "Hidden" },
} as const;

export function getBadgeVariant(s: string): BadgeVariant {
    return (
        (
            STATUS_CONFIG as Record<
                string,
                { variant: BadgeVariant; label: string }
            >
        )[s]?.variant ?? "secondary"
    );
}

export function getStatusLabel(s: string): string {
    return (
        (
            STATUS_CONFIG as Record<
                string,
                { variant: BadgeVariant; label: string }
            >
        )[s]?.label ?? s
    );
}
