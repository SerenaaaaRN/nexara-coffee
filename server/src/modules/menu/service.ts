import { and, asc, count, eq, ilike, isNotNull, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { menuCategories, menuItems } from "../../db/schema/menu.js";
import {
	deleteImage,
	getPublicId,
	uploadImageBase64,
} from "../../infra/images.js";
import { fail, ok } from "../../lib/http.js";
import { containsPattern } from "../../lib/table.js";
import type { menuItemsQuery } from "./model.js";

export const getMenuCategories = async () => {
	const rows = await db
		.select()
		.from(menuCategories)
		.orderBy(asc(menuCategories.displayOrder));
	return ok(rows);
};

export const getMenuItems = async (params: typeof menuItemsQuery.static) => {
	const searchConditions = [];
	const term = params.q?.trim();
	if (term) {
		const pattern = containsPattern(term);
		searchConditions.push(
			or(ilike(menuItems.name, pattern), ilike(menuItems.description, pattern)),
		);
	}
	const searchWhere =
		searchConditions.length > 0 ? and(...searchConditions) : undefined;

	const listConditions = [...searchConditions];
	if (params.categoryId) {
		listConditions.push(eq(menuItems.categoryId, params.categoryId));
	} else {
		listConditions.push(isNotNull(menuItems.categoryId));
	}
	const listWhere = and(...listConditions);

	const toRow = (row: {
		menu_items: typeof menuItems.$inferSelect;
		menu_categories: typeof menuCategories.$inferSelect;
	}) => ({
		...row.menu_items,
		variants: row.menu_items.variants as
			| { name: string; price: number }[]
			| null,
		category: row.menu_categories,
	});

	const [itemRows, [{ value: total }], availabilityGroups, categoryGroups] =
		await Promise.all([
			db
				.select()
				.from(menuItems)
				.innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
				.where(listWhere)
				.orderBy(asc(menuCategories.displayOrder), asc(menuItems.name)),
			db
				.select({ value: count() })
				.from(menuItems)
				.where(listWhere),
			db
				.select({ available: menuItems.isAvailable, value: count() })
				.from(menuItems)
				.where(listWhere)
				.groupBy(menuItems.isAvailable),
			db
				.select({ categoryId: menuItems.categoryId, value: count() })
				.from(menuItems)
				.where(searchWhere)
				.groupBy(menuItems.categoryId),
		]);

	let available = 0;
	let hidden = 0;
	for (const group of availabilityGroups) {
		if (group.available) available = group.value;
		else hidden = group.value;
	}
	const byCategory: Record<string, number> = {};
	for (const group of categoryGroups) {
		byCategory[group.categoryId] = group.value;
	}

	return ok({
		rows: itemRows.map(toRow),
		total,
		summary: { total, available, hidden, byCategory },
	});
};

export const createCategory = async (data: {
	name: string;
	displayOrder?: number;
}) => {
	const [cat] = await db
		.insert(menuCategories)
		.values({ name: data.name, displayOrder: data.displayOrder ?? 0 })
		.returning();
	return ok(cat);
};

export const updateCategory = async (
	id: string,
	data: { name?: string; displayOrder?: number },
) => {
	const updates: Record<string, unknown> = {};
	if (data.name !== undefined) updates.name = data.name;
	if (data.displayOrder !== undefined) updates.displayOrder = data.displayOrder;
	const [cat] = await db
		.update(menuCategories)
		.set(updates)
		.where(eq(menuCategories.id, id))
		.returning();
	if (!cat) return fail(404, "Category not found");
	return ok(cat);
};

export const deleteCategory = async (id: string) => {
	const [itemCount] = await db
		.select({ cnt: count() })
		.from(menuItems)
		.where(eq(menuItems.categoryId, id));
	if (itemCount && Number(itemCount.cnt) > 0) {
		return fail(
			400,
			`Cannot delete — ${itemCount.cnt} menu item(s) still use this category`,
		);
	}
	await db.delete(menuCategories).where(eq(menuCategories.id, id));
	return ok(null);
};

export const updateCategoryOrder = async (id: string, displayOrder: number) => {
	await db
		.update(menuCategories)
		.set({ displayOrder })
		.where(eq(menuCategories.id, id));
	return ok(null);
};

export const createMenuItem = async (data: {
	categoryId: string;
	name: string;
	description?: string;
	price: number;
	variants?: { name: string; price: number }[];
	imageUrl?: string;
	imageBase64?: string;
}) => {
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
	return ok({
		...item,
		variants: item.variants as { name: string; price: number }[] | null,
	});
};

export const updateMenuItem = async (
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
	if (!item) return fail(404, "Menu item not found");
	return ok({
		...item,
		variants: item.variants as { name: string; price: number }[] | null,
	});
};

export const deleteMenuItem = async (id: string) => {
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
	return ok(null);
};

export const toggleMenuAvailability = async (
	id: string,
	isAvailable: boolean,
) => {
	const [item] = await db
		.update(menuItems)
		.set({ isAvailable })
		.where(eq(menuItems.id, id))
		.returning();
	if (!item) return fail(404, "Menu item not found");
	return ok({
		...item,
		variants: item.variants as { name: string; price: number }[] | null,
	});
};
