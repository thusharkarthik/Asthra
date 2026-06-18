"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export type FlowMemberOption = {
  id: number;
  name: string;
  email?: string | null;
  role?: string | null;
  source: "project" | "workspace" | "organization" | "current_user";
};

export function useFlowMemberOptions() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedOrganizationId = useWorkspaceStore((state) => state.selectedOrganizationId);
  const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);

  const workspaceMembersQuery = useQuery({
    queryKey: ["flow", "members", "workspace", selectedWorkspaceId],
    queryFn: () => settingsApi.listWorkspaceMembers(accessToken ?? "", selectedWorkspaceId ?? 0),
    enabled: Boolean(accessToken && selectedWorkspaceId),
    retry: 1
  });

  const organizationMembersQuery = useQuery({
    queryKey: ["flow", "members", "organization", selectedOrganizationId],
    queryFn: () => settingsApi.listOrganizationMembers(accessToken ?? "", selectedOrganizationId ?? 0),
    enabled: Boolean(accessToken && selectedOrganizationId),
    retry: 1
  });

  return useMemo(() => {
    const byId = new Map<number, FlowMemberOption>();
    if (currentUser?.id) {
      byId.set(currentUser.id, {
        id: currentUser.id,
        name: currentUser.full_name || currentUser.email || `User ${currentUser.id}`,
        email: currentUser.email,
        role: currentUser.is_superuser ? "Admin" : "Member",
        source: "current_user"
      });
    }
    for (const member of workspaceMembersQuery.data ?? []) {
      if (!byId.has(member.user_id)) {
        byId.set(member.user_id, {
          id: member.user_id,
          name: `User ${member.user_id}`,
          role: member.member_role || "Workspace member",
          source: "workspace"
        });
      }
    }
    for (const member of organizationMembersQuery.data ?? []) {
      if (!byId.has(member.user_id)) {
        byId.set(member.user_id, {
          id: member.user_id,
          name: `User ${member.user_id}`,
          role: member.member_role || "Organization member",
          source: "organization"
        });
      }
    }
    return Array.from(byId.values()).sort((a, b) => {
      const sourceRank = { current_user: 0, project: 1, workspace: 2, organization: 3 };
      return sourceRank[a.source] - sourceRank[b.source] || a.name.localeCompare(b.name);
    });
  }, [currentUser, organizationMembersQuery.data, workspaceMembersQuery.data]);
}

export function FlowMemberPicker({
  value,
  onChange,
  label = "Assignee",
  includeUnassigned = true
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  includeUnassigned?: boolean;
}) {
  const members = useFlowMemberOptions();
  const listId = useId();
  const selectedMember = members.find((member) => String(member.id) === value);
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    setDisplayValue(selectedMember ? memberDisplayText(selectedMember) : "");
  }, [selectedMember]);

  return (
    <div className="space-y-1">
      <Input
        aria-label={label}
        list={listId}
        placeholder={includeUnassigned ? "Unassigned" : "Search members"}
        value={displayValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDisplayValue(nextValue);
          if (!nextValue.trim() && includeUnassigned) {
            onChange("");
            return;
          }
          const matched = members.find((member) => memberDisplayText(member) === nextValue || String(member.id) === nextValue);
          if (matched) onChange(String(matched.id));
        }}
        onBlur={() => {
          if (!displayValue.trim() && includeUnassigned) {
            onChange("");
            return;
          }
          if (selectedMember) setDisplayValue(memberDisplayText(selectedMember));
        }}
      />
      <datalist id={listId}>
        {members.map((member) => (
          <option key={member.id} value={memberDisplayText(member)} />
        ))}
      </datalist>
      {selectedMember ? (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background font-semibold text-foreground">{selectedMember.name.slice(0, 1).toUpperCase()}</span>
          <span className="min-w-0">
            <span className="font-medium text-foreground">{selectedMember.name}</span>
            {selectedMember.email ? <span> · {selectedMember.email}</span> : null}
            {selectedMember.role ? <span> · {selectedMember.role}</span> : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function memberDisplayText(member: FlowMemberOption) {
  return `${member.name}${member.email ? ` · ${member.email}` : ""}${member.role ? ` · ${member.role}` : ""}`;
}

export function FlowMemberDisplay({ userId }: { userId?: number | null }) {
  const members = useFlowMemberOptions();
  const member = members.find((option) => option.id === userId);
  if (!userId) {
    return <span>Unassigned</span>;
  }
  if (!member) {
    return (
      <span>
        User {userId}
        <span className="ml-1 text-xs text-muted-foreground">Profile lookup pending</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
        {member.name.slice(0, 1).toUpperCase()}
      </span>
      <span>
        <span className="font-medium">{member.name}</span>
        {member.email ? <span className="ml-1 text-muted-foreground">{member.email}</span> : null}
        {member.role ? <span className="ml-1 text-xs text-muted-foreground">{member.role}</span> : null}
      </span>
    </span>
  );
}
