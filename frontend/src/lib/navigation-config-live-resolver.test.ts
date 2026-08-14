import { describe, expect, it } from "vitest";
import { Home } from "lucide-react";
import { mergeLiveNavigationCandidateSections, resolveLiveNavigationConfig, resolveItemState, selectRoleForNavigationConfig } from "@/lib/navigation-config-live-resolver";
import type { ModeNavSection } from "@/lib/navigation-mode";
import type { RoleNavigationConfigResponse } from "@/types/core";

const sections: ModeNavSection[] = [
  {
    label: "Organization",
    items: [
      { navKey: "organization.home", label: "Home", href: "/", icon: Home },
      { navKey: "organization.members", label: "Members", href: "/settings/members", icon: Home, permission: "settings.member.view" },
    ],
  },
];

function config(visibility: "default" | "hidden" | "show_when_allowed" | "show_locked_if_denied"): RoleNavigationConfigResponse {
  return {
    role_id: 1,
    mode: "org",
    items: [
      {
        id: 1,
        created_at: "2026-08-13T00:00:00Z",
        updated_at: "2026-08-13T00:00:00Z",
        role_id: 1,
        mode: "org",
        nav_key: "organization.members",
        visibility,
        is_active: true,
      },
    ],
  };
}

describe("live navigation config resolver", () => {
  it("returns the original sections unchanged when the feature flag is false", () => {
    for (const visibility of ["hidden", "show_locked_if_denied", "show_when_allowed"] as const) {
      const result = resolveLiveNavigationConfig({
        sections,
        featureEnabled: false,
        roleConfig: config(visibility),
        canAccessItem: () => false,
      });

      expect(result.sections).toBe(sections);
      expect(result.diagnostics.fallbackUsed).toBe(true);
      expect(result.diagnostics.fallbackReason).toBe("flag_disabled");
    }
  });

  it("returns the original sections unchanged when config is missing", () => {
    const result = resolveLiveNavigationConfig({
      sections,
      featureEnabled: true,
      roleConfig: null,
      canAccessItem: () => false,
    });

    expect(result.sections).toBe(sections);
    expect(result.diagnostics.fallbackReason).toBe("config_missing");
  });

  it("returns the original sections unchanged when config does not match any nav item", () => {
    const result = resolveLiveNavigationConfig({
      sections,
      featureEnabled: true,
      roleConfig: {
        role_id: 1,
        mode: "org",
        items: [{
          ...config("hidden").items[0],
          nav_key: "organization.not_registered",
        }],
      },
      canAccessItem: () => false,
    });

    expect(result.sections).toBe(sections);
    expect(result.diagnostics.fallbackReason).toBe("config_unmatched");
  });

  it("hides configured hidden items", () => {
    const result = resolveLiveNavigationConfig({
      sections,
      featureEnabled: true,
      roleConfig: config("hidden"),
      canAccessItem: () => true,
    });

    expect(result.sections[0].items.map((item) => item.label)).toEqual(["Home"]);
    expect(result.diagnostics.hiddenCount).toBe(1);
  });

  it("shows denied items as locked only when configured", () => {
    const result = resolveLiveNavigationConfig({
      sections,
      featureEnabled: true,
      roleConfig: config("show_locked_if_denied"),
      canAccessItem: (item) => item.label === "Home",
    });

    expect(result.sections[0].items.map((item) => [item.label, item.navigationConfigState])).toEqual([
      ["Home", "visible_clickable"],
      ["Members", "visible_locked"],
    ]);
    expect(result.sections[0].items.find((item) => item.label === "Members")?.navigationConfigMissingPermissions).toEqual([
      "settings.member.view",
    ]);
    expect(result.diagnostics.lockedCount).toBe(1);
  });

  it("keeps show_locked_if_denied items clickable when permission is present", () => {
    const result = resolveLiveNavigationConfig({
      sections,
      featureEnabled: true,
      roleConfig: config("show_locked_if_denied"),
      canAccessItem: () => true,
    });

    expect(result.sections[0].items.find((item) => item.label === "Members")?.navigationConfigState).toBe("visible_clickable");
    expect(result.diagnostics.lockedCount).toBe(0);
    expect(result.diagnostics.clickableCount).toBe(2);
  });

  it("keeps default denied items hidden like baseline access behavior", () => {
    const result = resolveLiveNavigationConfig({
      sections,
      featureEnabled: true,
      roleConfig: config("default"),
      canAccessItem: (item) => item.label === "Home",
    });

    expect(result.sections[0].items.map((item) => item.label)).toEqual(["Home"]);
    expect(result.diagnostics.fallbackUsed).toBe(false);
    expect(result.diagnostics.hiddenCount).toBe(1);
  });

  it("does not grant clickable access through show_when_allowed", () => {
    const result = resolveLiveNavigationConfig({
      sections,
      featureEnabled: true,
      roleConfig: config("show_when_allowed"),
      canAccessItem: (item) => item.label === "Home",
    });

    expect(result.sections[0].items.map((item) => item.label)).toEqual(["Home"]);
  });

  it("keeps allowed show_when_allowed items clickable", () => {
    const result = resolveLiveNavigationConfig({
      sections,
      featureEnabled: true,
      roleConfig: config("show_when_allowed"),
      canAccessItem: () => true,
    });

    expect(result.sections[0].items.find((item) => item.label === "Members")?.navigationConfigState).toBe("visible_clickable");
  });

  it("resolves item state without making denied items clickable", () => {
    expect(resolveItemState("default", false)).toBe("hidden");
    expect(resolveItemState("show_when_allowed", false)).toBe("hidden");
    expect(resolveItemState("show_locked_if_denied", false)).toBe("visible_locked");
    expect(resolveItemState("show_locked_if_denied", true)).toBe("visible_clickable");
  });

  it("can lock a denied candidate item when supplied by the sidebar candidate set", () => {
    const permissionFilteredSections: ModeNavSection[] = [
      { label: "Organization", items: [{ navKey: "organization.home", label: "Home", href: "/", icon: Home }] },
    ];
    const candidateSections = mergeLiveNavigationCandidateSections(permissionFilteredSections, sections, config("show_locked_if_denied"));

    const result = resolveLiveNavigationConfig({
      sections: candidateSections,
      featureEnabled: true,
      roleConfig: config("show_locked_if_denied"),
      canAccessItem: (item) => item.label === "Home",
    });

    expect(result.sections[0].items.map((item) => [item.label, item.navigationConfigState])).toEqual([
      ["Home", "visible_clickable"],
      ["Members", "visible_locked"],
    ]);
  });

  it("does not preserve denied candidates for show_when_allowed", () => {
    const permissionFilteredSections: ModeNavSection[] = [
      { label: "Organization", items: [{ navKey: "organization.home", label: "Home", href: "/", icon: Home }] },
    ];
    const candidateSections = mergeLiveNavigationCandidateSections(permissionFilteredSections, sections, config("show_when_allowed"));

    expect(candidateSections).toBe(permissionFilteredSections);
  });

  it("cannot resurrect a configured item that is absent from all candidate sections", () => {
    const permissionFilteredSections: ModeNavSection[] = [
      { label: "Organization", items: [{ navKey: "organization.home", label: "Home", href: "/", icon: Home }] },
    ];

    const result = resolveLiveNavigationConfig({
      sections: permissionFilteredSections,
      featureEnabled: true,
      roleConfig: config("show_locked_if_denied"),
      canAccessItem: (item) => item.label === "Home",
    });

    expect(result.sections).toBe(permissionFilteredSections);
    expect(result.diagnostics.fallbackReason).toBe("config_unmatched");
  });

  it("selects a single role for mode and falls back on ambiguity", () => {
    expect(selectRoleForNavigationConfig([{ id: 1, name: "Org", key: "organization_member", scope: "organization", source_scope_type: "organization" }], "org")?.id).toBe(1);
    expect(selectRoleForNavigationConfig([
      { id: 1, name: "Org", key: "organization_member", scope: "organization", source_scope_type: "organization" },
      { id: 2, name: "Owner", key: "organization_owner", scope: "organization", source_scope_type: "organization" },
    ], "org")).toBeNull();
  });
});
