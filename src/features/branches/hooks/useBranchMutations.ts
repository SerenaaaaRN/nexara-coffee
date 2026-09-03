import type { Database } from "@database/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type {
    AssignFranchiseInput,
    Branch,
    BranchRow,
    CreateBranchInput,
    UpdateBranchInput,
} from "@/features/branches/types";
import { branchKeys } from "@/features/query-keys";

/**
 * Membuat cabang baru.
 *
 * Membuat record di tabel `branches` sekaligus membuat chat channel "General"
 * untuk cabang tersebut. Mencatat audit log setelah berhasil.
 *
 * @returns Branch yang baru dibuat
 */
export const createBranchFn = createServerFn({ method: "POST" })
    .validator((data: CreateBranchInput) => data)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("create", "branches");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");
        const { logAudit } = await import("@/lib/audit-log");

        const { data: branch, error } = await supabaseAdmin
            .from("branches")
            .insert({
                id: crypto.randomUUID(),
                name: data.name,
                address: data.address,
                lat: data.lat || null,
                lng: data.lng || null,
                phone: data.phone || null,
                opening_time: data.openingTime || null,
                closing_time: data.closingTime || null,
                ownership_type: data.ownershipType,
            })
            .select()
            .single();

        if (error || !branch)
            return {
                success: false as const,
                error: error?.message ?? "Gagal membuat cabang",
            };

        await supabaseAdmin.from("chat_channels").insert({
            id: crypto.randomUUID(),
            type: "branch",
            branch_id: branch.id,
            name: branch.name,
        });

        void logAudit({
            actorId: auth.session.user.id,
            action: "create",
            targetTable: "branches",
            targetId: branch.id,
            metadata: { name: branch.name },
        });

        const result: Branch = {
            id: branch.id,
            name: branch.name,
            address: branch.address,
            lat: branch.lat,
            lng: branch.lng,
            phone: branch.phone,
            openingTime: branch.opening_time,
            closingTime: branch.closing_time,
            status: branch.status,
            ownershipType: branch.ownership_type,
            managerId: branch.manager_id,
            createdAt: branch.created_at,
            updatedAt: branch.updated_at,
        };
        return { success: true as const, data: result };
    });

/**
 * Memperbarui data cabang yang sudah ada.
 *
 * Partial update — hanya field yang dikirim yang akan diubah.
 * Mencatat audit log setelah berhasil.
 *
 * @returns Branch yang sudah diperbarui
 */
export const updateBranchFn = createServerFn({ method: "POST" })
    .validator((data: UpdateBranchInput & { id: string }) => data)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "branches");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");
        const { logAudit } = await import("@/lib/audit-log");

        const { id, ...input } = data;
        const updates: Database["public"]["Tables"]["branches"]["Update"] = {};
        if (input.name !== undefined) updates.name = input.name;
        if (input.address !== undefined) updates.address = input.address;
        if (input.lat !== undefined) updates.lat = input.lat || null;
        if (input.lng !== undefined) updates.lng = input.lng || null;
        if (input.phone !== undefined) updates.phone = input.phone || null;
        if (input.openingTime !== undefined)
            updates.opening_time = input.openingTime || null;
        if (input.closingTime !== undefined)
            updates.closing_time = input.closingTime || null;
        if (input.ownershipType !== undefined)
            updates.ownership_type = input.ownershipType;

        const { data: branch, error } = await supabaseAdmin
            .from("branches")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error || !branch)
            return {
                success: false as const,
                error: error?.message ?? "Gagal memperbarui cabang",
            };

        void logAudit({
            actorId: auth.session.user.id,
            action: "update",
            targetTable: "branches",
            targetId: id,
            branchId: id,
            metadata: updates as Record<string, unknown>,
        });

        const result: Branch = {
            id: branch.id,
            name: branch.name,
            address: branch.address,
            lat: branch.lat,
            lng: branch.lng,
            phone: branch.phone,
            openingTime: branch.opening_time,
            closingTime: branch.closing_time,
            status: branch.status,
            ownershipType: branch.ownership_type,
            managerId: branch.manager_id,
            createdAt: branch.created_at,
            updatedAt: branch.updated_at,
        };
        return { success: true as const, data: result };
    });

