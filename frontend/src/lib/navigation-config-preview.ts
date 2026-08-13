import type { NavigationRegistryItem, RoleNavigationConfigPreviewItem, RoleNavigationVisibility } from "@/types/core";

export type NavigationPreviewEditorState = {
  visibility: RoleNavigationVisibility;
  orderOverride: string;
};

export type NavigationPreviewState = "allowed" | "locked" | "hidden";

export type NavigationPreviewItem = {
  navKey: string;
  label: string;
  route: string;
  group: string;
  order: number;
  icon: string;
  moduleKey?: string | null;
  visibility: RoleNavigationVisibility;
  state: NavigationPreviewState;
  configSource: string;
  requiredPermissions: string[];
  missingPermissions: string[];
  reason: string;
};

export function buildNavigationPreviewBaseItems(
  previewItems: RoleNavigationConfigPreviewItem[] | undefined,
  modeItems: NavigationRegistryItem[],
): RoleNavigationConfigPreviewItem[] {
  if (previewItems?.length) return previewItems;
  return modeItems.map((item) => ({
    ...item,
    config: null,
    preview_visibility: "default" as RoleNavigationVisibility,
    preview_label: item.label,
    preview_group: item.group,
    preview_order: item.order,
  }));
}

export function navigationConfigSourceLabel(visibility: RoleNavigationVisibility) {
  if (visibility === "hidden") return "Hidden";
  if (visibility === "show_when_allowed") return "Show when allowed";
  if (visibility === "show_locked_if_denied") return "Show locked if denied";
  return "Default";
}

export function calculateNavigationPreviewItems({
  previewItems,
  modeItems,
  editorState,
  rolePermissionCodes,
  featureFlags,
  permissionEvaluationReady,
  permissionEvaluationUnavailable = false,
}: {
  previewItems?: RoleNavigationConfigPreviewItem[];
  modeItems: NavigationRegistryItem[];
  editorState: Record<string, NavigationPreviewEditorState>;
  rolePermissionCodes: Set<string>;
  featureFlags: Record<string, boolean>;
  permissionEvaluationReady: boolean;
  permissionEvaluationUnavailable?: boolean;
}): NavigationPreviewItem[] {
  return buildNavigationPreviewBaseItems(previewItems, modeItems)
    .map((item) => {
      const state = editorState[item.nav_key];
      const visibility = state?.visibility ?? item.preview_visibility ?? "default";
      const parsedOrder = state?.orderOverride?.trim() ? Number(state.orderOverride) : null;
      const order = parsedOrder != null && Number.isFinite(parsedOrder) ? parsedOrder : item.preview_order;
      const requiredPermissions = item.required_any_permissions ?? [];
      const hasRequiredPermission = requiredPermissions.length === 0 || requiredPermissions.some((permission) => rolePermissionCodes.has(permission));
      const missingPermissions = requiredPermissions.length > 0 && !hasRequiredPermission ? requiredPermissions : [];
      const featureUnavailable = Boolean(item.required_feature_flag && featureFlags[item.required_feature_flag] === false);
      let previewState: NavigationPreviewState = "allowed";
      let reason = "Role has required access for this preview item.";

      if (visibility === "hidden") {
        previewState = "hidden";
        reason = "Role navigation config hides this item.";
      } else if (featureUnavailable) {
        previewState = "hidden";
        reason = "Required module or feature flag is unavailable in the current context.";
      } else if (!item.default_visible && visibility === "default") {
        previewState = "hidden";
        reason = "Registry default visibility hides this item.";
      } else if (!permissionEvaluationReady && requiredPermissions.length > 0) {
        previewState = visibility === "show_locked_if_denied" ? "locked" : "hidden";
        reason = permissionEvaluationUnavailable
          ? "Permission evaluation is unavailable; preview is conservative."
          : "Permission evaluation is loading; preview is conservative.";
      } else if (!hasRequiredPermission) {
        if (visibility === "show_locked_if_denied") {
          previewState = "locked";
          reason = "Role lacks the required permission, and config asks to show a locked item.";
        } else {
          previewState = "hidden";
          reason = "Role lacks the required permission, so default/show-when-allowed behavior hides it.";
        }
      }

      return {
        navKey: item.nav_key,
        label: item.preview_label ?? item.label,
        route: item.route,
        group: item.preview_group ?? item.group,
        order,
        icon: item.icon,
        moduleKey: item.module_key,
        visibility,
        state: previewState,
        configSource: navigationConfigSourceLabel(visibility),
        requiredPermissions,
        missingPermissions,
        reason,
      };
    })
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label));
}

export function countNavigationPreviewStates(items: NavigationPreviewItem[]) {
  return items.reduce<Record<NavigationPreviewState, number>>(
    (counts, item) => {
      counts[item.state] += 1;
      return counts;
    },
    { allowed: 0, locked: 0, hidden: 0 },
  );
}
