import Elysia from "elysia";
import { betterAuth } from "./plugins/auth";
import { errorPlugin } from "./plugins/error";
import { health } from "./routes/health";
import { session } from "./routes/sessions";

export const app = new Elysia()
	.use(betterAuth)
	.get("/", () => ({
		name: "Nexara API",
		status: "ok",
		version: "1.0.0",
	}))
	.use(health)
	.use(session)
	.use(errorPlugin);

export type App = typeof app;
export default app;

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
