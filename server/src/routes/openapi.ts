import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

export const openapiDocs = new Elysia().use(
	openapi({
		documentation: {
			info: {
				title: "Nexara API",
				version: "1.0.0",
			},
			tags: [
				{ name: "overview", description: "Dashboard overview" },
				{ name: "kasir", description: "Setoran harian" },
				{ name: "orders", description: "Order management" },
				{ name: "menu", description: "Menu & categories" },
				{ name: "branches", description: "Branch management" },
				{ name: "customers", description: "Customer CRM & loyalty" },
				{ name: "employees", description: "Employee management" },
				{ name: "transactions", description: "Payment transactions" },
				{ name: "payouts", description: "Franchise payouts" },
				{ name: "reviews", description: "Review moderation" },
				{ name: "chat", description: "Realtime chat" },
				{ name: "notifications", description: "User notifications" },
				{ name: "audit", description: "Audit log" },
				{ name: "settings", description: "User settings" },
				{ name: "dashboard", description: "Dashboard meta" },
				{ name: "maps", description: "Branch map data" },
				{ name: "my", description: "Customer portal" },
				{ name: "landing", description: "Public landing" },
				{ name: "ably", description: "Ably token" },
			],
		},
	}),
);
