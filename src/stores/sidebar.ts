import { create } from "zustand";

interface SidebarStore {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    toggle: () => void;
}

const SIDEBAR_KEY = "nexara-sidebar-open";

export const useSidebarStore = create<SidebarStore>((set) => ({
    isOpen: true,
    setOpen: (open) => {
        try {
            localStorage.setItem(SIDEBAR_KEY, String(open));
        } catch {}
        set({ isOpen: open });
    },
    toggle: () =>
        set((s) => {
            const next = !s.isOpen;
            try {
                localStorage.setItem(SIDEBAR_KEY, String(next));
            } catch {}
            return { isOpen: next };
        }),
}));

const stored =
    typeof window !== "undefined" ? localStorage.getItem(SIDEBAR_KEY) : null;
if (stored !== null) {
    useSidebarStore.setState({ isOpen: stored === "true" });
}
