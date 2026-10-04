import { asc, count, eq, isNotNull } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { menuCategories, menuItems } from "../../db/schema/menu.js";
import {
	deleteImage,
	getPublicId,
	uploadImageBase64,
} from "../../lib/cloudinary.js";
import { can, type Role } from "../../lib/rbac.js";

export const getMenuCategories = async (user: { id: string; role: string }) => {
	if (!can(user.role as Role, "read", "menu")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const rows = await db
		.select()
		.from(menuCategories)
		.orderBy(asc(menuCategories.displayOrder));
	return { success: true as const, data: rows };
};

export const getMenuItems = async (
	user: { id: string; role: string },
	categoryId?: string | null,
) => {
	if (!can(user.role as Role, "read", "menu")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const cond = categoryId
		? eq(menuItems.categoryId, categoryId)
		: isNotNull(menuItems.categoryId);
	const rows = await db
		.select()
		.from(menuItems)
		.innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
		.where(cond)
		.orderBy(asc(menuCategories.displayOrder), asc(menuItems.name))
		.then((r) =>
			r.map((row) => ({
				...row.menu_items,
				variants: row.menu_items.variants as
					| { name: string; price: number }[]
					| null,
				category: row.menu_categories,
			})),
		);

	return { success: true as const, data: rows };
};

export const createCategory = async (
	user: { id: string; role: string },
	data: { name: string; displayOrder?: number },
) => {
	if (!can(user.role as Role, "create", "menu")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const [cat] = await db
		.insert(menuCategories)
		.values({ name: data.name, displayOrder: data.displayOrder ?? 0 })
		.returning();
	return { success: true as const, data: cat };
};

export const updateCategory = async (
	user: { id: string; role: string },
	id: string,
	data: { name?: string; displayOrder?: number },
) => {
	if (!can(user.role as Role, "update", "menu")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const updates: Record<string, unknown> = {};
	if (data.name !== undefined) updates.name = data.name;
	if (data.displayOrder !== undefined) updates.displayOrder = data.displayOrder;
	const [cat] = await db
		.update(menuCategories)
		.set(updates)
		.where(eq(menuCategories.id, id))
		.returning();
	if (!cat)
		return status(404, {
			success: false as const,
			error: "Category not found",
		});
	return { success: true as const, data: cat };
};

export const deleteCategory = async (
	user: { id: string; role: string },
	id: string,
) => {
	if (!can(user.role as Role, "delete", "menu")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const [itemCount] = await db
		.select({ cnt: count() })
		.from(menuItems)
		.where(eq(menuItems.categoryId, id));
	if (itemCount && Number(itemCount.cnt) > 0) {
		return status(400, {
			success: false as const,
			error: `Cannot delete — ${itemCount.cnt} menu item(s) still use this category`,
		});
	}
	await db.delete(menuCategories).where(eq(menuCategories.id, id));
	return { success: true as const, data: null };
};

export const updateCategoryOrder = async (
	user: { id: string; role: string },
	id: string,
	displayOrder: number,
) => {
	if (!can(user.role as Role, "update", "menu")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	await db
		.update(menuCategories)
		.set({ displayOrder })
		.where(eq(menuCategories.id, id));
	return { success: true as const, data: null };
};

export const createMenuItem = async (
	user: { id: string; role: string },
	data: {
		categoryId: string;
		name: string;
		description?: string;
		price: number;
		variants?: { name: string; price: number }[];
		imageUrl?: string;
		imageBase64?: string;
	},
) => {
	if (!can(user.role as Role, "create", "menu")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	let imageUrl = data.imageUrl;
	if (data.imageBase64) {
		const result = await uploadImageBase64(data.imageBase64);
		imageUrl = result.url;
	}
	const [item] = await db
		.insert(menuItems)
		.values({
			categoryId: data.categoryId,
			name: data.name,
			description: data.description,
			price: String(data.price),
			variants: data.variants ? JSON.stringify(data.variants) : null,
			imageUrl,
		})
		.returning();
	return {
		success: true as const,
		data: {
			...item,
			variants: item.variants as { name: string; price: number }[] | null,
		},
	};
};

export const updateMenuItem = async (
	user: { id: string; role: string },
	id: string,
	data: {
		categoryId?: string;
		name?: string;
		description?: string;
		price?: number;
		variants?: { name: string; price: number }[] | null;
		imageUrl?: string;
		imageBase64?: string;
	},
) => {
	if (!can(user.role as Role, "update", "menu")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	let imageUrl = data.imageUrl;
	if (data.imageBase64) {
		const result = await uploadImageBase64(data.imageBase64);
		imageUrl = result.url;
	}
	if (data.imageUrl && data.imageUrl !== imageUrl) {
		const publicId = getPublicId(data.imageUrl);
		if (publicId) await deleteImage(publicId);
	}
	const updates: Record<string, unknown> = {};
	if (data.name !== undefined) updates.name = data.name;
	if (data.description !== undefined) updates.description = data.description;
	if (data.price !== undefined) updates.price = String(data.price);
	if (data.categoryId !== undefined) updates.categoryId = data.categoryId;
	if (data.variants !== undefined)
		updates.variants = data.variants ? JSON.stringify(data.variants) : null;
	if (imageUrl !== undefined) updates.imageUrl = imageUrl;
	const [item] = await db
		.update(menuItems)
		.set(updates)
		.where(eq(menuItems.id, id))
		.returning();
	if (!item)
		return status(404, {
			success: false as const,
			error: "Menu item not found",
		});
	return {
		success: true as const,
		data: {
			...item,
			variants: item.variants as { name: string; price: number }[] | null,
		},
	};
};

export const deleteMenuItem = async (
	user: { id: string; role: string },
	id: string,
) => {
	if (!can(user.role as Role, "delete", "menu")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const [item] = await db
		.select()
		.from(menuItems)
		.where(eq(menuItems.id, id))
		.limit(1);
	if (item?.imageUrl) {
		const publicId = getPublicId(item.imageUrl);
		if (publicId) await deleteImage(publicId);
	}
	await db.delete(menuItems).where(eq(menuItems.id, id));
	return { success: true as const, data: null };
};

export const toggleMenuAvailability = async (
	user: { id: string; role: string },
	id: string,
	isAvailable: boolean,
) => {
	if (!can(user.role as Role, "update", "menu")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const [item] = await db
		.update(menuItems)
		.set({ isAvailable })
		.where(eq(menuItems.id, id))
		.returning();
	if (!item)
		return status(404, {
			success: false as const,
			error: "Menu item not found",
		});
	return {
		success: true as const,
		data: {
			...item,
			variants: item.variants as { name: string; price: number }[] | null,
		},
	};
};
