import {
  Activity,
  Bot,
  Briefcase,
  Cable,
  FileText,
  Gauge,
  HeartPulse,
  Home,
  Lightbulb,
  Image,
  MessageSquare,
  Settings,
  ShieldCheck,
  Wrench
} from "lucide-react";
import type { NavItem } from "@/types/navigation";

export const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Flow", href: "/flow", icon: Briefcase },
  { label: "Docs", href: "/docs", icon: FileText },
  { label: "Discover", href: "/discover", icon: Lightbulb },
  { label: "Desk", href: "/desk", icon: MessageSquare },
  { label: "Pulse", href: "/pulse", icon: HeartPulse },
  { label: "Dev", href: "/dev", icon: Wrench },
  { label: "Collab", href: "/collab", icon: Activity },
  { label: "Automation", href: "/automation", icon: Bot },
  { label: "Connect", href: "/connect", icon: Cable },
  { label: "Guard", href: "/guard", icon: ShieldCheck },
  { label: "Insights", href: "/insights", icon: Gauge },
  { label: "Media", href: "/media", icon: Image },
  { label: "Settings", href: "/settings", icon: Settings }
];

export const utilityNavItems: NavItem[] = [];
