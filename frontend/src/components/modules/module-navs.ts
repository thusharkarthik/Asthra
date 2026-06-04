import { Activity, AlertTriangle, BarChart3, Bell, BookOpen, Bot, Boxes, Cable, CheckCircle, ClipboardList, CloudUpload, Code2, Database, FileBarChart, FileText, Gauge, GitPullRequest, Image, KeyRound, LayoutDashboard, Link2, Megaphone, MessageSquare, Package, PlayCircle, Plug, RadioTower, Repeat, Shield, Tags, Users, Workflow } from "lucide-react";
import type { ModuleNavItem } from "@/components/modules/product-experience";

export const pulseNavItems: ModuleNavItem[] = [
  { href: "/pulse", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pulse/alerts", label: "Alerts", icon: Bell },
  { href: "/pulse/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/pulse/status-pages", label: "Status Pages", icon: RadioTower },
  { href: "/pulse/on-call", label: "On-call", icon: Users },
  { href: "/pulse/escalations", label: "Escalations", icon: Gauge },
  { href: "/pulse/postmortems", label: "Postmortems", icon: FileText }
];

export const devNavItems: ModuleNavItem[] = [
  { href: "/dev", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dev/repositories", label: "Repositories", icon: Code2 },
  { href: "/dev/pull-requests", label: "Pull Requests", icon: GitPullRequest },
  { href: "/dev/environments", label: "Environments", icon: CloudUpload },
  { href: "/dev/deployments", label: "Deployments", icon: PlayCircle },
  { href: "/dev/releases", label: "Releases", icon: Package },
  { href: "/dev/services", label: "Services", icon: Boxes },
  { href: "/dev/dependencies", label: "Dependencies", icon: Link2 }
];

export const collabNavItems: ModuleNavItem[] = [
  { href: "/collab", label: "Dashboard", icon: LayoutDashboard },
  { href: "/collab/threads", label: "Threads", icon: MessageSquare },
  { href: "/collab/mentions", label: "Mentions", icon: Bell },
  { href: "/collab/announcements", label: "Announcements", icon: Megaphone },
  { href: "/collab/team-updates", label: "Team Updates", icon: ClipboardList },
  { href: "/collab/activity", label: "Activity", icon: Activity }
];

export const automationNavItems: ModuleNavItem[] = [
  { href: "/automation", label: "Dashboard", icon: LayoutDashboard },
  { href: "/automation/workflows", label: "Workflows", icon: Workflow },
  { href: "/automation/executions", label: "Executions", icon: PlayCircle },
  { href: "/automation/schedules", label: "Schedules", icon: Repeat },
  { href: "/automation/templates", label: "Templates", icon: BookOpen },
  { href: "/automation/audit-logs", label: "Audit Logs", icon: Activity }
];

export const connectNavItems: ModuleNavItem[] = [
  { href: "/connect", label: "Dashboard", icon: LayoutDashboard },
  { href: "/connect/integrations", label: "Integrations", icon: Plug },
  { href: "/connect/connectors", label: "Connectors", icon: Cable },
  { href: "/connect/webhooks", label: "Webhooks", icon: RadioTower },
  { href: "/connect/sync-jobs", label: "Sync Jobs", icon: Repeat },
  { href: "/connect/api-connections", label: "API Connections", icon: KeyRound },
  { href: "/connect/event-subscriptions", label: "Event Subscriptions", icon: Bell }
];

export const guardNavItems: ModuleNavItem[] = [
  { href: "/guard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/guard/policies", label: "Policies", icon: Shield },
  { href: "/guard/access-reviews", label: "Access Reviews", icon: Users },
  { href: "/guard/compliance", label: "Compliance", icon: CheckCircle },
  { href: "/guard/audit-events", label: "Audit Events", icon: Activity },
  { href: "/guard/risks", label: "Risks", icon: AlertTriangle },
  { href: "/guard/retention", label: "Retention", icon: Database },
  { href: "/guard/exceptions", label: "Exceptions", icon: FileText }
];

export const insightsNavItems: ModuleNavItem[] = [
  { href: "/insights", label: "Dashboard", icon: LayoutDashboard },
  { href: "/insights/dashboards", label: "Dashboards", icon: BarChart3 },
  { href: "/insights/widgets", label: "Widgets", icon: Boxes },
  { href: "/insights/reports", label: "Reports", icon: FileBarChart },
  { href: "/insights/metrics", label: "Metrics", icon: Gauge },
  { href: "/insights/usage", label: "Usage", icon: Activity },
  { href: "/insights/events", label: "Events", icon: Bell }
];

export const mediaNavItems: ModuleNavItem[] = [
  { href: "/media", label: "Dashboard", icon: LayoutDashboard },
  { href: "/media/assets", label: "Assets", icon: Image },
  { href: "/media/collections", label: "Collections", icon: Boxes },
  { href: "/media/processing-jobs", label: "Processing Jobs", icon: PlayCircle },
  { href: "/media/transcripts", label: "Transcripts", icon: FileText },
  { href: "/media/annotations", label: "Annotations", icon: MessageSquare },
  { href: "/media/tags", label: "Tags", icon: Tags }
];
