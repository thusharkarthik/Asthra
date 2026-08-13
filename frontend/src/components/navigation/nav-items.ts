import {
  Activity,
  Bot,
  Briefcase,
  Cable,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  HeartPulse,
  Home,
  Lightbulb,
  Image,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench
} from "lucide-react";
import type { NavItem, NavSection } from "@/types/navigation";

export const navSections: NavSection[] = [
  {
    label: "Platform",
    items: [
      { label: "Home", href: "/", icon: Home },
      { label: "Search", action: "search", icon: Search },
      { label: "Assistant", action: "assistant", icon: Sparkles },
      { label: "Favorites", href: "/favorites", icon: Star },
      { label: "CRUD Checklist", href: "/platform/crud-checklist", icon: ClipboardCheck },
      { label: "Platform Health", href: "/platform/health", icon: ShieldCheck }
    ]
  },
  {
    label: "Work",
    items: [
      { label: "Flow", href: "/flow", icon: Briefcase, requiredPermissions: ["flow.*.view"] },
      { label: "Discover", href: "/discover", icon: Lightbulb, requiredPermissions: ["discover.*.view"] },
      { label: "Docs", href: "/docs", icon: FileText, requiredPermissions: ["docs.*.view"] },
      { label: "Collab", href: "/collab", icon: Activity, requiredPermissions: ["collab.*.view"] }
    ]
  },
  {
    label: "Operations",
    items: [
      { label: "Desk", href: "/desk", icon: MessageSquare, requiredPermissions: ["desk.*.view"] },
      { label: "Pulse", href: "/pulse", icon: HeartPulse, requiredPermissions: ["pulse.*.view"] },
      { label: "Automation", href: "/automation", icon: Bot }
    ]
  },
  {
    label: "Engineering",
    items: [
      { label: "Dev", href: "/dev", icon: Wrench, requiredPermissions: ["dev.*.view"] },
      { label: "Connect", href: "/connect", icon: Cable }
    ]
  },
  {
    label: "Intelligence",
    items: [
      { label: "Insights", href: "/insights", icon: Gauge, requiredPermissions: ["insights.*.view"] },
      { label: "Memory", href: "/memory", icon: Database, disabled: true }
    ]
  },
  {
    label: "Admin",
    items: [
      { label: "Guard", href: "/guard", icon: ShieldCheck, requiredPermissions: ["guard.audit.view"] },
      { label: "Media", href: "/media", icon: Image, requiredPermissions: ["media.*.view"] },
      { label: "Settings", href: "/settings", icon: Settings, requiredPermissions: ["settings.*.view", "settings.*.manage"] }
    ]
  }
];

export const navItems: NavItem[] = navSections.flatMap((section) => section.items);
export const utilityNavItems: NavItem[] = [];
