import {
    queryOptions,
    useQuery,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { SetoranJoined, SetoranRow } from "@/features/kasir/types";
import { kasirKeys } from "@/features/query-keys";

const toSetoranRow = (r: SetoranJoined): SetoranRow => {
    return {
        id: r.id,
        branchId: r.branch_id,
        cashierId: r.cashier_id,
        amount: r.amount,
        date: r.date,
        status: r.status,
        verifiedBy: r.verified_by,
        notes: r.notes,
        createdAt: r.created_at,
        branchName: r.branches?.name ?? null,
        cashierName: r.cashier?.name ?? null,
        verifiedByName: r.verified_by_user?.name ?? null,
    };
};

/**
 * Menghitung total transaksi POS per metode pembayaran untuk hari tertentu.
 * Data ini dipakai sebagai referensi saat cashier input setoran dan saat approver review.
 * @param data Objek berisi branchId, date (YYYY-MM-DD)
 * @returns ExpectedCash { cashTotal, qrisTotal, debitTotal, creditTotal, total }
 */
export const getExpectedCashFn = createServerFn({ method: "GET" })
    .validator((data: { branchId: string; date: string }) => data)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "finance");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );
        if (ids !== null && !ids.includes(data.branchId)) {
            return { success: false as const, error: "Forbidden" };
        }

        const { supabaseAdmin } = await import("@database/server");

        // Range query instead of DATE() to leverage index on createdAt / branchId
        const startDate = new Date(`${data.date}T00:00:00.000Z`);
        const endDate = new Date(startDate);
        endDate.setUTCDate(endDate.getUTCDate() + 1);

        const { data: rows, error } = await supabaseAdmin
            .from("transactions")
            .select("payment_method, amount")
            .eq("branch_id", data.branchId)
            .gte("created_at", startDate.toISOString())
            .lt("created_at", endDate.toISOString());

        if (error) return { success: false as const, error: error.message };

        const result = { cash: 0, qris: 0, debit: 0, credit: 0 };
        for (const r of rows ?? []) {
            if (r.payment_method in result) {
                result[r.payment_method as keyof typeof result] += Number(
                    r.amount,
                );
            }
        }

        return {
            success: true as const,
            data: {
                cashTotal: result.cash,
                qrisTotal: result.qris,
                debitTotal: result.debit,
                creditTotal: result.credit,
                total: result.cash + result.qris + result.debit + result.credit,
            },
        };
    });

export const useExpectedCash = (
    branchId: string,
    date: string,
    opts?: { enabled?: boolean },
) =>
    useQuery({
        queryKey: kasirKeys.expectedCash(branchId, date),
        queryFn: () => getExpectedCashFn({ data: { branchId, date } }),
        staleTime: 0,
        enabled: opts?.enabled ?? (!!branchId && !!date),
    });

/**
 * Mengambil data setoran harian beserta nama branch, cashier, dan verifier.
 * @param data Objek berisi branch (opsional) untuk filter
 * @returns Daftar setoran yang sudah difilter
 */
export const getSetoransFn = createServerFn({ method: "GET" })
    .validator(
        (data: { branch?: string | null; limit?: number } | undefined) => data,
    )
    .handler(async ({ data }) => {
        const branch = data?.branch;
        const limit = data?.limit ?? 300;
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "setoran");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );
        const branchId = branch ?? null;

        const { supabaseAdmin } = await import("@database/server");

        let setoransQuery = supabaseAdmin
            .from("daily_setorans")
            .select(
                "id, branch_id, cashier_id, amount, date, status, verified_by, notes, created_at, branches!daily_setorans_branch_id_branches_id_fk(id, name), cashier:user!daily_setorans_cashier_id_user_id_fk(id, name), verified_by_user:user!daily_setorans_verified_by_user_id_fk(id, name)",
            )
            .order("created_at", { ascending: false })
            .limit(limit);

        if (branchId) {
            setoransQuery = setoransQuery.eq("branch_id", branchId);
        } else if (ids !== null) {
            if (ids.length === 0) {
                return {
                    success: true as const,
                    data: [] satisfies SetoranRow[],
                };
            }
            setoransQuery = setoransQuery.in("branch_id", ids);
        }

        const { data: rows, error } = await setoransQuery;
        if (error) return { success: false as const, error: error.message };

        const list: SetoranRow[] = (
            (rows ?? []) as unknown as SetoranJoined[]
        ).map(toSetoranRow);
        return { success: true as const, data: list satisfies SetoranRow[] };
    });

export const setoransOptions = (branch?: string | null) =>
    queryOptions({
        queryKey: branch ? kasirKeys.list({ branch }) : kasirKeys.lists(),
        queryFn: () => getSetoransFn({ data: { branch } }),
        staleTime: 0,
    });

/** @see {@link getSetoransFn} */
export const useSetorans = (branch?: string | null) =>
    useSuspenseQuery(setoransOptions(branch));
