import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeskPage from "@/app/desk/page";
import TicketDetailPage from "@/app/desk/tickets/[id]/page";
import TicketsPage from "@/app/desk/tickets/page";
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

function mockDeskFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/tickets/9/comments")) {
      return new Response(JSON.stringify([{ id: 1, ticket_id: 9, author_id: 1, content: "Need logs" }]), { status: 200 });
    }
    if (url.includes("/tickets/9/approvals")) {
      return new Response(JSON.stringify([{ id: 2, ticket_id: 9, status: "pending" }]), { status: 200 });
    }
    if (url.includes("/tickets/9")) {
      return new Response(JSON.stringify({ id: 9, workspace_id: 2, project_id: 3, title: "Cannot access billing", description: "Customer cannot open invoices", status: "open", priority: "high" }), { status: 200 });
    }
    if (url.includes("/tickets")) {
      return new Response(JSON.stringify([{ id: 9, workspace_id: 2, project_id: 3, title: "Cannot access billing", description: "Customer cannot open invoices", status: "open", priority: "high" }]), { status: 200 });
    }
    if (url.includes("/queues")) {
      return new Response(JSON.stringify([{ id: 1, workspace_id: 2, name: "Support", description: "Default support queue" }]), { status: 200 });
    }
    if (url.includes("/slas")) {
      return new Response(JSON.stringify([{ id: 1, workspace_id: 2, name: "P1 SLA", response_time_minutes: 30, resolution_time_minutes: 240, priority: "high" }]), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  });
}

describe("Desk frontend screens", () => {
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
    mockDeskFetch();
  });

  it("renders Desk dashboard", async () => {
    renderWithQuery(<DeskPage />);

    expect(screen.getByRole("heading", { name: "Desk" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Cannot access billing")).toBeInTheDocument());
  });

  it("renders tickets page", async () => {
    renderWithQuery(<TicketsPage />);

    expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Cannot access billing")).toBeInTheDocument());
  });

  it("renders ticket detail", async () => {
    navigationMock.params = { id: "9" };
    renderWithQuery(<TicketDetailPage />);

    await waitFor(() => expect(screen.getByText("Customer cannot open invoices")).toBeInTheDocument());
    expect(screen.getByText("Need logs")).toBeInTheDocument();
  });
});
