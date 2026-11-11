CREATE TABLE ads_settings (
  organization_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status = 'disconnected'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE ad_campaigns (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ad_campaigns_org_lower_name_idx ON ad_campaigns (organization_id, lower(name));

CREATE TABLE ad_groups (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  campaign_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, campaign_id) REFERENCES ad_campaigns(organization_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ad_groups_org_campaign_lower_name_idx ON ad_groups (organization_id, campaign_id, lower(name));

CREATE TABLE ad_keywords (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  campaign_id uuid NOT NULL,
  ad_group_id uuid NOT NULL,
  name text NOT NULL,
  match_type text NOT NULL DEFAULT 'broad' CHECK (match_type IN ('exact', 'phrase', 'broad')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, campaign_id) REFERENCES ad_campaigns(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, ad_group_id) REFERENCES ad_groups(organization_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ad_keywords_org_group_lower_name_idx ON ad_keywords (organization_id, ad_group_id, lower(name));

CREATE TABLE ad_items (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  campaign_id uuid NOT NULL,
  ad_group_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, campaign_id) REFERENCES ad_campaigns(organization_id, id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id, ad_group_id) REFERENCES ad_groups(organization_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ad_items_org_group_lower_name_idx ON ad_items (organization_id, ad_group_id, lower(name));

CREATE TABLE record_attributions (
  organization_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT uuidv7(),
  record_module text NOT NULL CHECK (record_module IN ('Leads', 'Contacts', 'Deals', 'Accounts', 'Cases')),
  record_id text NOT NULL,
  gclid text CHECK (gclid IS NULL OR length(gclid) <= 255),
  utm_source text CHECK (utm_source IS NULL OR length(utm_source) <= 255),
  utm_medium text CHECK (utm_medium IS NULL OR length(utm_medium) <= 255),
  utm_campaign text CHECK (utm_campaign IS NULL OR length(utm_campaign) <= 255),
  utm_term text CHECK (utm_term IS NULL OR length(utm_term) <= 255),
  utm_content text CHECK (utm_content IS NULL OR length(utm_content) <= 255),
  campaign_id uuid,
  ad_group_id uuid,
  keyword_id uuid,
  ad_item_id uuid,
  source text NOT NULL CHECK (source IN ('webform', 'manual', 'conversion')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, campaign_id) REFERENCES ad_campaigns(organization_id, id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id, ad_group_id) REFERENCES ad_groups(organization_id, id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id, keyword_id) REFERENCES ad_keywords(organization_id, id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id, ad_item_id) REFERENCES ad_items(organization_id, id) ON DELETE SET NULL
);

CREATE INDEX record_attributions_org_record_idx ON record_attributions (organization_id, record_module, record_id);
CREATE INDEX record_attributions_org_campaign_idx ON record_attributions (organization_id, campaign_id);

ALTER TABLE ads_settings OWNER TO crm_owner;
ALTER TABLE ad_campaigns OWNER TO crm_owner;
ALTER TABLE ad_groups OWNER TO crm_owner;
ALTER TABLE ad_keywords OWNER TO crm_owner;
ALTER TABLE ad_items OWNER TO crm_owner;
ALTER TABLE record_attributions OWNER TO crm_owner;

ALTER TABLE ads_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON ads_settings TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON ad_campaigns TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON ad_groups TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON ad_keywords TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON ad_items TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));
CREATE POLICY tenant_isolation ON record_attributions TO crm_app
  USING (organization_id = (SELECT public.current_org_id()))
  WITH CHECK (organization_id = (SELECT public.current_org_id()));

GRANT SELECT, INSERT, UPDATE ON ads_settings TO crm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ad_campaigns, ad_groups, ad_keywords, ad_items, record_attributions TO crm_app;
