import { Elysia } from "elysia";
import { ably } from "../modules/ably/index.js";
import { audit } from "../modules/audit/index.js";
import { branches } from "../modules/branches/index.js";
import { chat } from "../modules/chat/index.js";
import { customers } from "../modules/customers/index.js";
import { employee } from "../modules/employee/index.js";
import { kasir } from "../modules/kasir/index.js";
import { landing } from "../modules/landing/index.js";
import { maps } from "../modules/maps/index.js";
import { menu } from "../modules/menu/index.js";
import { myPortal } from "../modules/my/index.js";
import { notifications } from "../modules/notifications/index.js";
import { orders } from "../modules/orders/index.js";
import { overview } from "../modules/overview/index.js";
import { payouts } from "../modules/payouts/index.js";
import { reviews } from "../modules/reviews/index.js";
import { dashboardMeta, settings } from "../modules/settings/index.js";
import { transactions } from "../modules/transactions/index.js";

export const api = new Elysia({ prefix: "/api" })
	.use(overview)
	.use(kasir)
	.use(orders)
	.use(menu)
	.use(branches)
	.use(customers)
	.use(employee)
	.use(transactions)
	.use(payouts)
	.use(reviews)
	.use(chat)
	.use(notifications)
	.use(audit)
	.use(settings)
	.use(dashboardMeta)
	.use(maps)
	.use(myPortal)
	.use(landing)
	.use(ably);
