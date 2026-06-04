import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import SettingsPage from "@/app/settings/page";
import PreferencesSettingsPage from "@/app/settings/preferences/page";
import ProfileSettingsPage from "@/app/settings/profile/page";
import WorkspaceSettingsPage from "@/app/settings/workspace/page";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

describe("Settings frontend screens", () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useWorkspaceStore.setState({
      organizations: [{ id: 1, name: "Asthra" }],
      workspaces: [{ id: 2, organization_id: 1, name: "Platform" }],
      projects: [{ id: 3, workspace_id: 2, name: "Frontend" }],
      selectedOrganizationId: 1,
      selectedWorkspaceId: 2,
      selectedProjectId: 3
    });
  });

  it("renders settings page", () => {
    render(<SettingsPage />);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Platform preferences and account context for the Asthra shell.")).toBeInTheDocument();
  });

  it("renders profile settings", () => {
    render(<ProfileSettingsPage />);
    expect(screen.getByRole("heading", { name: "Profile Settings" })).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("renders workspace settings", () => {
    render(<WorkspaceSettingsPage />);
    expect(screen.getByRole("heading", { name: "Workspace Settings" })).toBeInTheDocument();
    expect(screen.getByText("Platform")).toBeInTheDocument();
  });

  it("renders preferences settings", () => {
    render(<PreferencesSettingsPage />);
    expect(screen.getByRole("heading", { name: "Preferences" })).toBeInTheDocument();
    expect(screen.getByText("Notification channel preferences are placeholders until backend preference storage is added.")).toBeInTheDocument();
  });
});
