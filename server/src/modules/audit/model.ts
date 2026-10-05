import { t } from "elysia";

export const auditQuery = t.Object({
	branch: t.Optional(t.String()),
	action: t.Optional(t.String()),
	limit: t.Optional(t.Numeric({ minimum: 1, maximum: 500 })),
	offset: t.Optional(t.Numeric({ minimum: 0 })),
});
