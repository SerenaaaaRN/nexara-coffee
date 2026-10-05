import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { idParams } from "../../lib/schema.js";
import {
	expectedCashQuery,
	kasirApproveBody,
	kasirCreateBody,
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
	.model({
		"kasir.expectedCash": expectedCashQuery,
		"kasir.setorans": setoransQuery,
		"kasir.params": idParams,
		"kasir.create": kasirCreateBody,
		"kasir.decision": kasirApproveBody,
	})
	.get(
		"/expected-cash",
		async ({ query, user }) => getExpectedCash(user, query.branchId, query.date),
		{
			query: "kasir.expectedCash",
			requireRole: ["finance", "read"],
			detail: { tags: ["kasir"] },
		},
	)
	.get(
		"/setorans",
		async ({ query, user }) => getSetorans(user, query.branch ?? null, query.limit),
		{
			query: "kasir.setorans",
			requireRole: ["setoran", "read"],
			detail: { tags: ["kasir"] },
		},
	)
	.post(
		"/setorans",
		async ({ body, user }) => createSetoran(user, body.branchId, body.formData),
		{
			body: "kasir.create",
			requireRole: ["setoran", "create"],
			detail: { tags: ["kasir"] },
		},
	)
	.post("/setorans/:id/delete", async ({ params, user }) => deleteSetoran(user, params.id), {
		params: "kasir.params",
		requireRole: ["setoran", "delete"],
		detail: { tags: ["kasir"] },
	})
	.post(
		"/setorans/:id/approve",
		async ({ params, body, user }) => approveSetoran(user, params.id, body.formData.notes),
		{
			params: "kasir.params",
			body: "kasir.decision",
			requireRole: ["setoran", "approve"],
			detail: { tags: ["kasir"] },
		},
	)
	.post(
		"/setorans/:id/reject",
		async ({ params, body, user }) => rejectSetoran(user, params.id, body.formData.notes),
		{
			params: "kasir.params",
			body: "kasir.decision",
			requireRole: ["setoran", "approve"],
			detail: { tags: ["kasir"] },
		},
	);
