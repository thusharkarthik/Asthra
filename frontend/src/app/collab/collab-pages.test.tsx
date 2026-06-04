import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CollabPage from "@/app/collab/page";
import ThreadDetailPage from "@/app/collab/threads/[id]/page";
import ThreadsPage from "@/app/collab/threads/page";
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

function mockCollabFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/threads/8/messages")) {
      return new Response(JSON.stringify([{ id: 1, thread_id: 8, author_id: 1, content: "Ship update posted" }]), { status: 200 });
    }
    if (url.includes("/threads/8")) {
      return new Response(JSON.stringify({ id: 8, workspace_id: 2, project_id: 3, title: "Release discussion", status: "open", created_by_id: 1 }), { status: 200 });
    }
    if (url.includes("/threads")) {
      return new Response(JSON.stringify([{ id: 8, workspace_id: 2, project_id: 3, title: "Release discussion", status: "open", created_by_id: 1 }]), { status: 200 });
    }
    if (url.includes("/announcements")) {
      return new Response(JSON.stringify([{ id: 1, workspace_id: 2, title: "Maintenance window", content: "Scheduled update", status: "published", created_by_id: 1 }]), { status: 200 });
    }
    if (url.includes("/team-updates")) {
      return new Response(JSON.stringify([{ id: 2, workspace_id: 2, title: "Platform update", content: "Gateway routing complete", status: "published", created_by_id: 1 }]), { status: 200 });
    }
    if (url.includes("/activity-stream")) {
      return new Response(JSON.stringify([{ id: 3, workspace_id: 2, entity_type: "thread", action: "thread.created", description: "Release discussion created" }]), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  });
}

describe("Collab frontend screens", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigationMock.params = {};
    useAuthStore.setState({ accessToken: "token", currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true }, isAuthenticated: true, hasHydrated: true });
    useWorkspaceStore.setState({ selectedWorkspaceId: 2, selectedProjectId: 3 });
    mockCollabFetch();
  });

  it("renders Collab dashboard", async () => {
    renderWithQuery(<CollabPage />);
    expect(screen.getByRole("heading", { name: "Collab" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Release discussion")).toBeInTheDocument());
  });

  it("renders threads page", async () => {
    renderWithQuery(<ThreadsPage />);
    expect(screen.getByRole("heading", { name: "Threads" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Release discussion")).toBeInTheDocument());
  });

  it("renders thread detail", async () => {
    navigationMock.params = { id: "8" };
    renderWithQuery(<ThreadDetailPage />);
    await waitFor(() => expect(screen.getByText("Ship update posted")).toBeInTheDocument());
  });
});
