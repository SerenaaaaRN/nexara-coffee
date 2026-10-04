/**
 * @see https://elysiajs.com/recipe/drizzle.html#utility
 * @lastModified 2025-02-04
 */
import { Kind, type TObject } from "@sinclair/typebox";
import type { Table } from "drizzle-orm";
import {
	type BuildSchema,
	createInsertSchema,
	createSelectSchema,
} from "drizzle-typebox";

type Spread<
	T extends TObject | Table,
	Mode extends "select" | "insert" | undefined,
> =
	T extends TObject<infer Fields>
		? {
				[K in keyof Fields]: Fields[K];
			}
		: T extends Table
			? Mode extends "select"
				? BuildSchema<"select", T["_"]["columns"], undefined>["properties"]
				: Mode extends "insert"
					? BuildSchema<"insert", T["_"]["columns"], undefined>["properties"]
					: Record<string, never>
			: Record<string, never>;

export const spread = <
	T extends TObject | Table,
	Mode extends "select" | "insert" | undefined,
>(
	schema: T,
	mode?: Mode,
): Spread<T, Mode> => {
	const newSchema: Record<string, unknown> = {};
	let table: unknown;

	switch (mode) {
		case "insert":
		case "select":
			if (Kind in (schema as Record<string, unknown>)) {
				table = schema;
				break;
			}
			table =
				mode === "insert"
					? createInsertSchema(schema as Table)
					: createSelectSchema(schema as Table);
			break;
		default:
			if (!(Kind in (schema as Record<string, unknown>)))
				throw new Error("Expect a schema");
			table = schema;
	}

	for (const key of Object.keys((table as TObject).properties))
		newSchema[key] = (table as TObject).properties[key];

	return newSchema as Spread<T, Mode>;
};

export const spreads = <
	T extends Record<string, TObject | Table>,
	Mode extends "select" | "insert" | undefined,
>(
	models: T,
	mode?: Mode,
): { [K in keyof T]: Spread<T[K], Mode> } => {
	const newSchema: Record<string, unknown> = {};
	const keys = Object.keys(models);

	for (const key of keys) newSchema[key] = spread(models[key], mode);

	return newSchema as { [K in keyof T]: Spread<T[K], Mode> };
};
