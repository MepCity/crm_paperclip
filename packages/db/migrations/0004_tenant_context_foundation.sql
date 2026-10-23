-- No domain tables or blanket grants. Provision the three base roles first.
CREATE FUNCTION public.current_org_id() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT nullif(current_setting('app.org_id', true), '')::uuid $$;
--> statement-breakpoint
ALTER FUNCTION public.current_org_id() OWNER TO crm_owner;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.current_org_id() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.current_org_id() TO crm_app;
--> statement-breakpoint
-- PostgreSQL grants TEMP to PUBLIC by default; runtime roles must have no DDL.
DO $$ BEGIN
  EXECUTE format('REVOKE TEMPORARY ON DATABASE %I FROM PUBLIC', current_database());
END $$;
