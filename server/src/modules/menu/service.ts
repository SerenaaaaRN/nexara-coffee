import {
	deleteImage,
	getPublicId,
	uploadImageBase64,
} from "../../infra/images.js";
import { fail, ok } from "../../lib/http.js";
import type {
	createCategoryBody,
	createMenuItemBody,
	menuItemsQuery,
	updateCategoryBody,
	updateMenuItemBody,
} from "./model.js";
import {
	menuRepo,
	type MenuItemPatch,
	type MenuItemVariant,
	type NewMenuItem,
} from "./repository.js";

type ItemRow = {
	menu_items: { variants: unknown };
	menu_categories: Record<string, unknown>;
};

const toRow = (row: ItemRow) => ({
	...row.menu_items,
	variants: row.menu_items.variants as MenuItemVariant[] | null,
	category: row.menu_categories,
});

const toAvailabilitySummary = (
	groups: { available: boolean | null; value: number }[],
) => {
	const summary = { available: 0, hidden: 0 };
	for (const group of groups) {
		if (group.available) summary.available = group.value;
		else summary.hidden = group.value;
	}
	return summary;
};

export const getMenuCategories = async () => {
	return ok(await menuRepo.categories());
};

export const getMenuItems = async (params: typeof menuItemsQuery.static) => {
	const result = await menuRepo.itemsPage(params.categoryId, params.q);

	const byCategory: Record<string, number> = {};
	for (const group of result.categoryGroups) {
		byCategory[group.categoryId] = group.value;
	}

	return ok({
		rows: result.itemRows.map(toRow),
		total: result.total,
		summary: {
			total: result.total,
			...toAvailabilitySummary(result.availabilityGroups),
			byCategory,
		},
	});
};

export const createCategory = async (
	data: typeof createCategoryBody.static,
) => {
	const cat = await menuRepo.createCategory({
		name: data.name,
		displayOrder: data.displayOrder ?? 0,
	});
	if (!cat) return fail(500, "Failed to create category");

	return ok(cat);
};

export const updateCategory = async (
	id: string,
	data: typeof updateCategoryBody.static,
) => {
	const patch: Partial<{ name: string; displayOrder: number }> = {};
	if (data.name !== undefined) patch.name = data.name;
	if (data.displayOrder !== undefined) patch.displayOrder = data.displayOrder;

	const cat = await menuRepo.updateCategory(id, patch);
	if (!cat) return fail(404, "Category not found");

	return ok(cat);
};

export const deleteCategory = async (id: string) => {
	const itemCount = await menuRepo.countCategoryItems(id);
	if (itemCount > 0) {
		return fail(
			400,
			`Cannot delete — ${itemCount} menu item(s) still use this category`,
		);
	}
	await menuRepo.removeCategory(id);

	return ok(null);
};

export const updateCategoryOrder = async (id: string, displayOrder: number) => {
	await menuRepo.setCategoryOrder(id, displayOrder);

	return ok(null);
};

const resolveImageUrl = async (
	oldUrl: string | undefined,
	data: { imageUrl?: string; imageBase64?: string },
) => {
	let imageUrl = data.imageUrl;
	if (data.imageBase64) {
		const result = await uploadImageBase64(data.imageBase64);
		imageUrl = result.url;
	}
	if (oldUrl && oldUrl !== imageUrl) {
		const publicId = getPublicId(oldUrl);
		if (publicId) await deleteImage(publicId);
	}
	return imageUrl;
};

export const createMenuItem = async (
	data: typeof createMenuItemBody.static,
) => {
	const imageUrl = await resolveImageUrl(undefined, data);

	const payload: NewMenuItem = {
		categoryId: data.categoryId,
		name: data.name,
		description: data.description,
		price: String(data.price),
		variants: data.variants ? JSON.stringify(data.variants) : null,
		imageUrl,
	};
	const item = await menuRepo.createItem(payload);
	if (!item) return fail(500, "Failed to create menu item");

	return ok({ ...item, variants: item.variants as MenuItemVariant[] | null });
};

export const updateMenuItem = async (
	id: string,
	data: typeof updateMenuItemBody.static,
) => {
	const imageUrl = await resolveImageUrl(data.imageUrl, data);

	const patch: MenuItemPatch = {};
	if (data.name !== undefined) patch.name = data.name;
	if (data.description !== undefined) patch.description = data.description;
	if (data.price !== undefined) patch.price = String(data.price);
	if (data.categoryId !== undefined) patch.categoryId = data.categoryId;
	if (data.variants !== undefined)
		patch.variants = data.variants ? JSON.stringify(data.variants) : null;
	if (imageUrl !== undefined) patch.imageUrl = imageUrl;

	const item = await menuRepo.updateItem(id, patch);
	if (!item) return fail(404, "Menu item not found");

	return ok({ ...item, variants: item.variants as MenuItemVariant[] | null });
};

export const deleteMenuItem = async (id: string) => {
	const item = await menuRepo.findItem(id);
	if (item?.imageUrl) {
		const publicId = getPublicId(item.imageUrl);
		if (publicId) await deleteImage(publicId);
	}
	await menuRepo.removeItem(id);

	return ok(null);
};

export const toggleMenuAvailability = async (
	id: string,
	isAvailable: boolean,
) => {
	const item = await menuRepo.setAvailability(id, isAvailable);
	if (!item) return fail(404, "Menu item not found");

	return ok({ ...item, variants: item.variants as MenuItemVariant[] | null });
};
