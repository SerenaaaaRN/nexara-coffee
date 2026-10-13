import { t } from "elysia";

export const mapBranchesQuery = t.Object({
	q: t.Optional(t.String({ maxLength: 100 })),
});
