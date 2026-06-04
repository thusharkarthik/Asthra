import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchDialog } from "@/components/search/search-dialog";
import { QueryProvider } from "@/providers/query-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

function renderSearch() {
  return render(
    <QueryProvider>
      <SearchDialog />
    </QueryProvider>
  );
}

describe("SearchDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useUIStore.setState({ isSearchOpen: true });
    useAuthStore.setState({
      accessToken: "test-token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useWorkspaceStore.setState({ selectedWorkspaceId: 2 });
  });

  it("renders no workspace selected state", () => {
    useWorkspaceStore.setState({ selectedWorkspaceId: null });

    renderSearch();

    expect(screen.getByText("Select a workspace")).toBeInTheDocument();
  });

  it("groups workspace search results by source type", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            { id: 1, title: "Memory plan", source_type: "docs_page", snippet: "Docs snippet", score: 0.9 },
            { id: 2, title: "Task breakdown", source_type: "work_item", snippet: "Work snippet", score: 0.7 }
          ]
        }),
        { status: 200 }
      )
    );

    renderSearch();
    fireEvent.change(screen.getByPlaceholderText(/search work items/i), { target: { value: "memory" } });

    await waitFor(() => expect(screen.getByText("Memory plan")).toBeInTheDocument());
    expect(screen.getByText("Docs")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Task breakdown")).toBeInTheDocument();
  });

  it("shows API error state", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ detail: "Search failed" }), { status: 500 }));

    renderSearch();
    fireEvent.change(screen.getByPlaceholderText(/search work items/i), { target: { value: "memory" } });

    await waitFor(() => expect(screen.getByText("Workspace search failed")).toBeInTheDocument());
  });

  it("shows recent search placeholders before typing", () => {
    renderSearch();

    expect(screen.getByText("Recent searches")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "release risk" })).toBeInTheDocument();
  });
});
