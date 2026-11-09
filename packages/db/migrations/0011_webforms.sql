CREATE TABLE webforms (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  name text NOT NULL,
  module text NOT NULL CHECK (module IN ('Leads', 'Contacts', 'Cases')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  draft_version_id uuid,
  published_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, created_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, updated_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX webforms_org_lower_name_idx ON webforms (organization_id, lower(name));

CREATE TABLE webform_versions (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  form_id uuid NOT NULL,
  number int NOT NULL,
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'published', 'superseded')),
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  published_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, form_id) REFERENCES webforms(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, published_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX webform_versions_org_form_number_idx ON webform_versions (organization_id, form_id, number);
CREATE UNIQUE INDEX webform_versions_one_draft_idx ON webform_versions (organization_id, form_id) WHERE state = 'draft';
CREATE UNIQUE INDEX webform_versions_one_published_idx ON webform_versions (organization_id, form_id) WHERE state = 'published';

ALTER TABLE webforms
  ADD CONSTRAINT webforms_draft_version_fk
  FOREIGN KEY (organization_id, draft_version_id) REFERENCES webform_versions(organization_id, id) ON DELETE SET NULL;

ALTER TABLE webforms
  ADD CONSTRAINT webforms_published_version_fk
  FOREIGN KEY (organization_id, published_version_id) REFERENCES webform_versions(organization_id, id) ON DELETE SET NULL;

CREATE TABLE webform_locations (
  organization_id uuid NOT NULL,
  form_id uuid NOT NULL,
  origin text NOT NULL,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, form_id, origin),
  FOREIGN KEY (organization_id, form_id) REFERENCES webforms(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE webform_submissions (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  form_id uuid NOT NULL,
  version_id uuid NOT NULL,
  location text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('accepted', 'invalid', 'spam', 'duplicate_pending_approval', 'pending_approval', 'pending_double_opt_in', 'rejected_location', 'rate_limited')),
  record_module text,
  record_id text,
  payload jsonb,
  client_hash text NOT NULL,
  notification_state text NOT NULL DEFAULT 'none' CHECK (notification_state IN ('none', 'queued', 'sent', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, form_id) REFERENCES webforms(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, version_id) REFERENCES webform_versions(organization_id, id) ON DELETE RESTRICT
);

CREATE INDEX webform_submissions_org_form_created_idx ON webform_submissions (organization_id, form_id, created_at DESC);

CREATE TABLE webform_daily_stats (
  organization_id uuid NOT NULL,
  form_id uuid NOT NULL,
  day date NOT NULL,
  location text NOT NULL,
  visits int NOT NULL DEFAULT 0,
  accepted int NOT NULL DEFAULT 0,
  invalid int NOT NULL DEFAULT 0,
  spam int NOT NULL DEFAULT 0,
  duplicate_pending_approval int NOT NULL DEFAULT 0,
  pending_approval int NOT NULL DEFAULT 0,
  pending_double_opt_in int NOT NULL DEFAULT 0,
  rejected_location int NOT NULL DEFAULT 0,
  rate_limited int NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, form_id, day, location),
  FOREIGN KEY (organization_id, form_id) REFERENCES webforms(organization_id, id) ON DELETE CASCADE
);

CREATE TABLE webform_auto_response_rules (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  module text NOT NULL CHECK (module IN ('Leads', 'Contacts', 'Cases')),
  name text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  template_id text,
  position int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, created_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, updated_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

CREATE INDEX webform_auto_response_rules_org_pos_idx ON webform_auto_response_rules (organization_id, module, position);

CREATE TABLE public_rate_limits (
  organization_id uuid NOT NULL,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, bucket, window_start)
);

CREATE TABLE public_endpoint_keys (
  key_hash text NOT NULL PRIMARY KEY,
  organization_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('webform')),
  target_id uuid NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX public_endpoint_keys_org_target_idx ON public_endpoint_keys (organization_id, kind, target_id);

ALTER TABLE webforms OWNER TO crm_owner;
ALTER TABLE webform_versions OWNER TO crm_owner;
ALTER TABLE webform_locations OWNER TO crm_owner;
ALTER TABLE webform_submissions OWNER TO crm_owner;
ALTER TABLE webform_daily_stats OWNER TO crm_owner;
ALTER TABLE webform_auto_response_rules OWNER TO crm_owner;
ALTER TABLE public_rate_limits OWNER TO crm_owner;
ALTER TABLE public_endpoint_keys OWNER TO crm_owner;

ALTER TABLE webforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE webform_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webform_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webform_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webform_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE webform_auto_response_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON webforms TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON webform_versions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON webform_locations TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON webform_submissions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON webform_daily_stats TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON webform_auto_response_rules TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON public_rate_limits TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));

GRANT SELECT, INSERT, UPDATE ON webforms, webform_versions, webform_submissions, webform_daily_stats TO crm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON webform_locations, webform_auto_response_rules, public_rate_limits TO crm_app;
GRANT SELECT ON public_endpoint_keys TO crm_auth;
