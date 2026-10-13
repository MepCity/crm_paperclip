-- Fails on existing duplicate (provider_id, account_id) pairs or emails that differ only by case; does not delete or merge rows.
DROP INDEX "users_email_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_unique" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));