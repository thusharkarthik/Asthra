"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormActions, FormField, SettingsCard, SettingsLayout, SettingsSectionHeader } from "@/components/settings/settings-components";
import { useAuthStore } from "@/stores/auth-store";
import { useToastStore } from "@/stores/toast-store";
import { settingsApi } from "@/services/api/settings-api";
import { usePlatformContext } from "@/context/platformContext";
import type { CoreUser, RoleAssignmentRecord, RoleRecord } from "@/types/core";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const LOCALES = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
];

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-teal-500",
];

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAvatarColor(name: string | null | undefined, email: string): string {
  const seed = (name || email).charCodeAt(0) + (name || email).charCodeAt(1 % (name || email).length);
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}

function UserAvatar({ user }: { user: CoreUser | null }) {
  const initials = getInitials(user?.full_name);
  const colorClass = getAvatarColor(user?.full_name, user?.email ?? "");
  return (
    <div className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white ${colorClass}`}>
      {initials}
    </div>
  );
}

function scopeLabel(scopeType: string, scopeId: number | null | undefined, organizations: { id: number; name: string }[], workspaces: { id: number; name: string }[]): string {
  if (scopeType === "platform") return "Platform";
  if (scopeType === "organization" && scopeId) {
    const org = organizations.find((o) => o.id === scopeId);
    return org ? org.name : `Organization #${scopeId}`;
  }
  if (scopeType === "workspace" && scopeId) {
    const ws = workspaces.find((w) => w.id === scopeId);
    return ws ? ws.name : `Workspace #${scopeId}`;
  }
  if (scopeType === "project" && scopeId) return `Project #${scopeId}`;
  if (scopeType === "team" && scopeId) return `Team #${scopeId}`;
  return scopeType;
}

export default function ProfileSettingsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const addToast = useToastStore((state) => state.addToast);
  const { organizations, workspaces } = usePlatformContext();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(currentUser?.full_name ?? "");
  const [jobTitle, setJobTitle] = useState(currentUser?.job_title ?? "");
  const [timezone, setTimezone] = useState(currentUser?.timezone ?? "UTC");
  const [locale, setLocale] = useState(currentUser?.locale ?? "en");

  const profileQuery = useQuery({
    queryKey: ["me", "profile"],
    queryFn: () => settingsApi.getMyProfile(accessToken ?? ""),
    enabled: Boolean(accessToken),
  });

  const roleAssignmentsQuery = useQuery({
    queryKey: ["me", "role-assignments"],
    queryFn: () => settingsApi.listRoleAssignments(accessToken ?? "", { user_id: currentUser?.id, status: "active" }),
    enabled: Boolean(accessToken && currentUser?.id),
  });

  const rolesQuery = useQuery({
    queryKey: ["roles", "list"],
    queryFn: () => settingsApi.listRoles(accessToken ?? ""),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    const user = profileQuery.data ?? currentUser;
    if (!user) return;
    setFullName(user.full_name ?? "");
    setJobTitle(user.job_title ?? "");
    setTimezone(user.timezone ?? "UTC");
    setLocale(user.locale ?? "en");
  }, [profileQuery.data, currentUser]);

  const updateMutation = useMutation({
    mutationFn: (payload: { full_name: string; job_title: string; timezone: string; locale: string }) =>
      settingsApi.updateMyProfile(accessToken ?? "", payload),
    onSuccess: (updatedUser) => {
      // Update form state immediately from API response — do not wait for query refetch
      setFullName(updatedUser.full_name ?? "");
      setJobTitle(updatedUser.job_title ?? "");
      setTimezone(updatedUser.timezone ?? "UTC");
      setLocale(updatedUser.locale ?? "en");
      // Push updated user into the query cache so useEffect sees fresh data
      queryClient.setQueryData(["me", "profile"], updatedUser);
      // Update auth store so name/avatar update everywhere (header, bottom bar)
      useAuthStore.setState((state) => ({ ...state, currentUser: updatedUser }));
      addToast({ type: "success", title: "Profile updated", message: "Your profile has been saved." });
    },
    onError: (error) => {
      addToast({ type: "error", title: "Save failed", message: error instanceof Error ? error.message : "Unable to save profile." });
    },
  });

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    updateMutation.mutate({ full_name: fullName, job_title: jobTitle, timezone, locale });
  }

  const profile = profileQuery.data ?? currentUser;
  const roleAssignments: RoleAssignmentRecord[] = roleAssignmentsQuery.data ?? [];
  const rolesById: Record<number, RoleRecord> = Object.fromEntries((rolesQuery.data ?? []).map((r) => [r.id, r]));

  return (
    <SettingsLayout breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Profile" }]} backHref="/settings" backLabel="Back to Settings">
      <SettingsSectionHeader title="Profile" description="Manage your personal information and preferences." />

      <SettingsCard title="Avatar">
        <div className="flex items-center gap-4">
          <UserAvatar user={profile} />
          <div>
            <p className="text-sm font-medium">{profile?.full_name || "Set your name below"}</p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
            <p className="mt-2 text-xs text-muted-foreground">Avatar upload available in a future update.</p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Personal Information">
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Full Name" required>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </FormField>
          <FormField label="Email">
            <Input value={profile?.email ?? ""} readOnly className="opacity-60 cursor-not-allowed" />
            <span className="block text-xs text-muted-foreground mt-1">Email cannot be changed.</span>
          </FormField>
          <FormField label="Job Title">
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Engineer"
            />
          </FormField>
          <FormField label="Timezone">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Language">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </form>
      </SettingsCard>

      <SettingsCard title="Role Assignments">
        {roleAssignmentsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading roles…</p>
        ) : roleAssignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active role assignments.</p>
        ) : (
          <ul className="space-y-2">
            {roleAssignments.map((assignment) => {
              const role = rolesById[assignment.role_id];
              const roleName = role?.name ?? `Role #${assignment.role_id}`;
              const scope = scopeLabel(assignment.scope_type, assignment.scope_id, organizations, workspaces);
              return (
                <li key={assignment.id} className="flex items-center gap-2 text-sm">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">{assignment.scope_type}</span>
                  <span className="font-medium">{roleName}</span>
                  <span className="text-muted-foreground">—</span>
                  <span className="text-muted-foreground">{scope}</span>
                </li>
              );
            })}
          </ul>
        )}
      </SettingsCard>
    </SettingsLayout>
  );
}
