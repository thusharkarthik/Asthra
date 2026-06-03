import {
  Activity,
  Bot,
  Briefcase,
  FileText,
  Gauge,
  HeartPulse,
  Home,
  Lightbulb,
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
  { label: "Insights", href: "/insights", icon: Gauge },
  { label: "Settings", href: "/settings", icon: Settings }
];

export const utilityNavItems: NavItem[] = [{ label: "Guard", href: "/settings", icon: ShieldCheck }];
