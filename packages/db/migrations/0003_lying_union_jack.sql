-- Fails if any user email is not lowercase or case-insensitive duplicates exist; does not update or delete rows.
DROP INDEX "users_email_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_lower_check" CHECK ("users"."email" = lower("users"."email"));