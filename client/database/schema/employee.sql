-- domain: employee & payroll — urutan apply: 03 (setelah auth, branches)
-- tabel: employee_details, payrolls

CREATE TABLE "employee_details" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "branch_id" text NOT NULL,
  "base_salary" numeric(12, 2) NOT NULL,
  "hire_date" date NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "employee_details_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "payrolls" (
  "id" text PRIMARY KEY NOT NULL,
  "employee_id" text NOT NULL,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "employee_details" ADD CONSTRAINT "employee_details_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "employee_details" ADD CONSTRAINT "employee_details_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employee_id_employee_details_id_fk"
  FOREIGN KEY ("employee_id") REFERENCES "public"."employee_details"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "employee_details_user_id_idx" ON "employee_details" USING btree ("user_id");
CREATE INDEX "employee_details_branch_id_idx" ON "employee_details" USING btree ("branch_id");
CREATE INDEX "payrolls_employee_id_idx" ON "payrolls" USING btree ("employee_id");
CREATE INDEX "payrolls_status_idx" ON "payrolls" USING btree ("status");
