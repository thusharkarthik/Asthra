import type { NavigationMode } from "./navigation-mode";
import type { ModuleRegistryItem } from "@/types/core";

export interface HelpStep {
  label: string;
  icon?: string;
}

export interface HelpCTA {
  label: string;
  action: string;
}

export interface HelpContent {
  title: string;
  description: string;
  steps: HelpStep[];
  cta?: HelpCTA | null;
  mode?: NavigationMode;
}

// ══════════════════════════════════════════════════
// HUMAN-WRITTEN CONTENT
// Add entries here when building new pages.
// Key = route path. Routes not listed here get
// auto-generated placeholder content.
// ══════════════════════════════════════════════════
export const HELP_CONTENT: Record<string, HelpContent> = {
  "/": {
    title: "Home",
    description: "Your personal dashboard. See recent activity, quick actions, and platform overview.",
    steps: [],
    cta: null,
  },
  "/flow": {
    title: "Flow",
    description: "Flow helps you plan, track, and deliver work. Create work items, organize them in backlog, plan sprints, move work across boards, and release completed work.",
    steps: [
      { label: "Work Item", icon: "📋" },
      { label: "Backlog", icon: "📥" },
      { label: "Sprint", icon: "🏃" },
      { label: "Board", icon: "📊" },
      { label: "Release", icon: "🚀" },
    ],
    cta: { label: "Create Work Item", action: "create-work-item" },
    mode: "work",
  },
  "/flow/backlog": {
    title: "Backlog",
    description: "The backlog holds all work that hasn't been assigned to a sprint yet. Prioritize and organize before sprint planning.",
    steps: [
      { label: "Add items", icon: "📝" },
      { label: "Prioritize", icon: "🎯" },
      { label: "Pull into Sprint", icon: "➡️" },
    ],
    cta: null,
    mode: "work",
  },
  "/flow/boards": {
    title: "Board",
    description: "The board shows your sprint's work items by status. Drag items across columns as work progresses.",
    steps: [
      { label: "To Do", icon: "📌" },
      { label: "In Progress", icon: "⚙️" },
      { label: "In Review", icon: "👁️" },
      { label: "Done", icon: "✅" },
    ],
    cta: null,
    mode: "work",
  },
  "/docs": {
    title: "Docs",
    description: "Docs is your team's knowledge base. Create spaces for different areas and pages for documentation, runbooks, and notes.",
    steps: [
      { label: "Space", icon: "🗂️" },
      { label: "Pages", icon: "📄" },
      { label: "Write", icon: "✍️" },
      { label: "Share", icon: "🔗" },
    ],
    cta: { label: "Create Space", action: "create-space" },
    mode: "work",
  },
  "/discover": {
    title: "Discover",
    description: "Discover is where ideas begin. Capture opportunities, validate them, and convert the best ones into execution work in Flow.",
    steps: [
      { label: "Idea", icon: "💡" },
      { label: "Validate", icon: "✅" },
      { label: "Prioritize", icon: "🎯" },
      { label: "Convert", icon: "⚡" },
    ],
    cta: { label: "Add Idea", action: "create-idea" },
    mode: "work",
  },
  "/desk": {
    title: "Desk",
    description: "Desk manages support tickets, incidents, and service requests. Track issues from creation to resolution.",
    steps: [
      { label: "Ticket", icon: "🎫" },
      { label: "Assign", icon: "👤" },
      { label: "Resolve", icon: "✅" },
      { label: "Close", icon: "🔒" },
    ],
    cta: null,
    mode: "work",
  },
  "/pulse": {
    title: "Pulse",
    description: "Pulse monitors operational health. Track incidents, postmortems, and service status in real time.",
    steps: [
      { label: "Detect", icon: "🔍" },
      { label: "Incident", icon: "🚨" },
      { label: "Resolve", icon: "✅" },
      { label: "Postmortem", icon: "📋" },
    ],
    cta: null,
    mode: "work",
  },
  "/collab": {
    title: "Collab",
    description: "Collab is your team communication hub. Channels, threads, and real-time discussion to keep everyone aligned.",
    steps: [
      { label: "Channel", icon: "💬" },
      { label: "Add Members", icon: "👥" },
      { label: "Post Message", icon: "📨" },
      { label: "Thread", icon: "🧵" },
    ],
    cta: null,
    mode: "work",
  },
  "/dev": {
    title: "Dev",
    description: "Dev connects your engineering workflow. Link branches, pull requests, and deployments to work items in Flow.",
    steps: [
      { label: "Repository", icon: "🔗" },
      { label: "Branch", icon: "🌿" },
      { label: "Open PR", icon: "📬" },
      { label: "Deploy", icon: "🚀" },
    ],
    cta: null,
    mode: "work",
  },
  "/insights": {
    title: "Insights",
    description: "Insights gives you platform analytics and reporting. Track team velocity, delivery metrics, and platform health over time.",
    steps: [
      { label: "Select Scope", icon: "🎯" },
      { label: "Metric", icon: "📈" },
      { label: "View Report", icon: "📊" },
      { label: "Share", icon: "🔗" },
    ],
    cta: null,
    mode: "work",
  },
  "/guard": {
    title: "Guard",
    description: "Guard provides audit logs and governance controls. Review who did what, when, and from where across the platform.",
    steps: [
      { label: "Filter Events", icon: "🔍" },
      { label: "Review Logs", icon: "📋" },
      { label: "Export Audit", icon: "📤" },
      { label: "Investigate", icon: "🕵️" },
    ],
    cta: null,
    mode: "work",
  },
  "/automation": {
    title: "Automation",
    description: "Automation lets you build workflows that respond to events across Asthra modules. Trigger actions, send notifications, and integrate with external services.",
    steps: [
      { label: "Trigger", icon: "⚡" },
      { label: "Conditions", icon: "🔀" },
      { label: "Actions", icon: "⚙️" },
      { label: "Activate", icon: "🟢" },
    ],
    cta: null,
    mode: "work",
  },
  "/assistant": {
    title: "Assistant",
    description: "Assistant is your AI-powered workspace guide. Ask questions, get context, and take actions using natural language.",
    steps: [
      { label: "Ask", icon: "💬" },
      { label: "Context", icon: "🧠" },
      { label: "Action", icon: "⚡" },
      { label: "Learn", icon: "📚" },
    ],
    cta: { label: "Ask Assistant", action: "open-assistant" },
    mode: "work",
  },
  "/memory": {
    title: "Memory",
    description: "Memory is Asthra's long-term project brain. Store decisions, architecture notes, session summaries, and context the AI should always know.",
    steps: [
      { label: "Decision", icon: "🧠" },
      { label: "Context", icon: "📝" },
      { label: "History", icon: "📅" },
      { label: "AI Uses", icon: "🤖" },
    ],
    cta: null,
    mode: "work",
  },
  "/settings": {
    title: "Settings",
    description: "Settings is the admin center for organizations, workspaces, projects, members, roles, and permissions.",
    steps: [
      { label: "Create Org", icon: "🏢" },
      { label: "Workspace", icon: "🗃️" },
      { label: "Invite", icon: "👥" },
      { label: "Assign Roles", icon: "🔑" },
    ],
    cta: null,
  },
  "/settings/members": {
    title: "Members",
    description: "Manage who has access to Asthra. Invite members, assign roles, and control access across your organization.",
    steps: [
      { label: "Invite", icon: "📧" },
      { label: "Role", icon: "🔑" },
      { label: "Scope", icon: "🎯" },
      { label: "Active", icon: "✅" },
    ],
    cta: { label: "Invite Member", action: "invite-member" },
  },
  "/settings/roles": {
    title: "Roles",
    description: "Roles define what members can do. Each role has a set of permissions that control access to resources and actions.",
    steps: [
      { label: "Choose Role", icon: "🎭" },
      { label: "Assign Perms", icon: "🔐" },
      { label: "Assign to Member", icon: "👤" },
      { label: "Access Granted", icon: "✅" },
    ],
    cta: null,
  },
  "/settings/permissions": {
    title: "Permissions",
    description: "Permissions are fine-grained access controls attached to roles. Browse the permission catalog and manage role-permission mappings.",
    steps: [
      { label: "Browse Catalog", icon: "📚" },
      { label: "Map to Role", icon: "🗺️" },
      { label: "Assign Role", icon: "👤" },
      { label: "Perm Active", icon: "✅" },
    ],
    cta: null,
  },
  "/settings/organizations": {
    title: "Organizations",
    description: "Create and manage the top-level homes for Asthra work. Each organization contains workspaces, projects, and members.",
    steps: [
      { label: "Create", icon: "🏢" },
      { label: "Configure", icon: "⚙️" },
      { label: "Invite Owner", icon: "👑" },
      { label: "Active", icon: "✅" },
    ],
    cta: { label: "Create Organization", action: "create-org" },
  },
  "/settings/workspaces": {
    title: "Workspaces",
    description: "Workspaces group projects and teams within an organization. Create workspaces for different teams or product areas.",
    steps: [
      { label: "Create", icon: "🗃️" },
      { label: "Add Projects", icon: "📁" },
      { label: "Invite Team", icon: "👥" },
      { label: "Configure", icon: "⚙️" },
    ],
    cta: { label: "Create Workspace", action: "create-workspace" },
  },
  "/settings/access-control": {
    title: "Access Control",
    description: "Manage roles and permissions across the platform. Define what each role can see and do using the permission engine.",
    steps: [
      { label: "Role", icon: "🛡️" },
      { label: "Permissions", icon: "🔑" },
      { label: "Assign", icon: "👤" },
      { label: "God Mode", icon: "👁️" },
    ],
    cta: null,
  },
  "/settings/audit-logs": {
    title: "Audit Logs",
    description: "Every action in Asthra is logged. Audit logs help you track changes, investigate issues, and maintain compliance.",
    steps: [
      { label: "Action", icon: "📝" },
      { label: "Who", icon: "👤" },
      { label: "When", icon: "🕐" },
      { label: "Filter", icon: "🔍" },
    ],
    cta: null,
  },
  "/settings/api-keys": {
    title: "API Keys",
    description: "Create and manage API keys for programmatic access to Asthra. Keys are scoped and can be revoked at any time.",
    steps: [
      { label: "Create", icon: "🔑" },
      { label: "Scope", icon: "🎯" },
      { label: "Copy Once", icon: "📋" },
      { label: "Revoke", icon: "🚫" },
    ],
    cta: { label: "Create API Key", action: "create-api-key" },
  },
};

