import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import type {
    approveSetoranSchema,
    createSetoranSchema,
} from "@/features/kasir/types";
import { kasirKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Membuat data setoran harian baru (atau memperbarui yang pending
 * di branch+tanggal yang sama — ditangani server).
 */
export const createSetoran = async (input: {
    branchId: string;
    formData: z.infer<typeof createSetoranSchema>;
}) => {
    const { data, error } = await api.kasir.setorans.post({
        branchId: input.branchId,
        formData: {
            amount: input.formData.amount,
            date: input.formData.date,
            notes: input.formData.notes,
        },
    });
    return toEnvelope(data, error);
};

/**
 * Menghapus setoran milik sendiri yang masih berstatus pending.
 */
export const deleteSetoran = async (id: string) => {
    const { data, error } = await api.kasir.setorans({ id }).delete.post();
    return toEnvelope(data, error);
};

/**
 * Menyetujui setoran.
 */
export const approveSetoran = async (input: {
    id: string;
    formData: z.infer<typeof approveSetoranSchema>;
}) => {
    const { data, error } = await api.kasir
        .setorans({ id: input.id })
        .approve.post({ formData: { notes: input.formData.notes } });
    return toEnvelope(data, error);
};

/**
 * Menolak setoran.
 */
export const rejectSetoran = async (input: {
    id: string;
    formData: z.infer<typeof approveSetoranSchema>;
}) => {
    const { data, error } = await api.kasir
        .setorans({ id: input.id })
        .reject.post({ formData: { notes: input.formData.notes } });
    return toEnvelope(data, error);
};

export const useCreateSetoran = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            branchId: string;
            formData: z.infer<typeof createSetoranSchema>;
        }) => createSetoran(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kasirKeys.all });
        },
    });
};

export const useDeleteSetoran = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSetoran(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kasirKeys.all });
        },
    });
};

export const useApproveSetoran = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            id: string;
            formData: z.infer<typeof approveSetoranSchema>;
        }) => approveSetoran(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kasirKeys.all });
        },
    });
};

export const useRejectSetoran = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            id: string;
            formData: z.infer<typeof approveSetoranSchema>;
        }) => rejectSetoran(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: kasirKeys.all });
        },
    });
};
