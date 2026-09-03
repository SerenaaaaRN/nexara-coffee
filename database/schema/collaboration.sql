-- domain: chat (collaboration) — urutan apply: 03 (setelah auth, branches)
-- tabel: chat_channels, chat_channel_members, chat_messages
-- catatan: kolom last_read_at pernah ada (0002) lalu di-drop (0003) — final: tidak ada

CREATE TABLE "chat_channels" (
  "id" text PRIMARY KEY NOT NULL,
  "type" text NOT NULL,
  "branch_id" text,
  "name" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "chat_channel_members" (
  "id" text PRIMARY KEY NOT NULL,
  "channel_id" text NOT NULL,
  "user_id" text NOT NULL
);

CREATE TABLE "chat_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "channel_id" text NOT NULL,
  "sender_id" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_channel_members" ADD CONSTRAINT "chat_channel_members_channel_id_chat_channels_id_fk"
  FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_channel_members" ADD CONSTRAINT "chat_channel_members_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_channel_id_chat_channels_id_fk"
  FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_user_id_fk"
  FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "chat_channels_branch_id_idx" ON "chat_channels" USING btree ("branch_id");
CREATE INDEX "chat_channel_members_channel_id_idx" ON "chat_channel_members" USING btree ("channel_id");
CREATE INDEX "chat_channel_members_user_id_idx" ON "chat_channel_members" USING btree ("user_id");
CREATE INDEX "chat_messages_channel_id_idx" ON "chat_messages" USING btree ("channel_id");
CREATE INDEX "chat_messages_sender_id_idx" ON "chat_messages" USING btree ("sender_id");