/**
 * Menghapus cabang. Hard delete.
 *
 * Mencatat audit log setelah berhasil.
 */
export const deleteBranchFn = createServerFn({ method: "POST" })
    .validator((data: { id: string }) => data)
    .handler(async ({ data: { id } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("delete", "branches");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");
        const { logAudit } = await import("@/lib/audit-log");

        const { error } = await supabaseAdmin
            .from("branches")
            .delete()
            .eq("id", id);
        if (error) return { success: false as const, error: error.message };

        void logAudit({
            actorId: auth.session.user.id,
            action: "delete",
            targetTable: "branches",
            targetId: id,
        });

        return { success: true as const };
    });

/**
 * Menetapkan franchise owner ke cabang.
 *
 * Membuat record di tabel junction `franchise_branches` yang menghubungkan
 * user (franchise owner) dengan cabang tertentu beserta rate komisi.
 * Mencatat audit log setelah berhasil.
 *
 * @returns Data franchise_branches yang baru dibuat
 */
export const assignFranchiseFn = createServerFn({ method: "POST" })
    .validator((data: AssignFranchiseInput) => data)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "branches");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");
        const { logAudit } = await import("@/lib/audit-log");

        const { data: fb, error } = await supabaseAdmin
            .from("franchise_branches")
            .insert({
                id: crypto.randomUUID(),
                user_id: data.userId,
                branch_id: data.branchId,
                commission_rate: data.commissionRate,
            })
            .select()
            .single();

        if (error || !fb)
            return {
                success: false as const,
                error: error?.message ?? "Gagal menetapkan franchise",
            };

        void logAudit({
            actorId: auth.session.user.id,
            action: "create",
            targetTable: "franchise_branches",
            targetId: fb.id,
            branchId: data.branchId,
            metadata: {
                userId: data.userId,
                commissionRate: data.commissionRate,
            },
        });

        return {
            success: true as const,
            data: {
                id: fb.id,
                userId: fb.user_id,
                branchId: fb.branch_id,
                commissionRate: fb.commission_rate,
                createdAt: fb.created_at,
            },
        };
    });

/** @see {@link createBranchFn} */
export function useCreateBranch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBranchInput) => createBranchFn({ data }),
        onSuccess: () => qc.invalidateQueries({ queryKey: branchKeys.lists() }),
    });
}

/** @see {@link updateBranchFn} */
export function useUpdateBranch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateBranchInput & { id: string }) =>
            updateBranchFn({ data }),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: branchKeys.detail(variables.id) });
            qc.invalidateQueries({ queryKey: branchKeys.lists() });
        },
    });
}

/** @see {@link deleteBranchFn} */
export function useDeleteBranch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteBranchFn({ data: { id } }),
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: branchKeys.lists() });
            const previousLists = qc.getQueryData(branchKeys.lists());
            if (previousLists) {
                qc.setQueryData(
                    branchKeys.lists(),
                    (old: { data: BranchRow[] } | undefined) => {
                        if (!old) return old;
                        return {
                            ...old,
                            data: old.data.filter((b) => b.id !== id),
                        };
                    },
                );
            }
            return { previousLists };
        },
        onError: (_err, _id, context) => {
            if (context?.previousLists) {
                qc.setQueryData(branchKeys.lists(), context.previousLists);
            }
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: branchKeys.all });
        },
    });
}

/** @see {@link assignFranchiseFn} */
export function useAssignFranchise() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: AssignFranchiseInput) => assignFranchiseFn({ data }),
        onSuccess: () => qc.invalidateQueries({ queryKey: branchKeys.lists() }),
    });
}
