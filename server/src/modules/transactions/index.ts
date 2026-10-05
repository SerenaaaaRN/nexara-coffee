import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { recordTransactionBody, transactionIdParams } from "./model.js";
import {
	getTransactionDetail,
	getTransactions,
	recordTransaction,
	refundTransaction,
} from "./service.js";

export const transactions = new Elysia({ prefix: "/transactions" })
	.use(authPlugin)
	.get("/", async ({ user }) => getTransactions(user), {
		requireRole: ["finance", "read"],
		detail: { tags: ["transactions"] },
	})
	.get("/:id", async ({ params, user }) => getTransactionDetail(user, params.id), {
		params: transactionIdParams,
		requireRole: ["finance", "read"],
		detail: { tags: ["transactions"] },
	})
	.post("/record", async ({ body, user }) => recordTransaction(user, body as never), {
		body: recordTransactionBody,
		requireRole: ["finance", "create"],
		detail: { tags: ["transactions"] },
	})
	.post("/:id/refund", async ({ params, user }) => refundTransaction(user, params.id), {
		params: transactionIdParams,
		requireRole: ["finance", "update"],
		detail: { tags: ["transactions"] },
	});
