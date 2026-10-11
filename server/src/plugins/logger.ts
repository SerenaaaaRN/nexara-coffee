import { Elysia, ElysiaCustomStatusResponse } from "elysia";
import type { CurrentUser } from "../access/index.js";

/**
 * Request logger satu baris per request.
 *
 * Format: timestamp [requestId] METHOD path status durasi role :: detail.
 * Level via `LOG_LEVEL` (info|warn|error|silent, default info).
 * Body, query values, headers, dan kredensial tidak pernah di-log.
 */
type LogLevel = "info" | "warn" | "error" | "silent";

const LOG_LEVEL = (process.env.LOG_LEVEL ?? "info").toLowerCase() as LogLevel;
const IS_PROD = process.env.NODE_ENV === "production";
const USE_COLOR = !process.env.NO_COLOR && process.stdout.isTTY === true;

const SLOW_MS = 500;
const VERY_SLOW_MS = 1000;
const MAX_MSG_LENGTH = 120;
const IGNORED_PATHS = ["/", "/api/health", "/openapi"];

const ANSI = {
	reset: "\x1b[0m",
	gray: "\x1b[90m",
	cyan: "\x1b[36m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	magenta: "\x1b[35m",
} as const;

const LOG_RANK: Record<LogLevel, number> = {
	silent: Number.POSITIVE_INFINITY,
	error: 2,
	warn: 1,
	info: 0,
};

const MIN_RANK = LOG_RANK[LOG_LEVEL] ?? 0;

const paint = (code: string, value: string | number): string =>
	USE_COLOR ? `${code}${value}${ANSI.reset}` : String(value);

const getTimestamp = (): string =>
	new Date().toLocaleTimeString("en-GB", {
		hour12: false,
		timeZone: "Asia/Jakarta",
	});

const generateId = (): string =>
	Math.random().toString(36).slice(2, 8).padEnd(6, "0");

const sanitizeMessage = (msg: string): string =>
	msg.replace(/\s+/g, " ").trim().slice(0, MAX_MSG_LENGTH);

const isIgnoredPath = (path: string): boolean =>
	IGNORED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

const getRank = (status: number): 0 | 1 | 2 =>
	status >= 500 ? 2 : status >= 400 ? 1 : 0;

interface RequestContext {
	user?: CurrentUser;
}

const extractRole = (ctx: unknown): string =>
	(ctx as RequestContext).user?.role ?? "anon";

const extractStatus = (set: { status?: unknown }, fallback: number): number => {
	if (typeof set.status === "number") return set.status;
	if (typeof set.status === "string") {
		const num = Number(set.status);
		if (Number.isFinite(num)) return num;
	}
	return fallback;
};

const extractErrorCode = (error: unknown): number | null => {
	const status = (error as { status?: unknown })?.status;
	return typeof status === "number" && Number.isFinite(status) ? status : null;
};

const resolveErrorStatus = (
	set: { status?: unknown },
	error: unknown,
	fallback: number,
): number => {
	const fromError = extractErrorCode(error);
	if (fromError !== null) return fromError;
	const fromSet = extractStatus(set, fallback);
	return fromSet === 200 ? fallback : fromSet;
};

const unwrapResponse = (
	response: unknown,
): { code: number | null; body: unknown } => {
	if (response instanceof ElysiaCustomStatusResponse) {
		const code = Number(response.code);
		return {
			code: Number.isFinite(code) ? code : null,
			body: response.response,
		};
	}
	return { code: null, body: response };
};

const getFailureDetail = (response: unknown): string | undefined => {
	if (typeof response !== "object" || response === null) return undefined;
	const r = response as { success?: unknown; error?: unknown };
	if (r.success === false && typeof r.error === "string") return r.error;
	return undefined;
};

const getValidationDetail = (error: unknown): string => {
	const all = (error as { all?: { message?: string }[] })?.all;
	return all?.[0]?.message ?? (error as Error)?.message ?? "Validation failed";
};

interface LogEntry {
	id: string;
	method: string;
	path: string;
	status: number;
	durationMs: number;
	role: string;
	detail?: string;
}

const printLogLine = ({
	id,
	method,
	path,
	status,
	durationMs,
	role,
	detail,
}: LogEntry): void => {
	if (getRank(status) < MIN_RANK) return;

	const statusColor =
		status >= 500
			? ANSI.red
			: status >= 400
				? ANSI.yellow
				: status >= 300
					? ANSI.cyan
					: ANSI.green;

	const isVerySlow = durationMs >= VERY_SLOW_MS;
	const isSlow = durationMs >= SLOW_MS;
	const slowMark = isVerySlow ? " 🐌 slow" : isSlow ? " ⚠ slow" : "";
	const durationColor = isVerySlow
		? ANSI.red
		: isSlow
			? ANSI.yellow
			: ANSI.gray;

	const line = [
		paint(ANSI.gray, getTimestamp()),
		paint(ANSI.magenta, `[${id}]`),
		paint(ANSI.cyan, method.padEnd(6)),
		path,
		paint(statusColor, status),
		`${paint(durationColor, `${Math.round(durationMs)}ms`)}${slowMark}`,
		paint(ANSI.gray, role),
		detail ? `:: ${sanitizeMessage(detail)}` : "",
	]
		.filter(Boolean)
		.join(" ");

	if (status >= 500) console.error(line);
	else if (status >= 400) console.warn(line);
	else console.log(line);
};

const requestMeta = new WeakMap<Request, { id: string; start: number }>();

const getMeta = (request: Request): { id: string; start: number } =>
	requestMeta.get(request) ?? { id: "------", start: performance.now() };

export const logger = new Elysia({ name: "logger" })
	.onRequest(({ request }) => {
		requestMeta.set(request, { id: generateId(), start: performance.now() });
	})
	.onAfterHandle({ as: "global" }, (ctx) => {
		const path = new URL(ctx.request.url).pathname;
		if (isIgnoredPath(path)) return;

		const meta = getMeta(ctx.request);
		const unwrapped = unwrapResponse(ctx.response);
		const status = unwrapped.code ?? extractStatus(ctx.set, 200);

		printLogLine({
			id: meta.id,
			method: ctx.request.method,
			path,
			status,
			durationMs: performance.now() - meta.start,
			role: extractRole(ctx),
			detail: getFailureDetail(unwrapped.body),
		});
	})
	.onError({ as: "global" }, (ctx) => {
		const path = new URL(ctx.request.url).pathname;
		if (isIgnoredPath(path)) return;

		const meta = getMeta(ctx.request);
		const baseEntry = {
			id: meta.id,
			method: ctx.request.method,
			path,
			durationMs: performance.now() - meta.start,
			role: extractRole(ctx),
		};

		let status: number;
		let detail: string;

		switch (ctx.code) {
			case "VALIDATION":
				status = resolveErrorStatus(ctx.set, ctx.error, 422);
				detail = getValidationDetail(ctx.error);
				break;
			case "NOT_FOUND":
				status = resolveErrorStatus(ctx.set, ctx.error, 404);
				detail = "Not found";
				break;
			default:
				status = resolveErrorStatus(ctx.set, ctx.error, 500);
				detail = (ctx.error as Error)?.message ?? "Internal server error";
		}

		printLogLine({ ...baseEntry, status, detail });

		if (
			status >= 500 &&
			!IS_PROD &&
			ctx.error instanceof Error &&
			ctx.error.stack
		) {
			console.error(ctx.error.stack);
		}
	});
