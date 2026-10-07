import Elysia from "elysia";
import { betterAuth } from "./plugins/auth";
import { errorPlugin } from "./plugins/error";
import { logger } from "./plugins/logger";
import { api } from "./routes/api";
import { health } from "./routes/health";
import { openapiDocs } from "./routes/openapi";
import { session } from "./routes/sessions";

export const app = new Elysia()
	.use(logger)
	.use(openapiDocs)
	.use(betterAuth)
	.get("/", () => ({
		name: "Nexara API",
		status: "ok",
		version: "1.0.0",
	}))
	.use(health)
	.use(session)
	.use(api)
	.use(errorPlugin);

export type App = typeof app;
export default app;

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
