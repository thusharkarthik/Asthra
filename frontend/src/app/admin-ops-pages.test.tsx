import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AutomationPage from "@/app/automation/page";
import WorkflowDetailPage from "@/app/automation/workflows/[id]/page";
import WorkflowsPage from "@/app/automation/workflows/page";
import ConnectPage from "@/app/connect/page";
import IntegrationsPage from "@/app/connect/integrations/page";
import WebhooksPage from "@/app/connect/webhooks/page";
import GuardPage from "@/app/guard/page";
import AuditEventsPage from "@/app/guard/audit-events/page";
import PoliciesPage from "@/app/guard/policies/page";
import MediaPage from "@/app/media/page";
import MediaAssetDetailPage from "@/app/media/assets/[id]/page";
import MediaAssetsPage from "@/app/media/assets/page";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const navigationMock = (
  globalThis as typeof globalThis & {
    __asthraNavigationMock: {
      pathname: string;
      params: Record<string, string>;
      push: ReturnType<typeof vi.fn>;
      replace: ReturnType<typeof vi.fn>;
    };
  }
).__asthraNavigationMock;

function renderWithQuery(ui: React.ReactNode) {
  return render(<QueryProvider>{ui}</QueryProvider>);
}

function envelope(data: unknown) {
  return { success: true, data, message: null, request_id: "test" };
}

function mockAdminOpsFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);

    if (url.includes("/api/automation/api/v1/workflows/7/triggers")) {
      return new Response(JSON.stringify(envelope([{ id: 1, workflow_id: 7, trigger_type: "manual", is_active: true }])), { status: 200 });
    }
    if (url.includes("/api/automation/api/v1/workflows/7/conditions")) {
      return new Response(JSON.stringify(envelope([{ id: 2, workflow_id: 7, condition_type: "always" }])), { status: 200 });
    }
    if (url.includes("/api/automation/api/v1/workflows/7/actions")) {
      return new Response(JSON.stringify(envelope([{ id: 3, workflow_id: 7, action_type: "create_notification", execution_order: 1 }])), { status: 200 });
    }
    if (url.includes("/api/automation/api/v1/workflows/7")) {
      return new Response(JSON.stringify(envelope({ id: 7, workspace_id: 2, name: "Ticket routing workflow", description: "Route incoming support tickets", status: "active" })), { status: 200 });
    }
    if (url.includes("/api/automation/api/v1/workflows")) {
      return new Response(JSON.stringify(envelope([{ id: 7, workspace_id: 2, name: "Ticket routing workflow", description: "Route incoming support tickets", status: "active" }])), { status: 200 });
    }
    if (url.includes("/api/automation/api/v1/executions")) {
      return new Response(JSON.stringify(envelope([{ id: 8, workflow_id: 7, execution_status: "success", execution_log: "Placeholder actions completed" }])), { status: 200 });
    }
    if (url.includes("/api/automation/api/v1/schedules")) {
      return new Response(JSON.stringify(envelope([{ id: 9, workflow_id: 7, cron_expression: "0 9 * * *", is_active: true }])), { status: 200 });
    }

    if (url.includes("/api/connect/api/v1/integrations")) {
      return new Response(JSON.stringify(envelope([{ id: 10, workspace_id: 2, name: "GitHub integration", provider: "github", status: "active" }])), { status: 200 });
    }
    if (url.includes("/api/connect/api/v1/connectors")) {
      return new Response(JSON.stringify(envelope([{ id: 11, integration_id: 10, connector_type: "repository", connector_name: "GitHub repos", status: "active" }])), { status: 200 });
    }
    if (url.includes("/api/connect/api/v1/webhook-deliveries")) {
      return new Response(JSON.stringify(envelope([{ id: 12, webhook_endpoint_id: 13, event_type: "flow.work_item.created", delivery_status: "success" }])), { status: 200 });
    }
    if (url.includes("/api/connect/api/v1/webhooks")) {
      return new Response(JSON.stringify(envelope([{ id: 13, workspace_id: 2, name: "Ops webhook", target_url: "https://example.com/webhook", is_active: true }])), { status: 200 });
    }
    if (url.includes("/api/connect/api/v1/event-subscriptions")) {
      return new Response(JSON.stringify(envelope([{ id: 14, workspace_id: 2, event_name: "desk.ticket.created", subscriber_type: "webhook", is_active: true }])), { status: 200 });
    }
    if (url.includes("/api/connect/api/v1/sync-jobs")) {
      return new Response(JSON.stringify(envelope([{ id: 15, integration_id: 10, job_type: "repository_sync", status: "success", execution_log: "Synced repositories" }])), { status: 200 });
    }
    if (url.includes("/api/connect/api/v1/api-connections")) {
      return new Response(JSON.stringify(envelope([{ id: 16, workspace_id: 2, provider: "jira", auth_type: "token", connection_status: "connected" }])), { status: 200 });
    }

    if (url.includes("/api/guard/api/v1/security-policies")) {
      return new Response(JSON.stringify(envelope([{ id: 20, workspace_id: 2, name: "Data access policy", policy_type: "access", status: "active" }])), { status: 200 });
    }
    if (url.includes("/api/guard/api/v1/access-reviews")) {
      return new Response(JSON.stringify(envelope([{ id: 21, workspace_id: 2, title: "Quarterly review", status: "in_progress", reviewer_id: 1 }])), { status: 200 });
    }
    if (url.includes("/api/guard/api/v1/compliance-checks")) {
      return new Response(JSON.stringify(envelope([{ id: 22, workspace_id: 2, name: "SOC2 access control", framework: "SOC2", status: "pending" }])), { status: 200 });
    }
    if (url.includes("/api/guard/api/v1/audit-events")) {
      return new Response(JSON.stringify(envelope([{ id: 23, workspace_id: 2, action: "policy.updated", entity_type: "security_policy", severity: "medium", description: "Policy changed" }])), { status: 200 });
    }
    if (url.includes("/api/guard/api/v1/risk-findings")) {
      return new Response(JSON.stringify(envelope([{ id: 24, workspace_id: 2, title: "Unreviewed admin access", severity: "high", status: "open" }])), { status: 200 });
    }
    if (url.includes("/api/guard/api/v1/security-exceptions")) {
      return new Response(JSON.stringify(envelope([{ id: 25, workspace_id: 2, title: "Temporary access exception", status: "open" }])), { status: 200 });
    }

    if (url.includes("/api/media/api/v1/media-assets/30/transcripts")) {
      return new Response(JSON.stringify(envelope([{ id: 31, asset_id: 30, transcript_text: "Demo transcript text", language: "en" }])), { status: 200 });
    }
    if (url.includes("/api/media/api/v1/media-assets/30/annotations")) {
      return new Response(JSON.stringify(envelope([{ id: 32, asset_id: 30, annotation_type: "note", content: "Important diagram" }])), { status: 200 });
    }
    if (url.includes("/api/media/api/v1/media-assets/30/tags")) {
      return new Response(JSON.stringify(envelope([{ id: 33, name: "architecture" }])), { status: 200 });
    }
    if (url.includes("/api/media/api/v1/media-assets/30")) {
      return new Response(JSON.stringify(envelope({ id: 30, workspace_id: 2, title: "Architecture diagram", description: "System overview", asset_type: "image", file_url: "https://example.com/diagram.png", file_name: "diagram.png" })), { status: 200 });
    }
    if (url.includes("/api/media/api/v1/media-assets")) {
      return new Response(JSON.stringify(envelope([{ id: 30, workspace_id: 2, title: "Architecture diagram", asset_type: "image", file_url: "https://example.com/diagram.png", file_name: "diagram.png" }])), { status: 200 });
    }
    if (url.includes("/api/media/api/v1/media-collections")) {
      return new Response(JSON.stringify(envelope([{ id: 34, workspace_id: 2, name: "Product assets", description: "Launch media" }])), { status: 200 });
    }
    if (url.includes("/api/media/api/v1/processing-jobs")) {
      return new Response(JSON.stringify(envelope([{ id: 35, asset_id: 30, job_type: "ocr_placeholder", status: "pending" }])), { status: 200 });
    }
    if (url.includes("/api/media/api/v1/media-tags")) {
      return new Response(JSON.stringify(envelope([{ id: 33, name: "architecture" }])), { status: 200 });
    }

    return new Response(JSON.stringify(envelope([])), { status: 200 });
  });
}

