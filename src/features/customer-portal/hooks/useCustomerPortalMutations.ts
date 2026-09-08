import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { myPortalKeys } from "@/features/query-keys";

export const createMyReviewSchema = z.object({
    orderId: z.string().min(1),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().max(500).optional().or(z.literal("")),
});

export type CreateMyReviewInput = z.infer<typeof createMyReviewSchema>;

/**
 * Membuat review milik customer yang sedang login untuk satu order completed.
 *
 * Scope own: order harus milik sendiri (dibuat sendiri ATAU tercatat atas
 * profil customer-nya) dan berstatus completed. Satu order hanya bisa
 * diulas sekali. Review masuk dengan status pending untuk dimoderasi staff.
 *
 * @param d - orderId, rating 1-5, comment opsional
 * @returns id review yang dibuat
 */
export const createMyReviewFn = createServerFn({ method: "POST" })
    .validator((d: CreateMyReviewInput) => d)
    .handler(async ({ data }) => {
        const parsed = createMyReviewSchema.safeParse(data);
        if (!parsed.success)
            return {
                success: false as const,
                error: parsed.error.issues[0]?.message ?? "Input tidak valid",
            };

        const { getSession } = await import("@/lib/with-auth.server");
        const session = await getSession();
        if (!session?.user)
            return { success: false as const, error: "Unauthorized" };

        const { supabaseAdmin } = await import("@database/server");
        const uid = session.user.id;

        const { data: owned, error: ownedError } = await supabaseAdmin
            .from("customers")
            .select("id")
            .eq("user_id", uid);

        if (ownedError)
            return { success: false as const, error: ownedError.message };

        const ownedIds = (owned ?? []).map((c) => c.id);

        let orderQuery = supabaseAdmin
            .from("orders")
            .select("id, branch_id, customer_id, status, created_by")
            .eq("id", parsed.data.orderId);

        if (ownedIds.length > 0) {
            orderQuery = orderQuery.or(
                `created_by.eq.${uid},customer_id.in.(${ownedIds.join(",")})`,
            );
        } else {
            orderQuery = orderQuery.eq("created_by", uid);
        }

        const { data: order, error: orderError } =
            await orderQuery.maybeSingle();

        if (orderError || !order)
            return {
                success: false as const,
                error: orderError?.message ?? "Order tidak ditemukan",
            };

        if (order.status !== "completed")
            return {
                success: false as const,
                error: "Hanya order yang sudah selesai yang bisa diulas",
            };

        const { data: dup } = await supabaseAdmin
            .from("reviews")
            .select("id")
            .eq("order_id", order.id)
            .maybeSingle();

        if (dup)
            return {
                success: false as const,
                error: "Order ini sudah pernah diulas",
            };

        const { data: inserted, error: insertError } = await supabaseAdmin
            .from("reviews")
            .insert({
                id: crypto.randomUUID(),
                branch_id: order.branch_id,
                customer_id: order.customer_id ?? ownedIds[0] ?? null,
                order_id: order.id,
                rating: parsed.data.rating,
                comment: parsed.data.comment || null,
                status: "pending",
            })
            .select("id")
            .single();

        if (insertError || !inserted)
            return {
                success: false as const,
                error: insertError?.message ?? "Gagal menyimpan ulasan",
            };

        return { success: true as const, data: { id: inserted.id } };
    });

/** @see {@link createMyReviewFn} */
export function useCreateMyReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateMyReviewInput) => createMyReviewFn({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: myPortalKeys.all });
        },
    });
}
