import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantDock } from "@/components/assistant/assistant-dock";
import { QueryProvider } from "@/providers/query-provider";
import { useAssistantStore } from "@/stores/assistant-store";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

function renderAssistant() {
  return render(
    <QueryProvider>
      <AssistantDock />
    </QueryProvider>
  );
}

describe("AssistantDock", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAssistantStore.getState().resetAssistant();
    useAuthStore.setState({
      accessToken: "test-token",
      currentUser: { id: 1, email: "user@example.com", full_name: "Test User", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
    useWorkspaceStore.setState({
      selectedWorkspaceId: 2,
      workspaces: [{ id: 2, organization_id: 1, name: "Platform" }]
    });
  });

  it("renders the assistant panel", () => {
    renderAssistant();

    expect(screen.getByLabelText(/ai assistant/i)).toBeInTheDocument();
    expect(screen.getByText("Asthra Assistant")).toBeInTheDocument();
  });

  it("shows no workspace selected state", () => {
    useWorkspaceStore.setState({ selectedWorkspaceId: null });

    renderAssistant();

    expect(screen.getByText("Select a workspace")).toBeInTheDocument();
  });

  it("sends a message with mocked gateway responses", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/assistant/sessions") && !url.includes("/messages")) {
        if (init?.method === "POST") {
          return new Response(JSON.stringify({ id: 99, workspace_id: 2, title: "Workspace assistant" }), { status: 200 });
        }
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes("/assistant/chat")) {
        return new Response(
          JSON.stringify({
            answer: "Here is the workspace answer.",
            session_id: 99,
            sources: [{ title: "Workspace memory plan", source_type: "docs_page", score: 0.91 }]
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });

    renderAssistant();

    fireEvent.change(screen.getByPlaceholderText("Ask about this workspace"), { target: { value: "What changed?" } });
    fireEvent.click(screen.getByLabelText("Send assistant message"));

    await waitFor(() => expect(screen.getByText("Here is the workspace answer.")).toBeInTheDocument());
    expect(screen.getByText("Workspace memory plan (docs_page)")).toBeInTheDocument();
  });

  it("can clear the assistant conversation", () => {
    useAssistantStore.getState().addMessage({ id: "1", role: "user", content: "Hello" });

    renderAssistant();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Clear assistant conversation"));

    expect(screen.getByText("Ask Asthra anything about this workspace")).toBeInTheDocument();
  });
});
