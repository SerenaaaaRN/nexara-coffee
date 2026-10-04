import { Elysia, t } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
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
	.use(betterAuth)
	.get(
		"/categories",
		async ({ user }) => getMenuCategories(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["menu"] },
		},
	)
	.get(
		"/items",
		async ({ query, user }) =>
			getMenuItems(
				user as { id: string; role: string },
				query.categoryId ?? null,
			),
		{ query: menuItemsQuery, auth: true, detail: { tags: ["menu"] } },
	)
	.post(
		"/categories",
		async ({ body, user }) =>
			createCategory(user as { id: string; role: string }, body as never),
		{
			body: createCategoryBody as never,
			auth: true,
			detail: { tags: ["menu"] },
		},
	)
	.put(
		"/categories/:id",
		async ({ params, body, user }) =>
			updateCategory(
				user as { id: string; role: string },
				params.id,
				body as never,
			),
		{
			params: menuIdParams,
			body: updateCategoryBody as never,
			auth: true,
			detail: { tags: ["menu"] },
		},
	)
	.delete(
		"/categories/:id",
		async ({ params, user }) =>
			deleteCategory(user as { id: string; role: string }, params.id),
		{
			params: menuIdParams,
			auth: true,
			detail: { tags: ["menu"] },
		},
	)
	.patch(
		"/categories/:id/order",
		async ({ params, body, user }) =>
			updateCategoryOrder(
				user as { id: string; role: string },
				params.id,
				(body as { displayOrder: number }).displayOrder,
			),
		{
			params: menuIdParams,
			body: categoryOrderBody,
			auth: true,
			detail: { tags: ["menu"] },
		},
	)
	.post(
		"/items",
		async ({ body, user }) =>
			createMenuItem(user as { id: string; role: string }, body as never),
		{
			body: createMenuItemBody,
			auth: true,
			detail: { tags: ["menu"] },
		},
	)
	.put(
		"/items/:id",
		async ({ params, body, user }) =>
			updateMenuItem(
				user as { id: string; role: string },
				params.id,
				body as never,
			),
		{
			params: menuIdParams,
			body: updateMenuItemBody,
			auth: true,
			detail: { tags: ["menu"] },
		},
	)
	.delete(
		"/items/:id",
		async ({ params, user }) =>
			deleteMenuItem(user as { id: string; role: string }, params.id),
		{
			params: menuIdParams,
			auth: true,
			detail: { tags: ["menu"] },
		},
	)
	.patch(
		"/items/:id/availability",
		async ({ params, body, user }) =>
			toggleMenuAvailability(
				user as { id: string; role: string },
				params.id,
				(body as { isAvailable: boolean }).isAvailable,
			),
		{
			params: menuIdParams,
			body: t.Object({ isAvailable: t.Boolean() }),
			auth: true,
			detail: { tags: ["menu"] },
		},
	);
