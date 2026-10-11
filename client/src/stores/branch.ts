import { create } from "zustand";

interface BranchStore {
    activeBranch: string | null;
    setActiveBranch: (id: string | null) => void;
}

export const useBranchStore = create<BranchStore>((set) => ({
    activeBranch: null,
    setActiveBranch: (id) => set({ activeBranch: id }),
}));
