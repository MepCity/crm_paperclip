CREATE TABLE journeys (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  name text NOT NULL,
  module text NOT NULL CHECK (module IN ('Leads', 'Contacts', 'Accounts', 'Deals')),
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  draft_version_id uuid,
  active_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NOT NULL,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, created_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, updated_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX journeys_org_lower_name_idx ON journeys (organization_id, lower(name));

CREATE TABLE journey_versions (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  journey_id uuid NOT NULL,
  number int NOT NULL,
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'active', 'superseded')),
  states jsonb NOT NULL DEFAULT '[]'::jsonb,
  transitions jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at timestamptz,
  published_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, journey_id) REFERENCES journeys(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, published_by) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX journey_versions_org_journey_number_idx ON journey_versions (organization_id, journey_id, number);
CREATE UNIQUE INDEX journey_versions_one_draft_idx ON journey_versions (organization_id, journey_id) WHERE state = 'draft';
CREATE UNIQUE INDEX journey_versions_one_active_idx ON journey_versions (organization_id, journey_id) WHERE state = 'active';

ALTER TABLE journeys
  ADD CONSTRAINT journeys_draft_version_fk
  FOREIGN KEY (organization_id, draft_version_id) REFERENCES journey_versions(organization_id, id) ON DELETE SET NULL;

ALTER TABLE journeys
  ADD CONSTRAINT journeys_active_version_fk
  FOREIGN KEY (organization_id, active_version_id) REFERENCES journey_versions(organization_id, id) ON DELETE SET NULL;

CREATE TABLE journey_instances (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  journey_id uuid NOT NULL,
  version_id uuid NOT NULL,
  record_module text NOT NULL CHECK (record_module IN ('Leads', 'Contacts', 'Accounts', 'Deals')),
  record_id text NOT NULL,
  current_state_id text NOT NULL,
  state_entered_at timestamptz NOT NULL DEFAULT now(),
  deadline_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'exited', 'stopped')),
  generation int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, journey_id) REFERENCES journeys(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, version_id) REFERENCES journey_versions(organization_id, id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX journey_instances_one_active_idx ON journey_instances (organization_id, journey_id, record_module, record_id) WHERE status = 'active';
CREATE INDEX journey_instances_org_journey_idx ON journey_instances (organization_id, journey_id, status);
CREATE INDEX journey_instances_org_record_idx ON journey_instances (organization_id, record_module, record_id);

CREATE TABLE journey_transition_runs (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  instance_id uuid NOT NULL,
  transition_id text NOT NULL,
  event_id text NOT NULL,
  result text NOT NULL DEFAULT 'success',
  result_reason text,
  executed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, instance_id) REFERENCES journey_instances(organization_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX journey_transition_runs_run_idx ON journey_transition_runs (organization_id, instance_id, transition_id, event_id);

CREATE TABLE journey_due_actions (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  instance_id uuid NOT NULL,
  state_id text NOT NULL,
  action_id text NOT NULL,
  due_at timestamptz NOT NULL,
  generation int NOT NULL DEFAULT 1,
  outcome text,
  outcome_reason text,
  executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, instance_id) REFERENCES journey_instances(organization_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX journey_due_actions_run_idx ON journey_due_actions (organization_id, instance_id, state_id, action_id, generation);
CREATE INDEX journey_due_actions_due_idx ON journey_due_actions (organization_id, due_at) WHERE outcome IS NULL;

ALTER TABLE journeys OWNER TO crm_owner;
ALTER TABLE journey_versions OWNER TO crm_owner;
ALTER TABLE journey_instances OWNER TO crm_owner;
ALTER TABLE journey_transition_runs OWNER TO crm_owner;
ALTER TABLE journey_due_actions OWNER TO crm_owner;

ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_transition_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_due_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON journeys TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON journey_versions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON journey_instances TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON journey_transition_runs TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON journey_due_actions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));

GRANT SELECT, INSERT, UPDATE, DELETE ON journeys, journey_versions, journey_instances, journey_transition_runs, journey_due_actions TO crm_app;