describe("Automation, Connect, Guard, and Media frontend screens", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigationMock.params = {};
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useWorkspaceStore.setState({ selectedWorkspaceId: 2, selectedProjectId: 3 });
    mockAdminOpsFetch();
  });

  it("renders Automation dashboard", async () => {
    renderWithQuery(<AutomationPage />);
    expect(screen.getByRole("heading", { name: "Automation" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Ticket routing workflow")).toBeInTheDocument());
  });

  it("renders workflows page", async () => {
    renderWithQuery(<WorkflowsPage />);
    expect(screen.getByRole("heading", { name: "Workflows" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Ticket routing workflow")).toBeInTheDocument());
  });

  it("renders workflow detail", async () => {
    navigationMock.params = { id: "7" };
    renderWithQuery(<WorkflowDetailPage />);
    await waitFor(() => expect(screen.getByText("Route incoming support tickets")).toBeInTheDocument());
    expect(screen.getByText("Execution History")).toBeInTheDocument();
  });

  it("renders Connect dashboard", async () => {
    renderWithQuery(<ConnectPage />);
    expect(screen.getByRole("heading", { name: "Connect" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("GitHub integration")).toBeInTheDocument());
  });

  it("renders integrations page", async () => {
    renderWithQuery(<IntegrationsPage />);
    expect(screen.getByRole("heading", { name: "Integrations" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("GitHub integration")).toBeInTheDocument());
  });

  it("renders webhooks page", async () => {
    renderWithQuery(<WebhooksPage />);
    expect(screen.getByRole("heading", { name: "Webhooks" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Ops webhook")).toBeInTheDocument());
  });

  it("renders Guard dashboard", async () => {
    renderWithQuery(<GuardPage />);
    expect(screen.getByRole("heading", { name: "Guard" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Unreviewed admin access")).toBeInTheDocument());
  });

  it("renders policies page", async () => {
    renderWithQuery(<PoliciesPage />);
    expect(screen.getByRole("heading", { name: "Security Policies" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Data access policy")).toBeInTheDocument());
  });

  it("renders audit events page", async () => {
    renderWithQuery(<AuditEventsPage />);
    expect(screen.getByRole("heading", { name: "Audit Events" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("policy.updated")).toBeInTheDocument());
  });

  it("renders Media dashboard", async () => {
    renderWithQuery(<MediaPage />);
    expect(screen.getByRole("heading", { name: "Media" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Architecture diagram")).toBeInTheDocument());
  });

  it("renders media assets page", async () => {
    renderWithQuery(<MediaAssetsPage />);
    expect(screen.getByRole("heading", { name: "Media Assets" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Architecture diagram")).toBeInTheDocument());
  });

  it("renders media asset detail", async () => {
    navigationMock.params = { id: "30" };
    renderWithQuery(<MediaAssetDetailPage />);
    await waitFor(() => expect(screen.getByText("System overview")).toBeInTheDocument());
    expect(screen.getByText("architecture")).toBeInTheDocument();
  });
});
