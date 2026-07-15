import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Brain,
  Building2,
  Code2,
  FolderKanban,
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
import type { LucideIcon } from "lucide-react";
import type { ModuleRegistryItem, NavigationRegistryItem, ResolvedNavigation } from "@/types/core";
import type { ModeNavItem, ModeNavSection, NavigationMode } from "@/lib/navigation-mode";

// Derive icon from module_key — more reliable than icon string from DB
export const MODULE_KEY_ICON_MAP: Record<string, LucideIcon> = {
  // Platform mode
  platform_home: Home,
  organizations: Building2,
  platform_members: Users,
  access_control: Shield,
  audit_logs: ScrollText,
  api_keys: Key,
  platform_health: Activity,
  platform_settings: Settings,
  // Org mode
  org_home: Home,
  workspaces: Layers,
  org_members: Users,
  teams: UsersRound,
  roles: Shield,
  org_settings: Building2,
  preferences: SlidersHorizontal,
  profile: User,
  // Work mode
  home: Home,
  flow: Zap,
  discover: Lightbulb,
  docs: BookOpen,
  collab: MessageSquare,
  desk: Ticket,
  pulse: Activity,
  automation: Workflow,
  dev: Code2,
  connect: Plug,
  insights: BarChart3,
  memory: Brain,
  assistant: Bot,
  guard: Shield,
};

const ICON_NAME_MAP: Record<string, LucideIcon> = {
  activity: Activity,
  bar_chart3: BarChart3,
  bell: Bell,
  book_open: BookOpen,
  bot: Bot,
  brain: Brain,
  building2: Building2,
  code2: Code2,
  folder_kanban: FolderKanban,
  home: Home,
  key: Key,
  layers: Layers,
  lightbulb: Lightbulb,
  message_square: MessageSquare,
  plug: Plug,
  scroll_text: ScrollText,
  settings: Settings,
  shield: Shield,
  sliders_horizontal: SlidersHorizontal,
  ticket: Ticket,
  user: User,
  users: Users,
  users_round: UsersRound,
  workflow: Workflow,
  zap: Zap,
};

// Backend category field → sidebar section label
const CATEGORY_TO_LABEL: Record<string, string> = {
  platform: "Platform",
  organization: "Organization",
  work: "Work",
  execution: "Work",
  product: "Work",
  knowledge: "Work",
  collaboration: "Work",
  operations: "Operations",
  engineering: "Engineering",
  intelligence: "Intelligence",
  admin: "Admin",
};

// Per-key section overrides: org-mode modules all share category="organization"
// but some belong in "Settings" rather than "Organization"
const MODULE_KEY_SECTION_OVERRIDE: Record<string, string> = {
  platform_settings: "Admin",
  org_settings: "Settings",
  preferences: "Settings",
  profile: "Settings",
};

const SECTION_ORDER = [
  "Platform",
  "Organization",
  "Work",
  "Operations",
  "Engineering",
  "Intelligence",
  "Settings",
  "Admin",
];

/**
 * Converts the backend availableModules array into sidebar sections for a given mode.
 * Returns ModeNavSection[] so it is a drop-in replacement for navSectionsForMode().
 */
export function buildNavSections(
  modules: ModuleRegistryItem[],
  navigationMode: NavigationMode,
): ModeNavSection[] {
  if (!modules || modules.length === 0) return [];

  // Filter by navigation mode and visible; sort by sort_order ascending
  const modeModules = modules
    .filter((m) => m.navigation_mode === navigationMode && m.visible)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (modeModules.length === 0) return [];

  const sectionMap = new Map<string, ModeNavItem[]>();

  for (const m of modeModules) {
    const sectionLabel =
      MODULE_KEY_SECTION_OVERRIDE[m.module_key] ??
      CATEGORY_TO_LABEL[m.category] ??
      "Other";

    if (!sectionMap.has(sectionLabel)) sectionMap.set(sectionLabel, []);

    sectionMap.get(sectionLabel)!.push({
      label: m.name,
      href: m.route,
      icon: MODULE_KEY_ICON_MAP[m.module_key] ?? Home,
      permission: m.required_permissions.length > 0 ? m.required_permissions[0] : undefined,
      permissions: m.required_permissions,
    });
  }

  // Build result in canonical section order
  const result: ModeNavSection[] = [];
  for (const label of SECTION_ORDER) {
    const items = sectionMap.get(label);
    if (items) result.push({ label, items });
  }
  // Append any sections not in the known order (future-proofing)
  for (const [label, items] of sectionMap) {
    if (!SECTION_ORDER.includes(label)) result.push({ label, items });
  }
  return result;
}

export function buildNavSectionsFromNavigation(
  navigation: ResolvedNavigation | null | undefined,
  navigationMode: NavigationMode,
): ModeNavSection[] {
  const items = navigation?.modes?.[navigationMode]?.items ?? [];
  if (items.length === 0) return [];

  const sectionMap = new Map<string, ModeNavItem[]>();
  for (const item of [...items].sort((a, b) => a.order - b.order)) {
    if (!sectionMap.has(item.group)) sectionMap.set(item.group, []);
    sectionMap.get(item.group)!.push(navItemToModeItem(item));
  }

  const result: ModeNavSection[] = [];
  for (const label of SECTION_ORDER) {
    const sectionItems = sectionMap.get(label);
    if (sectionItems) result.push({ label, items: sectionItems });
  }
  for (const [label, sectionItems] of sectionMap) {
    if (!SECTION_ORDER.includes(label)) result.push({ label, items: sectionItems });
  }
  return result;
}

function navItemToModeItem(item: NavigationRegistryItem): ModeNavItem {
  return {
    label: item.label,
    href: item.route,
    icon: ICON_NAME_MAP[item.icon] ?? (item.module_key ? MODULE_KEY_ICON_MAP[item.module_key] : undefined) ?? Home,
    permission: item.required_any_permissions.length > 0 ? item.required_any_permissions[0] : undefined,
    permissions: item.required_any_permissions,
  };
}
