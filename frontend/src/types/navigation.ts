import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href?: string;
  action?: "search" | "assistant";
  icon: LucideIcon;
  disabled?: boolean;
  requiredPermissions?: string[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
};
