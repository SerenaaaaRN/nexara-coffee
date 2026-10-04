import { Elysia } from "elysia";
import {
	getPublicBranches,
	getPublicMenu,
	getPublicReviews,
} from "./service.js";

export const landing = new Elysia({ prefix: "/landing" })
	.get("/branches", async () => getPublicBranches(), {
		detail: { tags: ["landing"] },
	})
	.get("/menu", async () => getPublicMenu(), {
		detail: { tags: ["landing"] },
	})
	.get("/reviews", async () => getPublicReviews(), {
		detail: { tags: ["landing"] },
	});
