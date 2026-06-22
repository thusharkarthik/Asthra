import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAsthraQueryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { useCreateOrganizationMutation, useInviteMemberMutation } from "@/hooks/use-settings-mutations";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";

vi.mock("@/services/api/settings-api", () => ({
  settingsApi: {
    createOrganization: vi.fn(async () => ({ id: 1, name: "Asthra Labs", is_active: true })),
    createInvitation: vi.fn(async () => ({ id: 10, email: "new@example.com", status: "pending" }))
  }
}));

function renderWithClient(ui: React.ReactNode) {
  const client = createAsthraQueryClient();
  const invalidateSpy = vi.spyOn(client, "invalidateQueries");
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return invalidateSpy;
}

function CreateOrganizationProbe() {
  const mutation = useCreateOrganizationMutation();
  return <button type="button" onClick={() => mutation.mutate({ name: "Asthra Labs" })}>Create organization</button>;
}

function InviteProbe() {
  const mutation = useInviteMemberMutation();
  return <button type="button" onClick={() => mutation.mutate({ email: "new@example.com", organization_id: 1, role_id: 2 })}>Invite member</button>;
}

describe("settings mutation hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: "token",
      currentUser: { id: 1, email: "admin@example.com", full_name: "Admin", is_active: true },
      isAuthenticated: true,
      hasHydrated: true
    });
  });

  it("invalidates organization cache after creating an organization", async () => {
    const invalidateSpy = renderWithClient(<CreateOrganizationProbe />);

    fireEvent.click(screen.getByRole("button", { name: "Create organization" }));

    await waitFor(() => expect(settingsApi.createOrganization).toHaveBeenCalledWith("token", { name: "Asthra Labs" }));
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.organizations.list }));
  });

  it("invalidates member and invitation cache after inviting a member", async () => {
    const invalidateSpy = renderWithClient(<InviteProbe />);

    fireEvent.click(screen.getByRole("button", { name: "Invite member" }));

    await waitFor(() => expect(settingsApi.createInvitation).toHaveBeenCalled());
    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.invitations.list }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.members.all });
  });
});
