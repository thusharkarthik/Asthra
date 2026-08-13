import type { ModeNavItem, ModeNavSection, NavigationMode } from "@/lib/navigation-mode";
import type { CurrentUserResolvedRole, RoleNavigationConfigResponse, RoleNavigationVisibility } from "@/types/core";

export type LiveNavigationItemState = "visible_clickable" | "visible_locked" | "hidden";

export type LiveNavigationConfigDiagnostics = {
  featureEnabled: boolean;
  fallbackUsed: boolean;
  fallbackReason: "flag_disabled" | "config_missing" | "config_unmatched" | "resolver_error" | null;
  matchedConfigCount: number;
  hiddenCount: number;
  lockedCount: number;
  clickableCount: number;
};

export type LiveNavigationConfigItem = ModeNavItem & {
  navigationConfigState?: Exclude<LiveNavigationItemState, "hidden">;
  navigationConfigReason?: string;
};

export type LiveNavigationConfigSection = Omit<ModeNavSection, "items"> & {
  items: LiveNavigationConfigItem[];
};

export type LiveNavigationConfigResult = {
  sections: LiveNavigationConfigSection[];
  diagnostics: LiveNavigationConfigDiagnostics;
};

export type LiveNavigationConfigInput = {
  sections: ModeNavSection[];
  featureEnabled: boolean;
  roleConfig?: RoleNavigationConfigResponse | null;
  canAccessItem: (item: ModeNavItem) => boolean;
};

const FALLBACK_DIAGNOSTICS: LiveNavigationConfigDiagnostics = {
  featureEnabled: false,
  fallbackUsed: true,
  fallbackReason: "flag_disabled",
  matchedConfigCount: 0,
  hiddenCount: 0,
  lockedCount: 0,
  clickableCount: 0,
};

export function mergeLiveNavigationCandidateSections(
  primarySections: ModeNavSection[],
  candidateSections: ModeNavSection[],
  roleConfig?: RoleNavigationConfigResponse | null,
): ModeNavSection[] {
  const lockedCandidateKeys = new Set(
    (roleConfig?.items ?? [])
      .filter((config) => config.is_active !== false && config.visibility === "show_locked_if_denied")
      .map((config) => config.nav_key),
  );
  if (candidateSections.length === 0 || lockedCandidateKeys.size === 0) return primarySections;

  const seenKeys = new Set<string>();
  const sectionMap = new Map<string, ModeNavSection>();
  const mergedSections: ModeNavSection[] = [];

  function itemKey(item: ModeNavItem) {
    return item.navKey ?? item.href;
  }

  function ensureSection(section: ModeNavSection) {
    let target = sectionMap.get(section.label);
    if (!target) {
      target = { ...section, items: [] };
      sectionMap.set(section.label, target);
      mergedSections.push(target);
    }
    return target;
  }

  for (const section of primarySections) {
    const target = ensureSection(section);
    for (const item of section.items) {
      const key = itemKey(item);
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      target.items.push(item);
    }
  }

  for (const section of candidateSections) {
    const target = ensureSection(section);
    for (const item of section.items) {
      const key = itemKey(item);
      if (seenKeys.has(key) || !lockedCandidateKeys.has(key)) continue;
      seenKeys.add(key);
      target.items.push(item);
    }
  }

  return mergedSections.filter((section) => section.items.length > 0);
}

export function resolveLiveNavigationConfig({
  sections,
  featureEnabled,
  roleConfig,
  canAccessItem,
}: LiveNavigationConfigInput): LiveNavigationConfigResult {
  if (!featureEnabled) {
    return { sections: sections as LiveNavigationConfigSection[], diagnostics: FALLBACK_DIAGNOSTICS };
  }

  const activeConfigs = (roleConfig?.items ?? []).filter((config) => config.is_active !== false);
  if (activeConfigs.length === 0) {
    return {
      sections: sections as LiveNavigationConfigSection[],
      diagnostics: { ...FALLBACK_DIAGNOSTICS, featureEnabled: true, fallbackReason: "config_missing" },
    };
  }

  try {
    const configsByKey = new Map(activeConfigs.map((config) => [config.nav_key, config]));
    let matchedConfigCount = 0;
    let hiddenCount = 0;
    let lockedCount = 0;
    let clickableCount = 0;

    const resolvedSections = sections
      .map((section) => {
        const resolvedItems: LiveNavigationConfigItem[] = [];
        for (const item of section.items) {
          const config = item.navKey ? configsByKey.get(item.navKey) : undefined;
          if (config) matchedConfigCount += 1;

          const visibility = config?.visibility ?? "default";
          const allowed = canAccessItem(item);
          const state = resolveItemState(visibility, allowed);

          if (state === "hidden") {
            hiddenCount += 1;
            continue;
          }

          if (state === "visible_locked") lockedCount += 1;
          if (state === "visible_clickable") clickableCount += 1;

          resolvedItems.push({
            ...item,
            label: config?.label_override ?? item.label,
            navigationConfigState: state,
            navigationConfigReason: state === "visible_locked" ? "Access restricted" : undefined,
          });
        }
        return { ...section, items: resolvedItems };
      })
      .filter((section) => section.items.length > 0);

    if (matchedConfigCount === 0) {
      return {
        sections: sections as LiveNavigationConfigSection[],
        diagnostics: {
          featureEnabled: true,
          fallbackUsed: true,
          fallbackReason: "config_unmatched",
          matchedConfigCount: 0,
          hiddenCount: 0,
          lockedCount: 0,
          clickableCount: 0,
        },
      };
    }

    return {
      sections: resolvedSections,
      diagnostics: {
        featureEnabled: true,
        fallbackUsed: false,
        fallbackReason: null,
        matchedConfigCount,
        hiddenCount,
        lockedCount,
        clickableCount,
      },
    };
  } catch {
    return {
      sections: sections as LiveNavigationConfigSection[],
      diagnostics: { ...FALLBACK_DIAGNOSTICS, featureEnabled: true, fallbackReason: "resolver_error" },
    };
  }
}

export function resolveItemState(visibility: RoleNavigationVisibility, allowed: boolean): LiveNavigationItemState {
  if (visibility === "hidden") return "hidden";
  if (allowed) return "visible_clickable";
  if (visibility === "show_locked_if_denied") return "visible_locked";
  return "hidden";
}

export function selectRoleForNavigationConfig(roles: CurrentUserResolvedRole[], mode: NavigationMode): CurrentUserResolvedRole | null {
  const candidates = roles.filter((role) => role.id > 0 && roleMatchesNavigationMode(role, mode));
  return candidates.length === 1 ? candidates[0] : null;
}

function roleMatchesNavigationMode(role: CurrentUserResolvedRole, mode: NavigationMode) {
  const scope = (role.source_scope_type || role.scope || "").toLowerCase();
  const roleScope = (role.scope || "").toLowerCase();
  if (mode === "platform") return scope === "platform" || roleScope === "platform";
  if (mode === "org") return ["org", "organization"].includes(scope) || ["org", "organization"].includes(roleScope);
  return !["platform", "org", "organization"].includes(scope || roleScope);
}
