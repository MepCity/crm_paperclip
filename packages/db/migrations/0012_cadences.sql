CREATE TABLE cadences (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  name text NOT NULL,
  module text NOT NULL CHECK (module IN ('Leads', 'Contacts', 'Accounts', 'Deals')),
  description text NOT NULL DEFAULT '',
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

CREATE UNIQUE INDEX cadences_org_lower_name_idx ON cadences (organization_id, lower(name));

CREATE TABLE cadence_versions (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  cadence_id uuid NOT NULL,
  number int NOT NULL,
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'published', 'superseded')),
  audience jsonb NOT NULL DEFAULT '{"kind":"manual"}'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  exit_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at timestamptz,
  published_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, cadence_id) REFERENCES cadences(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, published_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX cadence_versions_org_cadence_number_idx ON cadence_versions (organization_id, cadence_id, number);
CREATE UNIQUE INDEX cadence_versions_one_draft_idx ON cadence_versions (organization_id, cadence_id) WHERE state = 'draft';
CREATE UNIQUE INDEX cadence_versions_one_published_idx ON cadence_versions (organization_id, cadence_id) WHERE state = 'published';

ALTER TABLE cadences
  ADD CONSTRAINT cadences_draft_version_fk
  FOREIGN KEY (organization_id, draft_version_id) REFERENCES cadence_versions(organization_id, id) ON DELETE SET NULL;

ALTER TABLE cadences
  ADD CONSTRAINT cadences_published_version_fk
  FOREIGN KEY (organization_id, published_version_id) REFERENCES cadence_versions(organization_id, id) ON DELETE SET NULL;

CREATE TABLE cadence_enrollments (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  cadence_id uuid NOT NULL,
  version_id uuid NOT NULL,
  record_module text NOT NULL CHECK (record_module IN ('Leads', 'Contacts', 'Accounts', 'Deals')),
  record_id text NOT NULL,
  enrolled_by uuid NOT NULL,
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'paused', 'completed', 'exited', 'stopped')),
  reason text,
  generation int NOT NULL DEFAULT 1,
  next_step_id text,
  next_due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, cadence_id) REFERENCES cadences(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, version_id) REFERENCES cadence_versions(organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, enrolled_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX cadence_enrollments_one_active_idx ON cadence_enrollments (organization_id, cadence_id, record_module, record_id) WHERE state IN ('active', 'paused');
CREATE INDEX cadence_enrollments_org_cadence_idx ON cadence_enrollments (organization_id, cadence_id, state);
CREATE INDEX cadence_enrollments_org_record_idx ON cadence_enrollments (organization_id, record_module, record_id);

CREATE TABLE cadence_step_runs (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  enrollment_id uuid NOT NULL,
  step_id text NOT NULL,
  generation int NOT NULL DEFAULT 1,
  outcome text NOT NULL,
  outcome_reason text,
  executed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, enrollment_id) REFERENCES cadence_enrollments(organization_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX cadence_step_runs_run_idx ON cadence_step_runs (organization_id, enrollment_id, step_id, generation);

ALTER TABLE cadences OWNER TO crm_owner;
ALTER TABLE cadence_versions OWNER TO crm_owner;
ALTER TABLE cadence_enrollments OWNER TO crm_owner;
ALTER TABLE cadence_step_runs OWNER TO crm_owner;

ALTER TABLE cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_step_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON cadences TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON cadence_versions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON cadence_enrollments TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON cadence_step_runs TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));

GRANT SELECT, INSERT, UPDATE, DELETE ON cadences, cadence_versions, cadence_enrollments, cadence_step_runs TO crm_app;
