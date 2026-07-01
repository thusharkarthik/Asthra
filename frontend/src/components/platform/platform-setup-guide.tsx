"use client";

import Link from "next/link";
import { Building2, FolderKanban, PanelsTopLeft } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AsthraLogo } from "@/components/brand/asthra-logo";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/services/api/client";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import type { Organization } from "@/types/core";

function OrgCreateForm({
  onSuccess,
  submitLabel = "Create Organization"
}: {
  onSuccess?: (organization?: Organization) => void | Promise<void>;
  submitLabel?: string;
}) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitCompleted, setSubmitCompleted] = useState(false);

  const refreshPlatformContext = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.platformContext.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.context.versionRoot }),
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all }),
    ]);
    await queryClient.refetchQueries({ queryKey: queryKeys.platformContext.all, type: "active" });
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (!accessToken) throw new Error("Not authenticated");
      return settingsApi.onboardOrganization(accessToken, {
        name: name.trim(),
        description: description.trim() || null,
      });
    },
    onSuccess: async (organization) => {
      setSubmitCompleted(true);
      await refreshPlatformContext();
      await onSuccess?.(organization);
    },
    onError: async (error: Error) => {
      if (error instanceof ApiError && error.status === 400 && error.message.toLowerCase().includes("already have access")) {
        setSubmitCompleted(true);
        await refreshPlatformContext();
        await onSuccess?.();
        return;
      }
      setFormError(error.message ?? "Something went wrong. Please try again.");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mutation.isPending || submitCompleted) return;
    setFormError(null);
    if (!name.trim()) {
      setFormError("Organization name is required.");
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="org-name" className="text-sm font-medium leading-none">
          Organization name <span className="text-destructive">*</span>
        </label>
        <input
          id="org-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Acme Corp"
        required
        disabled={mutation.isPending || submitCompleted}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="org-description" className="text-sm font-medium leading-none">
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="org-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="A short description of your organization"
          rows={3}
          disabled={mutation.isPending || submitCompleted}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[72px]"
        />
      </div>
      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      <button
        type="submit"
        disabled={mutation.isPending || submitCompleted || !name.trim()}
        className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {mutation.isPending || submitCompleted ? "Creating…" : submitLabel}
      </button>
    </form>
  );
}

export function CreateOrgDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Create organization">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-base font-semibold">Create your organization</h2>
        <OrgCreateForm onSuccess={() => onOpenChange(false)} />
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function OnboardingGate({ onSkip, onCreated }: { onSkip?: () => void; onCreated?: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <AsthraLogo markClassName="h-14 w-14 rounded-2xl" showWordmark />
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to Asthra</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create your organization to get started</p>
          </div>
        </div>
        <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <OrgCreateForm onSuccess={onCreated} />
        </div>
        {onSkip ? (
          <div className="text-center">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Skip for now
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

type PlatformSetupGuideProps = {
  hasOrganization?: boolean;
  hasWorkspace?: boolean;
  hasProject?: boolean;
  moduleName?: string;
  requiresProject?: boolean;
  title?: string;
  description?: string;
};

export function PlatformSetupGuide({
  hasOrganization = true,
  hasWorkspace = true,
  hasProject = true,
  moduleName = "Asthra",
  requiresProject = false,
  title,
  description
}: PlatformSetupGuideProps) {
  const step = !hasOrganization
    ? {
        icon: Building2,
        title: title ?? "Create an organization to start using Asthra",
        description: description ?? "Organizations are the top-level home for users, workspaces, projects, and platform settings.",
        action: "Create Organization"
      }
    : !hasWorkspace
      ? {
          icon: PanelsTopLeft,
          title: title ?? `Create or select a workspace for ${moduleName}`,
          description: description ?? "A workspace connects teams, projects, content, operations, and AI-ready context.",
          action: "Create Workspace"
        }
      : requiresProject && !hasProject
        ? {
            icon: FolderKanban,
            title: title ?? `Create or select a project for ${moduleName}`,
            description: description ?? "Projects scope work, docs, ideas, tickets, and module-specific activity to the right team or product.",
            action: "Create Project"
          }
        : null;

  if (!step) return null;

  const Icon = step.icon;

  return (
    <section className="rounded-lg border bg-card p-6" aria-label={`${moduleName} setup guide`}>
      <div className="flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/settings/workspace" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
              {step.action}
            </Link>
            <Link href="/settings" className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-muted">
              Open Settings
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
