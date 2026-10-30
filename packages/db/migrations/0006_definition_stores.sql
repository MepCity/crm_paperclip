-- Configuration only. No record values, executor, provider, or delivery state.
CREATE TABLE report_definitions (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 255),
  description text NOT NULL CHECK (length(description) <= 4000),
  module text NOT NULL,
  columns jsonb NOT NULL CHECK (jsonb_typeof(columns) = 'array'),
  criteria jsonb,
  grouping jsonb CHECK (grouping IS NULL),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 1 AND 200),
  created_by text NOT NULL,
  updated_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  UNIQUE (organization_id, idempotency_key)
);
CREATE UNIQUE INDEX report_definitions_name ON report_definitions (organization_id, module, lower(name));
CREATE TABLE assignment_shells (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  module text NOT NULL,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 255),
  description text NOT NULL CHECK (length(description) <= 4000),
  enabled boolean NOT NULL DEFAULT false CHECK (NOT enabled),
  entries jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (entries = '[]'::jsonb),
  fallback jsonb CHECK (fallback IS NULL),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 1 AND 200),
  PRIMARY KEY (organization_id, id),
  UNIQUE (organization_id, idempotency_key)
);
CREATE UNIQUE INDEX assignment_shells_name ON assignment_shells (organization_id, module, lower(name));
CREATE TABLE organization_email_addresses (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 255),
  address_normalized text NOT NULL CHECK (address_normalized = lower(address_normalized)),
  status text NOT NULL DEFAULT 'unverified' CHECK (status = 'unverified'),
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 1 AND 200),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  UNIQUE (organization_id, address_normalized),
  UNIQUE (organization_id, idempotency_key)
);
ALTER TABLE report_definitions OWNER TO crm_owner;
ALTER TABLE assignment_shells OWNER TO crm_owner;
ALTER TABLE organization_email_addresses OWNER TO crm_owner;
ALTER TABLE report_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_shells ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_email_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON report_definitions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON assignment_shells TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON organization_email_addresses TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
GRANT SELECT, INSERT, UPDATE ON report_definitions TO crm_app;
GRANT SELECT, INSERT ON assignment_shells, organization_email_addresses TO crm_app;
