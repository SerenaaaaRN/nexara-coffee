-- domain: system (audit log & notifikasi) — urutan apply: 05 (terakhir)
-- tabel: audit_logs, notifications

CREATE TABLE "audit_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "actor_id" text,
  "branch_id" text,
  "action" text NOT NULL,
  "target_table" text NOT NULL,
  "target_id" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "notifications" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "is_read" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_user_id_fk"
  FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");
CREATE INDEX "audit_logs_branch_id_idx" ON "audit_logs" USING btree ("branch_id");
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");
