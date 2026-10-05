import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
    AssignFranchiseInput,
    Branch,
    BranchRow,
    CreateBranchInput,
    FranchiseAssignment,
    UpdateBranchInput,
} from "@/features/branches/types";
import { branchKeys } from "@/features/query-keys";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

/**
 * Membuat cabang baru.
 *
 * Server sekaligus membuat chat channel "General" untuk cabang tersebut
 * dan mencatat audit log.
 *
 * @returns Branch yang baru dibuat
 */
export const createBranch = async (
    input: CreateBranchInput,
): Promise<Envelope<Branch>> => {
    const { data, error } = await api.branches.post({ ...input });
    return toEnvelope(data, error);
};

/**
 * Memperbarui data cabang yang sudah ada.
 *
 * Partial update — hanya field yang dikirim yang akan diubah.
 * Server mencatat audit log setelah berhasil.
 *
 * @returns Branch yang sudah diperbarui
 */
export const updateBranch = async ({
    id,
    ...input
}: UpdateBranchInput & { id: string }): Promise<Envelope<Branch>> => {
    const { data, error } = await api.branches({ id }).put({ ...input });
    return toEnvelope(data, error);
};

/**
 * Menghapus cabang. Hard delete.
 *
 * Server mencatat audit log setelah berhasil.
 */
export const deleteBranch = async (id: string): Promise<Envelope<null>> => {
    const { data, error } = await api.branches({ id }).delete();
    return toEnvelope(data, error);
};

/**
 * Menetapkan franchise owner ke cabang.
 *
 * Membuat record di tabel junction `franchise_branches` yang menghubungkan
 * user (franchise owner) dengan cabang tertentu beserta rate komisi.
 * Server mencatat audit log setelah berhasil.
 *
 * @returns Data franchise_branches yang baru dibuat
 */
export const assignFranchise = async (
    input: AssignFranchiseInput,
): Promise<Envelope<FranchiseAssignment>> => {
    const { data, error } = await api.branches.franchise.post({
        userId: input.userId,
        branchId: input.branchId,
        commissionRate: Number(input.commissionRate),
    });
    return toEnvelope(data, error);
};

/** @see {@link createBranch} */
export function useCreateBranch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBranchInput) => createBranch(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: branchKeys.lists() }),
    });
}

/** @see {@link updateBranch} */
export function useUpdateBranch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateBranchInput & { id: string }) =>
            updateBranch(data),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: branchKeys.detail(variables.id) });
            qc.invalidateQueries({ queryKey: branchKeys.lists() });
        },
    });
}

/** @see {@link deleteBranch} */
export function useDeleteBranch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteBranch(id),
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

/** @see {@link assignFranchise} */
export function useAssignFranchise() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: AssignFranchiseInput) => assignFranchise(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: branchKeys.lists() }),
    });
}
