import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Setoran } from "@/features/kasir/types";
import { kasirKeys } from "@/features/query-keys";
import { approveSetoranSchema, createSetoranSchema } from "../types";

type SetoranDbRow = {
    id: string;
    branch_id: string;
    cashier_id: string;
    amount: string;
    date: string;
    status: string;
    verified_by: string | null;
    notes: string | null;
    created_at: string;
};

function toSetoran(r: SetoranDbRow): Setoran {
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
    };
}

/**
 * Membuat data setoran harian baru.
 * @param data Objek berisi branchId dan formData (amount, date, notes)
 * @returns Data setoran yang baru dibuat
 */
export const createSetoranFn = createServerFn({ method: "POST" })
    .validator(
        z.object({
            branchId: z.string(),
            formData: createSetoranSchema,
        }),
    )
    .handler(async ({ data: { branchId, formData } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("create", "setoran");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        if (ids !== null && !ids.includes(branchId)) {
            return { success: false as const, error: "Forbidden" };
        }

        const { supabaseAdmin } = await import("@database/server");

        const { data: existingRows, error: existingError } = await supabaseAdmin
            .from("daily_setorans")
            .select()
            .eq("branch_id", branchId)
            .eq("date", formData.date)
            .limit(1);

        if (existingError)
            return { success: false as const, error: existingError.message };

        const existing = existingRows?.[0] as SetoranDbRow | undefined;

        let setoran: SetoranDbRow | null = null;
        if (existing) {
            if (existing.status !== "pending") {
                return {
                    success: false as const,
                    error: `Cannot update setoran with status "${existing.status}". Only pending setoran can be edited.`,
                };
            }
            const { data: updated, error } = await supabaseAdmin
                .from("daily_setorans")
                .update({
                    amount: formData.amount.toString(),
                    cashier_id: auth.session.user.id,
                    notes: formData.notes || null,
                })
                .eq("id", existing.id)
                .select()
                .single();
            if (error || !updated)
                return {
                    success: false as const,
                    error: error?.message ?? "Setoran tidak ditemukan",
                };
            setoran = updated;
        } else {
            const { data: inserted, error: insertError } = await supabaseAdmin
                .from("daily_setorans")
                .insert({
                    id: crypto.randomUUID(),
                    branch_id: branchId,
                    cashier_id: auth.session.user.id,
                    amount: formData.amount.toString(),
                    date: formData.date,
                    notes: formData.notes || null,
                })
                .select()
                .single();

            if (insertError) {
                const msg = insertError.message ?? "";
                const isUnique =
                    insertError.code === "23505" ||
                    msg.toLowerCase().includes("unique") ||
                    msg.toLowerCase().includes("duplicate") ||
                    msg.includes("daily_setorans_branch_date_idx");
                if (!isUnique)
                    return {
                        success: false as const,
                        error: insertError.message,
                    };
                // Race: another request inserted same branch+date between SELECT and INSERT
                const { data: retryRows, error: retryError } =
                    await supabaseAdmin
                        .from("daily_setorans")
                        .select()
                        .eq("branch_id", branchId)
                        .eq("date", formData.date)
                        .limit(1);
                const retryExisting = (
                    retryError ? [] : (retryRows ?? [])
                )[0] as SetoranDbRow | undefined;
                if (!retryExisting) {
                    return {
                        success: false as const,
                        error: "Duplicate setoran detected, please retry.",
                    };
                }
                if (retryExisting.status !== "pending") {
                    return {
                        success: false as const,
                        error: `Cannot update setoran with status "${retryExisting.status}". Only pending setoran can be edited.`,
                    };
                }
                const { data: updated, error } = await supabaseAdmin
                    .from("daily_setorans")
                    .update({
                        amount: formData.amount.toString(),
                        cashier_id: auth.session.user.id,
                        notes: formData.notes || null,
                    })
                    .eq("id", retryExisting.id)
                    .select()
                    .single();
                if (error || !updated)
                    return {
                        success: false as const,
                        error: error?.message ?? "Setoran tidak ditemukan",
                    };
                setoran = updated;
            } else {
                setoran = inserted;
            }
        }

        if (!setoran)
            return { success: false as const, error: "Gagal membuat setoran" };

        const { logAudit } = await import("@/lib/audit-log");
        void logAudit({
            actorId: auth.session.user.id,
            action: "create",
            targetTable: "daily_setorans",
            targetId: setoran.id,
            branchId,
            metadata: { amount: formData.amount },
        });

        return { success: true as const, data: toSetoran(setoran) };
    });

/**
 * Menghapus setoran milik sendiri yang masih berstatus pending.
 * @param data Objek berisi id setoran
 * @returns null jika berhasil
 */
export const deleteSetoranFn = createServerFn({ method: "POST" })
    .validator(z.object({ id: z.string() }))
    .handler(async ({ data: { id } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("delete", "setoran");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: setoran, error: fetchError } = await supabaseAdmin
            .from("daily_setorans")
            .select()
            .eq("id", id)
            .maybeSingle();

        if (fetchError || !setoran) {
            return {
                success: false as const,
                error: fetchError?.message ?? "Not found",
            };
        }
        if ((setoran as SetoranDbRow).cashier_id !== auth.session.user.id)
            return { success: false as const, error: "Forbidden" };
        if ((setoran as SetoranDbRow).status !== "pending")
            return {
                success: false as const,
                error: "Can only delete pending setoran",
            };

        const { error } = await supabaseAdmin
            .from("daily_setorans")
            .delete()
            .eq("id", id);
        if (error) return { success: false as const, error: error.message };

        const { logAudit } = await import("@/lib/audit-log");
        void logAudit({
            actorId: auth.session.user.id,
            action: "delete",
            targetTable: "daily_setorans",
            targetId: id,
            branchId: (setoran as SetoranDbRow).branch_id,
        });

        return { success: true as const, data: null };
    });

/**
 * Menyetujui setoran.
 * @param data Objek berisi id setoran dan catatan opsional
 * @returns Data setoran yang diperbarui
 */
export const approveSetoranFn = createServerFn({ method: "POST" })
    .validator(
        z.object({
            id: z.string(),
            formData: approveSetoranSchema,
        }),
    )
    .handler(async ({ data: { id, formData } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("approve", "setoran");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        const { supabaseAdmin } = await import("@database/server");

        const { data: existing, error: fetchError } = await supabaseAdmin
            .from("daily_setorans")
            .select("branch_id, status")
            .eq("id", id)
            .maybeSingle();

        if (fetchError || !existing) {
            return {
                success: false as const,
                error: fetchError?.message ?? "Not found",
            };
        }
        if (ids !== null && !ids.includes(existing.branch_id)) {
            return { success: false as const, error: "Forbidden" };
        }
        if (existing.status !== "pending") {
            return {
                success: false as const,
                error: `Cannot approve setoran with status "${existing.status}". Only pending can be approved.`,
            };
        }

        const { data: setoran, error } = await supabaseAdmin
            .from("daily_setorans")
            .update({
                status: "approved",
                verified_by: auth.session.user.id,
                ...(formData.notes ? { notes: formData.notes } : {}),
            })
            .eq("id", id)
            .eq("status", "pending")
            .select()
            .single();

        if (error || !setoran)
            return {
                success: false as const,
                error: error?.message ?? "Not found",
            };

        const { logAudit } = await import("@/lib/audit-log");
        void logAudit({
            actorId: auth.session.user.id,
            action: "approve",
            targetTable: "daily_setorans",
            targetId: id,
            branchId: (setoran as SetoranDbRow).branch_id,
            metadata: { result: "approved", notes: formData.notes },
        });

        return {
            success: true as const,
            data: toSetoran(setoran as SetoranDbRow),
        };
    });

/**
 * Menolak setoran.
 * @param data Objek berisi id setoran dan catatan penolakan
 * @returns Data setoran yang diperbarui
 */
export const rejectSetoranFn = createServerFn({ method: "POST" })
    .validator(
        z.object({
            id: z.string(),
            formData: approveSetoranSchema,
        }),
    )
    .handler(async ({ data: { id, formData } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("approve", "setoran");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        const { supabaseAdmin } = await import("@database/server");

        const { data: existing, error: fetchError } = await supabaseAdmin
            .from("daily_setorans")
            .select("branch_id, status")
            .eq("id", id)
            .maybeSingle();

        if (fetchError || !existing) {
            return {
                success: false as const,
                error: fetchError?.message ?? "Not found",
            };
        }
        if (ids !== null && !ids.includes(existing.branch_id)) {
            return { success: false as const, error: "Forbidden" };
        }
        if (existing.status !== "pending") {
            return {
                success: false as const,
                error: `Cannot reject setoran with status "${existing.status}". Only pending can be rejected.`,
            };
        }

        const { data: setoran, error } = await supabaseAdmin
            .from("daily_setorans")
            .update({
                status: "rejected",
                verified_by: auth.session.user.id,
                ...(formData.notes ? { notes: formData.notes } : {}),
            })
            .eq("id", id)
            .eq("status", "pending")
            .select()
            .single();

        if (error || !setoran)
            return {
                success: false as const,
                error: error?.message ?? "Not found",
            };

        const { logAudit } = await import("@/lib/audit-log");
        void logAudit({
            actorId: auth.session.user.id,
            action: "reject",
            targetTable: "daily_setorans",
            targetId: id,
            branchId: (setoran as SetoranDbRow).branch_id,
            metadata: { result: "rejected", notes: formData.notes },
        });

        return {
            success: true as const,
            data: toSetoran(setoran as SetoranDbRow),
        };
    });

/** @see {@link createSetoranFn} */
export const useCreateSetoran = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            branchId: string;
            formData: z.infer<typeof createSetoranSchema>;
        }) => createSetoranFn({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kasirKeys.all });
        },
    });
};

/** @see {@link deleteSetoranFn} */
export const useDeleteSetoran = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSetoranFn({ data: { id } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kasirKeys.all });
        },
    });
};

/** @see {@link approveSetoranFn} */
export const useApproveSetoran = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            id: string;
            formData: z.infer<typeof approveSetoranSchema>;
        }) => approveSetoranFn({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kasirKeys.all });
        },
    });
};

/** @see {@link rejectSetoranFn} */
export const useRejectSetoran = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            id: string;
            formData: z.infer<typeof approveSetoranSchema>;
        }) => rejectSetoranFn({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kasirKeys.all });
        },
    });
};
