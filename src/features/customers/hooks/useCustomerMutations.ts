import type { Database } from "@database/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Customer, UpdateCustomerInput } from "@/features/customers/types";
import {
    updateCustomerSchema,
    updateLoyaltySchema,
} from "@/features/customers/types";
import { customerKeys } from "@/features/query-keys";

/**
 * Mencari customer berdasarkan HP (kalau diisi) lalu nama, atau membuat baru.
 *
 * Match berlapis: phone yang dinormalisasi dulu (identitas stabil untuk
 * member), fallback ke nama persis seperti sebelumnya. Baris baru ikut
 * menyimpan phone supaya tidak menumpuk baris tanpa identitas.
 *
 * @returns Data customer yang ditemukan atau dibuat
 */
export const findOrCreateCustomerFn = createServerFn({ method: "POST" })
    .validator(
        z.object({
            fullName: z.string().min(1).max(255),
            phone: z.string().max(32).optional().or(z.literal("")),
        }),
    )
    .handler(async ({ data: { fullName, phone } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("create", "customers");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (
            !rateLimit(
                `customers:find-or-create:${auth.session.user.id}`,
                20,
                60_000,
            )
        ) {
            return { success: false as const, error: "Too many requests" };
        }

        const { supabaseAdmin } = await import("@database/server");

        type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

        const toCustomer = (c: CustomerRow): Customer => ({
            id: c.id,
            fullName: c.full_name,
            email: c.email,
            phone: c.phone,
            segment: c.segment,
            loyaltyPoints: c.loyalty_points,
            loyaltyTier: c.loyalty_tier,
            createdAt: c.created_at,
            userId: c.user_id,
        });

        const { normalizePhone } = await import("@/features/customers/types");
        const digits = phone ? normalizePhone(phone) : "";

        if (digits !== "") {
            const { data: byPhone } = await supabaseAdmin
                .from("customers")
                .select()
                .eq("phone", digits)
                .limit(1)
                .maybeSingle();

            if (byPhone) {
                return { success: true as const, data: toCustomer(byPhone) };
            }
        }

        const { data: existing } = await supabaseAdmin
            .from("customers")
            .select()
            .eq("full_name", fullName)
            .limit(1)
            .maybeSingle();

        if (existing) {
            return { success: true as const, data: toCustomer(existing) };
        }

        const { logAudit } = await import("@/lib/audit-log");

        const { data: created, error } = await supabaseAdmin
            .from("customers")
            .insert({
                id: crypto.randomUUID(),
                full_name: fullName,
                phone: digits !== "" ? digits : null,
            })
            .select()
            .single();

        if (error || !created) {
            const { data: fallback } = await supabaseAdmin
                .from("customers")
                .select()
                .eq("full_name", fullName)
                .limit(1)
                .maybeSingle();
            if (!fallback) {
                return {
                    success: false as const,
                    error: "Failed to create customer",
                };
            }
            return { success: true as const, data: toCustomer(fallback) };
        }

        void logAudit({
            actorId: auth.session.user.id,
            action: "create",
            targetTable: "customers",
            targetId: created.id,
            metadata: { fullName: created.full_name },
        });

        return { success: true as const, data: toCustomer(created) };
    });

/**
 * Memperbarui data customer. Partial update.
 *
 * Email dan phone di-set null jika dikirim sebagai string kosong.
 * Invalidasi query key "customers" setelah berhasil.
 *
 * @returns Customer yang sudah diperbarui
 */
export const updateCustomerFn = createServerFn({ method: "POST" })
    .validator(updateCustomerSchema.extend({ id: z.string().min(1) }))
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "customers");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (
            !rateLimit(`customers:update:${auth.session.user.id}`, 30, 60_000)
        ) {
            return { success: false as const, error: "Too many requests" };
        }

        const { supabaseAdmin } = await import("@database/server");
        const { logAudit } = await import("@/lib/audit-log");

        const { id, ...input } = data;
        const updates: Database["public"]["Tables"]["customers"]["Update"] = {};
        if (input.fullName !== undefined) updates.full_name = input.fullName;
        if (input.email !== undefined)
            updates.email = input.email === "" ? null : input.email;
        if (input.phone !== undefined)
            updates.phone = input.phone === "" ? null : input.phone;
        if (input.segment !== undefined) updates.segment = input.segment;
        if (input.loyaltyPoints !== undefined)
            updates.loyalty_points = input.loyaltyPoints;
        if (input.loyaltyTier !== undefined)
            updates.loyalty_tier = input.loyaltyTier;

        const { data: customer, error } = await supabaseAdmin
            .from("customers")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error || !customer)
            return {
                success: false as const,
                error: error?.message ?? "Gagal memperbarui customer",
            };

        void logAudit({
            actorId: auth.session.user.id,
            action: "update",
            targetTable: "customers",
            targetId: id,
            metadata: updates as Record<string, unknown>,
        });

        return {
            success: true as const,
            data: {
                id: customer.id,
                fullName: customer.full_name,
                email: customer.email,
                phone: customer.phone,
                segment: customer.segment,
                loyaltyPoints: customer.loyalty_points,
                loyaltyTier: customer.loyalty_tier,
                createdAt: customer.created_at,
                userId: customer.user_id,
            } satisfies Customer,
        };
    });

