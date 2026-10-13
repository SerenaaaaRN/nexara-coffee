import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

/** Kategori menu — from eden treaty (source of truth: server). */
export type MenuCategory = GetData<typeof api.menu.categories.get>[number];

/**
 * Item menu — from eden treaty. Server selalu menyertakan `variants`
 * dan join `category` sebagai nested object.
 */
export type MenuItem = GetData<typeof api.menu.items.get>["rows"][number];

/** Ringkasan agregat menu — from eden treaty. */
export type MenuSummary = GetData<typeof api.menu.items.get>["summary"];

export interface MenuItemVariant {
    name: string;
    price: number;
}

export type MenuItemRow = MenuItem & {
    category: MenuCategory;
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

/** Payload submit dialog item: nilai form + hasil upload image. */
export type MenuItemSubmitData = CreateMenuItemInput & {
    imageBase64?: string;
};
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
