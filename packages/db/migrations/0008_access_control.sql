-- ADR 0017: profiles, roles, groups, data sharing. Forward-only.
ALTER TABLE organizations ADD COLUMN owner_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;

CREATE TABLE access_profiles (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT uuidv7(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  kind text NOT NULL CHECK (kind IN ('administrator', 'standard', 'custom')),
  permissions jsonb NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  modified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id)
);
CREATE UNIQUE INDEX access_profiles_name_unique ON access_profiles (organization_id, lower(name));
CREATE UNIQUE INDEX access_profiles_system_kind_unique ON access_profiles (organization_id, kind) WHERE kind <> 'custom';

CREATE TABLE access_field_permissions (
  organization_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  module text NOT NULL,
  field_api_name text NOT NULL,
  access text NOT NULL CHECK (access IN ('read_only', 'hidden')),
  PRIMARY KEY (organization_id, profile_id, module, field_api_name),
  FOREIGN KEY (organization_id, profile_id) REFERENCES access_profiles (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE access_roles (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT uuidv7(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  parent_role_id uuid,
  share_with_peers boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  modified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, parent_role_id) REFERENCES access_roles (organization_id, id) ON DELETE RESTRICT,
  CHECK (parent_role_id IS NULL OR parent_role_id <> id)
);
CREATE UNIQUE INDEX access_roles_single_root ON access_roles (organization_id) WHERE parent_role_id IS NULL;
CREATE UNIQUE INDEX access_roles_name_unique ON access_roles (organization_id, lower(name));

CREATE TABLE access_groups (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT uuidv7(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  modified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id)
);
CREATE UNIQUE INDEX access_groups_name_unique ON access_groups (organization_id, lower(name));

CREATE TABLE access_group_members (
  organization_id uuid NOT NULL,
  group_id uuid NOT NULL,
  member_kind text NOT NULL CHECK (member_kind IN ('user', 'role', 'role_and_subordinates', 'group')),
  member_id uuid NOT NULL,
  PRIMARY KEY (organization_id, group_id, member_kind, member_id),
  FOREIGN KEY (organization_id, group_id) REFERENCES access_groups (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE access_module_defaults (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module text NOT NULL,
  level text NOT NULL CHECK (level IN ('private', 'public_read', 'public_read_write', 'public_read_write_delete')),
  PRIMARY KEY (organization_id, module)
);

CREATE TABLE access_sharing_rules (
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  id uuid NOT NULL DEFAULT uuidv7(),
  module text NOT NULL,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  source_kind text NOT NULL CHECK (source_kind IN ('role', 'role_and_subordinates', 'group')),
  source_id uuid NOT NULL,
  target_kind text NOT NULL CHECK (target_kind IN ('role', 'role_and_subordinates', 'group')),
  target_id uuid NOT NULL,
  level text NOT NULL CHECK (level IN ('read', 'read_write', 'read_write_delete')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  modified_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id)
);
CREATE INDEX access_sharing_rules_module_idx ON access_sharing_rules (organization_id, module);

CREATE TABLE member_access (
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  role_id uuid NOT NULL,
  PRIMARY KEY (organization_id, user_id),
  FOREIGN KEY (organization_id, user_id) REFERENCES memberships (organization_id, user_id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, profile_id) REFERENCES access_profiles (organization_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id, role_id) REFERENCES access_roles (organization_id, id) ON DELETE RESTRICT
);
CREATE INDEX member_access_profile_idx ON member_access (organization_id, profile_id);
CREATE INDEX member_access_role_idx ON member_access (organization_id, role_id);

CREATE TABLE access_versions (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  version bigint NOT NULL DEFAULT 1
);

ALTER TABLE invitations ADD COLUMN profile_id uuid, ADD COLUMN role_id uuid;
ALTER TABLE invitations
  ADD FOREIGN KEY (organization_id, profile_id) REFERENCES access_profiles (organization_id, id) ON DELETE SET NULL (profile_id),
  ADD FOREIGN KEY (organization_id, role_id) REFERENCES access_roles (organization_id, id) ON DELETE SET NULL (role_id);

ALTER TABLE access_profiles OWNER TO crm_owner;
ALTER TABLE access_field_permissions OWNER TO crm_owner;
ALTER TABLE access_roles OWNER TO crm_owner;
ALTER TABLE access_groups OWNER TO crm_owner;
ALTER TABLE access_group_members OWNER TO crm_owner;
ALTER TABLE access_module_defaults OWNER TO crm_owner;
ALTER TABLE access_sharing_rules OWNER TO crm_owner;
ALTER TABLE member_access OWNER TO crm_owner;
ALTER TABLE access_versions OWNER TO crm_owner;

ALTER TABLE access_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_field_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_module_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_sharing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON access_profiles TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON access_field_permissions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON access_roles TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON access_groups TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON access_group_members TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON access_module_defaults TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON access_sharing_rules TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON member_access TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON access_versions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));

GRANT SELECT, INSERT, UPDATE, DELETE ON access_profiles, access_field_permissions, access_roles,
  access_groups, access_group_members, access_module_defaults, access_sharing_rules, member_access
  TO crm_app;
GRANT SELECT, INSERT, UPDATE ON access_versions TO crm_app;

-- Backfill (ADR 0017 §10): every existing organisation gets the system profiles/roles, every
-- existing member becomes Administrator + CEO, and the owner is the earliest admin.
DO $$
DECLARE
  org record;
  admin_profile uuid;
  standard_profile uuid;
  root_role uuid;
  full_modules text[] := ARRAY['Leads','Contacts','Accounts','Deals','Tasks','Meetings','Calls','Campaigns','Cases','Solutions','Products','Quotes','Invoices'];
  mods jsonb;
  admin_perms jsonb;
  standard_perms jsonb;
  m text;
BEGIN
  mods := '{}'::jsonb;
  FOREACH m IN ARRAY full_modules LOOP
    mods := mods || jsonb_build_object(m, jsonb_build_object('view', true, 'create', true, 'edit', true, 'delete', true));
  END LOOP;
  admin_perms := jsonb_build_object(
    'schemaVersion', 1,
    'modules', mods,
    'features', jsonb_build_object(
      'reports', '{"view":true,"manage":true,"schedule":true,"export":true}'::jsonb,
      'analytics', '{"view":true,"manage":true,"export":true}'::jsonb,
      'documents', '{"view":true,"createTeamFolder":true,"associateTeamFolder":true,"editTeamFolder":true}'::jsonb,
      'notes', '{"view":true,"create":true,"edit":true,"delete":true}'::jsonb,
      'attachments', '{"view":true,"create":true,"delete":true}'::jsonb,
      'feeds', '{"view":true,"post":true}'::jsonb),
    'importModules', to_jsonb(full_modules),
    'exportModules', to_jsonb(full_modules),
    'email', jsonb_build_object('send', to_jsonb(full_modules), 'mass', to_jsonb(full_modules), 'delete', to_jsonb(full_modules)),
    'tools', jsonb_build_object(
      'massUpdate', to_jsonb(full_modules), 'massDelete', to_jsonb(full_modules),
      'changeOwner', to_jsonb(full_modules), 'massTransfer', to_jsonb(full_modules),
      'convert', '["Leads"]'::jsonb, 'share', to_jsonb(full_modules),
      'printView', to_jsonb(full_modules), 'findAndMerge', to_jsonb(full_modules),
      'manageViews', true, 'tags', true, 'recordTimeline', true, 'onlyListSubordinates', false),
    'admin', jsonb_build_object(
      'userManagement', true, 'moduleCustomization', true, 'manageCurrencies', true,
      'customizeHome', true, 'manageAutomation', true, 'manageTemplates', true,
      'emailSettings', true, 'dataManagement', true,
      'viewAllRecords', to_jsonb(full_modules), 'modifyAllRecords', to_jsonb(full_modules)));
  standard_perms := jsonb_set(admin_perms, '{admin}', jsonb_build_object(
      'userManagement', false, 'moduleCustomization', false, 'manageCurrencies', false,
      'customizeHome', false, 'manageAutomation', false, 'manageTemplates', false,
      'emailSettings', false, 'dataManagement', false,
      'viewAllRecords', '[]'::jsonb, 'modifyAllRecords', '[]'::jsonb));

  FOR org IN SELECT id FROM organizations LOOP
    INSERT INTO access_profiles (organization_id, name, description, kind, permissions)
      VALUES (org.id, 'Administrator', 'Full access to every module and setting.', 'administrator', admin_perms)
      RETURNING id INTO admin_profile;
    INSERT INTO access_profiles (organization_id, name, description, kind, permissions)
      VALUES (org.id, 'Standard', 'All permissions except administrative privileges.', 'standard', standard_perms)
      RETURNING id INTO standard_profile;
    INSERT INTO access_roles (organization_id, name, parent_role_id, share_with_peers)
      VALUES (org.id, 'CEO', NULL, true) RETURNING id INTO root_role;
    INSERT INTO access_roles (organization_id, name, parent_role_id, share_with_peers)
      VALUES (org.id, 'Manager', root_role, false);
    FOREACH m IN ARRAY full_modules LOOP
      INSERT INTO access_module_defaults (organization_id, module, level)
        VALUES (org.id, m, CASE WHEN m = 'Products' THEN 'public_read' ELSE 'private' END);
    END LOOP;
    UPDATE memberships SET role = 'admin' WHERE organization_id = org.id;
    INSERT INTO member_access (organization_id, user_id, profile_id, role_id)
      SELECT org.id, user_id, admin_profile, root_role FROM memberships WHERE organization_id = org.id;
    UPDATE organizations SET owner_user_id = (
      SELECT user_id FROM memberships WHERE organization_id = org.id ORDER BY created_at, user_id LIMIT 1
    ) WHERE id = org.id;
    INSERT INTO access_versions (organization_id, version) VALUES (org.id, 1);
  END LOOP;
END $$;
