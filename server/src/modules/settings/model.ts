import { t } from "elysia";

export const profileBody = t.Object({
	name: t.String({ minLength: 2, maxLength: 100 }),
});

export const changeRoleBody = t.Object({
	userId: t.String({ minLength: 1 }),
	role: t.String({ minLength: 1 }),
});

export const avatarBody = t.Object({
	base64: t.String({ minLength: 1 }),
});

const roleSchema = t.Union([
	t.Literal("super_admin"),
	t.Literal("branch_manager"),
	t.Literal("franchise_owner"),
	t.Literal("cashier"),
	t.Literal("barista"),
	t.Literal("visitor"),
]);

const resourceSchema = t.Union([
	t.Literal("menu"),
	t.Literal("orders"),
	t.Literal("users"),
	t.Literal("branches"),
	t.Literal("customers"),
	t.Literal("reviews"),
	t.Literal("finance"),
	t.Literal("payouts"),
	t.Literal("chat"),
	t.Literal("system"),
	t.Literal("ai"),
	t.Literal("employee"),
	t.Literal("reports"),
	t.Literal("setoran"),
	t.Literal("notifications"),
	t.Literal("maps"),
]);

const actionSchema = t.Union([
	t.Literal("create"),
	t.Literal("read"),
	t.Literal("update"),
	t.Literal("delete"),
	t.Literal("approve"),
	t.Literal("manage"),
	t.Literal("process"),
]);

export const dashboardMetaResponse = t.Object({
	success: t.Literal(true),
	data: t.Object({
		isSuperAdmin: t.Boolean(),
		branchList: t.Array(t.Object({ id: t.String(), name: t.String() })),
		defaultBranchId: t.Union([t.String(), t.Null()]),
		abilities: t.Record(resourceSchema, t.Array(actionSchema)),
		defaultRoute: t.Union([t.Literal("/overview"), t.Literal("/my")]),
		navGuards: t.Array(
			t.Object({
				path: t.String(),
				resource: resourceSchema,
				action: actionSchema,
			}),
		),
		roles: t.Array(
			t.Object({ value: roleSchema, label: t.String(), level: t.Number() }),
		),
		assignableRoles: t.Array(roleSchema),
	}),
});
