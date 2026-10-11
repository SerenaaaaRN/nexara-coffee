import { t } from "elysia";

export const menuItemsQuery = t.Object({
	categoryId: t.Optional(t.String()),
});

export const createMenuItemBody = t.Object({
	categoryId: t.String({ minLength: 1 }),
	name: t.String({ minLength: 2, maxLength: 100 }),
	description: t.Optional(t.String({ maxLength: 500 })),
	price: t.Number({ minimum: 0 }),
	variants: t.Optional(
		t.Array(
			t.Object({
				name: t.String({ minLength: 1 }),
				price: t.Number({ minimum: 0 }),
			}),
		),
	),
	imageUrl: t.Optional(t.String()),
	imageBase64: t.Optional(t.String()),
});

export const updateMenuItemBody = t.Object({
	id: t.Optional(t.String()),
	categoryId: t.Optional(t.String()),
	name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
	description: t.Optional(t.String({ maxLength: 500 })),
	price: t.Optional(t.Number({ minimum: 0 })),
	variants: t.Optional(
		t.Union([
			t.Array(
				t.Object({
					name: t.String({ minLength: 1 }),
					price: t.Number({ minimum: 0 }),
				}),
			),
			t.Null(),
		]),
	),
	imageUrl: t.Optional(t.String()),
	imageBase64: t.Optional(t.String()),
});

export const createCategoryBody = t.Object({
	name: t.String({ minLength: 2, maxLength: 50 }),
	displayOrder: t.Optional(t.Number({ minimum: 0 })),
});
export const updateCategoryBody = t.Object({
	name: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
	displayOrder: t.Optional(t.Number({ minimum: 0 })),
});

export const categoryOrderBody = t.Object({
	displayOrder: t.Number(),
});
