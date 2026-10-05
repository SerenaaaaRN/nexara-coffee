import type {
    MenuCategoryRow as DBMenuCategory,
    MenuItemRow as DBMenuItem,
} from "@database/types";
import { z } from "zod";
import type { ToCamelCase } from "@/utils/convert-types";

export type MenuCategory = ToCamelCase<DBMenuCategory>;

export interface MenuItemVariant {
    name: string;
    price: number;
}

export type MenuItem = Pick<
    ToCamelCase<DBMenuItem>,
    | "id"
    | "categoryId"
    | "name"
    | "description"
    | "price"
    | "imageUrl"
    | "isAvailable"
> & {
    variants: MenuItemVariant[] | null;
};

export type MenuItemJoined = DBMenuItem & {
    category: Pick<DBMenuCategory, "id" | "name" | "display_order"> | null;
};

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
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
