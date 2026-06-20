import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApprovalsPage from "@/app/desk/approvals/page";
import ChangeRequestsPage from "@/app/desk/change-requests/page";
import DeskPage from "@/app/desk/page";
import QueuesPage from "@/app/desk/queues/page";
import DeskReportsPage from "@/app/desk/reports/page";
import SlasPage from "@/app/desk/slas/page";
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
      return new Response(JSON.stringify([{ id: 2, ticket_id: 9, approver_id: 4, status: "pending" }]), { status: 200 });
    }
    if (url.includes("/approvals/2")) {
      return new Response(JSON.stringify({ id: 2, ticket_id: 9, approver_id: 4, status: "approved" }), { status: 200 });
    }
    if (url.includes("/tickets/9")) {
      return new Response(JSON.stringify({ id: 9, workspace_id: 2, project_id: 3, queue_id: 1, title: "Cannot access billing", description: "Customer cannot open invoices", status: "open", priority: "high", requester_id: 1, assignee_id: 1 }), { status: 200 });
    }
    if (url.includes("/tickets")) {
      return new Response(JSON.stringify([{ id: 9, workspace_id: 2, project_id: 3, queue_id: 1, title: "Cannot access billing", description: "Customer cannot open invoices", status: "open", priority: "high", requester_id: 1, assignee_id: 1 }]), { status: 200 });
    }
    if (url.includes("/queues")) {
      return new Response(JSON.stringify([{ id: 1, workspace_id: 2, name: "Support", description: "Default support queue" }]), { status: 200 });
    }
    if (url.includes("/slas")) {
      return new Response(JSON.stringify([{ id: 1, workspace_id: 2, name: "P1 SLA", response_time_minutes: 30, resolution_time_minutes: 240, priority: "high" }]), { status: 200 });
    }
    if (url.includes("/incidents")) {
      return new Response(JSON.stringify([{ id: 3, workspace_id: 2, ticket_id: 9, title: "Billing outage", description: "Invoice page outage", severity: "high", status: "open" }]), { status: 200 });
    }
    if (url.includes("/change-requests")) {
      return new Response(JSON.stringify([{ id: 4, workspace_id: 2, title: "Patch billing config", description: "Adjust invoice service timeout", risk_level: "medium", status: "draft", requested_by_id: 1 }]), { status: 200 });
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
    useWorkspaceStore.setState({ selectedOrganizationId: 1, selectedWorkspaceId: 2, selectedProjectId: 3 });
    mockDeskFetch();
  });

  it("renders Desk dashboard", async () => {
    renderWithQuery(<DeskPage />);

    expect(screen.getByRole("heading", { name: "Desk" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("Cannot access billing").length).toBeGreaterThan(0));
  });

  it("renders tickets page", async () => {
    renderWithQuery(<TicketsPage />);

    expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Cannot access billing")).toBeInTheDocument());
  });

  it("renders ticket detail", async () => {
    navigationMock.params = { id: "9" };
    renderWithQuery(<TicketDetailPage />);

    await waitFor(() => expect(screen.getAllByText("Customer cannot open invoices").length).toBeGreaterThan(0));
    expect(screen.getByText("Need logs")).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByLabelText("Change ticket priority")).toBeInTheDocument();
  });

  it("renders queues page", async () => {
    renderWithQuery(<QueuesPage />);

    expect(screen.getByRole("heading", { name: "Queues" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Support")).toBeInTheDocument());
  });

  it("renders SLAs page", async () => {
    renderWithQuery(<SlasPage />);

    expect(screen.getByRole("heading", { name: "SLAs" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("P1 SLA")).toBeInTheDocument());
  });

  it("renders approvals page", async () => {
    renderWithQuery(<ApprovalsPage />);

    expect(screen.getByRole("heading", { name: "Approvals" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("User 4")).toBeInTheDocument());
  });

  it("renders change requests page", async () => {
    renderWithQuery(<ChangeRequestsPage />);

    expect(screen.getByRole("heading", { name: "Change Requests" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Patch billing config")).toBeInTheDocument());
  });

  it("renders reports page", async () => {
    renderWithQuery(<DeskReportsPage />);

    expect(screen.getByRole("heading", { name: "Desk Reports" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Open Tickets")).toBeInTheDocument());
  });

  it("opens create ticket dialog", async () => {
    renderWithQuery(<TicketsPage />);

    fireEvent.click(screen.getByRole("button", { name: "Create ticket" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Ticket title")).toBeInTheDocument();
  });

  it("renders guided empty state without workspace", () => {
    useWorkspaceStore.setState({ selectedOrganizationId: 1, selectedWorkspaceId: null, selectedProjectId: null });
    renderWithQuery(<DeskPage />);

    expect(screen.getByText("Create or select a workspace for Desk")).toBeInTheDocument();
  });
});
