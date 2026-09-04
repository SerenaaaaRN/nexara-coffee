import { z } from "zod";

export interface MenuCategory {
    id: string;
    name: string;
    displayOrder: number;
}

export interface MenuItem {
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    price: string;
    variants: { name: string; price: number }[] | null;
    imageUrl: string | null;
    isAvailable: boolean;
}

export interface MenuItemRow extends MenuItem {
    category: MenuCategory;
}

export type MenuItemJoined = {
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: string;
    variants: { name: string; price: number }[] | null;
    image_url: string | null;
    is_available: boolean;
    category: { id: string; name: string; display_order: number } | null;
};

export interface MenuItemFormData {
    name: string;
    description?: string;
    price: string;
    categoryId: string;
    variants?: { name: string; price: string }[];
    imageUrl?: string;
}

export const createMenuItemSchema = z.object({
    categoryId: z.string().min(1, "Category is required"),
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    description: z.string().max(500).optional(),
    price: z.coerce.number().positive("Price must be positive"),
    variants: z
        .array(
            z.object({
                name: z.string().min(1),
                price: z.coerce.number().min(0),
            }),
        )
        .optional(),
    imageUrl: z.string().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const createCategorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
