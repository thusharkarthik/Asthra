import type { Organization, WorkspaceRecord, ProjectRecord } from "@/types/core";

export const GOD_MODE_MOCK_ORG: Organization = {
  id: 9001,
  name: "Demo Organization",
  description: "God Mode calibration sandbox",
  slug: "demo-org",
  is_active: true,
};

export const GOD_MODE_MOCK_WORKSPACE: WorkspaceRecord = {
  id: 9001,
  organization_id: 9001,
  name: "Demo Workspace",
  description: "God Mode calibration sandbox",
  slug: "demo-workspace",
  is_active: true,
};

export const GOD_MODE_MOCK_PROJECT: ProjectRecord = {
  id: 9001,
  workspace_id: 9001,
  organization_id: 9001,
  name: "Demo Project",
  key: "DEMO",
  description: "God Mode calibration sandbox",
  status: "active",
  is_active: true,
};
