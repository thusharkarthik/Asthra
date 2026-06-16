"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { settingsApi } from "@/services/api/settings-api";
import type { ApiKeyRecord, Organization, ProjectRecord, RoleRecord, TeamRecord, WorkspaceRecord } from "@/types/core";
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

function SetupSummary() {
  const { organizations, workspaces, projects } = useSettingsData();
  return <PlatformSetupSteps hasOrganization={organizations.length > 0} hasWorkspace={workspaces.length > 0} hasProject={projects.length > 0} />;
}

export function SettingsHomeView() {
  const { organizations, workspaces, projects } = useSettingsData();
  const cards = [
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
      <div className="grid gap-4 md:grid-cols-2">
        <SettingsCard title="Overview">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-muted-foreground">Slug</dt><dd>{organization.slug ?? "Not available"}</dd></div>
            <div><dt className="text-muted-foreground">Status</dt><dd>{organization.is_active === false ? "Inactive" : "Active"}</dd></div>
          </dl>
        </SettingsCard>
        <SettingsCard title="Admin areas">
          <div className="flex flex-wrap gap-2">
            <SettingsLinkButton href={`/settings/organizations/${organizationId}/members`} variant="outline">Members</SettingsLinkButton>
            <SettingsLinkButton href={`/settings/organizations/${organizationId}/workspaces`} variant="outline">Workspaces</SettingsLinkButton>
            <SettingsLinkButton href={`/settings/organizations/${organizationId}/roles`} variant="outline">Roles</SettingsLinkButton>
            <SettingsLinkButton href={`/settings/organizations/${organizationId}/permissions`} variant="outline">Permissions</SettingsLinkButton>
          </div>
        </SettingsCard>
      </div>
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
      <div className="grid gap-4 md:grid-cols-2">
        <SettingsCard title="Overview">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-muted-foreground">Organization ID</dt><dd>{workspace.organization_id}</dd></div>
            <div><dt className="text-muted-foreground">Status</dt><dd>{workspace.is_active === false ? "Inactive" : "Active"}</dd></div>
          </dl>
        </SettingsCard>
        <SettingsCard title="Admin areas">
          <div className="flex flex-wrap gap-2">
            <SettingsLinkButton href={`/settings/workspaces/${workspaceId}/members`} variant="outline">Members</SettingsLinkButton>
            <SettingsLinkButton href={`/settings/workspaces/${workspaceId}/teams`} variant="outline">Teams</SettingsLinkButton>
            <SettingsLinkButton href={`/settings/workspaces/${workspaceId}/projects`} variant="outline">Projects</SettingsLinkButton>
          </div>
        </SettingsCard>
      </div>
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
  const { projects, workspaces } = useSettingsData();
  const project = projects.find((item) => item.id === projectId);
  if (!project) {
    return <SettingsEmptyState title="Project not found" description="Refresh the page or open the projects list." action={<SettingsLinkButton href="/settings/projects">Projects</SettingsLinkButton>} />;
  }
  return (
    <div className="space-y-6">
      <SettingsSectionHeader title={project.name} description={project.description ?? "Project settings and operational metadata."} actions={<SettingsLinkButton href="/flow">Open Flow</SettingsLinkButton>} />
      <SettingsCard title="Project metadata">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-muted-foreground">Workspace</dt><dd>{workspaces.find((workspace) => workspace.id === project.workspace_id)?.name ?? project.workspace_id}</dd></div>
          <div><dt className="text-muted-foreground">Status</dt><dd>{project.status ?? "active"}</dd></div>
          <div><dt className="text-muted-foreground">Key</dt><dd>{project.key ?? "Generated by core-service"}</dd></div>
          <div><dt className="text-muted-foreground">Owner</dt><dd>{project.owner_id ?? "Not assigned"}</dd></div>
        </dl>
      </SettingsCard>
      <SettingsDangerZone description="Project archive is a placeholder for the usability pass. Project records remain managed by core-service." />
    </div>
  );
}

export function MembersView({ organizationId, workspaceId }: { organizationId?: number; workspaceId?: number }) {
  const { accessToken } = useSettingsData();
  const membersQuery = useQuery<Array<{ user_id: number; role_id?: number | null; member_role: string }>>({
    queryKey: ["settings", "members", organizationId, workspaceId],
    queryFn: async () => {
      if (organizationId) return settingsApi.listOrganizationMembers(accessToken ?? "", organizationId);
      return settingsApi.listWorkspaceMembers(accessToken ?? "", workspaceId ?? 0);
    },
    enabled: Boolean(accessToken && (organizationId || workspaceId))
  });
  const members = membersQuery.data ?? [];
  return (
    <div className="space-y-6">
      <SettingsSectionHeader title="Members" description="Review current membership. Invites and role assignment are planned next." />
      <SettingsDataTable
        columns={["User ID", "Role ID", "Member Role"]}
        rows={members.map((member) => [member.user_id, member.role_id ?? "None", member.member_role])}
        emptyMessage="No members found"
      />
    </div>
  );
}

export function TeamsView({ workspaceId }: { workspaceId?: number }) {
  const { accessToken, workspaces } = useSettingsData();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
  const teamsQuery = useQuery({ queryKey: ["settings", "teams"], queryFn: () => settingsApi.listTeams(accessToken ?? ""), enabled: Boolean(accessToken) });
  const teams = (teamsQuery.data ?? []).filter((team: TeamRecord) => (workspaceId ? team.workspace_id === workspaceId : true));
  const targetWorkspaceId = workspaceId ?? selectedWorkspaceId ?? workspaces[0]?.id;
  const mutation = useMutation({
    mutationFn: (payload: { workspace_id: number; name: string; description?: string }) => settingsApi.createTeam(accessToken ?? "", payload),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["settings", "teams"] });
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : "Unable to create team.")
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
      <SettingsSectionHeader title="Teams" description="Create lightweight workspace teams for future ownership and permissions." actions={<QuickCreateButton onClick={() => setOpen(true)}>Create Team</QuickCreateButton>} />
      <SettingsDataTable columns={["Name", "Workspace ID", "Description"]} rows={teams.map((team) => [team.name, team.workspace_id, team.description ?? "No description"])} emptyMessage="No teams yet" />
      <SettingsCreateDialog title="Create team" open={open} onOpenChange={setOpen} onSubmit={submit} error={formError}>
        <FormField label="Name" required><Input name="name" placeholder="Engineering" /></FormField>
        <FormField label="Description"><Input name="description" placeholder="Build and operations team" /></FormField>
        <FormActions submitLabel="Create Team" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function RolesView({ organizationId }: { organizationId?: number }) {
  const { accessToken } = useSettingsData();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const rolesQuery = useQuery({ queryKey: ["settings", "roles"], queryFn: () => settingsApi.listRoles(accessToken ?? ""), enabled: Boolean(accessToken) });
  const roles = (rolesQuery.data ?? []).filter((role: RoleRecord) => (organizationId ? role.organization_id === organizationId || role.organization_id == null : true));
  const mutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; organization_id?: number; scope?: string }) => settingsApi.createRole(accessToken ?? "", payload),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["settings", "roles"] });
    }
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = getFormValue(event.currentTarget, "name");
    if (name) mutation.mutate({ name, description: getFormValue(event.currentTarget, "description") || undefined, organization_id: organizationId, scope: "organization" });
  }
  return (
    <div className="space-y-6">
      <SettingsSectionHeader title="Roles" description="Define role records for future access-control assignment." actions={<QuickCreateButton onClick={() => setOpen(true)}>Create Role</QuickCreateButton>} />
      <SettingsDataTable columns={["Name", "Scope", "Status"]} rows={roles.map((role) => [role.name, role.scope, role.is_active === false ? "Inactive" : "Active"])} emptyMessage="No roles yet" />
      <SettingsCreateDialog title="Create role" open={open} onOpenChange={setOpen} onSubmit={submit}>
        <FormField label="Name" required><Input name="name" placeholder="Workspace Admin" /></FormField>
        <FormField label="Description"><Input name="description" placeholder="Can manage workspace setup" /></FormField>
        <FormActions submitLabel="Create Role" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
    </div>
  );
}

