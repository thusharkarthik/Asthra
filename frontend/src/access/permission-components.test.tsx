import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Can, PermissionButton } from "@/access/permission-components";

function renderWithQuery(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe("permission visibility components", () => {
  it("renders children when the action permission is allowed", () => {
    renderWithQuery(
      <Can actionKey="settings.project.restore" scope={{ permissionCodes: ["settings.project.restore"] }}>
        <span>Restore project</span>
      </Can>
    );

    expect(screen.getByText("Restore project")).toBeInTheDocument();
  });

  it("hides children when the action permission is denied", () => {
    renderWithQuery(
      <Can actionKey="settings.project.restore" scope={{ permissionCodes: ["settings.project.view"] }}>
        <span>Restore project</span>
      </Can>
    );

    expect(screen.queryByText("Restore project")).not.toBeInTheDocument();
  });

  it("disables buttons when denied mode requests a disabled control", () => {
    renderWithQuery(
      <PermissionButton actionKey="settings.team.edit" deniedMode="disabled" scope={{ permissionCodes: ["settings.team.view"] }}>
        Edit Team
      </PermissionButton>
    );

    expect(screen.getByRole("button", { name: "Edit Team" })).toBeDisabled();
  });

  it("shows loading fallback without rendering denied content while permissions load", () => {
    renderWithQuery(
      <Can
        actionKey="settings.project.restore"
        scope={{ permissionCodes: [], isLoading: true }}
        loadingFallback={<span>Checking access</span>}
      >
        <span>Restore project</span>
      </Can>
    );

    expect(screen.getByText("Checking access")).toBeInTheDocument();
    expect(screen.queryByText("Restore project")).not.toBeInTheDocument();
  });
});
