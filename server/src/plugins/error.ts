import { Elysia } from "elysia";

export const errorPlugin = new Elysia({ name: "error" }).onError(
	({ code, error, set }) => {
		if (code === "VALIDATION") {
			const msg =
				(error as unknown as { all?: { message: string }[] })?.all?.[0]
					?.message ?? (error as Error).message;
			set.status = 400;
			return { success: false as const, error: msg };
		}
		if (code === "NOT_FOUND") {
			set.status = 404;
			return { success: false as const, error: "Not found" };
		}
		console.error(error);
		set.status = 500;
		return { success: false as const, error: "Internal server error" };
	},
);
