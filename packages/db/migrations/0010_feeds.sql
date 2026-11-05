CREATE TABLE feed_posts (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  author_user_id uuid NOT NULL,
  body text NOT NULL CHECK ((deleted_at IS NULL AND length(body) BETWEEN 1 AND 5000) OR (deleted_at IS NOT NULL AND body = '')),
  record_module text,
  record_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  PRIMARY KEY (organization_id, id),
  CHECK ((record_module IS NULL AND record_id IS NULL) OR (record_module IS NOT NULL AND record_id IS NOT NULL)),
  FOREIGN KEY (organization_id, author_user_id) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

CREATE INDEX feed_posts_org_created_idx ON feed_posts (organization_id, created_at DESC, id DESC);
CREATE INDEX feed_posts_record_idx ON feed_posts (organization_id, record_module, record_id, created_at DESC);

CREATE TABLE feed_comments (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  post_id uuid,
  history_event_id text,
  record_module text,
  record_id text,
  author_user_id uuid NOT NULL,
  body text NOT NULL CHECK ((deleted_at IS NULL AND length(body) BETWEEN 1 AND 5000) OR (deleted_at IS NOT NULL AND body = '')),
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  PRIMARY KEY (organization_id, id),
  CHECK ((post_id IS NOT NULL AND history_event_id IS NULL) OR (post_id IS NULL AND history_event_id IS NOT NULL AND record_module IS NOT NULL AND record_id IS NOT NULL)),
  FOREIGN KEY (organization_id, post_id) REFERENCES feed_posts(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, author_user_id) REFERENCES memberships(organization_id, user_id) ON DELETE RESTRICT
);

CREATE INDEX feed_comments_post_idx ON feed_comments (organization_id, post_id, created_at, id);
CREATE INDEX feed_comments_event_idx ON feed_comments (organization_id, history_event_id, created_at, id);

CREATE TABLE feed_likes (
  organization_id uuid NOT NULL,
  target_kind text NOT NULL CHECK (target_kind IN ('post', 'comment', 'history_event')),
  target_id text NOT NULL,
  user_id uuid NOT NULL,
  record_module text,
  record_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, target_kind, target_id, user_id),
  FOREIGN KEY (organization_id, user_id) REFERENCES memberships(organization_id, user_id) ON DELETE CASCADE
);

CREATE TABLE feed_mentions (
  organization_id uuid NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('post', 'comment')),
  source_id uuid NOT NULL,
  user_id uuid NOT NULL,
  PRIMARY KEY (organization_id, source_kind, source_id, user_id),
  FOREIGN KEY (organization_id, user_id) REFERENCES memberships(organization_id, user_id) ON DELETE CASCADE
);

CREATE INDEX feed_mentions_user_idx ON feed_mentions (organization_id, user_id);

CREATE TABLE feed_follows (
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  target_kind text NOT NULL CHECK (target_kind IN ('record', 'user')),
  target_module text NOT NULL DEFAULT '' CHECK ((target_kind = 'record' AND target_module <> '') OR (target_kind = 'user' AND target_module = '')),
  target_id text NOT NULL,
  muted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id, target_kind, target_module, target_id),
  FOREIGN KEY (organization_id, user_id) REFERENCES memberships(organization_id, user_id) ON DELETE CASCADE
);

CREATE INDEX feed_follows_target_idx ON feed_follows (organization_id, target_kind, target_module, target_id);

ALTER TABLE feed_posts OWNER TO crm_owner;
ALTER TABLE feed_comments OWNER TO crm_owner;
ALTER TABLE feed_likes OWNER TO crm_owner;
ALTER TABLE feed_mentions OWNER TO crm_owner;
ALTER TABLE feed_follows OWNER TO crm_owner;

ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON feed_posts TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON feed_comments TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON feed_likes TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON feed_mentions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON feed_follows TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));

GRANT SELECT, INSERT, UPDATE ON feed_posts, feed_comments TO crm_app;
GRANT SELECT, INSERT, DELETE ON feed_likes TO crm_app;
GRANT SELECT, INSERT, DELETE ON feed_mentions TO crm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON feed_follows TO crm_app;