// ══════════════════════════════════════════════════
// AUTO-REGISTRATION LOGIC
// ══════════════════════════════════════════════════

function generatePlaceholderContent(moduleName: string): HelpContent {
  return {
    title: moduleName,
    description: `${moduleName} — help content coming soon.`,
    steps: [],
    cta: null,
  };
}

// Merges all human-written HELP_CONTENT with any module routes
// not yet documented. New backend modules auto-appear with a
// placeholder so the Info button is never silently missing.
export function buildHelpRegistry(
  availableModules: ModuleRegistryItem[],
): Record<string, HelpContent> {
  const registry: Record<string, HelpContent> = { ...HELP_CONTENT };

  for (const m of availableModules) {
    if (!m.visible) continue;
    if (registry[m.route]) continue;

    registry[m.route] = generatePlaceholderContent(m.name);

    if (process.env.NODE_ENV === "development") {
      console.info(
        `[Help Registry] Missing content for: ${m.route} (${m.module_key}). ` +
          `Add an entry to HELP_CONTENT in convention-help-registry.ts`,
      );
    }
  }

  return registry;
}

const GENERIC_FALLBACK: HelpContent = {
  title: "Asthra",
  description: "AI-native execution platform for engineering and product teams.",
  steps: [],
  cta: null,
};

// Exact match → progressively shorter parent paths → root → generic fallback.
export function findHelpContent(
  registry: Record<string, HelpContent>,
  pathname: string,
): HelpContent {
  if (registry[pathname]) return registry[pathname];

  const parts = pathname.split("/").filter(Boolean);
  for (let i = parts.length - 1; i > 0; i--) {
    const parent = "/" + parts.slice(0, i).join("/");
    if (registry[parent]) return registry[parent];
  }

  return registry["/"] ?? GENERIC_FALLBACK;
}
