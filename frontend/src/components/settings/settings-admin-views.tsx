"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { settingsApi } from "@/services/api/settings-api";
import type { ApiKeyRecord, CoreUser, PermissionRecord, ProjectRecord, RoleRecord, TeamMemberRecord, TeamRecord } from "@/types/core";
import {
  FormActions,
  FormField,
  PlatformSetupSteps,
  QuickCreateButton,
  SettingsCard,
  SettingsCreateDialog,
  SettingsDangerZone,
  SettingsDataTable,
  SettingsEmptyState,
  SettingsSectionHeader
} from "@/components/settings/settings-components";

function SettingsLinkButton({ href, children, variant = "default" }: { href: string; children: ReactNode; variant?: "default" | "outline" }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium ${
        variant === "outline" ? "border bg-background hover:bg-muted" : "bg-primary text-primary-foreground hover:opacity-90"
      }`}
    >
      {children}
    </Link>
  );
}

function useSettingsData() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setOrganizations = useWorkspaceStore((state) => state.setOrganizations);
  const setWorkspaces = useWorkspaceStore((state) => state.setWorkspaces);
  const setProjects = useWorkspaceStore((state) => state.setProjects);

  const organizationsQuery = useQuery({
    queryKey: ["settings", "organizations"],
    queryFn: () => settingsApi.listOrganizations(accessToken ?? ""),
    enabled: Boolean(accessToken)
  });
  const workspacesQuery = useQuery({
    queryKey: ["settings", "workspaces"],
    queryFn: () => settingsApi.listWorkspaces(accessToken ?? ""),
    enabled: Boolean(accessToken)
  });
  const projectsQuery = useQuery({
    queryKey: ["settings", "projects"],
    queryFn: () => settingsApi.listProjects(accessToken ?? ""),
    enabled: Boolean(accessToken)
  });

  useEffect(() => {
    if (organizationsQuery.data) setOrganizations(organizationsQuery.data);
  }, [organizationsQuery.data, setOrganizations]);
  useEffect(() => {
    if (workspacesQuery.data) setWorkspaces(workspacesQuery.data);
  }, [setWorkspaces, workspacesQuery.data]);
  useEffect(() => {
    if (projectsQuery.data) setProjects(projectsQuery.data);
  }, [projectsQuery.data, setProjects]);

  return {
    accessToken,
    organizations: organizationsQuery.data ?? [],
    workspaces: workspacesQuery.data ?? [],
    projects: projectsQuery.data ?? [],
    isLoading: organizationsQuery.isLoading || workspacesQuery.isLoading || projectsQuery.isLoading,
    error: organizationsQuery.error ?? workspacesQuery.error ?? projectsQuery.error
  };
}

function getFormValue(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "").trim();
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function displayUser(user?: CoreUser | null, fallbackId?: number) {
  if (!user) return { name: fallbackId ? `User ${fallbackId}` : "Pending user", email: "Email unavailable", status: "Unknown" };
  return {
    name: user.full_name || user.email,
    email: user.email,
    status: user.is_active ? "Active" : "Inactive"
  };
}

function useUserProfiles(userIds: number[]) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const uniqueIds = useMemo(() => Array.from(new Set(userIds.filter(Boolean))).sort((a, b) => a - b), [userIds]);
  return useQuery({
    queryKey: ["settings", "user-profiles", uniqueIds.join(",")],
    queryFn: async () => {
      const users = await Promise.all(
        uniqueIds.map(async (userId) => {
          try {
            return await settingsApi.getUser(accessToken ?? "", userId);
          } catch {
            return null;
          }
        })
      );
      return new Map(users.filter(Boolean).map((user) => [user!.id, user!]));
    },
    enabled: Boolean(accessToken && uniqueIds.length)
  });
}

function AdminTabs({ tabs }: { tabs: Array<{ label: string; href: string; active?: boolean }> }) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b pb-2" aria-label="Administration tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
            tab.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

function SearchBox({ value, onChange, placeholder = "Search" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="max-w-sm" />;
}

function ConfirmActionButton({
  label,
  message,
  onConfirm,
  variant = "outline"
}: {
  label: string;
  message: string;
  onConfirm: () => void;
  variant?: "default" | "outline";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={() => {
        if (window.confirm(message)) onConfirm();
      }}
    >
      {label}
    </Button>
  );
}

function SetupSummary() {
  const { organizations, workspaces, projects } = useSettingsData();
  return <PlatformSetupSteps hasOrganization={organizations.length > 0} hasWorkspace={workspaces.length > 0} hasProject={projects.length > 0} />;
}

export function SettingsHomeView() {
  const { organizations, workspaces, projects } = useSettingsData();
  const cards = [
    { title: "Administration", value: "Open", href: "/settings/administration" },
    { title: "Organizations", value: organizations.length, href: "/settings/organizations" },
    { title: "Workspaces", value: workspaces.length, href: "/settings/workspaces" },
    { title: "Projects", value: projects.length, href: "/settings/projects" },
    { title: "API Keys", value: "Manage", href: "/settings/api-keys" }
  ];

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        title="Settings"
        description="Admin center for account preferences, organizations, workspaces, projects, members, roles, and platform setup."
      />
      <SetupSummary />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="rounded-lg border bg-card p-4 hover:bg-muted/60">
            <div className="text-sm text-muted-foreground">{card.title}</div>
            <div className="mt-2 text-2xl font-semibold">{card.value}</div>
          </Link>
        ))}
      </div>
      <SettingsCard title="Operational setup flow" description="Create the required hierarchy before using project-scoped modules like Flow.">
        <div className="grid gap-3 md:grid-cols-3">
          <SettingsLinkButton href="/settings/organizations" variant="outline">Create Organization</SettingsLinkButton>
          <SettingsLinkButton href="/settings/workspaces" variant="outline">Create Workspace</SettingsLinkButton>
          <SettingsLinkButton href="/settings/projects" variant="outline">Create Project</SettingsLinkButton>
        </div>
      </SettingsCard>
      <SettingsCard title="Settings navigation" description="Operational administration areas are grouped for admin use.">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold">Personal</h3>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {["Profile", "Account", "Preferences", "Notifications", "API Keys"].map((item) => (
                <Link key={item} className="text-muted-foreground hover:text-foreground" href={`/settings/${item.toLowerCase().replaceAll(" ", "-")}`}>
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Administration</h3>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              {["Organizations", "Workspaces", "Projects", "Members", "Teams", "Roles", "Permissions"].map((item) => (
                <Link key={item} className="text-muted-foreground hover:text-foreground" href={`/settings/${item.toLowerCase()}`}>
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Platform</h3>
            <div className="mt-2 flex flex-col gap-1 text-sm">
              <Link className="text-muted-foreground hover:text-foreground" href="/settings/security">Security</Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/settings/audit-logs">Audit Logs</Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/settings/integrations">Integrations</Link>
              <Link className="text-muted-foreground hover:text-foreground" href="/settings/ai-preferences">AI Preferences</Link>
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

export function AdministrationDashboardView() {
  const { accessToken, organizations, workspaces, projects } = useSettingsData();
  const teamsQuery = useQuery({ queryKey: ["settings", "teams"], queryFn: () => settingsApi.listTeams(accessToken ?? ""), enabled: Boolean(accessToken) });
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissionsQuery = useQuery({ queryKey: ["settings", "permissions"], queryFn: () => settingsApi.listPermissions(accessToken ?? ""), enabled: Boolean(accessToken) });
  const membersEstimate = organizations.length + workspaces.length;
  const cards = [
    { title: "Organizations", count: organizations.length, href: "/settings/organizations" },
    { title: "Workspaces", count: workspaces.length, href: "/settings/workspaces" },
    { title: "Projects", count: projects.length, href: "/settings/projects" },
    { title: "Members", count: membersEstimate, href: "/settings/members" },
    { title: "Teams", count: teamsQuery.data?.length ?? 0, href: "/settings/teams" },
    { title: "Roles", count: rolesQuery.data?.length ?? 0, href: "/settings/roles" },
    { title: "Permissions", count: permissionsQuery.data?.length ?? 0, href: "/settings/permissions" }
  ];

  return (
    <div className="space-y-6">
      <SettingsSectionHeader title="Administration" description="Operational control center for setup, members, teams, roles, and permissions." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <SettingsCard key={card.title} title={card.title}>
            <div className="flex items-end justify-between gap-3">
              <div className="text-3xl font-semibold">{card.count}</div>
              <SettingsLinkButton href={card.href} variant="outline">Manage</SettingsLinkButton>
            </div>
          </SettingsCard>
        ))}
      </div>
    </div>
  );
}

export function OrganizationsView() {
  const { accessToken, organizations } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const setSelectedOrganization = useWorkspaceStore((state) => state.setSelectedOrganization);

  const mutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => settingsApi.createOrganization(accessToken ?? "", payload),
    onSuccess: async (organization) => {
      setOpen(false);
      setFormError(null);
      setSelectedOrganization(organization.id);
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      addToast({ type: "success", title: "Organization created", message: `${organization.name} is now selected.` });
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Unable to create organization.")
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = getFormValue(form, "name");
    if (!name) {
      setFormError("Organization name is required.");
      return;
    }
    mutation.mutate({ name, description: getFormValue(form, "description") || undefined });
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader title="Organizations" description="Create and manage the top-level homes for Asthra work." actions={<QuickCreateButton onClick={() => setOpen(true)}>Create Organization</QuickCreateButton>} />
      <SettingsDataTable
        columns={["Name", "Description", "Status", "Actions"]}
        rows={organizations.map((organization) => [
          organization.name,
          organization.description ?? "No description",
          organization.is_active === false ? "Inactive" : "Active",
          <Link key={organization.id} className="text-primary hover:underline" href={`/settings/organizations/${organization.id}`}>
            Open
          </Link>
        ])}
        emptyMessage="No organizations yet"
      />
      <SettingsCreateDialog title="Create organization" open={open} onOpenChange={setOpen} onSubmit={submit} error={formError}>
        <FormField label="Name" required>
          <Input name="name" placeholder="Acme Platform" />
        </FormField>
        <FormField label="Description">
          <Input name="description" placeholder="Internal product organization" />
        </FormField>
        <FormActions submitLabel="Create Organization" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function WorkspacesView({ organizationId }: { organizationId?: number }) {
  const { accessToken, organizations, workspaces } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const setSelectedWorkspace = useWorkspaceStore((state) => state.setSelectedWorkspace);
  const targetOrganizationId = organizationId ?? selectedOrganizationId ?? organizations[0]?.id;
  const visibleWorkspaces = organizationId ? workspaces.filter((workspace) => workspace.organization_id === organizationId) : workspaces;

  const mutation = useMutation({
    mutationFn: (payload: { organization_id: number; name: string; description?: string }) => settingsApi.createWorkspace(accessToken ?? "", payload),
    onSuccess: async (workspace) => {
      setOpen(false);
      setFormError(null);
      setSelectedWorkspace(workspace.id);
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      addToast({ type: "success", title: "Workspace created", message: `${workspace.name} is now selected.` });
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Unable to create workspace.")
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = getFormValue(form, "name");
    const organization_id = Number(getFormValue(form, "organization_id") || targetOrganizationId);
    if (!organization_id) {
      setFormError("Create or select an organization first.");
      return;
    }
    if (!name) {
      setFormError("Workspace name is required.");
      return;
    }
    mutation.mutate({ organization_id, name, description: getFormValue(form, "description") || undefined });
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader title="Workspaces" description="Workspaces connect teams, projects, and module data under an organization." actions={<QuickCreateButton onClick={() => setOpen(true)}>Create Workspace</QuickCreateButton>} />
      {!organizations.length ? (
        <SettingsEmptyState title="Create an organization first" description="A workspace must belong to an organization." action={<SettingsLinkButton href="/settings/organizations">Create Organization</SettingsLinkButton>} />
      ) : (
        <SettingsDataTable
          columns={["Name", "Organization", "Description", "Actions"]}
          rows={visibleWorkspaces.map((workspace) => [
            workspace.name,
            organizations.find((organization) => organization.id === workspace.organization_id)?.name ?? workspace.organization_id,
            workspace.description ?? "No description",
            <Link key={workspace.id} className="text-primary hover:underline" href={`/settings/workspaces/${workspace.id}`}>
              Open
            </Link>
          ])}
          emptyMessage="No workspaces yet"
        />
      )}
      <SettingsCreateDialog title="Create workspace" open={open} onOpenChange={setOpen} onSubmit={submit} error={formError}>
        <FormField label="Organization" required>
          <select name="organization_id" defaultValue={targetOrganizationId ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Name" required>
          <Input name="name" placeholder="Product Workspace" />
        </FormField>
        <FormField label="Description">
          <Input name="description" placeholder="Product and engineering planning" />
        </FormField>
        <FormActions submitLabel="Create Workspace" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function ProjectsView({ workspaceId }: { workspaceId?: number }) {
  const { accessToken, workspaces, projects } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const setSelectedProject = useWorkspaceStore((state) => state.setSelectedProject);
  const targetWorkspaceId = workspaceId ?? selectedWorkspaceId ?? workspaces[0]?.id;
  const visibleProjects = workspaceId ? projects.filter((project) => project.workspace_id === workspaceId) : projects;

  const mutation = useMutation({
    mutationFn: (payload: { workspace_id: number; name: string; description?: string; status?: string }) => settingsApi.createProject(accessToken ?? "", payload),
    onSuccess: async (project) => {
      setOpen(false);
      setFormError(null);
      setSelectedProject(project.id);
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      addToast({ type: "success", title: "Project created", message: `${project.name} is now selected.` });
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Unable to create project.")
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = getFormValue(form, "name");
    const workspace_id = Number(getFormValue(form, "workspace_id") || targetWorkspaceId);
    if (!workspace_id) {
      setFormError("Create or select a workspace first.");
      return;
    }
    if (!name) {
      setFormError("Project name is required.");
      return;
    }
    mutation.mutate({ workspace_id, name, description: getFormValue(form, "description") || undefined, status: "active" });
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader title="Projects" description="Projects scope Flow work, Docs knowledge, discovery, tickets, and operations." actions={<QuickCreateButton onClick={() => setOpen(true)}>Create Project</QuickCreateButton>} />
      {!workspaces.length ? (
        <SettingsEmptyState title="Create a workspace first" description="A project must belong to a workspace." action={<SettingsLinkButton href="/settings/workspaces">Create Workspace</SettingsLinkButton>} />
      ) : (
        <SettingsDataTable
          columns={["Name", "Workspace", "Status", "Actions"]}
          rows={visibleProjects.map((project) => [
            project.name,
            workspaces.find((workspace) => workspace.id === project.workspace_id)?.name ?? project.workspace_id,
            project.status ?? "active",
            <Link key={project.id} className="text-primary hover:underline" href={`/settings/projects/${project.id}`}>
              Open
            </Link>
          ])}
          emptyMessage="No projects yet"
        />
      )}
      <SettingsCreateDialog title="Create project" open={open} onOpenChange={setOpen} onSubmit={submit} error={formError}>
        <FormField label="Workspace" required>
          <select name="workspace_id" defaultValue={targetWorkspaceId ?? ""} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Name" required>
          <Input name="name" placeholder="Asthra Alpha" />
        </FormField>
        <FormField label="Description">
          <Input name="description" placeholder="Initial internal alpha project" />
        </FormField>
        <FormActions submitLabel="Create Project" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function OrganizationDetailView({ organizationId }: { organizationId: number }) {
  const { organizations, workspaces } = useSettingsData();
  const organization = organizations.find((item) => item.id === organizationId);
  const scopedWorkspaces = workspaces.filter((workspace) => workspace.organization_id === organizationId);

  if (!organization) {
    return <SettingsEmptyState title="Organization not found" description="Refresh the page or open the organizations list." action={<SettingsLinkButton href="/settings/organizations">Organizations</SettingsLinkButton>} />;
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader title={organization.name} description={organization.description ?? "Organization administration and setup."} />
      <AdminTabs
        tabs={[
          { label: "Overview", href: `/settings/organizations/${organizationId}`, active: true },
          { label: "Members", href: `/settings/organizations/${organizationId}/members` },
          { label: "Workspaces", href: `/settings/organizations/${organizationId}/workspaces` },
          { label: "Roles", href: `/settings/organizations/${organizationId}/roles` },
          { label: "Permissions", href: `/settings/organizations/${organizationId}/permissions` }
        ]}
      />
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Slug</dt><dd>{organization.slug ?? "Not available"}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{organization.is_active === false ? "Inactive" : "Active"}</dd></div>
          <div><dt className="text-muted-foreground">Created</dt><dd>{formatDate(organization.created_at)}</dd></div>
          <div><dt className="text-muted-foreground">Workspaces</dt><dd>{scopedWorkspaces.length}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsDataTable
        columns={["Workspace", "Description", "Actions"]}
        rows={scopedWorkspaces.map((workspace) => [workspace.name, workspace.description ?? "No description", <Link key={workspace.id} className="text-primary hover:underline" href={`/settings/workspaces/${workspace.id}`}>Open</Link>])}
        emptyMessage="No workspaces in this organization"
      />
      <SettingsDangerZone description="Organization deletion and ownership transfer are intentionally deferred for the operational foundation." />
    </div>
  );
}

export function WorkspaceDetailView({ workspaceId }: { workspaceId: number }) {
  const { workspaces, projects } = useSettingsData();
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const scopedProjects = projects.filter((project) => project.workspace_id === workspaceId);

  if (!workspace) {
    return <SettingsEmptyState title="Workspace not found" description="Refresh the page or open the workspaces list." action={<SettingsLinkButton href="/settings/workspaces">Workspaces</SettingsLinkButton>} />;
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader title={workspace.name} description={workspace.description ?? "Workspace administration and project setup."} />
      <AdminTabs
        tabs={[
          { label: "Overview", href: `/settings/workspaces/${workspaceId}`, active: true },
          { label: "Members", href: `/settings/workspaces/${workspaceId}/members` },
          { label: "Teams", href: `/settings/workspaces/${workspaceId}/teams` },
          { label: "Projects", href: `/settings/workspaces/${workspaceId}/projects` }
        ]}
      />
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Organization ID</dt><dd>{workspace.organization_id}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{workspace.is_active === false ? "Inactive" : "Active"}</dd></div>
          <div><dt className="text-muted-foreground">Created</dt><dd>{formatDate(workspace.created_at)}</dd></div>
          <div><dt className="text-muted-foreground">Projects</dt><dd>{scopedProjects.length}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsDataTable
        columns={["Project", "Status", "Actions"]}
        rows={scopedProjects.map((project) => [project.name, project.status ?? "active", <Link key={project.id} className="text-primary hover:underline" href={`/settings/projects/${project.id}`}>Open</Link>])}
        emptyMessage="No projects in this workspace"
      />
      <SettingsDangerZone description="Workspace archive and permanent deletion are placeholders until audit and retention policies are added." />
    </div>
  );
}

export function ProjectDetailView({ projectId }: { projectId: number }) {
  const { accessToken, projects, workspaces } = useSettingsData();
  const [ownerOpen, setOwnerOpen] = useState(false);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const project = projects.find((item) => item.id === projectId);
  const workspaceMembersQuery = useQuery({
    queryKey: ["settings", "project-owner-members", project?.workspace_id],
    queryFn: () => settingsApi.listWorkspaceMembers(accessToken ?? "", project?.workspace_id ?? 0),
    enabled: Boolean(accessToken && project?.workspace_id)
  });
  const ownerProfiles = useUserProfiles([
    ...(workspaceMembersQuery.data ?? []).map((member) => member.user_id),
    ...(project?.owner_id ? [project.owner_id] : [])
  ]).data ?? new Map<number, CoreUser>();
  const owner = project?.owner_id ? displayUser(ownerProfiles.get(project.owner_id), project.owner_id) : null;
  const ownerMutation = useMutation({
    mutationFn: (owner_id: number | null) => settingsApi.updateProject(accessToken ?? "", projectId, { owner_id }),
    onSuccess: async () => {
      setOwnerOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["settings", "projects"] });
      addToast({ type: "success", title: "Project owner updated" });
    },
    onError: (error) => addToast({ type: "error", title: "Owner update failed", message: error instanceof Error ? error.message : "Unable to update owner." })
  });
  if (!project) {
    return <SettingsEmptyState title="Project not found" description="Refresh the page or open the projects list." action={<SettingsLinkButton href="/settings/projects">Projects</SettingsLinkButton>} />;
  }
  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        title={project.name}
        description={project.description ?? "Project settings and operational metadata."}
        actions={<><Button type="button" onClick={() => setOwnerOpen(true)}>Assign Owner</Button><SettingsLinkButton href="/flow">Open Flow</SettingsLinkButton></>}
      />
      <SettingsCard title="Project metadata">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Workspace</dt><dd>{workspaces.find((workspace) => workspace.id === project.workspace_id)?.name ?? project.workspace_id}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{project.status ?? "active"}</dd></div>
          <div><dt className="text-muted-foreground">Key</dt><dd>{project.key ?? "Generated by core-service"}</dd></div>
          <div><dt className="text-muted-foreground">Owner Name</dt><dd>{owner?.name ?? "Not assigned"}</dd></div>
          <div><dt className="text-muted-foreground">Owner Email</dt><dd>{owner?.email ?? "Not assigned"}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsCard title="Ownership actions">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setOwnerOpen(true)}>Change Owner</Button>
          <ConfirmActionButton label="Remove Owner" message="Remove this project owner?" onConfirm={() => ownerMutation.mutate(null)} />
        </div>
      </SettingsCard>
      <SettingsDangerZone description="Project archive is a placeholder for the usability pass. Project records remain managed by core-service." />
      <SettingsCreateDialog title="Assign project owner" open={ownerOpen} onOpenChange={setOwnerOpen} onSubmit={(event) => {
        event.preventDefault();
        const ownerId = Number(getFormValue(event.currentTarget, "owner_id"));
        if (ownerId) ownerMutation.mutate(ownerId);
      }}>
        <FormField label="Workspace member" required>
          <select name="owner_id" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select owner</option>
            {(workspaceMembersQuery.data ?? []).map((member) => {
              const user = displayUser(ownerProfiles.get(member.user_id), member.user_id);
              return <option key={member.user_id} value={member.user_id}>{user.name} - {user.email}</option>;
            })}
          </select>
        </FormField>
        <FormActions submitLabel="Assign Owner" isSubmitting={ownerMutation.isPending} onCancel={() => setOwnerOpen(false)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function MembersView({ organizationId, workspaceId }: { organizationId?: number; workspaceId?: number }) {
  const { accessToken, organizations, workspaces } = useSettingsData();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const membersQuery = useQuery<Array<{ user_id: number; role_id?: number | null; member_role: string }>>({
    queryKey: ["settings", "members", organizationId, workspaceId],
    queryFn: async () => {
      if (organizationId) return settingsApi.listOrganizationMembers(accessToken ?? "", organizationId);
      return settingsApi.listWorkspaceMembers(accessToken ?? "", workspaceId ?? 0);
    },
    enabled: Boolean(accessToken && (organizationId || workspaceId))
  });
  const members = membersQuery.data ?? [];
  const userProfiles = useUserProfiles(members.map((member) => member.user_id));
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const invitationsQuery = useQuery({ queryKey: ["settings", "invitations"], queryFn: () => settingsApi.listInvitations(accessToken ?? ""), enabled: Boolean(accessToken) });
  const roles = rolesQuery.data ?? [];
  const profiles = userProfiles.data ?? new Map<number, CoreUser>();
  const scopeOrganizationId = organizationId ?? workspaces.find((workspace) => workspace.id === workspaceId)?.organization_id ?? organizations[0]?.id;
  const scopeWorkspaceId = workspaceId ?? null;
  const filteredMembers = members.filter((member) => {
    const user = displayUser(profiles.get(member.user_id), member.user_id);
    const role = roles.find((item) => item.id === member.role_id)?.name ?? member.member_role;
    const haystack = `${user.name} ${user.email} ${role}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const inviteMutation = useMutation({
    mutationFn: (payload: { email: string; organization_id: number; workspace_id?: number | null; role_id?: number | null }) =>
      settingsApi.createInvitation(accessToken ?? "", payload),
    onSuccess: async (invitation) => {
      setInviteOpen(false);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["settings", "invitations"] });
      addToast({ type: "success", title: "Invitation created", message: `${invitation.email} was invited.` });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to invite member.";
      setFormError(message);
      addToast({ type: "error", title: "Invite failed", message });
    }
  });
  const roleMutation = useMutation({
    mutationFn: (payload: { userId: number; roleId: number }) => settingsApi.assignUserRole(accessToken ?? "", payload.userId, payload.roleId),
    onSuccess: async () => {
      setRoleOpen(null);
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      addToast({ type: "success", title: "Role assigned" });
    },
    onError: (error) => addToast({ type: "error", title: "Role assignment failed", message: error instanceof Error ? error.message : "Unable to assign role." })
  });

  function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = getFormValue(form, "email");
    const roleId = Number(getFormValue(form, "role_id")) || null;
    if (!scopeOrganizationId) {
      setFormError("Create or select an organization first.");
      return;
    }
    if (!email) {
      setFormError("Email is required.");
      return;
    }
    inviteMutation.mutate({ email, organization_id: scopeOrganizationId, workspace_id: scopeWorkspaceId, role_id: roleId });
  }

  return (
    <div className="space-y-6">
      {organizationId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/organizations/${organizationId}` },
            { label: "Members", href: `/settings/organizations/${organizationId}/members`, active: true },
            { label: "Workspaces", href: `/settings/organizations/${organizationId}/workspaces` },
            { label: "Roles", href: `/settings/organizations/${organizationId}/roles` },
            { label: "Permissions", href: `/settings/organizations/${organizationId}/permissions` }
          ]}
        />
      ) : null}
      {workspaceId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/workspaces/${workspaceId}` },
            { label: "Members", href: `/settings/workspaces/${workspaceId}/members`, active: true },
            { label: "Teams", href: `/settings/workspaces/${workspaceId}/teams` },
            { label: "Projects", href: `/settings/workspaces/${workspaceId}/projects` }
          ]}
        />
      ) : null}
      <SettingsSectionHeader title="Members" description="Invite members, review status, and assign roles without using raw database screens." actions={<QuickCreateButton onClick={() => setInviteOpen(true)}>Invite Member</QuickCreateButton>} />
      <SearchBox value={search} onChange={setSearch} placeholder="Search members by name, email, or role" />
      <SettingsDataTable
        columns={["Full Name", "Email", "Role", "Status", "Joined Date", "Actions"]}
        rows={filteredMembers.map((member) => {
          const user = displayUser(profiles.get(member.user_id), member.user_id);
          const role = roles.find((item) => item.id === member.role_id)?.name ?? member.member_role;
          return [
            user.name,
            user.email,
            role,
            user.status,
            "Current member",
            <div key={member.user_id} className="flex flex-wrap gap-2">
              <SettingsLinkButton href={`/settings/members/${member.user_id}`} variant="outline">View</SettingsLinkButton>
              <Button type="button" size="sm" variant="outline" onClick={() => setRoleOpen(member.user_id)}>Change Role</Button>
              <ConfirmActionButton label="Remove" message="Remove member is a placeholder until scoped removal UX is finalized." onConfirm={() => addToast({ type: "info", title: "Remove member placeholder", message: "Use organization/workspace member removal after confirmation UX is finalized." })} />
            </div>
          ];
        })}
        emptyMessage="No members found"
      />
      <SettingsCard title="Pending invitations" description="Invitations are created through core-service and appear here when visible to the signed-in admin.">
        <SettingsDataTable
          columns={["Email", "Scope", "Role", "Status", "Expires"]}
          rows={(invitationsQuery.data ?? [])
            .filter((invitation) => (organizationId ? invitation.organization_id === organizationId : true))
            .filter((invitation) => (workspaceId ? invitation.workspace_id === workspaceId : true))
            .map((invitation) => [
              invitation.email,
              invitation.workspace_id ? "Workspace" : "Organization",
              roles.find((role) => role.id === invitation.role_id)?.name ?? "Default member",
              invitation.status,
              formatDate(invitation.expires_at)
            ])}
          emptyMessage="No pending invitations"
        />
      </SettingsCard>
      <SettingsCreateDialog title="Invite member" open={inviteOpen} onOpenChange={setInviteOpen} onSubmit={submitInvite} error={formError}>
        <FormField label="Email" required><Input name="email" type="email" placeholder="teammate@example.com" /></FormField>
        <FormField label="Role">
          <select name="role_id" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Default member</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </FormField>
        <FormField label="Scope">
          <Input value={workspaceId ? "Workspace" : "Organization"} readOnly />
        </FormField>
        <FormActions submitLabel="Invite Member" isSubmitting={inviteMutation.isPending} onCancel={() => setInviteOpen(false)} />
      </SettingsCreateDialog>
      <SettingsCreateDialog title="Change role" open={roleOpen !== null} onOpenChange={(open) => setRoleOpen(open ? roleOpen : null)} onSubmit={(event) => {
        event.preventDefault();
        const roleId = Number(getFormValue(event.currentTarget, "role_id"));
        if (roleOpen && roleId) roleMutation.mutate({ userId: roleOpen, roleId });
      }}>
        <FormField label="Role" required>
          <select name="role_id" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </FormField>
        <FormActions submitLabel="Assign Role" isSubmitting={roleMutation.isPending} onCancel={() => setRoleOpen(null)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function MemberDetailView({ userId }: { userId: number }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const userQuery = useQuery({ queryKey: ["settings", "user", userId], queryFn: () => settingsApi.getUser(accessToken ?? "", userId), enabled: Boolean(accessToken && userId) });
  const userRolesQuery = useQuery({ queryKey: ["settings", "user-roles", userId], queryFn: () => settingsApi.listUserRoles(accessToken ?? "", userId), enabled: Boolean(accessToken && userId) });
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const user = userQuery.data;
  return (
    <div className="space-y-6">
      <SettingsSectionHeader title={displayUser(user, userId).name} description="Member details, assigned roles, teams, projects, and activity placeholders." />
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Email</dt><dd>{displayUser(user, userId).email}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{displayUser(user, userId).status}</dd></div>
          <div><dt className="text-muted-foreground">Job Title</dt><dd>{user?.job_title ?? "Not set"}</dd></div>
          <div><dt className="text-muted-foreground">Joined</dt><dd>{formatDate(user?.created_at)}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsCard title="Roles">
        <SettingsDataTable
          columns={["Role", "Assigned"]}
          rows={(userRolesQuery.data ?? []).map((assignment) => [rolesQuery.data?.find((role) => role.id === assignment.role_id)?.name ?? `Role ${assignment.role_id}`, formatDate(assignment.created_at)])}
          emptyMessage="No assigned roles"
        />
      </SettingsCard>
      <SettingsCard title="Teams" description="Team membership is shown from team detail pages in this pass. Assignment is available under team administration." />
      <SettingsCard title="Projects" description="Project ownership can be assigned from project detail pages." />
      <SettingsCard title="Activity Placeholder" description="Member audit and activity stream integration is planned for a later platform pass." />
    </div>
  );
}

export function TeamsView({ workspaceId }: { workspaceId?: number }) {
  const { accessToken, workspaces } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const teamsQuery = useQuery({ queryKey: ["settings", "teams"], queryFn: () => settingsApi.listTeams(accessToken ?? ""), enabled: Boolean(accessToken) });
  const teams = (teamsQuery.data ?? [])
    .filter((team: TeamRecord) => (workspaceId ? team.workspace_id === workspaceId : true))
    .filter((team: TeamRecord) => `${team.name} ${team.description ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const targetWorkspaceId = workspaceId ?? selectedWorkspaceId ?? workspaces[0]?.id;
  const mutation = useMutation({
    mutationFn: (payload: { workspace_id: number; name: string; description?: string }) => settingsApi.createTeam(accessToken ?? "", payload),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["settings", "teams"] });
      addToast({ type: "success", title: "Team created" });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to create team.";
      setFormError(message);
      addToast({ type: "error", title: "Team create failed", message });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: (teamId: number) => settingsApi.deleteTeam(accessToken ?? "", teamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "teams"] });
      addToast({ type: "success", title: "Team archived" });
    },
    onError: (error) => addToast({ type: "error", title: "Team archive failed", message: error instanceof Error ? error.message : "Unable to archive team." })
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = getFormValue(event.currentTarget, "name");
    if (!targetWorkspaceId || !name) {
      setFormError("Workspace and team name are required.");
      return;
    }
    mutation.mutate({ workspace_id: targetWorkspaceId, name, description: getFormValue(event.currentTarget, "description") || undefined });
  }
  return (
    <div className="space-y-6">
      {workspaceId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/workspaces/${workspaceId}` },
            { label: "Members", href: `/settings/workspaces/${workspaceId}/members` },
            { label: "Teams", href: `/settings/workspaces/${workspaceId}/teams`, active: true },
            { label: "Projects", href: `/settings/workspaces/${workspaceId}/projects` }
          ]}
        />
      ) : null}
      <SettingsSectionHeader title="Teams" description="Create lightweight workspace teams for future ownership and permissions." actions={<QuickCreateButton onClick={() => setOpen(true)}>Create Team</QuickCreateButton>} />
      <SearchBox value={search} onChange={setSearch} placeholder="Search teams" />
      <SettingsDataTable
        columns={["Name", "Description", "Members Count", "Lead", "Status", "Actions"]}
        rows={teams.map((team) => [
          team.name,
          team.description ?? "No description",
          "Open detail",
          team.created_by_id ? `User ${team.created_by_id}` : "Not assigned",
          team.is_active === false ? "Archived" : "Active",
          <div key={team.id} className="flex flex-wrap gap-2">
            <SettingsLinkButton href={`/settings/teams/${team.id}`} variant="outline">View</SettingsLinkButton>
            <SettingsLinkButton href={`/settings/teams/${team.id}`} variant="outline">Edit</SettingsLinkButton>
            <ConfirmActionButton label="Delete" message={`Archive team ${team.name}?`} onConfirm={() => deleteMutation.mutate(team.id)} />
          </div>
        ])}
        emptyMessage="No teams yet"
      />
      <SettingsCreateDialog title="Create team" open={open} onOpenChange={setOpen} onSubmit={submit} error={formError}>
        <FormField label="Name" required><Input name="name" placeholder="Engineering" /></FormField>
        <FormField label="Description"><Input name="description" placeholder="Build and operations team" /></FormField>
        <FormActions submitLabel="Create Team" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function TeamDetailView({ teamId }: { teamId: number }) {
  const { accessToken, workspaces } = useSettingsData();
  const [assignOpen, setAssignOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const teamQuery = useQuery({ queryKey: ["settings", "team", teamId], queryFn: () => settingsApi.getTeam(accessToken ?? "", teamId), enabled: Boolean(accessToken && teamId) });
  const membersQuery = useQuery({ queryKey: ["settings", "team-members", teamId], queryFn: () => settingsApi.listTeamMembers(accessToken ?? "", teamId), enabled: Boolean(accessToken && teamId) });
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const workspaceMembersQuery = useQuery({
    queryKey: ["settings", "workspace-members-for-team", teamQuery.data?.workspace_id],
    queryFn: () => settingsApi.listWorkspaceMembers(accessToken ?? "", teamQuery.data?.workspace_id ?? 0),
    enabled: Boolean(accessToken && teamQuery.data?.workspace_id)
  });
  const teamMembers = membersQuery.data ?? [];
  const profiles = useUserProfiles(teamMembers.map((member: TeamMemberRecord) => member.user_id)).data ?? new Map<number, CoreUser>();
  const workspaceMemberProfiles = useUserProfiles((workspaceMembersQuery.data ?? []).map((member) => member.user_id)).data ?? new Map<number, CoreUser>();
  const assignMutation = useMutation({
    mutationFn: (payload: { user_id: number; role_id?: number | null; member_role?: string }) => settingsApi.addTeamMember(accessToken ?? "", teamId, payload),
    onSuccess: async () => {
      setAssignOpen(false);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["settings", "team-members", teamId] });
      addToast({ type: "success", title: "Member assigned to team" });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to assign member.";
      setFormError(message);
      addToast({ type: "error", title: "Assignment failed", message });
    }
  });
  const team = teamQuery.data;
  if (!team) return <SettingsEmptyState title="Team not found" description="Open the teams list or refresh the page." action={<SettingsLinkButton href="/settings/teams">Teams</SettingsLinkButton>} />;

  function submitAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = Number(getFormValue(event.currentTarget, "user_id"));
    const roleId = Number(getFormValue(event.currentTarget, "role_id")) || null;
    if (!userId) {
      setFormError("Select a workspace member.");
      return;
    }
    assignMutation.mutate({ user_id: userId, role_id: roleId, member_role: "member" });
  }

  return (
    <div className="space-y-6">
      <SettingsSectionHeader title={team.name} description={team.description ?? "Team administration."} actions={<QuickCreateButton onClick={() => setAssignOpen(true)}>Assign Member</QuickCreateButton>} />
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Workspace</dt><dd>{workspaces.find((workspace) => workspace.id === team.workspace_id)?.name ?? team.workspace_id}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{team.is_active === false ? "Archived" : "Active"}</dd></div>
          <div><dt className="text-muted-foreground">Lead</dt><dd>{team.created_by_id ? `User ${team.created_by_id}` : "Not assigned"}</dd></div>
          <div><dt className="text-muted-foreground">Members</dt><dd>{teamMembers.length}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsCard title="Members">
        <SettingsDataTable
          columns={["Name", "Email", "Role", "Status"]}
          rows={teamMembers.map((member: TeamMemberRecord) => {
            const user = displayUser(profiles.get(member.user_id), member.user_id);
            return [user.name, user.email, rolesQuery.data?.find((role) => role.id === member.role_id)?.name ?? member.member_role, user.status];
          })}
          emptyMessage="No team members"
        />
      </SettingsCard>
      <SettingsCard title="Projects" description="Project/team linking is supported by core-service and will be surfaced here in a later pass." />
      <SettingsCard title="Lead" description="The team creator is shown as the temporary lead until explicit lead assignment is added." />
      <SettingsCreateDialog title="Assign member to team" open={assignOpen} onOpenChange={setAssignOpen} onSubmit={submitAssign} error={formError}>
        <FormField label="Workspace member" required>
          <select name="user_id" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Select member</option>
            {(workspaceMembersQuery.data ?? []).map((member) => {
              const user = displayUser(workspaceMemberProfiles.get(member.user_id), member.user_id);
              return <option key={member.user_id} value={member.user_id}>{user.name} - {user.email}</option>;
            })}
          </select>
        </FormField>
        <FormField label="Role">
          <select name="role_id" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            <option value="">Default member</option>
            {(rolesQuery.data ?? []).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </FormField>
        <FormActions submitLabel="Assign Member" isSubmitting={assignMutation.isPending} onCancel={() => setAssignOpen(false)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function RolesView({ organizationId }: { organizationId?: number }) {
  const { accessToken } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const roles = (rolesQuery.data ?? [])
    .filter((role: RoleRecord) => (organizationId ? role.organization_id === organizationId || role.organization_id == null : true))
    .filter((role: RoleRecord) => `${role.name} ${role.description ?? ""} ${role.scope}`.toLowerCase().includes(search.toLowerCase()));
  const mutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; organization_id?: number; scope?: string }) => settingsApi.createRole(accessToken ?? "", payload),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["settings", "roles"] });
      addToast({ type: "success", title: "Role created" });
    },
    onError: (error) => addToast({ type: "error", title: "Role create failed", message: error instanceof Error ? error.message : "Unable to create role." })
  });
  const deleteMutation = useMutation({
    mutationFn: (roleId: number) => settingsApi.deleteRole(accessToken ?? "", roleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "roles"] });
      addToast({ type: "success", title: "Role archived" });
    },
    onError: (error) => addToast({ type: "error", title: "Role archive failed", message: error instanceof Error ? error.message : "Unable to archive role." })
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = getFormValue(event.currentTarget, "name");
    if (name) mutation.mutate({ name, description: getFormValue(event.currentTarget, "description") || undefined, organization_id: organizationId, scope: "organization" });
  }
  return (
    <div className="space-y-6">
      {organizationId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/organizations/${organizationId}` },
            { label: "Members", href: `/settings/organizations/${organizationId}/members` },
            { label: "Workspaces", href: `/settings/organizations/${organizationId}/workspaces` },
            { label: "Roles", href: `/settings/organizations/${organizationId}/roles`, active: true },
            { label: "Permissions", href: `/settings/organizations/${organizationId}/permissions` }
          ]}
        />
      ) : null}
      <SettingsSectionHeader title="Roles" description="Define role records for future access-control assignment." actions={<QuickCreateButton onClick={() => setOpen(true)}>Create Role</QuickCreateButton>} />
      <SearchBox value={search} onChange={setSearch} placeholder="Search roles" />
      <SettingsDataTable
        columns={["Name", "Description", "Scope", "Status", "Actions"]}
        rows={roles.map((role) => [
          role.name,
          role.description ?? "No description",
          role.scope,
          role.is_active === false ? "Archived" : "Active",
          <div key={role.id} className="flex flex-wrap gap-2">
            <SettingsLinkButton href={`/settings/roles/${role.id}`} variant="outline">View</SettingsLinkButton>
            <SettingsLinkButton href={`/settings/roles/${role.id}`} variant="outline">Edit</SettingsLinkButton>
            <ConfirmActionButton label="Delete" message={`Archive role ${role.name}?`} onConfirm={() => deleteMutation.mutate(role.id)} />
          </div>
        ])}
        emptyMessage="No roles yet"
      />
      <SettingsCreateDialog title="Create role" open={open} onOpenChange={setOpen} onSubmit={submit}>
        <FormField label="Name" required><Input name="name" placeholder="Workspace Admin" /></FormField>
        <FormField label="Description"><Input name="description" placeholder="Can manage workspace setup" /></FormField>
        <FormActions submitLabel="Create Role" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function PermissionsView({ organizationId }: { organizationId?: number } = {}) {
  const { accessToken } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const permissionsQuery = useQuery({ queryKey: ["settings", "permissions"], queryFn: () => settingsApi.listPermissions(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissions = (permissionsQuery.data ?? []).filter((permission: PermissionRecord) => `${permission.code} ${permission.name} ${permission.description ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const mutation = useMutation({
    mutationFn: (payload: { code: string; name: string; description?: string }) => settingsApi.createPermission(accessToken ?? "", payload),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["settings", "permissions"] });
      addToast({ type: "success", title: "Permission created" });
    },
    onError: (error) => addToast({ type: "error", title: "Permission create failed", message: error instanceof Error ? error.message : "Unable to create permission." })
  });
  const deleteMutation = useMutation({
    mutationFn: (permissionId: number) => settingsApi.deletePermission(accessToken ?? "", permissionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["settings", "permissions"] });
      addToast({ type: "success", title: "Permission archived" });
    },
    onError: (error) => addToast({ type: "error", title: "Permission archive failed", message: error instanceof Error ? error.message : "Unable to archive permission." })
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = getFormValue(event.currentTarget, "code");
    const name = getFormValue(event.currentTarget, "name");
    if (code && name) mutation.mutate({ code, name, description: getFormValue(event.currentTarget, "description") || undefined });
  }
  return (
    <div className="space-y-6">
      {organizationId ? (
        <AdminTabs
          tabs={[
            { label: "Overview", href: `/settings/organizations/${organizationId}` },
            { label: "Members", href: `/settings/organizations/${organizationId}/members` },
            { label: "Workspaces", href: `/settings/organizations/${organizationId}/workspaces` },
            { label: "Roles", href: `/settings/organizations/${organizationId}/roles` },
            { label: "Permissions", href: `/settings/organizations/${organizationId}/permissions`, active: true }
          ]}
        />
      ) : null}
      <SettingsSectionHeader title="Permissions" description="Permission records are available for future role binding." actions={<QuickCreateButton onClick={() => setOpen(true)}>Create Permission</QuickCreateButton>} />
      <SearchBox value={search} onChange={setSearch} placeholder="Search permissions" />
      <SettingsDataTable
        columns={["Code", "Name", "Description", "Status", "Actions"]}
        rows={permissions.map((permission) => [
          permission.code,
          permission.name,
          permission.description ?? "No description",
          permission.is_active === false ? "Archived" : "Active",
          <div key={permission.id} className="flex flex-wrap gap-2">
            <SettingsLinkButton href={`/settings/permissions/${permission.id}`} variant="outline">View</SettingsLinkButton>
            <ConfirmActionButton label="Delete" message={`Archive permission ${permission.name}?`} onConfirm={() => deleteMutation.mutate(permission.id)} />
          </div>
        ])}
        emptyMessage="No permissions yet"
      />
      <SettingsCard title="Permission matrix" description="Simple display mapping for administrator planning. Enforcement remains backend-owned.">
        <SettingsDataTable
          columns={["Permission", "Owner", "Admin", "Manager", "Member", "Viewer"]}
          rows={permissions.map((permission) => [
            permission.code,
            "Full",
            "Full",
            permission.code.includes("delete") ? "No" : "Manage",
            permission.code.includes("manage") ? "No" : "Use",
            "Read"
          ])}
          emptyMessage="No permissions to map"
        />
      </SettingsCard>
      <SettingsCreateDialog title="Create permission" open={open} onOpenChange={setOpen} onSubmit={submit}>
        <FormField label="Code" required><Input name="code" placeholder="workspace.manage" /></FormField>
        <FormField label="Name" required><Input name="name" placeholder="Manage workspace" /></FormField>
        <FormField label="Description"><Input name="description" placeholder="Allows workspace setup changes" /></FormField>
        <FormActions submitLabel="Create Permission" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function RoleDetailView({ roleId }: { roleId: number }) {
  const { accessToken } = useSettingsData();
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissionsQuery = useQuery({ queryKey: ["settings", "permissions"], queryFn: () => settingsApi.listPermissions(accessToken ?? ""), enabled: Boolean(accessToken) });
  const rolePermissionsQuery = useQuery({ queryKey: ["settings", "role-permissions", roleId], queryFn: () => settingsApi.listRolePermissions(accessToken ?? "", roleId), enabled: Boolean(accessToken && roleId) });
  const role = rolesQuery.data?.find((item) => item.id === roleId);
  if (!role) return <SettingsEmptyState title="Role not found" description="Open the roles list or refresh the page." action={<SettingsLinkButton href="/settings/roles">Roles</SettingsLinkButton>} />;
  const linkedPermissionIds = new Set((rolePermissionsQuery.data ?? []).map((item) => item.permission_id));
  return (
    <div className="space-y-6">
      <SettingsSectionHeader title={role.name} description={role.description ?? "Role detail and permission mapping."} />
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Scope</dt><dd>{role.scope}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{role.is_active === false ? "Archived" : "Active"}</dd></div>
          <div><dt className="text-muted-foreground">Key</dt><dd>{role.key ?? "Generated by core-service"}</dd></div>
          <div><dt className="text-muted-foreground">Organization</dt><dd>{role.organization_id ?? "Global"}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsCard title="Permissions">
        <SettingsDataTable
          columns={["Code", "Name", "Mapped"]}
          rows={(permissionsQuery.data ?? []).map((permission) => [permission.code, permission.name, linkedPermissionIds.has(permission.id) ? "Yes" : "No"])}
          emptyMessage="No permissions available"
        />
      </SettingsCard>
      <SettingsCard title="Assigned Members" description="User-role assignments are shown on member detail pages. Bulk role membership editing is planned." />
    </div>
  );
}

export function PermissionDetailView({ permissionId }: { permissionId: number }) {
  const { accessToken } = useSettingsData();
  const permissionsQuery = useQuery({ queryKey: ["settings", "permissions"], queryFn: () => settingsApi.listPermissions(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permission = permissionsQuery.data?.find((item) => item.id === permissionId);
  if (!permission) return <SettingsEmptyState title="Permission not found" description="Open the permissions list or refresh the page." action={<SettingsLinkButton href="/settings/permissions">Permissions</SettingsLinkButton>} />;
  return (
    <div className="space-y-6">
      <SettingsSectionHeader title={permission.name} description={permission.description ?? "Permission detail."} />
      <SettingsCard title="Overview">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Code</dt><dd>{permission.code}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{permission.is_active === false ? "Archived" : "Active"}</dd></div>
          <div><dt className="text-muted-foreground">Key</dt><dd>{permission.key ?? "Generated by core-service"}</dd></div>
          <div><dt className="text-muted-foreground">Created</dt><dd>{formatDate(permission.created_at)}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsCard title="Permission matrix">
        <SettingsDataTable columns={["Owner", "Admin", "Manager", "Member", "Viewer"]} rows={[["Full", "Full", "Manage", "Use", "Read"]]} emptyMessage="No matrix mapping" />
      </SettingsCard>
    </div>
  );
}

export function ApiKeysView() {
  const { accessToken, organizations, workspaces } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const apiKeysQuery = useQuery({ queryKey: ["settings", "api-keys"], queryFn: () => settingsApi.listApiKeys(accessToken ?? ""), enabled: Boolean(accessToken) });
  const apiKeys = apiKeysQuery.data ?? [];
  const mutation = useMutation({
    mutationFn: (payload: { name: string; organization_id?: number | null; workspace_id?: number | null; scopes?: string[] }) => settingsApi.createApiKey(accessToken ?? "", payload),
    onSuccess: async (key: ApiKeyRecord) => {
      setCreatedKey(key.api_key ?? null);
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["settings", "api-keys"] });
    }
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = getFormValue(event.currentTarget, "name");
    if (name) mutation.mutate({ name, organization_id: organizations[0]?.id ?? null, workspace_id: workspaces[0]?.id ?? null, scopes: ["read"] });
  }
  return (
    <div className="space-y-6">
      <SettingsSectionHeader title="API Keys" description="Create and review personal API keys for future integrations." actions={<QuickCreateButton onClick={() => setOpen(true)}>Create API Key</QuickCreateButton>} />
      {createdKey ? <SettingsCard title="New API key" description="Copy this value now. Core-service only returns it once."><code className="break-all rounded bg-muted px-2 py-1 text-sm">{createdKey}</code></SettingsCard> : null}
      <SettingsDataTable columns={["Name", "Prefix", "Scopes", "Status"]} rows={apiKeys.map((key) => [key.name, key.key_prefix, key.scopes.join(", ") || "None", key.is_active === false ? "Revoked" : "Active"])} emptyMessage="No API keys yet" />
      <SettingsCreateDialog title="Create API key" open={open} onOpenChange={setOpen} onSubmit={submit}>
        <FormField label="Name" required><Input name="name" placeholder="Local testing key" /></FormField>
        <FormActions submitLabel="Create API Key" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function PlaceholderSettingsView({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <SettingsSectionHeader title={title} description={description} />
      <SettingsEmptyState title={`${title} is planned`} description="This settings area is intentionally a placeholder for the operational foundation. No backend behavior is required yet." />
    </div>
  );
}

export function AccountSettingsView() {
  const user = useAuthStore((state) => state.currentUser);
  return (
    <div className="space-y-6">
      <SettingsSectionHeader title="Account" description="Signed-in user identity and account metadata." />
      <SettingsCard title="Profile">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Email</dt><dd>{user?.email ?? "Not loaded"}</dd></div>
          <div><dt className="text-muted-foreground">Name</dt><dd>{user?.full_name ?? "Not set"}</dd></div>
          <div><dt className="text-muted-foreground">User ID</dt><dd>{user?.id ?? "Not loaded"}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{user?.is_active ? "Active" : "Unknown"}</dd></div>
        </dl>
      </SettingsCard>
    </div>
  );
}

export function WorkspaceContextSettingsView() {
  const { organizations, workspaces, projects } = useSettingsData();
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const selectedProjectId = useWorkspaceStore((state) => state.selectedProjectId);
  const summary = useMemo(
    () => [
      ["Organization", organizations.find((item) => item.id === selectedOrganizationId)?.name ?? "Not selected"],
      ["Workspace", workspaces.find((item) => item.id === selectedWorkspaceId)?.name ?? "Not selected"],
      ["Project", projects.find((item) => item.id === selectedProjectId)?.name ?? "Not selected"]
    ],
    [organizations, projects, selectedOrganizationId, selectedProjectId, selectedWorkspaceId, workspaces]
  );
  return (
    <div className="space-y-6">
      <SettingsSectionHeader title="Workspace Context" description="Current organization, workspace, and project selection used across Asthra." />
      <SetupSummary />
      <SettingsDataTable columns={["Context", "Selected"]} rows={summary} emptyMessage="No context selected" />
    </div>
  );
}