export function PermissionsView() {
  const { accessToken } = useSettingsData();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const permissionsQuery = useQuery({ queryKey: ["settings", "permissions"], queryFn: () => settingsApi.listPermissions(accessToken ?? ""), enabled: Boolean(accessToken) });
  const permissions = permissionsQuery.data ?? [];
  const mutation = useMutation({
    mutationFn: (payload: { code: string; name: string; description?: string }) => settingsApi.createPermission(accessToken ?? "", payload),
    onSuccess: async () => {
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["settings", "permissions"] });
    }
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = getFormValue(event.currentTarget, "code");
    const name = getFormValue(event.currentTarget, "name");
    if (code && name) mutation.mutate({ code, name, description: getFormValue(event.currentTarget, "description") || undefined });
  }
  return (
    <div className="space-y-6">
      <SettingsSectionHeader title="Permissions" description="Permission records are available for future role binding." actions={<QuickCreateButton onClick={() => setOpen(true)}>Create Permission</QuickCreateButton>} />
      <SettingsDataTable columns={["Code", "Name", "Description"]} rows={permissions.map((permission) => [permission.code, permission.name, permission.description ?? "No description"])} emptyMessage="No permissions yet" />
      <SettingsCreateDialog title="Create permission" open={open} onOpenChange={setOpen} onSubmit={submit}>
        <FormField label="Code" required><Input name="code" placeholder="workspace.manage" /></FormField>
        <FormField label="Name" required><Input name="name" placeholder="Manage workspace" /></FormField>
        <FormField label="Description"><Input name="description" placeholder="Allows workspace setup changes" /></FormField>
        <FormActions submitLabel="Create Permission" isSubmitting={mutation.isPending} onCancel={() => setOpen(false)} />
      </SettingsCreateDialog>
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
