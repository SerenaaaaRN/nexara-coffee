import type { MenuCategory, MenuItem } from "@/features/menu/types";

export type POSCategory = Pick<MenuCategory, "id" | "name">;

export type POSMenuItem = Pick<
    MenuItem,
    "id" | "categoryId" | "name" | "price" | "imageUrl"
>;

export interface POSCartItem {
    id: string;
    menuItem: POSMenuItem;
    quantity: number;
}

export interface POSClientProps {
    branchId: string | undefined;
    categories: POSCategory[];
    items: POSMenuItem[];
}
