import { Elysia, t } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import {
	categoryOrderBody,
	createCategoryBody,
	createMenuItemBody,
	menuIdParams,
	menuItemsQuery,
	updateCategoryBody,
	updateMenuItemBody,
} from "./model.js";
import {
	createCategory,
	createMenuItem,
	deleteCategory,
	deleteMenuItem,
	getMenuCategories,
	getMenuItems,
	toggleMenuAvailability,
	updateCategory,
	updateCategoryOrder,
	updateMenuItem,
} from "./service.js";

export const menu = new Elysia({ prefix: "/menu" })
	.use(authPlugin)
	.get("/categories", async ({ user }) => getMenuCategories(user), {
		requireRole: ["menu", "read"],
		detail: { tags: ["menu"] },
	})
	.get(
		"/items",
		async ({ query, user }) => getMenuItems(user, query.categoryId ?? null),
		{
			query: menuItemsQuery,
			requireRole: ["menu", "read"],
			detail: { tags: ["menu"] },
		},
	)
	.post("/categories", async ({ body, user }) => createCategory(user, body as never), {
		body: createCategoryBody as never,
		requireRole: ["menu", "create"],
		detail: { tags: ["menu"] },
	})
	.put(
		"/categories/:id",
		async ({ params, body, user }) => updateCategory(user, params.id, body as never),
		{
			params: menuIdParams,
			body: updateCategoryBody as never,
			requireRole: ["menu", "update"],
			detail: { tags: ["menu"] },
		},
	)
	.delete("/categories/:id", async ({ params, user }) => deleteCategory(user, params.id), {
		params: menuIdParams,
		requireRole: ["menu", "delete"],
		detail: { tags: ["menu"] },
	})
	.patch(
		"/categories/:id/order",
		async ({ params, body, user }) =>
			updateCategoryOrder(user, params.id, (body as { displayOrder: number }).displayOrder),
		{
			params: menuIdParams,
			body: categoryOrderBody,
			requireRole: ["menu", "update"],
			detail: { tags: ["menu"] },
		},
	)
	.post("/items", async ({ body, user }) => createMenuItem(user, body as never), {
		body: createMenuItemBody,
		requireRole: ["menu", "create"],
		detail: { tags: ["menu"] },
	})
	.put(
		"/items/:id",
		async ({ params, body, user }) => updateMenuItem(user, params.id, body as never),
		{
			params: menuIdParams,
			body: updateMenuItemBody,
			requireRole: ["menu", "update"],
			detail: { tags: ["menu"] },
		},
	)
	.delete("/items/:id", async ({ params, user }) => deleteMenuItem(user, params.id), {
		params: menuIdParams,
		requireRole: ["menu", "delete"],
		detail: { tags: ["menu"] },
	})
	.patch(
		"/items/:id/availability",
		async ({ params, body, user }) =>
			toggleMenuAvailability(user, params.id, (body as { isAvailable: boolean }).isAvailable),
		{
			params: menuIdParams,
			body: t.Object({ isAvailable: t.Boolean() }),
			requireRole: ["menu", "update"],
			detail: { tags: ["menu"] },
		},
	);
