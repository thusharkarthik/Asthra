"use client";

import { createContext, useContext, useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { SettingsEmptyState, SettingsLayout as SettingsPageLayout } from "@/components/settings/settings-components";
import { Button } from "@/components/ui/button";

export type SettingsAuthorityValue = {
  authorityLevel: "superuser" | "platform" | "org" | "workspace" | "member" | null;
  orgId: number | null;
  workspaceId: number | null;
};

export const SettingsAuthorityContext = createContext<SettingsAuthorityValue>({
  authorityLevel: null,
  orgId: null,
  workspaceId: null,
});

// Convenience hook — avoids importing createContext/useContext in every consumer.
export function useSettingsAuthority(): SettingsAuthorityValue {
  return useContext(SettingsAuthorityContext);
}

export function RequestAccessButton({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const addToast = useToastStore((state) => state.addToast);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await settingsApi.sendAccessRequest(accessToken ?? "", { page, message: message.trim() || undefined });
      setSent(true);
    } catch {
      addToast({ type: "error", title: "Failed", message: "Could not send access request. Please try again." });
    } finally {
      setPending(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setSent(false);
    setMessage("");
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Request Access
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Request Access"
          onClick={handleClose}
        >
          <div
            className="flex w-full max-w-sm flex-col overflow-hidden rounded-lg border bg-card shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b p-4">
              <h2 className="text-sm font-semibold">Request Access</h2>
            </div>
            {sent ? (
              <div className="space-y-4 p-4">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-400">
                  Your request has been sent to your admin.
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleClose}>Close</Button>
                </div>
              </div>
            ) : (
              <form className="space-y-4 p-4" onSubmit={handleSubmit}>
                <p className="text-sm text-muted-foreground">
                  Send a request to your admin to grant you access to this area.
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Message (optional)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Explain why you need access…"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                  <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send Request"}</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const PLATFORM_ADMIN_KEYS = new Set(["superuser", "platform_owner", "platform_admin"]);
const ORG_ADMIN_KEYS = new Set(["organization_owner", "organization_admin"]);
const WORKSPACE_ADMIN_KEYS = new Set(["workspace_admin", "workspace_manager"]);

// Routes accessible to any authenticated user regardless of admin authority.
const PERSONAL_ROUTES = new Set([
  "/settings",
  "/settings/profile",
  "/settings/preferences",
  "/settings/notifications",
  "/settings/account",
]);

export default function SettingsGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSuperuser = Boolean(currentUser?.is_superuser);

  // Belt-and-suspenders redirect — AsthraShell also handles this at the top level.
  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Shared query keys with members/page.tsx so TanStack Query serves one cached result
  // for all three consumers: this layout, members/page, and members/[id]/page.
  const platformPermsQuery = useQuery({
    queryKey: ["members-page", "platform-permissions"],
    queryFn: () => settingsApi.getCurrentPermissions(accessToken ?? "", {}),
    enabled: Boolean(accessToken && !isSuperuser),
    staleTime: 60_000,
  });

  const myAssignmentsQuery = useQuery({
    queryKey: ["members-page", "my-role-assignments", currentUser?.id],
    queryFn: () =>
      settingsApi.listRoleAssignments(accessToken ?? "", {
        user_id: currentUser?.id,
        status: "active",
      }),
    enabled: Boolean(accessToken && currentUser?.id && !isSuperuser),
    staleTime: 60_000,
  });

  const rolesQuery = useQuery({
    queryKey: ["settings", "roles"],
    queryFn: () => settingsApi.listRoles(accessToken ?? ""),
    enabled: Boolean(accessToken && !isSuperuser),
    staleTime: 60_000,
  });

  // Not yet hydrated or no token — AsthraShell renders the loading state; no children here.
  if (!hasHydrated || !accessToken) {
    return null;
  }

  // Superuser gets unrestricted access to all settings.
  if (isSuperuser) {
    return (
      <SettingsAuthorityContext.Provider value={{ authorityLevel: "superuser", orgId: null, workspaceId: null }}>
        {children}
      </SettingsAuthorityContext.Provider>
    );
  }

  // Still resolving authority — hold rendering to avoid premature child API calls.
  if (platformPermsQuery.isLoading || myAssignmentsQuery.isLoading || rolesQuery.isLoading) {
    return null;
  }

  // Platform admin or owner → full access.
  const platformRoles = platformPermsQuery.data?.roles ?? [];
  if (platformRoles.some((r) => PLATFORM_ADMIN_KEYS.has(r.key))) {
    return (
      <SettingsAuthorityContext.Provider value={{ authorityLevel: "platform", orgId: null, workspaceId: null }}>
        {children}
      </SettingsAuthorityContext.Provider>
    );
  }

  const assignments = myAssignmentsQuery.data ?? [];
  const roleById = new Map((rolesQuery.data ?? []).map((r) => [r.id, r]));

  // Org admin/owner → full access with org context.
  const orgAssignment = assignments
    .filter((a) => a.scope_type === "organization" && a.scope_id != null)
    .find((a) => {
      const role = roleById.get(a.role_id);
      return role != null && role.key != null && ORG_ADMIN_KEYS.has(role.key);
    });

  if (orgAssignment != null) {
    return (
      <SettingsAuthorityContext.Provider value={{ authorityLevel: "org", orgId: orgAssignment.scope_id ?? null, workspaceId: null }}>
        {children}
      </SettingsAuthorityContext.Provider>
    );
  }

  // Workspace admin/manager → full access with workspace context.
  const workspaceAssignment = assignments
    .filter((a) => a.scope_type === "workspace" && a.scope_id != null)
    .find((a) => {
      const role = roleById.get(a.role_id);
      return role != null && role.key != null && WORKSPACE_ADMIN_KEYS.has(role.key);
    });

  if (workspaceAssignment != null) {
    return (
      <SettingsAuthorityContext.Provider value={{ authorityLevel: "workspace", orgId: null, workspaceId: workspaceAssignment.scope_id ?? null }}>
        {children}
      </SettingsAuthorityContext.Provider>
    );
  }

  // No admin authority — personal routes remain accessible as member-level.
  if (PERSONAL_ROUTES.has(pathname)) {
    return (
      <SettingsAuthorityContext.Provider value={{ authorityLevel: "member", orgId: null, workspaceId: null }}>
        {children}
      </SettingsAuthorityContext.Provider>
    );
  }

  // Everything else is blocked for users with no admin authority.
  return (
    <SettingsPageLayout
      breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Restricted" }]}
      backHref="/settings"
      backLabel="Back to Settings"
    >
      <SettingsEmptyState
        title="Access Restricted"
        description="You don't have permission to access this settings page. Contact your Organization Admin to request access."
        action={<RequestAccessButton page={pathname} />}
      />
    </SettingsPageLayout>
  );
}
