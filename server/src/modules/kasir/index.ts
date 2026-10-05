import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import {
	expectedCashQuery,
	kasirApproveBody,
	kasirCreateBody,
	kasirIdParams,
	setoransQuery,
} from "./model.js";
import {
	approveSetoran,
	createSetoran,
	deleteSetoran,
	getExpectedCash,
	getSetorans,
	rejectSetoran,
} from "./service.js";

export const kasir = new Elysia({ prefix: "/kasir" })
	.use(authPlugin)
	.get(
		"/expected-cash",
		async ({ query, user }) => getExpectedCash(user, query.branchId, query.date),
		{
			query: expectedCashQuery,
			requireRole: ["finance", "read"],
			detail: { tags: ["kasir"] },
		},
	)
	.get(
		"/setorans",
		async ({ query, user }) => getSetorans(user, query.branch ?? null, query.limit),
		{
			query: setoransQuery,
			requireRole: ["setoran", "read"],
			detail: { tags: ["kasir"] },
		},
	)
	.post(
		"/setorans",
		async ({ body, user }) =>
			createSetoran(
				user,
				(body as { branchId: string }).branchId,
				(body as { formData: { amount: number; date: string; notes?: string } }).formData,
			),
		{
			body: kasirCreateBody as never,
			requireRole: ["setoran", "create"],
			detail: { tags: ["kasir"] },
		},
	)
	.post("/setorans/:id/delete", async ({ params, user }) => deleteSetoran(user, params.id), {
		params: kasirIdParams,
		requireRole: ["setoran", "delete"],
		detail: { tags: ["kasir"] },
	})
	.post(
		"/setorans/:id/approve",
		async ({ params, body, user }) =>
			approveSetoran(user, params.id, (body as { formData?: { notes?: string } })?.formData?.notes),
		{
			params: kasirIdParams,
			body: kasirApproveBody as never,
			requireRole: ["setoran", "approve"],
			detail: { tags: ["kasir"] },
		},
	)
	.post(
		"/setorans/:id/reject",
		async ({ params, body, user }) =>
			rejectSetoran(user, params.id, (body as { formData?: { notes?: string } })?.formData?.notes),
		{
			params: kasirIdParams,
			body: kasirApproveBody as never,
			requireRole: ["setoran", "approve"],
			detail: { tags: ["kasir"] },
		},
	);