/**
 * Menghapus customer. Hard delete.
 *
 * Invalidasi query key "customers" setelah berhasil.
 */
export const deleteCustomerFn = createServerFn({ method: "POST" })
    .validator(z.object({ id: z.string().min(1) }))
    .handler(async ({ data: { id } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("delete", "customers");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (
            !rateLimit(`customers:delete:${auth.session.user.id}`, 10, 60_000)
        ) {
            return { success: false as const, error: "Too many requests" };
        }

        const { supabaseAdmin } = await import("@database/server");
        const { logAudit } = await import("@/lib/audit-log");

        const { error } = await supabaseAdmin
            .from("customers")
            .delete()
            .eq("id", id);
        if (error) return { success: false as const, error: error.message };

        void logAudit({
            actorId: auth.session.user.id,
            action: "delete",
            targetTable: "customers",
            targetId: id,
        });

        return { success: true as const };
    });

/**
 * Memperbarui loyalty points customer.
 *
 * Invalidasi query key "customers" setelah berhasil.
 *
 * @returns Customer yang sudah diperbarui
 */
export const updateLoyaltyPointsFn = createServerFn({ method: "POST" })
    .validator(
        z.object({
            customerId: z.string().min(1),
            points: updateLoyaltySchema.shape.points,
        }),
    )
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "customers");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (
            !rateLimit(`customers:loyalty:${auth.session.user.id}`, 30, 60_000)
        ) {
            return { success: false as const, error: "Too many requests" };
        }

        const { supabaseAdmin } = await import("@database/server");

        const { data: customer, error } = await supabaseAdmin
            .from("customers")
            .update({ loyalty_points: data.points })
            .eq("id", data.customerId)
            .select()
            .single();

        if (error || !customer)
            return {
                success: false as const,
                error: error?.message ?? "Gagal memperbarui loyalty points",
            };

        return {
            success: true as const,
            data: {
                id: customer.id,
                fullName: customer.full_name,
                email: customer.email,
                phone: customer.phone,
                segment: customer.segment,
                loyaltyPoints: customer.loyalty_points,
                loyaltyTier: customer.loyalty_tier,
                createdAt: customer.created_at,
                userId: customer.user_id,
            } satisfies Customer,
        };
    });

/** @see {@link findOrCreateCustomerFn} */
export const useFindOrCreateCustomer = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: { fullName: string; phone?: string }) =>
            findOrCreateCustomerFn({ data: input }),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: customerKeys.lists() }),
    });
};

/** @see {@link updateCustomerFn} */
export const useUpdateCustomer = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateCustomerInput & { id: string }) =>
            updateCustomerFn({ data }),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: customerKeys.lists() });
            qc.invalidateQueries({
                queryKey: customerKeys.detail(variables.id),
            });
        },
    });
};

/** @see {@link deleteCustomerFn} */
export const useDeleteCustomer = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteCustomerFn({ data: { id } }),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: customerKeys.lists() }),
    });
};

/** @see {@link updateLoyaltyPointsFn} */
export const useUpdateLoyaltyPoints = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { customerId: string; points: number }) =>
            updateLoyaltyPointsFn({ data }),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({
                queryKey: customerKeys.detail(variables.customerId),
            });
            qc.invalidateQueries({ queryKey: customerKeys.lists() });
        },
    });
};
