import { useDeferredValue } from "react";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";
import { useLookupCustomerByPhone } from "@/features/customers/hooks/useCustomerQueries";
import { normalizePhone } from "@/features/customers/types";
import { cn } from "@/utils/cn";
import { formatLabel } from "@/utils/format";

type MemberCheckStatusProps = {
    phone: string;
};

/**
 * Status verifikasi member di dialog Charge POS. Mengecek otomatis
 * (deferred value) setelah digit HP sepanjang nomor valid.
 */
export const MemberCheckStatus = ({ phone }: MemberCheckStatusProps) => {
    const deferredPhone = useDeferredValue(phone);
    const digits = normalizePhone(deferredPhone);
    const lookup = useLookupCustomerByPhone(digits);

    if (digits === "") return null;

    if (digits.length < 9) return null;

    if (lookup.isPending || lookup.isFetching) {
        return (
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Mengecek nomor...
            </div>
        );
    }

    if (!lookup.data || !lookup.data.success) {
        return (
            <div className="flex items-center gap-2 rounded-md border border-destructive/30 px-3 py-2 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" />
                Gagal mengecek nomor, coba lagi.
            </div>
        );
    }

    if (!lookup.data.data) {
        return (
            <div
                className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                    "border-amber-500/40 text-amber-700 dark:text-amber-400",
                )}>
                <CircleAlert className="size-4 shrink-0" />
                Nomor belum terdaftar — order dicatat tanpa poin member.
            </div>
        );
    }

    const customer = lookup.data.data;
    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
            )}>
            <CircleCheck className="size-4 shrink-0" />
            {customer.fullName} · {formatLabel(customer.loyaltyTier)} ·{" "}
            {customer.loyaltyPoints} poin
        </div>
    );
};
