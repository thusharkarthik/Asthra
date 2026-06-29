"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronUp, Circle, Rocket, X } from "lucide-react";
import { usePlatformContext } from "@/context/platformContext";
import { useAuthStore } from "@/stores/auth-store";
import { settingsApi } from "@/services/api/settings-api";

function dismissedKey(orgId: number) {
  return `asthra_setup_checklist_dismissed_${orgId}`;
}

function minimizedKey(orgId: number) {
  return `asthra_setup_checklist_minimized_${orgId}`;
}

export function OrgSetupChecklist() {
  const { organizations, workspaces, projects, permissions, isLoading } = usePlatformContext();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);

  const [dismissed, setDismissed] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Use first org the user belongs to as the scope for the checklist
  const orgId = organizations[0]?.id;

  useEffect(() => {
    if (!orgId) return;
    setDismissed(localStorage.getItem(dismissedKey(orgId)) === "true");
    setMinimized(localStorage.getItem(minimizedKey(orgId)) === "true");
    setHydrated(true);
  }, [orgId]);

  // Only show to org owners and org admins
  const isOrgAdmin = Boolean(
    permissions?.roles?.some(
      (r) =>
        (r.key === "organization_owner" || r.key === "organization_admin") &&
        r.scope === "organization"
    )
  );

  // Fetch role assignments for the org to detect member count
  const assignmentsQuery = useQuery({
    queryKey: ["checklist", "org-assignments", orgId],
    queryFn: () =>
      settingsApi.listRoleAssignments(accessToken ?? "", {
        scope_type: "organization",
        scope_id: orgId,
        status: "active",
      }),
    enabled: Boolean(accessToken && orgId && isOrgAdmin && !dismissed),
  });

  const rolesQuery = useQuery({
    queryKey: ["settings", "roles"],
    queryFn: () => settingsApi.listRoles(accessToken ?? ""),
    enabled: Boolean(accessToken && orgId && isOrgAdmin && !dismissed),
    staleTime: 5 * 60 * 1000,
  });

  if (!hydrated || isLoading || !orgId || currentUser?.is_superuser || !isOrgAdmin || dismissed) {
    return null;
  }

  const assignments = assignmentsQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const orgOwnerRoleId = roles.find((r) => r.key === "organization_owner")?.id;

  // Invite check: at least one org-scope assignment belongs to someone other than the current user
  const invitedMember = assignments.some((a) => a.user_id !== currentUser?.id);

  // Roles check: at least one assignment uses a non-owner role (i.e., someone was explicitly assigned a member role)
  const assignedRoles =
    orgOwnerRoleId != null
      ? assignments.some((a) => a.role_id !== orgOwnerRoleId)
      : false;

  const items: Array<{
    id: string;
    label: string;
    href: string;
    completed: boolean;
    comingSoon?: boolean;
  }> = [
    {
      id: "workspace",
      label: "Create your first workspace",
      href: "/settings/workspaces",
      completed: workspaces.length > 0,
    },
    {
      id: "project",
      label: "Create your first project",
      href: "/settings/projects",
      completed: projects.length > 0,
    },
    {
      id: "invite",
      label: "Invite your first team member",
      href: `/settings/members?action=invite&orgId=${orgId}`,
      completed: invitedMember,
    },
    {
      id: "roles",
      label: "Assign roles to members",
      href: "/settings/members",
      completed: assignedRoles,
    },
    {
      id: "work-item",
      label: "Create your first work item in Flow",
      href: "/flow",
      completed: false,
      comingSoon: true,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const allComplete = completedCount === items.length;
  const progressPct = Math.round((completedCount / items.length) * 100);

  function handleDismiss() {
    if (!orgId) return;
    localStorage.setItem(dismissedKey(orgId), "true");
    setDismissed(true);
  }

  function toggleMinimized() {
    if (!orgId) return;
    const next = !minimized;
    localStorage.setItem(minimizedKey(orgId), String(next));
    setMinimized(next);
  }

  return (
    <div className="mb-4 rounded-lg border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Set up your organization</span>
          {minimized && (
            <span className="text-xs text-muted-foreground">
              {completedCount} of {items.length} complete
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={toggleMinimized}
            aria-label={minimized ? "Expand checklist" : "Minimize checklist"}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {minimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss checklist"
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="px-4 pb-4 space-y-4">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCount} of {items.length} complete
            </p>
          </div>

          {allComplete ? (
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              <span className="font-medium">You're all set! 🎉</span>
              <span className="ml-2 text-emerald-600 dark:text-emerald-500">
                Your organization is ready to go.
              </span>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  )}
                  {item.completed ? (
                    <span className="line-through text-muted-foreground">{item.label}</span>
                  ) : item.comingSoon ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {item.label}
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">
                        Coming soon
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="font-medium text-primary hover:underline underline-offset-2"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
