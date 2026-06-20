import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlatformActivityPage from "@/app/activity/page";
import PlatformSearchPage from "@/app/search/page";
import { LinkedResourcesPanel } from "@/components/platform/linked-resources-panel";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";

function renderWithQuery(ui: React.ReactNode) {
  return render(<QueryProvider>{ui}</QueryProvider>);
}

function mockPlatformFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes("/api/platform/activity")) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          items: [{
            id: "activity-1",
            source: "flow",
            actor: "Admin",
            action: "created",
            entity: { source: "flow", entity_type: "flow_work_item", entity_id: 7, title: "Login task", href: "/flow/work-items/7" },
            timestamp: "2026-06-20T10:00:00Z"
          }]
        }
      }), { status: 200 });
    }
    if (url.includes("/api/platform/search")) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          items: [
            { source: "docs", entity_type: "docs_page", entity_id: 2, title: "Runbook", href: "/docs/pages/2" },
            { source: "desk", entity_type: "desk_ticket", entity_id: 9, title: "Billing ticket", href: "/desk/tickets/9" }
          ]
        }
      }), { status: 200 });
    }
    if (url.includes("/api/platform/relationships/entity/desk_ticket/9")) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          items: [{
            id: "rel-1",
            source_type: "desk_ticket",
            source_id: 9,
            target_type: "docs_page",
            target_id: 2,
            relationship_type: "references",
            source: { source: "desk", entity_type: "desk_ticket", entity_id: 9, title: "Billing ticket", href: "/desk/tickets/9" },
            target: { source: "docs", entity_type: "docs_page", entity_id: 2, title: "Billing runbook", href: "/docs/pages/2" },
            from: { source: "desk", entity_type: "desk_ticket", entity_id: 9, title: "Billing ticket", href: "/desk/tickets/9" },
            to: { source: "docs", entity_type: "docs_page", entity_id: 2, title: "Billing runbook", href: "/docs/pages/2" },
            relation: "references"
          }]
        }
      }), { status: 200 });
    }
    if (url.includes("/api/platform/relationships") && init?.method === "POST") {
      return new Response(JSON.stringify({ success: true, data: { id: "rel-2" } }), { status: 200 });
    }
    if (url.includes("/api/platform/relationships/rel-1") && init?.method === "DELETE") {
      return new Response(JSON.stringify({ success: true, data: { deleted: true } }), { status: 200 });
    }
    return new Response(JSON.stringify({ success: true, data: { items: [] } }), { status: 200 });
  });
}

describe("platform linking foundation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "admin@example.com", full_name: "Admin User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    mockPlatformFetch();
  });

  it("renders global activity feed", async () => {
    renderWithQuery(<PlatformActivityPage />);

    expect(screen.getByRole("heading", { name: "Activity" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Admin created Login task")).toBeInTheDocument());
  });

  it("renders global search results", async () => {
    renderWithQuery(<PlatformSearchPage />);

    expect(screen.getByRole("heading", { name: "Search" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Runbook")).toBeInTheDocument());
    expect(screen.getByText("Billing ticket")).toBeInTheDocument();
  });

  it("renders linked resources and supports create/remove actions", async () => {
    renderWithQuery(<LinkedResourcesPanel entityType="desk_ticket" entityId={9} entityTitle="Billing ticket" />);

    await waitFor(() => expect(screen.getByText("Billing runbook")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Link Existing Resource" }));
    fireEvent.change(screen.getByLabelText("Linked resource ID"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Linked resource title"), { target: { value: "Incident note" } });
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/platform/relationships"), expect.objectContaining({ method: "POST" })));

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/platform/relationships/rel-1"), expect.objectContaining({ method: "DELETE" })));
  });
});
