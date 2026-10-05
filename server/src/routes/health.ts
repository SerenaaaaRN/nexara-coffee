import { Elysia } from "elysia";

export const health = new Elysia({ prefix: "/api" }).get("/health", () => ({
	ok: true,
	timestamp: new Date().toDateString(),
}));
