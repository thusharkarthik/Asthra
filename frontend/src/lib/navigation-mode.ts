import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Building2,
  Code2,
  Home,
  Key,
  Layers,
  Lightbulb,
  MessageSquare,
  Plug,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Ticket,
  User,
  Users,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";
import type { CurrentUserResolvedRole } from "@/types/core";

export type NavigationMode = "platform" | "org" | "work";

export type ModeNavItem = {
  navKey?: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  permissions?: string[];
};

export type ModeNavSection = {
  label: string;
  items: ModeNavItem[];
};

const PLATFORM_ROLE_KEYS = new Set(["platform_owner", "platform_admin", "platform_support"]);
const ORG_ROLE_KEYS = new Set([
  "organization_owner",
  "organization_admin",
  "organization_auditor",
  "organization_member",
]);

export function detectNavigationMode(
  isSuperuser: boolean,
  roles: CurrentUserResolvedRole[]
): NavigationMode {
  if (isSuperuser) return "platform";
  const roleKeys = roles.map((r) => r.key);
  if (roleKeys.some((k) => PLATFORM_ROLE_KEYS.has(k))) return "platform";
  if (roleKeys.some((k) => ORG_ROLE_KEYS.has(k))) return "org";
  return "work";
}

const WORK_MODULE_PREFIXES = [
  "/flow",
  "/docs",
  "/discover",
  "/desk",
  "/pulse",
  "/automation",
  "/dev",
  "/connect",
  "/insights",
  "/collab",
  "/media",
  "/guard",
];

export function autoDetectModeFromPath(pathname: string): NavigationMode {
  if (WORK_MODULE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "work";
  }
  if (/^\/settings\/organizations\/\d/.test(pathname)) return "org";
  return "platform";
}

// STATIC FALLBACK NAV
// Used when backend availableModules are not yet loaded or context is unavailable.
// Primary nav is driven by modules[] from GET /context/platform via buildNavSections()
// in module-nav-registry.ts. These constants serve as the fallback and development reference.
export const PLATFORM_NAV: ModeNavSection[] = [
  {
    label: "Platform",
    items: [
      { navKey: "platform.home", label: "Home", href: "/", icon: Home },
      { navKey: "platform.organizations", label: "Organizations", href: "/settings/organizations", icon: Building2, permission: "settings.organization.view" },
      { navKey: "platform.members", label: "Members", href: "/settings/members", icon: Users, permission: "settings.member.view" },
      { navKey: "platform.access_control", label: "Access Control", href: "/settings/access-control", icon: Shield, permissions: ["settings.access_control.view", "settings.role.view", "settings.permission.view"] },
      { navKey: "platform.audit_logs", label: "Audit Logs", href: "/settings/audit-logs", icon: ScrollText, permission: "guard.audit.view" },
      { navKey: "platform.api_keys", label: "API Keys", href: "/settings/api-keys", icon: Key },
      { navKey: "platform.health", label: "Platform Health", href: "/platform/health", icon: Activity, permission: "settings.organization.view" },
    ],
  },
  {
    label: "Admin",
    items: [{ navKey: "platform.settings", label: "Settings", href: "/settings", icon: Settings }],
  },
];

export const ORG_NAV: ModeNavSection[] = [
  {
    label: "Organization",
    items: [
      { navKey: "organization.home", label: "Home", href: "/", icon: Home },
      { navKey: "organization.workspaces", label: "Workspaces", href: "/settings/workspaces", icon: Layers, permission: "settings.workspace.view" },
      { navKey: "organization.members", label: "Members", href: "/settings/members", icon: Users, permission: "settings.member.view" },
      { navKey: "organization.teams", label: "Teams", href: "/settings/teams", icon: UsersRound, permission: "settings.team.view" },
      { navKey: "organization.roles", label: "Roles", href: "/settings/roles", icon: Shield, permission: "settings.role.view" },
    ],
  },
  {
    label: "Settings",
    items: [
      { navKey: "organization.settings", label: "Org Settings", href: "/settings/organizations", icon: Building2, permission: "settings.organization.view" },
      { navKey: "organization.preferences", label: "Preferences", href: "/settings/preferences", icon: SlidersHorizontal },
      { navKey: "organization.profile", label: "Profile", href: "/settings/profile", icon: User },
    ],
  },
];

export const WORK_NAV: ModeNavSection[] = [
  {
    label: "Work",
    items: [
      { navKey: "work.home", label: "Home", href: "/", icon: Home },
      { navKey: "work.flow", label: "Flow", href: "/flow", icon: Zap, permission: "flow.work_item.view" },
      { navKey: "work.discover", label: "Discover", href: "/discover", icon: Lightbulb, permission: "discover.idea.view" },
      { navKey: "work.docs", label: "Docs", href: "/docs", icon: BookOpen, permission: "docs.page.view" },
      { navKey: "work.collab", label: "Collab", href: "/collab", icon: MessageSquare, permission: "collab.thread.view" },
    ],
  },
  {
    label: "Operations",
    items: [
      { navKey: "work.desk", label: "Desk", href: "/desk", icon: Ticket, permission: "desk.ticket.view" },
      { navKey: "work.pulse", label: "Pulse", href: "/pulse", icon: Activity, permission: "pulse.incident.view" },
      { navKey: "work.automation", label: "Automation", href: "/automation", icon: Workflow, permission: "automation.rule.view" },
    ],
  },
  {
    label: "Engineering",
    items: [
      { navKey: "work.dev", label: "Dev", href: "/dev", icon: Code2, permission: "dev.release.view" },
      { navKey: "work.connect", label: "Connect", href: "/connect", icon: Plug, permission: "connect.integration.view" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { navKey: "work.insights", label: "Insights", href: "/insights", icon: BarChart3, permission: "insights.report.view" },
      { navKey: "work.memory", label: "Memory", href: "/memory", icon: Brain },
      { navKey: "work.assistant", label: "Assistant", href: "/assistant", icon: Bot },
    ],
  },
  {
    label: "Admin",
    items: [{ navKey: "work.settings", label: "Settings", href: "/settings", icon: Settings }],
  },
];

export function navSectionsForMode(mode: NavigationMode): ModeNavSection[] {
  if (mode === "platform") return PLATFORM_NAV;
  if (mode === "org") return ORG_NAV;
  return WORK_NAV;
}
