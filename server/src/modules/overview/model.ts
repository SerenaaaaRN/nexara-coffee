import { t } from "elysia";

export const overviewQuery = t.Object({
	branch: t.Optional(t.String()),
});

export type OverviewQuery = typeof overviewQuery.static;
