import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import type { POSMenuItem } from "@/features/pos/types";

/**
 * Filter katalog POS: search + kategori via URL search params,
 * sehingga state filter survive reload dan bisa di-share.
 *
 * @param items - Seluruh item menu
 * @returns search, activeCategory, setter, dan item terfilter
 */
export const usePosCatalog = (items: POSMenuItem[]) => {
    const searchParams = useSearch({ from: "/pos" });
    const navigate = useNavigate({ from: "/pos" });

    const search = searchParams.search || "";
    const activeCategory = searchParams.category || "all";

    const setSearch = (val: string) => {
        navigate({
            search: (prev) => ({ ...prev, search: val || undefined }),
            replace: true,
        });
    };

    const setActiveCategory = (val: string) => {
        navigate({
            search: (prev) => ({
                ...prev,
                category: val === "all" ? undefined : val,
            }),
            replace: true,
        });
    };

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            if (
                activeCategory !== "all" &&
                item.categoryId !== activeCategory
            ) {
                return false;
            }
            if (
                search &&
                !item.name.toLowerCase().includes(search.toLowerCase())
            ) {
                return false;
            }
            return true;
        });
    }, [items, search, activeCategory]);

    return {
        search,
        activeCategory,
        setSearch,
        setActiveCategory,
        filteredItems,
    };
};
