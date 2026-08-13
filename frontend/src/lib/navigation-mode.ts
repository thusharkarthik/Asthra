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
      { label: "Home", href: "/", icon: Home },
      { label: "Organizations", href: "/settings/organizations", icon: Building2, permission: "settings.organization.view" },
      { label: "Members", href: "/settings/members", icon: Users, permission: "settings.member.view" },
      { label: "Access Control", href: "/settings/access-control", icon: Shield, permissions: ["settings.access_control.view", "settings.role.view", "settings.permission.view"] },
      { label: "Audit Logs", href: "/settings/audit-logs", icon: ScrollText, permission: "guard.audit.view" },
      { label: "API Keys", href: "/settings/api-keys", icon: Key },
      { label: "Platform Health", href: "/platform/health", icon: Activity, permission: "settings.organization.view" },
    ],
  },
  {
    label: "Admin",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

export const ORG_NAV: ModeNavSection[] = [
  {
    label: "Organization",
    items: [
      { label: "Home", href: "/", icon: Home },
      { label: "Workspaces", href: "/settings/workspaces", icon: Layers, permission: "settings.workspace.view" },
      { label: "Members", href: "/settings/members", icon: Users, permission: "settings.member.view" },
      { label: "Teams", href: "/settings/teams", icon: UsersRound, permission: "settings.team.view" },
      { label: "Roles", href: "/settings/roles", icon: Shield, permission: "settings.role.view" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Org Settings", href: "/settings/organizations", icon: Building2, permission: "settings.organization.view" },
      { label: "Preferences", href: "/settings/preferences", icon: SlidersHorizontal },
      { label: "Profile", href: "/settings/profile", icon: User },
    ],
  },
];

export const WORK_NAV: ModeNavSection[] = [
  {
    label: "Work",
    items: [
      { label: "Home", href: "/", icon: Home },
      { label: "Flow", href: "/flow", icon: Zap, permission: "flow.work_item.view" },
      { label: "Discover", href: "/discover", icon: Lightbulb, permission: "discover.idea.view" },
      { label: "Docs", href: "/docs", icon: BookOpen, permission: "docs.page.view" },
      { label: "Collab", href: "/collab", icon: MessageSquare, permission: "collab.thread.view" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Desk", href: "/desk", icon: Ticket, permission: "desk.ticket.view" },
      { label: "Pulse", href: "/pulse", icon: Activity, permission: "pulse.incident.view" },
      { label: "Automation", href: "/automation", icon: Workflow, permission: "automation.rule.view" },
    ],
  },
  {
    label: "Engineering",
    items: [
      { label: "Dev", href: "/dev", icon: Code2, permission: "dev.release.view" },
      { label: "Connect", href: "/connect", icon: Plug, permission: "connect.integration.view" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Insights", href: "/insights", icon: BarChart3, permission: "insights.report.view" },
      { label: "Memory", href: "/memory", icon: Brain },
      { label: "Assistant", href: "/assistant", icon: Bot },
    ],
  },
  {
    label: "Admin",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

export function navSectionsForMode(mode: NavigationMode): ModeNavSection[] {
  if (mode === "platform") return PLATFORM_NAV;
  if (mode === "org") return ORG_NAV;
  return WORK_NAV;
}
