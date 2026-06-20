import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PulsePage from "@/app/pulse/page";
import PulseIncidentDetailPage from "@/app/pulse/incidents/[id]/page";
import IncidentsPage from "@/app/pulse/incidents/page";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const navigationMock = (
  globalThis as typeof globalThis & {
    __asthraNavigationMock: { pathname: string; params: Record<string, string>; push: ReturnType<typeof vi.fn>; replace: ReturnType<typeof vi.fn> };
  }
).__asthraNavigationMock;

function renderWithQuery(ui: React.ReactNode) {
  return render(<QueryProvider>{ui}</QueryProvider>);
}

function mockPulseFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/incidents/4/timeline")) {
      return new Response(JSON.stringify([{ id: 1, incident_id: 4, event_type: "identified", content: "Database latency identified" }]), { status: 200 });
    }
    if (url.includes("/incidents/4/postmortem")) {
      return new Response(JSON.stringify({ id: 2, incident_id: 4, summary: "Latency was caused by a slow query" }), { status: 200 });
    }
    if (url.includes("/incidents/4")) {
      return new Response(JSON.stringify({ id: 4, workspace_id: 2, title: "API latency", description: "Gateway requests are slow", severity: "sev2", status: "investigating", impacted_service: "api-gateway", incident_commander_id: 1 }), { status: 200 });
    }
    if (url.includes("/incidents")) {
      return new Response(JSON.stringify([{ id: 4, workspace_id: 2, title: "API latency", description: "Gateway requests are slow", severity: "sev2", status: "investigating", impacted_service: "api-gateway", incident_commander_id: 1 }]), { status: 200 });
    }
    if (url.includes("/alerts")) {
      return new Response(JSON.stringify([{ id: 3, workspace_id: 2, title: "Latency alert", severity: "high", status: "open", source: "synthetics" }]), { status: 200 });
    }
    if (url.includes("/status-pages")) {
      return new Response(JSON.stringify([{ id: 1, workspace_id: 2, name: "Public Status", is_public: true }]), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  });
}

describe("Pulse frontend screens", () => {
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
    mockPulseFetch();
  });

  it("renders Pulse dashboard", async () => {
    renderWithQuery(<PulsePage />);

    expect(screen.getByRole("heading", { name: "Pulse" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("API latency")).toBeInTheDocument());
  });

  it("renders incidents page", async () => {
    renderWithQuery(<IncidentsPage />);

    expect(screen.getByRole("heading", { name: "Incidents" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("API latency")).toBeInTheDocument());
  });

  it("renders incident detail", async () => {
    navigationMock.params = { id: "4" };
    renderWithQuery(<PulseIncidentDetailPage />);

    await waitFor(() => expect(screen.getByText("Gateway requests are slow")).toBeInTheDocument());
    expect(screen.getByText("api-gateway")).toBeInTheDocument();
    expect(screen.getByText("Database latency identified")).toBeInTheDocument();
    expect(screen.getByText("Linked Resources")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resolve Incident" })).toBeInTheDocument();
  });
});
