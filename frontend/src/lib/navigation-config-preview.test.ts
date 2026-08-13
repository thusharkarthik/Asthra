import { describe, expect, it } from "vitest";
import { calculateNavigationPreviewItems, countNavigationPreviewStates } from "@/lib/navigation-config-preview";
import type { NavigationRegistryItem, RoleNavigationConfigPreviewItem } from "@/types/core";

function registryItem(overrides: Partial<NavigationRegistryItem> = {}): NavigationRegistryItem {
  return {
    nav_key: "organization.members",
    label: "Members",
    route: "/settings/members",
    mode: "org",
    group: "Organization",
    icon: "users",
    order: 30,
    required_any_permissions: ["settings.member.view"],
    required_feature_flag: null,
    module_key: null,
    default_visible: true,
    is_customizable: true,
    ...overrides,
  };
}

function previewItem(overrides: Partial<RoleNavigationConfigPreviewItem> = {}): RoleNavigationConfigPreviewItem {
  const base = registryItem(overrides);
  return {
    ...base,
    config: null,
    preview_visibility: "default",
    preview_label: base.label,
    preview_group: base.group,
    preview_order: base.order,
    ...overrides,
  };
}

describe("navigation config preview rules", () => {
  it("allows items when the selected role has one required permission", () => {
    const [item] = calculateNavigationPreviewItems({
      previewItems: [previewItem()],
      modeItems: [],
      editorState: {},
      rolePermissionCodes: new Set(["settings.member.view"]),
      featureFlags: {},
      permissionEvaluationReady: true,
    });

    expect(item.state).toBe("allowed");
    expect(item.missingPermissions).toEqual([]);
  });

  it("locks missing-permission items only when configured to show locked", () => {
    const [item] = calculateNavigationPreviewItems({
      previewItems: [previewItem({ preview_visibility: "show_locked_if_denied" })],
      modeItems: [],
      editorState: { "organization.members": { visibility: "show_locked_if_denied", orderOverride: "" } },
      rolePermissionCodes: new Set(),
      featureFlags: {},
      permissionEvaluationReady: true,
    });

    expect(item.state).toBe("locked");
    expect(item.missingPermissions).toEqual(["settings.member.view"]);
  });

  it("hides missing-permission items for default and show-when-allowed behavior", () => {
    const items = calculateNavigationPreviewItems({
      previewItems: [
        previewItem({ nav_key: "organization.members", preview_visibility: "default" }),
        previewItem({ nav_key: "organization.teams", label: "Teams", preview_visibility: "show_when_allowed" }),
      ],
      modeItems: [],
      editorState: { "organization.teams": { visibility: "show_when_allowed", orderOverride: "" } },
      rolePermissionCodes: new Set(),
      featureFlags: {},
      permissionEvaluationReady: true,
    });

    expect(items.map((item) => item.state)).toEqual(["hidden", "hidden"]);
  });

  it("hides items explicitly configured as hidden", () => {
    const [item] = calculateNavigationPreviewItems({
      previewItems: [previewItem()],
      modeItems: [],
      editorState: { "organization.members": { visibility: "hidden", orderOverride: "" } },
      rolePermissionCodes: new Set(["settings.member.view"]),
      featureFlags: {},
      permissionEvaluationReady: true,
    });

    expect(item.state).toBe("hidden");
    expect(item.reason).toContain("hides this item");
  });

  it("hides unavailable feature-flagged items even when permissions are present", () => {
    const [item] = calculateNavigationPreviewItems({
      previewItems: [previewItem({ nav_key: "work.flow", required_feature_flag: "module.flow.enabled", module_key: "flow" })],
      modeItems: [],
      editorState: {},
      rolePermissionCodes: new Set(["settings.member.view"]),
      featureFlags: { "module.flow.enabled": false },
      permissionEvaluationReady: true,
    });

    expect(item.state).toBe("hidden");
    expect(item.reason).toContain("feature flag");
  });

  it("counts allowed locked and hidden states", () => {
    const items = calculateNavigationPreviewItems({
      previewItems: [
        previewItem({ nav_key: "allowed", required_any_permissions: [] }),
        previewItem({ nav_key: "locked", preview_visibility: "show_locked_if_denied" }),
        previewItem({ nav_key: "hidden", preview_visibility: "hidden" }),
      ],
      modeItems: [],
      editorState: {
        locked: { visibility: "show_locked_if_denied", orderOverride: "" },
        hidden: { visibility: "hidden", orderOverride: "" },
      },
      rolePermissionCodes: new Set(),
      featureFlags: {},
      permissionEvaluationReady: true,
    });

    expect(countNavigationPreviewStates(items)).toEqual({ allowed: 1, locked: 1, hidden: 1 });
  });
});
