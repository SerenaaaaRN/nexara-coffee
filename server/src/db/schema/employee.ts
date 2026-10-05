import { relations } from "drizzle-orm";
import {
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { branches } from "./branches";

export const employeeDetails = pgTable(
  "employee_details",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    branchId: text("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    baseSalary: numeric("base_salary", { precision: 12, scale: 2 }).notNull(),
    hireDate: date("hire_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("employee_details_user_id_idx").on(table.userId),
    index("employee_details_branch_id_idx").on(table.branchId),
  ],
);

export const payrolls = pgTable(
  "payrolls",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employeeDetails.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("payrolls_employee_id_idx").on(table.employeeId),
    index("payrolls_status_idx").on(table.status),
  ],
);

export const employeeDetailsRelations = relations(
  employeeDetails,
  ({ one, many }) => ({
    user: one(user, {
      fields: [employeeDetails.userId],
      references: [user.id],
    }),
    branch: one(branches, {
      fields: [employeeDetails.branchId],
      references: [branches.id],
    }),
    payrolls: many(payrolls),
  }),
);

export const payrollsRelations = relations(payrolls, ({ one }) => ({
  employee: one(employeeDetails, {
    fields: [payrolls.employeeId],
    references: [employeeDetails.id],
  }),
}));
