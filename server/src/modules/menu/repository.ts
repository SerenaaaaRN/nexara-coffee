import { and, asc, count, eq, ilike, isNotNull, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { menuCategories, menuItems } from "../../db/schema/menu.js";
import { containsPattern } from "../../lib/table.js";

export type MenuItemVariant = { name: string; price: number };
export type NewMenuItem = typeof menuItems.$inferInsert;
export type MenuItemPatch = Partial<typeof menuItems.$inferInsert>;
export type NewCategory = typeof menuCategories.$inferInsert;
export type CategoryPatch = Partial<typeof menuCategories.$inferInsert>;

export const menuRepo = {
	categories: async () => {
		return db
			.select()
			.from(menuCategories)
			.orderBy(asc(menuCategories.displayOrder));
	},

	itemsPage: async (categoryId?: string, q?: string) => {
		const term = q?.trim();
		const search = term
			? or(
					ilike(menuItems.name, containsPattern(term)),
					ilike(menuItems.description, containsPattern(term)),
				)
			: undefined;
		const scope = categoryId
			? eq(menuItems.categoryId, categoryId)
			: isNotNull(menuItems.categoryId);

		const [itemRows, [{ value: total }], availabilityGroups, categoryGroups] =
			await Promise.all([
				db
					.select()
					.from(menuItems)
					.innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
					.where(and(search, scope))
					.orderBy(asc(menuCategories.displayOrder), asc(menuItems.name)),
				db
					.select({ value: count() })
					.from(menuItems)
					.where(and(search, scope)),
				db
					.select({ available: menuItems.isAvailable, value: count() })
					.from(menuItems)
					.where(and(search, scope))
					.groupBy(menuItems.isAvailable),
				db
					.select({ categoryId: menuItems.categoryId, value: count() })
					.from(menuItems)
					.where(search)
					.groupBy(menuItems.categoryId),
			]);

		return { itemRows, total, availabilityGroups, categoryGroups };
	},

	createCategory: async (payload: NewCategory) => {
		const [row] = await db.insert(menuCategories).values(payload).returning();
		return row ?? null;
	},

	updateCategory: async (id: string, patch: CategoryPatch) => {
		const [row] = await db
			.update(menuCategories)
			.set(patch)
			.where(eq(menuCategories.id, id))
			.returning();
		return row ?? null;
	},

	countCategoryItems: async (id: string) => {
		const [row] = await db
			.select({ cnt: count() })
			.from(menuItems)
			.where(eq(menuItems.categoryId, id));
		return Number(row?.cnt ?? 0);
	},

	removeCategory: async (id: string) => {
		await db.delete(menuCategories).where(eq(menuCategories.id, id));
	},

	setCategoryOrder: async (id: string, displayOrder: number) => {
		await db
			.update(menuCategories)
			.set({ displayOrder })
			.where(eq(menuCategories.id, id));
	},

	createItem: async (payload: NewMenuItem) => {
		const [row] = await db.insert(menuItems).values(payload).returning();
		return row ?? null;
	},

	updateItem: async (id: string, patch: MenuItemPatch) => {
		const [row] = await db
			.update(menuItems)
			.set(patch)
			.where(eq(menuItems.id, id))
			.returning();
		return row ?? null;
	},

	findItem: async (id: string) => {
		const [row] = await db
			.select()
			.from(menuItems)
			.where(eq(menuItems.id, id))
			.limit(1);
		return row ?? null;
	},

	removeItem: async (id: string) => {
		await db.delete(menuItems).where(eq(menuItems.id, id));
	},

	setAvailability: async (id: string, isAvailable: boolean) => {
		const [row] = await db
			.update(menuItems)
			.set({ isAvailable })
			.where(eq(menuItems.id, id))
			.returning();
		return row ?? null;
	},
};
