import {
  Bot,
  Calculator,
  Code2,
  Cpu,
  Database,
  GitBranch,
  LayoutGrid,
  MessageSquare,
  Shield,
  Sliders,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export interface SetupLinkItem {
  id: string;
  label: string;
  href?: (orgSlug: string) => string;
  disabled?: boolean;
  badge?: "sparkles" | "new";
  ariaLabel?: string;
  aliases?: string[];
}

export interface SetupCategory {
  id: string;
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  items: SetupLinkItem[];
}

export const setupCategories: readonly SetupCategory[] = [
  {
    id: "general",
    title: "General",
    icon: Sliders,
    items: [
      {
        id: "personal-settings",
        label: "Personal Settings",
        href: (slug) => `/crm/${slug}/settings/personal-settings`,
      },
      {
        id: "users",
        label: "Users",
        href: (slug) => `/crm/${slug}/settings/members`,
        aliases: ["Members"],
      },
      {
        id: "company-details",
        label: "Company Details",
        href: (slug) => `/crm/${slug}/settings/company-details`,
        aliases: ["Company Settings", "Organization Details"],
      },
      {
        id: "currencies",
        label: "Currencies",
        href: (slug) => `/crm/${slug}/settings/currencies`,
      },
      {
        id: "calendar-booking",
        label: "Calendar Booking",
        href: (slug) => `/crm/${slug}/settings/calendar-booking`,
      },
      {
        id: "motivator",
        label: "Motivator",
        disabled: true,
      },
      {
        id: "agents",
        label: "Agents",
        disabled: true,
        badge: "sparkles",
      },
    ],
  },
  {
    id: "security-control",
    title: "Security Control",
    icon: Shield,
    items: [
      { id: "profiles", label: "Profiles", disabled: true },
      { id: "roles-sharing", label: "Roles and Sharing", disabled: true },
      { id: "mail-addon-users", label: "Mail Add-on Users", disabled: true },
      { id: "compliance-settings", label: "Compliance Settings", disabled: true },
      { id: "territory-management", label: "Territory Management", disabled: true },
      { id: "trusted-domain", label: "Trusted Domain", disabled: true },
      { id: "support-access", label: "Support Access", disabled: true },
      { id: "sso-saml", label: "Single Sign-On(SAML)", disabled: true },
      { id: "security-policies", label: "Security Policies", disabled: true },
      { id: "active-directory-sync", label: "Active Directory Sync", disabled: true },
      { id: "login-history", label: "Login History", disabled: true },
      { id: "audit-log", label: "Audit Log", disabled: true },
    ],
  },
  {
    id: "channels",
    title: "Channels",
    icon: MessageSquare,
    items: [
      {
        id: "email",
        label: "Email",
        href: (slug) => `/crm/${slug}/settings/email-configuration`,
      },
      { id: "telephony", label: "Telephony", disabled: true },
      { id: "business-messaging", label: "Business Messaging", disabled: true },
      { id: "notification-sms", label: "Notification SMS", disabled: true },
      { id: "webforms", label: "Webforms", disabled: true },
      { id: "social", label: "Social", disabled: true },
      { id: "chat", label: "Chat", disabled: true },
      { id: "portals", label: "Portals", disabled: true },
    ],
  },
  {
    id: "customization",
    title: "Customization",
    icon: SlidersHorizontal,
    items: [
      {
        id: "modules-and-fields",
        label: "Modules and Fields",
        href: (slug) => `/crm/${slug}/settings/modules`,
      },
      { id: "pipelines", label: "Pipelines", disabled: true },
      { id: "wizards", label: "Wizards", disabled: true },
      { id: "kiosk-studio", label: "Kiosk Studio", disabled: true },
      { id: "canvas", label: "Canvas", disabled: true, badge: "sparkles" },
      { id: "customize-home-page", label: "Customize Home page", disabled: true },
      { id: "translations", label: "Translations", disabled: true },
      {
        id: "templates",
        label: "Templates",
        href: (slug) => `/crm/${slug}/settings/templates?type=email`,
      },
      { id: "teamspace", label: "Teamspace", disabled: true, badge: "sparkles" },
    ],
  },
  {
    id: "automation",
    title: "Automation",
    icon: Cpu,
    items: [
      {
        id: "workflow-rules",
        label: "Workflow Rules",
        href: (slug) => `/crm/${slug}/settings/workflow-rules`,
      },
      { id: "actions", label: "Actions", disabled: true },
      { id: "schedules", label: "Schedules", disabled: true },
      {
        id: "assignment-rules",
        label: "Assignment Rules",
        href: (slug) => `/crm/${slug}/settings/assignment-rules`,
        aliases: ["Assignment"],
      },
      { id: "scoring-rules", label: "Scoring Rules", disabled: true },
      { id: "cadences", label: "Cadences", disabled: true },
    ],
  },
  {
    id: "process-management",
    title: "Process Management",
    icon: GitBranch,
    items: [
      { id: "blueprint", label: "Blueprint", disabled: true },
      { id: "approval-processes", label: "Approval Processes", disabled: true },
      { id: "review-processes", label: "Review Processes", disabled: true },
      { id: "connected-workflow", label: "Connected Workflow", disabled: true, badge: "sparkles" },
    ],
  },
  {
    id: "experience-center",
    title: "Experience Center",
    icon: LayoutGrid,
    items: [
      { id: "signals", label: "Signals", disabled: true },
      { id: "commandcenter", label: "CommandCenter", disabled: true },
      { id: "segmentation", label: "Segmentation", disabled: true },
    ],
  },
  {
    id: "data-administration",
    title: "Data Administration",
    icon: Database,
    items: [
      {
        id: "import",
        label: "Import",
        href: (slug) => `/crm/${slug}/settings/import-history`,
        aliases: ["Import History"],
      },
      {
        id: "export",
        label: "Export",
        href: (slug) => `/crm/${slug}/settings/export-history`,
        aliases: ["Export History"],
      },
      { id: "data-backup", label: "Data Backup", disabled: true },
      { id: "remove-sample-data", label: "Remove sample data", disabled: true },
      { id: "storage", label: "Storage", disabled: true },
      {
        id: "recycle-bin",
        label: "Recycle Bin",
        href: (slug) => `/crm/${slug}/settings/recycle-bin`,
      },
      { id: "admin-tools", label: "Admin Tools", disabled: true },
      { id: "sandbox", label: "Sandbox", disabled: true },
      { id: "copy-customization", label: "Copy Customization", disabled: true },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    icon: Store,
    items: [
      { id: "all-extensions", label: "All", disabled: true },
      { id: "extensions", label: "Marketplace Extensions", disabled: true },
      { id: "google-extensions", label: "Google", disabled: true },
      { id: "microsoft-extensions", label: "Microsoft", disabled: true },
      { id: "extension-builder", label: "Extension Builder", disabled: true },
      { id: "facebook-extensions", label: "Facebook", disabled: true },
      { id: "linkedin-extensions", label: "LinkedIn", disabled: true },
      { id: "tiktok-extensions", label: "TikTok", disabled: true },
      { id: "quickbooks-extensions", label: "QuickBooks", disabled: true },
    ],
  },
  {
    id: "developer-hub",
    title: "Developer Hub",
    icon: Code2,
    items: [
      { id: "ai-agents", label: "AI Agents", disabled: true, badge: "sparkles" },
      { id: "apis-sdks", label: "APIs and SDKs", disabled: true },
      { id: "connections", label: "Connections", disabled: true },
      { id: "variables", label: "Variables", disabled: true },
      { id: "circuits", label: "Circuits", disabled: true },
      { id: "functions", label: "Functions", disabled: true },
      { id: "widgets", label: "Widgets", disabled: true },
      { id: "data-model", label: "Data Model", disabled: true },
      { id: "ui-builder", label: "UI Builder", disabled: true },
      { id: "queries", label: "Queries", disabled: true },
      { id: "client-script", label: "Client Script", disabled: true },
      { id: "cloud-solutions", label: "Cloud Solutions", disabled: true },
    ],
  },
  {
    id: "smart-ai",
    title: "Smart AI",
    icon: Bot,
    items: [
      { id: "ai-assistant-agents", label: "Agents", disabled: true },
      { id: "data-enrichment", label: "Data Enrichment", disabled: true },
      { id: "prediction", label: "Prediction", disabled: true },
      { id: "recommendation", label: "Recommendation", disabled: true },
      { id: "communication", label: "Communication", disabled: true },
      { id: "vision", label: "Vision", disabled: true },
      { id: "notifications", label: "Notifications", disabled: true },
      { id: "voice-of-customer", label: "Voice of the Customer", disabled: true },
      { id: "ai-models", label: "AI Models", disabled: true },
      { id: "custom-ai-studio", label: "Custom AI Studio", disabled: true },
      { id: "competitors", label: "Competitors", disabled: true },
      { id: "usage-data", label: "Usage Data", disabled: true },
    ],
  },
  {
    id: "cpq",
    title: "CPQ",
    icon: Calculator,
    items: [
      { id: "product-configurator", label: "Product Configurator", disabled: true },
      { id: "price-rules", label: "Price Rules", disabled: true },
      { id: "guided-selling", label: "Guided Selling", disabled: true },
    ],
  },
];
