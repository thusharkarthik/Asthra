import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InsightsPage from "@/app/insights/page";
import MetricsPage from "@/app/insights/metrics/page";
import ReportsPage from "@/app/insights/reports/page";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

function renderWithQuery(ui: React.ReactNode) {
  return render(<QueryProvider>{ui}</QueryProvider>);
}

function envelope(data: unknown) {
  return { success: true, data, message: null, request_id: "test" };
}

function mockInsightsFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/dashboards")) {
      return new Response(JSON.stringify(envelope([{ id: 1, workspace_id: 2, name: "Executive Overview", description: "Top platform metrics" }])), { status: 200 });
    }
    if (url.includes("/metrics/definitions")) {
      return new Response(JSON.stringify(envelope([{ id: 2, workspace_id: 2, metric_key: "deployment.success_rate", name: "Deployment Success Rate", unit: "%" }])), { status: 200 });
    }
    if (url.includes("/metrics/snapshots")) {
      return new Response(JSON.stringify(envelope([{ id: 3, workspace_id: 2, metric_key: "deployment.success_rate", value: 98.5 }])), { status: 200 });
    }
    if (url.includes("/reports")) {
      return new Response(JSON.stringify(envelope([{ id: 4, workspace_id: 2, name: "Weekly Delivery Report", report_type: "delivery", status: "active" }])), { status: 200 });
    }
    if (url.includes("/insight-events")) {
      return new Response(JSON.stringify(envelope([{ id: 5, workspace_id: 2, event_type: "trend", severity: "info", title: "Delivery improving", description: "Deployment success rate is trending up" }])), { status: 200 });
    }
    if (url.includes("/usage-metrics")) {
      return new Response(JSON.stringify(envelope([{ id: 6, workspace_id: 2, service_name: "flow-service", metric_name: "requests", value: 42 }])), { status: 200 });
    }
    return new Response(JSON.stringify(envelope([])), { status: 200 });
  });
}

describe("Insights frontend screens", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ accessToken: "token", currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true }, isAuthenticated: true, hasHydrated: true });
    useWorkspaceStore.setState({ selectedWorkspaceId: 2, selectedProjectId: 3 });
    mockInsightsFetch();
  });

  it("renders Insights dashboard", async () => {
    renderWithQuery(<InsightsPage />);
    expect(screen.getByRole("heading", { name: "Insights" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Delivery improving")).toBeInTheDocument());
  });

  it("renders reports page", async () => {
    renderWithQuery(<ReportsPage />);
    expect(screen.getByRole("heading", { name: "Reports" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Weekly Delivery Report")).toBeInTheDocument());
  });

  it("renders metrics page", async () => {
    renderWithQuery(<MetricsPage />);
    expect(screen.getByRole("heading", { name: "Metrics" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Deployment Success Rate")).toBeInTheDocument());
  });
});
