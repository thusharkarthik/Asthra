import type { Organization, WorkspaceRecord, ProjectRecord } from "@/types/core";

// Fixed mock context for the platform context provider.
// These IDs (9000+ range) never collide with real DB records.
// Names are kept in sync with MOCK_ORGANIZATIONS/WORKSPACES/PROJECTS in god-mode-mock-responses.ts.

export const GOD_MODE_MOCK_ORG: Organization = {
  id: 9001,
  name: "Acme Engineering",
  description: "God Mode calibration sandbox",
  slug: "acme-engineering",
  is_active: true,
};

export const GOD_MODE_MOCK_WORKSPACE: WorkspaceRecord = {
  id: 9001,
  organization_id: 9001,
  name: "Engineering Hub",
  description: "God Mode calibration sandbox",
  slug: "engineering-hub",
  is_active: true,
};

export const GOD_MODE_MOCK_PROJECT: ProjectRecord = {
  id: 9001,
  workspace_id: 9001,
  organization_id: 9001,
  name: "Asthra Platform",
  key: "ASTH",
  description: "God Mode calibration sandbox",
  status: "active",
  is_active: true,
};
