import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString)
	throw new Error("DATABASE_URL environment variable is not set");

const pgClient = postgres(connectionString, {
	prepare: false,
	max: 20,
	idle_timeout: 30,
	connect_timeout: 30,
	max_lifetime: 60 * 30,
});
export const db = drizzle(pgClient, { schema });

export default db;
