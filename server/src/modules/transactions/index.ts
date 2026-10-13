import { Elysia } from "elysia";
import { idParams } from "../../lib/schema.js";
import { authPlugin } from "../../plugins/auth.js";
import { getTransactionsQuery, recordTransactionBody } from "./model.js";
import {
	getTransactionDetail,
	getTransactions,
	recordTransaction,
	refundTransaction,
} from "./service.js";

export const transactions = new Elysia({ prefix: "/transactions" })
	.use(authPlugin)
	.model({
		"transactions.query": getTransactionsQuery,
		"transactions.params": idParams,
		"transactions.record": recordTransactionBody,
	})
	.get("/", async ({ query, user }) => getTransactions(user, query), {
		query: "transactions.query",
		requireRole: ["finance", "read"],
		detail: { tags: ["transactions"] },
	})
	.get(
		"/:id",
		async ({ params, user }) => getTransactionDetail(user, params.id),
		{
			params: "transactions.params",
			requireRole: ["finance", "read"],
			detail: { tags: ["transactions"] },
		},
	)
	.post("/record", async ({ body, user }) => recordTransaction(user, body), {
		body: "transactions.record",
		requireRole: ["finance", "create"],
		detail: { tags: ["transactions"] },
	})
	.post(
		"/:id/refund",
		async ({ params, user }) => refundTransaction(user, params.id),
		{
			params: "transactions.params",
			requireRole: ["finance", "update"],
			detail: { tags: ["transactions"] },
		},
	);
