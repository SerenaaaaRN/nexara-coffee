import { status } from "elysia";

export const ok = <T>(data: T) => ({ success: true as const, data });

export const fail = (
	code: 400 | 401 | 403 | 404 | 409 | 429 | 500,
	error: string,
) => status(code, { success: false as const, error });

export type ApiOk<T> = ReturnType<typeof ok<T>>;
