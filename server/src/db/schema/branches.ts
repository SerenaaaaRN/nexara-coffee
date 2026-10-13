import { relations } from "drizzle-orm";
import {
  index,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const branches = pgTable(
  "branches",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    address: text("address").notNull(),
    lat: numeric("lat", { precision: 10, scale: 7 }),
    lng: numeric("lng", { precision: 10, scale: 7 }),
    phone: text("phone"),
    openingTime: time("opening_time"),
    closingTime: time("closing_time"),
    status: text("status").notNull().default("active"),
    ownershipType: text("ownership_type").notNull().default("corporate"),
    managerId: text("manager_id")
      .unique()
      .references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("branches_name_idx").on(table.name),
    index("branches_status_idx").on(table.status),
    index("branches_created_at_idx").on(table.createdAt),
  ],
);

export const franchiseBranches = pgTable(
  "franchise_branches",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    branchId: text("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("franchise_branches_user_id_idx").on(table.userId),
    index("franchise_branches_branch_id_idx").on(table.branchId),
  ],
);

export const branchesRelations = relations(branches, ({ one, many }) => ({
  manager: one(user, {
    fields: [branches.managerId],
    references: [user.id],
  }),
  franchiseBranches: many(franchiseBranches),
}));

export const franchiseBranchesRelations = relations(
  franchiseBranches,
  ({ one }) => ({
    user: one(user, {
      fields: [franchiseBranches.userId],
      references: [user.id],
    }),
    branch: one(branches, {
      fields: [franchiseBranches.branchId],
      references: [branches.id],
    }),
  }),
);
