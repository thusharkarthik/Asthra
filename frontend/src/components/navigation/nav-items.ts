import {
  Activity,
  Bot,
  Briefcase,
  Cable,
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
      { label: "Platform Health", href: "/platform/health", icon: ShieldCheck }
    ]
  },
  {
    label: "Work",
    items: [
      { label: "Flow", href: "/flow", icon: Briefcase },
      { label: "Discover", href: "/discover", icon: Lightbulb },
      { label: "Docs", href: "/docs", icon: FileText },
      { label: "Collab", href: "/collab", icon: Activity }
    ]
  },
  {
    label: "Operations",
    items: [
      { label: "Desk", href: "/desk", icon: MessageSquare },
      { label: "Pulse", href: "/pulse", icon: HeartPulse },
      { label: "Automation", href: "/automation", icon: Bot }
    ]
  },
  {
    label: "Engineering",
    items: [
      { label: "Dev", href: "/dev", icon: Wrench },
      { label: "Connect", href: "/connect", icon: Cable }
    ]
  },
  {
    label: "Intelligence",
    items: [
      { label: "Insights", href: "/insights", icon: Gauge },
      { label: "Memory", href: "/memory", icon: Database, disabled: true }
    ]
  },
  {
    label: "Admin",
    items: [
      { label: "Guard", href: "/guard", icon: ShieldCheck },
      { label: "Media", href: "/media", icon: Image },
      { label: "Settings", href: "/settings", icon: Settings }
    ]
  }
];

export const navItems: NavItem[] = navSections.flatMap((section) => section.items);
export const utilityNavItems: NavItem[] = [];
