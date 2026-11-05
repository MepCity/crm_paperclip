CREATE TABLE approval_processes (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  kind text NOT NULL CHECK (kind IN ('approval', 'review')),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  module text NOT NULL CHECK (length(module) BETWEEN 1 AND 80),
  trigger text NOT NULL CHECK (trigger IN ('create', 'edit', 'create_or_edit')),
  criteria jsonb NOT NULL DEFAULT '{"kind":"all_records"}'::jsonb,
  steps jsonb NOT NULL CHECK (jsonb_typeof(steps) = 'array' AND jsonb_array_length(steps) BETWEEN 1 AND 5),
  review_fields jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(review_fields) = 'array'),
  on_approve jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(on_approve) = 'array'),
  on_reject jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(on_reject) = 'array'),
  active boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id)
);

CREATE UNIQUE INDEX approval_processes_name_unique
  ON approval_processes (organization_id, kind, module, lower(name));

CREATE TABLE approval_requests (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  process_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('approval', 'review')),
  record_module text NOT NULL,
  record_id text NOT NULL,
  record_label text NOT NULL DEFAULT '',
  submitter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  current_step int NOT NULL DEFAULT 1 CHECK (current_step >= 1),
  status text NOT NULL CHECK (
    (kind = 'approval' AND status IN ('pending', 'approved', 'rejected', 'recalled'))
    OR (kind = 'review' AND status IN ('waiting_review', 'in_review', 'waiting_rereview', 'rejected', 'approved', 'recalled'))
  ),
  decided_at timestamptz,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, process_id) REFERENCES approval_processes(organization_id, id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX approval_requests_one_open_per_record
  ON approval_requests (organization_id, record_module, record_id)
  WHERE status IN ('pending', 'waiting_review', 'in_review', 'waiting_rereview');
CREATE INDEX approval_requests_submitted_idx
  ON approval_requests (organization_id, submitted_at DESC, id DESC);

CREATE TABLE approval_request_approvers (
  organization_id uuid NOT NULL,
  request_id uuid NOT NULL,
  step int NOT NULL CHECK (step >= 1),
  user_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'approved', 'rejected', 'delegated', 'skipped')),
  delegated_from_user_id uuid,
  PRIMARY KEY (organization_id, request_id, step, user_id),
  FOREIGN KEY (organization_id, request_id) REFERENCES approval_requests(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, user_id) REFERENCES memberships(organization_id, user_id) ON DELETE CASCADE
);

CREATE INDEX approval_request_approvers_queue_idx
  ON approval_request_approvers (organization_id, user_id, state);

CREATE TABLE approval_actions (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  request_id uuid NOT NULL,
  step int NOT NULL DEFAULT 1,
  actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'delegated', 'recalled', 'auto_approved')),
  comment text,
  target_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  acted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, request_id) REFERENCES approval_requests(organization_id, id) ON DELETE CASCADE
);

CREATE INDEX approval_actions_request_idx ON approval_actions (organization_id, request_id, acted_at, id);
CREATE INDEX approval_actions_acted_idx ON approval_actions (organization_id, acted_at DESC, id DESC);

CREATE TABLE notifications (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  recipient_user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('mention', 'post_comment', 'post_like', 'followed_update', 'approval_assigned', 'approval_decided', 'review_assigned', 'review_decided')),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  subject jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  seen_at timestamptz,
  read_at timestamptz,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, recipient_user_id) REFERENCES memberships(organization_id, user_id) ON DELETE CASCADE
);

CREATE INDEX notifications_recipient_idx
  ON notifications (organization_id, recipient_user_id, created_at DESC, id DESC);

ALTER TABLE approval_processes OWNER TO crm_owner;
ALTER TABLE approval_requests OWNER TO crm_owner;
ALTER TABLE approval_request_approvers OWNER TO crm_owner;
ALTER TABLE approval_actions OWNER TO crm_owner;
ALTER TABLE notifications OWNER TO crm_owner;

ALTER TABLE approval_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_request_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON approval_processes TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON approval_requests TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON approval_request_approvers TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON approval_actions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON notifications TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));

GRANT SELECT, INSERT, UPDATE, DELETE ON approval_processes TO crm_app;
GRANT SELECT, INSERT, UPDATE ON approval_requests, approval_request_approvers, notifications TO crm_app;
GRANT SELECT, INSERT ON approval_actions TO crm_app;
