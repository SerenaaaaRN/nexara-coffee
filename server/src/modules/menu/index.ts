import { Elysia, t } from "elysia";
import { idParams } from "../../lib/schema.js";
import { authPlugin } from "../../plugins/auth.js";
import {
	categoryOrderBody,
	createCategoryBody,
	createMenuItemBody,
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
	.model({
		"menu.createCategory": createCategoryBody,
		"menu.updateCategory": updateCategoryBody,
		"menu.createItem": createMenuItemBody,
		"menu.updateItem": updateMenuItemBody,
		"menu.categoryOrder": categoryOrderBody,
		"menu.availability": t.Object({ isAvailable: t.Boolean() }),
		"menu.itemsQuery": menuItemsQuery,
		"menu.idParams": idParams,
	})
	.get("/categories", async () => getMenuCategories(), {
		requireRole: ["menu", "read"],
		detail: { tags: ["menu"] },
	})
	.get("/items", async ({ query }) => getMenuItems(query), {
		query: "menu.itemsQuery",
		requireRole: ["menu", "read"],
		detail: { tags: ["menu"] },
	})
	.post("/categories", async ({ body }) => createCategory(body), {
		body: "menu.createCategory",
		requireRole: ["menu", "create"],
		detail: { tags: ["menu"] },
	})
	.put(
		"/categories/:id",
		async ({ params, body }) => updateCategory(params.id, body),
		{
			params: "menu.idParams",
			body: "menu.updateCategory",
			requireRole: ["menu", "update"],
			detail: { tags: ["menu"] },
		},
	)
	.delete("/categories/:id", async ({ params }) => deleteCategory(params.id), {
		params: "menu.idParams",
		requireRole: ["menu", "delete"],
		detail: { tags: ["menu"] },
	})
	.patch(
		"/categories/:id/order",
		async ({ params, body }) =>
			updateCategoryOrder(params.id, body.displayOrder),
		{
			params: "menu.idParams",
			body: "menu.categoryOrder",
			requireRole: ["menu", "update"],
			detail: { tags: ["menu"] },
		},
	)
	.post("/items", async ({ body }) => createMenuItem(body), {
		body: "menu.createItem",
		requireRole: ["menu", "create"],
		detail: { tags: ["menu"] },
	})
	.put(
		"/items/:id",
		async ({ params, body }) => updateMenuItem(params.id, body),
		{
			params: "menu.idParams",
			body: "menu.updateItem",
			requireRole: ["menu", "update"],
			detail: { tags: ["menu"] },
		},
	)
	.delete("/items/:id", async ({ params }) => deleteMenuItem(params.id), {
		params: "menu.idParams",
		requireRole: ["menu", "delete"],
		detail: { tags: ["menu"] },
	})
	.patch(
		"/items/:id/availability",
		async ({ params, body }) =>
			toggleMenuAvailability(params.id, body.isAvailable),
		{
			params: "menu.idParams",
			body: "menu.availability",
			requireRole: ["menu", "update"],
			detail: { tags: ["menu"] },
		},
	);
