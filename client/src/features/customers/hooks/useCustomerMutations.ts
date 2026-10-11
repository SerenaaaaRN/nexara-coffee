import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Customer, UpdateCustomerInput } from "@/features/customers/types";
import { customerKeys } from "@/features/query-keys";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

/**
 * Memperbarui data customer. Partial update.
 */
export const updateCustomer = async ({
    id,
    loyaltyPoints,
    loyaltyTier,
    ...input
}: UpdateCustomerInput & { id: string }): Promise<Envelope<Customer>> => {
    const { data, error } = await api.customers({ id }).put({ ...input });
    const envelope = toEnvelope(data, error);
    if (!envelope.success) return envelope;
    if (loyaltyPoints !== undefined) {
        const { data: loyalData, error: loyalError } = await api
            .customers({ id })
            .loyalty.patch({ points: loyaltyPoints });
        return toEnvelope(loyalData, loyalError);
    }
    return envelope;
};

/**
 * Menghapus customer. Hard delete.
 */
export const deleteCustomer = async (id: string): Promise<Envelope<null>> => {
    const { data, error } = await api.customers({ id }).delete();
    return toEnvelope(data, error);
};

/**
 * Memperbarui loyalty points customer (tier dihitung ulang di server).
 *
 * @returns Customer yang sudah diperbarui
 */
export const updateLoyaltyPoints = async (input: {
    customerId: string;
    points: number;
}): Promise<Envelope<Customer>> => {
    const { data, error } = await api
        .customers({ id: input.customerId })
        .loyalty.patch({ points: input.points });
    return toEnvelope(data, error);
};

/** @see {@link updateCustomer} */
export const useUpdateCustomer = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateCustomerInput & { id: string }) =>
            updateCustomer(data),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: customerKeys.lists() });
            qc.invalidateQueries({
                queryKey: customerKeys.detail(variables.id),
            });
        },
    });
};

/** @see {@link deleteCustomer} */
export const useDeleteCustomer = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteCustomer(id),
        onSuccess: () =>
            qc.invalidateQueries({ queryKey: customerKeys.lists() }),
    });
};

/** @see {@link updateLoyaltyPoints} */
export const useUpdateLoyaltyPoints = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { customerId: string; points: number }) =>
            updateLoyaltyPoints(data),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({
                queryKey: customerKeys.detail(variables.customerId),
            });
            qc.invalidateQueries({ queryKey: customerKeys.lists() });
        },
    });
};
