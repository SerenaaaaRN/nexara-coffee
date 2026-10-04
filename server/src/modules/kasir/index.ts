import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
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
	.use(betterAuth)
	.get(
		"/expected-cash",
		async ({ query, user }) =>
			getExpectedCash(
				user as { id: string; role: string },
				query.branchId,
				query.date,
			),
		{ query: expectedCashQuery, auth: true, detail: { tags: ["kasir"] } },
	)
	.get(
		"/setorans",
		async ({ query, user }) =>
			getSetorans(
				user as { id: string; role: string },
				query.branch ?? null,
				query.limit,
			),
		{ query: setoransQuery, auth: true, detail: { tags: ["kasir"] } },
	)
	.post(
		"/setorans",
		async ({ body, user }) =>
			createSetoran(
				user as { id: string; role: string },
				(body as { branchId: string }).branchId,
				(body as { formData: { amount: number; date: string; notes?: string } })
					.formData,
			),
		{
			body: kasirCreateBody as never,
			auth: true,
			detail: { tags: ["kasir"] },
		},
	)
	.post(
		"/setorans/:id/delete",
		async ({ params, user }) =>
			deleteSetoran(user as { id: string; role: string }, params.id),
		{ params: kasirIdParams, auth: true, detail: { tags: ["kasir"] } },
	)
	.post(
		"/setorans/:id/approve",
		async ({ params, body, user }) =>
			approveSetoran(
				user as { id: string; role: string },
				params.id,
				(body as { formData?: { notes?: string } })?.formData?.notes,
			),
		{
			params: kasirIdParams,
			body: kasirApproveBody as never,
			auth: true,
			detail: { tags: ["kasir"] },
		},
	)
	.post(
		"/setorans/:id/reject",
		async ({ params, body, user }) =>
			rejectSetoran(
				user as { id: string; role: string },
				params.id,
				(body as { formData?: { notes?: string } })?.formData?.notes,
			),
		{
			params: kasirIdParams,
			body: kasirApproveBody as never,
			auth: true,
			detail: { tags: ["kasir"] },
		},
	);
