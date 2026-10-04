import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import { recordTransactionBody, transactionIdParams } from "./model.js";
import {
	getTransactionDetail,
	getTransactions,
	recordTransaction,
	refundTransaction,
} from "./service.js";

export const transactions = new Elysia({ prefix: "/transactions" })
	.use(betterAuth)
	.get(
		"/",
		async ({ user }) => getTransactions(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["transactions"] },
		},
	)
	.get(
		"/:id",
		async ({ params, user }) =>
			getTransactionDetail(user as { id: string; role: string }, params.id),
		{
			params: transactionIdParams,
			auth: true,
			detail: { tags: ["transactions"] },
		},
	)
	.post(
		"/record",
		async ({ body, user }) =>
			recordTransaction(user as { id: string; role: string }, body as never),
		{
			body: recordTransactionBody,
			auth: true,
			detail: { tags: ["transactions"] },
		},
	)
	.post(
		"/:id/refund",
		async ({ params, user }) =>
			refundTransaction(user as { id: string; role: string }, params.id),
		{
			params: transactionIdParams,
			auth: true,
			detail: { tags: ["transactions"] },
		},
	);
