CREATE SEQUENCE chat_change_seq;

CREATE TABLE chat_conversations (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  kind text NOT NULL CHECK (kind IN ('direct', 'group', 'channel')),
  name text CHECK ((kind = 'direct' AND name IS NULL) OR (kind IN ('group', 'channel') AND name IS NOT NULL AND length(btrim(name)) BETWEEN 1 AND 80)),
  visibility text CHECK ((kind = 'channel' AND visibility IN ('public', 'private')) OR (kind <> 'channel' AND visibility IS NULL)),
  direct_key text CHECK ((kind = 'direct' AND direct_key IS NOT NULL) OR (kind <> 'direct' AND direct_key IS NULL)),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seq int NOT NULL DEFAULT 0 CHECK (last_seq >= 0),
  last_message_at timestamptz,
  archived_at timestamptz,
  changed_seq bigint NOT NULL DEFAULT nextval('chat_change_seq'),
  PRIMARY KEY (organization_id, id),
  UNIQUE (organization_id, direct_key)
);

CREATE TABLE chat_members (
  organization_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  last_read_seq int NOT NULL DEFAULT 0 CHECK (last_read_seq >= 0),
  pinned_at timestamptz,
  changed_seq bigint NOT NULL DEFAULT nextval('chat_change_seq'),
  PRIMARY KEY (organization_id, conversation_id, user_id),
  FOREIGN KEY (organization_id, conversation_id) REFERENCES chat_conversations(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, user_id) REFERENCES memberships(organization_id, user_id) ON DELETE CASCADE
);

CREATE TABLE chat_messages (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  conversation_id uuid NOT NULL,
  seq int,
  thread_root_id uuid,
  author_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK ((deleted_at IS NULL AND length(body) BETWEEN 1 AND 10000) OR (deleted_at IS NOT NULL AND body = '')),
  mentions uuid[] NOT NULL DEFAULT '{}',
  reply_count int NOT NULL DEFAULT 0 CHECK (reply_count >= 0),
  last_reply_at timestamptz,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  changed_seq bigint NOT NULL DEFAULT nextval('chat_change_seq'),
  search tsvector GENERATED ALWAYS AS (to_tsvector('simple', body)) STORED,
  PRIMARY KEY (organization_id, id),
  UNIQUE (organization_id, conversation_id, seq),
  CHECK ((thread_root_id IS NULL AND seq IS NOT NULL AND seq > 0) OR (thread_root_id IS NOT NULL AND seq IS NULL)),
  FOREIGN KEY (organization_id, conversation_id) REFERENCES chat_conversations(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, thread_root_id) REFERENCES chat_messages(organization_id, id) ON DELETE CASCADE
);

CREATE INDEX chat_messages_search_idx ON chat_messages USING gin (search);

CREATE TABLE chat_thread_reads (
  organization_id uuid NOT NULL,
  thread_root_id uuid NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  changed_seq bigint NOT NULL DEFAULT nextval('chat_change_seq'),
  PRIMARY KEY (organization_id, thread_root_id, user_id),
  FOREIGN KEY (organization_id, thread_root_id) REFERENCES chat_messages(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, user_id) REFERENCES memberships(organization_id, user_id) ON DELETE CASCADE
);

CREATE TABLE chat_stars (
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id, message_id),
  FOREIGN KEY (organization_id, message_id) REFERENCES chat_messages(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, user_id) REFERENCES memberships(organization_id, user_id) ON DELETE CASCADE
);

CREATE TABLE chat_presence (
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'busy', 'away', 'invisible')),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id),
  FOREIGN KEY (organization_id, user_id) REFERENCES memberships(organization_id, user_id) ON DELETE CASCADE
);

ALTER SEQUENCE chat_change_seq OWNER TO crm_owner;
ALTER TABLE chat_conversations OWNER TO crm_owner;
ALTER TABLE chat_members OWNER TO crm_owner;
ALTER TABLE chat_messages OWNER TO crm_owner;
ALTER TABLE chat_thread_reads OWNER TO crm_owner;
ALTER TABLE chat_stars OWNER TO crm_owner;
ALTER TABLE chat_presence OWNER TO crm_owner;

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_thread_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON chat_conversations TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON chat_members TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON chat_messages TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON chat_thread_reads TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON chat_stars TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON chat_presence TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));

GRANT USAGE, SELECT ON SEQUENCE chat_change_seq TO crm_app;
GRANT SELECT, INSERT, UPDATE ON chat_conversations, chat_messages, chat_thread_reads, chat_presence TO crm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_members TO crm_app;
GRANT SELECT, INSERT, DELETE ON chat_stars TO crm_app;
