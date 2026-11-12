-- Portals A: external identity and auth (ADR 0019 §5, ADR 0019a §1–§2).
-- Portal users are not members: no memberships/member_access rows, no AccessSnapshot.

CREATE TABLE portals (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  name text NOT NULL,
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  default_language text NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'tr')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, created_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, updated_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

-- One portal per organisation in this build.
CREATE UNIQUE INDEX portals_one_per_org_idx ON portals (organization_id);

CREATE TABLE portal_user_types (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  portal_id uuid NOT NULL,
  name text NOT NULL,
  primary_module text NOT NULL DEFAULT 'Contacts' CHECK (primary_module IN ('Contacts')),
  modules jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, portal_id) REFERENCES portals(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, created_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, updated_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX portal_user_types_org_portal_lower_name_idx ON portal_user_types (organization_id, portal_id, lower(name));

CREATE TABLE portal_identities (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  portal_id uuid NOT NULL,
  user_type_id uuid NOT NULL,
  email text NOT NULL CHECK (email = lower(email) AND length(email) BETWEEN 3 AND 254),
  display_name text NOT NULL DEFAULT '',
  password_hash text,
  record_module text NOT NULL DEFAULT 'Contacts' CHECK (record_module IN ('Contacts')),
  record_id text NOT NULL,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'disabled')),
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, portal_id) REFERENCES portals(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, user_type_id) REFERENCES portal_user_types(organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, created_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

-- Login emails are unique per organisation (ADR 0019a §1.2); one identity per Contact (§2.3).
CREATE UNIQUE INDEX portal_identities_org_email_idx ON portal_identities (organization_id, email);
CREATE UNIQUE INDEX portal_identities_org_record_idx ON portal_identities (organization_id, record_module, record_id);
CREATE INDEX portal_identities_org_user_type_idx ON portal_identities (organization_id, user_type_id);

CREATE TABLE portal_tokens (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  identity_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('invite', 'reset')),
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, identity_id) REFERENCES portal_identities(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, created_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX portal_tokens_org_hash_idx ON portal_tokens (organization_id, token_hash);
CREATE INDEX portal_tokens_org_identity_idx ON portal_tokens (organization_id, identity_id, kind);

CREATE TABLE portal_sessions (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  identity_id uuid NOT NULL,
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  client_hash text NOT NULL,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, identity_id) REFERENCES portal_identities(organization_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX portal_sessions_org_hash_idx ON portal_sessions (organization_id, token_hash);
CREATE INDEX portal_sessions_org_identity_idx ON portal_sessions (organization_id, identity_id, created_at);

CREATE TABLE portal_auth_events (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  portal_id uuid NOT NULL,
  identity_id uuid,
  kind text NOT NULL CHECK (kind IN (
    'login_succeeded', 'login_failed', 'locked', 'invitation_accepted',
    'reset_requested', 'reset_completed', 'logout', 'invited', 'disabled', 'enabled'
  )),
  client_hash text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, portal_id) REFERENCES portals(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, identity_id) REFERENCES portal_identities(organization_id, id) ON DELETE SET NULL (identity_id)
);

CREATE INDEX portal_auth_events_org_at_idx ON portal_auth_events (organization_id, portal_id, at DESC);

-- Slug resolution before any CRM context exists (ADR 0019a §1.2): key = hash of the slug.
ALTER TABLE public_endpoint_keys DROP CONSTRAINT public_endpoint_keys_kind_check;
ALTER TABLE public_endpoint_keys
  ADD CONSTRAINT public_endpoint_keys_kind_check CHECK (kind IN ('webform', 'portal'));

ALTER TABLE portals OWNER TO crm_owner;
ALTER TABLE portal_user_types OWNER TO crm_owner;
ALTER TABLE portal_identities OWNER TO crm_owner;
ALTER TABLE portal_tokens OWNER TO crm_owner;
ALTER TABLE portal_sessions OWNER TO crm_owner;
ALTER TABLE portal_auth_events OWNER TO crm_owner;

ALTER TABLE portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_auth_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON portals TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON portal_user_types TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON portal_identities TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON portal_tokens TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON portal_sessions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON portal_auth_events TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));

GRANT SELECT, INSERT, UPDATE, DELETE ON portals, portal_user_types, portal_identities TO crm_app;
GRANT SELECT, INSERT, UPDATE ON portal_tokens, portal_sessions TO crm_app;
GRANT SELECT, INSERT ON portal_auth_events TO crm_app;
