export type HelpStep = {
  label: string;
  icon?: string;
};

export type HelpContent = {
  title: string;
  description: string;
  steps: HelpStep[];
  cta: { label: string; action: string } | null;
};

export const HELP_REGISTRY: Record<string, HelpContent> = {
  "/": {
    title: "Home",
    description: "Your personal dashboard. See recent activity, quick actions, and platform overview.",
    steps: [],
    cta: null
  },
  "/flow": {
    title: "Flow",
    description: "Flow helps you plan, track, and deliver work. Create work items, organize them in backlog, plan sprints, move work across boards, and release completed work.",
    steps: [
      { label: "Work Item", icon: "📋" },
      { label: "Backlog", icon: "📥" },
      { label: "Sprint", icon: "🏃" },
      { label: "Board", icon: "📊" },
      { label: "Release", icon: "🚀" }
    ],
    cta: { label: "Create Work Item", action: "create-work-item" }
  },
  "/flow/backlog": {
    title: "Backlog",
    description: "The backlog holds all work that hasn't been assigned to a sprint yet. Prioritize and organize before sprint planning.",
    steps: [
      { label: "Add items", icon: "📝" },
      { label: "Prioritize", icon: "🎯" },
      { label: "Pull into Sprint", icon: "➡️" }
    ],
    cta: null
  },
  "/flow/boards": {
    title: "Board",
    description: "The board shows your sprint's work items by status. Drag items across columns as work progresses.",
    steps: [
      { label: "To Do", icon: "📌" },
      { label: "In Progress", icon: "⚙️" },
      { label: "In Review", icon: "👁️" },
      { label: "Done", icon: "✅" }
    ],
    cta: null
  },
  "/docs": {
    title: "Docs",
    description: "Docs is your team's knowledge base. Create spaces for different areas and pages for documentation, runbooks, and notes.",
    steps: [
      { label: "Space", icon: "🗂️" },
      { label: "Pages", icon: "📄" },
      { label: "Write", icon: "✍️" },
      { label: "Share", icon: "🔗" }
    ],
    cta: { label: "Create Space", action: "create-space" }
  },
  "/discover": {
    title: "Discover",
    description: "Discover is where ideas begin. Capture opportunities, validate them, and convert the best ones into execution work in Flow.",
    steps: [
      { label: "Idea", icon: "💡" },
      { label: "Validate", icon: "✅" },
      { label: "Prioritize", icon: "🎯" },
      { label: "Convert", icon: "⚡" }
    ],
    cta: { label: "Add Idea", action: "create-idea" }
  },
  "/settings": {
    title: "Settings",
    description: "Settings is the admin center for organizations, workspaces, projects, members, roles, and permissions.",
    steps: [
      { label: "Create Org", icon: "🏢" },
      { label: "Workspace", icon: "🗃️" },
      { label: "Invite", icon: "👥" },
      { label: "Assign Roles", icon: "🔑" }
    ],
    cta: null
  },
  "/settings/members": {
    title: "Members",
    description: "Manage who has access to Asthra. Invite members, assign roles, and control access across your organization.",
    steps: [
      { label: "Invite", icon: "📧" },
      { label: "Role", icon: "🔑" },
      { label: "Scope", icon: "🎯" },
      { label: "Active", icon: "✅" }
    ],
    cta: { label: "Invite Member", action: "invite-member" }
  },
  "/settings/roles": {
    title: "Roles",
    description: "Roles define what members can do. Each role has a set of permissions that control access to resources and actions.",
    steps: [
      { label: "Choose Role", icon: "🎭" },
      { label: "Assign Perms", icon: "🔐" },
      { label: "Assign to Member", icon: "👤" },
      { label: "Access Granted", icon: "✅" }
    ],
    cta: null
  },
  "/settings/permissions": {
    title: "Permissions",
    description: "Permissions are fine-grained access controls attached to roles. Browse the permission catalog and manage role-permission mappings.",
    steps: [
      { label: "Browse Catalog", icon: "📚" },
      { label: "Map to Role", icon: "🗺️" },
      { label: "Assign Role", icon: "👤" },
      { label: "Perm Active", icon: "✅" }
    ],
    cta: null
  },
  "/desk": {
    title: "Desk",
    description: "Desk manages support tickets, incidents, and service requests. Track issues from creation to resolution.",
    steps: [
      { label: "Ticket", icon: "🎫" },
      { label: "Assign", icon: "👤" },
      { label: "Resolve", icon: "✅" },
      { label: "Close", icon: "🔒" }
    ],
    cta: null
  },
  "/pulse": {
    title: "Pulse",
    description: "Pulse monitors operational health. Track incidents, postmortems, and service status in real time.",
    steps: [
      { label: "Detect", icon: "🔍" },
      { label: "Incident", icon: "🚨" },
      { label: "Resolve", icon: "✅" },
      { label: "Postmortem", icon: "📋" }
    ],
    cta: null
  },
  "/collab": {
    title: "Collab",
    description: "Collab is your team communication hub. Channels, threads, and real-time discussion to keep everyone aligned.",
    steps: [
      { label: "Channel", icon: "💬" },
      { label: "Add Members", icon: "👥" },
      { label: "Post Message", icon: "📨" },
      { label: "Thread", icon: "🧵" }
    ],
    cta: null
  },
  "/dev": {
    title: "Dev",
    description: "Dev connects your engineering workflow. Link branches, pull requests, and deployments to work items in Flow.",
    steps: [
      { label: "Repository", icon: "🔗" },
      { label: "Branch", icon: "🌿" },
      { label: "Open PR", icon: "📬" },
      { label: "Deploy", icon: "🚀" }
    ],
    cta: null
  },
  "/insights": {
    title: "Insights",
    description: "Insights gives you platform analytics and reporting. Track team velocity, delivery metrics, and platform health over time.",
    steps: [
      { label: "Select Scope", icon: "🎯" },
      { label: "Metric", icon: "📈" },
      { label: "View Report", icon: "📊" },
      { label: "Share", icon: "🔗" }
    ],
    cta: null
  },
  "/guard": {
    title: "Guard",
    description: "Guard provides audit logs and governance controls. Review who did what, when, and from where across the platform.",
    steps: [
      { label: "Filter Events", icon: "🔍" },
      { label: "Review Logs", icon: "📋" },
      { label: "Export Audit", icon: "📤" },
      { label: "Investigate", icon: "🕵️" }
    ],
    cta: null
  },
  "/automation": {
    title: "Automation",
    description: "Automation lets you build workflows that respond to events across Asthra modules. Trigger actions, send notifications, and integrate with external services.",
    steps: [
      { label: "Trigger", icon: "⚡" },
      { label: "Conditions", icon: "🔀" },
      { label: "Actions", icon: "⚙️" },
      { label: "Activate", icon: "🟢" }
    ],
    cta: null
  }
};

const FALLBACK_HELP: HelpContent = {
  title: "Asthra",
  description: "AI-native execution platform for engineering and product teams.",
  steps: [],
  cta: null
};

export function matchHelpContent(pathname: string): HelpContent {
  if (HELP_REGISTRY[pathname]) return HELP_REGISTRY[pathname];
  const keys = Object.keys(HELP_REGISTRY)
    .filter((key) => key !== "/")
    .sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (pathname.startsWith(`${key}/`)) return HELP_REGISTRY[key];
  }
  return FALLBACK_HELP;
}
