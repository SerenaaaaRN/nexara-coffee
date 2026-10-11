import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { branches } from "./branches";

export const auditLogs = pgTable(
	"audit_logs",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		actorId: text("actor_id").references(() => user.id, {
			onDelete: "set null",
		}),
		branchId: text("branch_id").references(() => branches.id, {
			onDelete: "set null",
		}),
		action: text("action").notNull(),
		targetTable: text("target_table").notNull(),
		targetId: text("target_id"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("audit_logs_actor_id_idx").on(table.actorId),
		index("audit_logs_branch_id_idx").on(table.branchId),
	],
);

export const notifications = pgTable(
	"notifications",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: text("type").notNull(),
		title: text("title").notNull(),
		body: text("body"),
		isRead: boolean("is_read").notNull().default(false),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("notifications_user_id_idx").on(table.userId)],
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	actor: one(user, {
		fields: [auditLogs.actorId],
		references: [user.id],
	}),
	branch: one(branches, {
		fields: [auditLogs.branchId],
		references: [branches.id],
	}),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(user, {
		fields: [notifications.userId],
		references: [user.id],
	}),
}));
