"use client";

import { Select } from "@/components/ui/select";
import { useOrganizations } from "@/hooks/use-smart-context-cache";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function OrganizationSwitcher() {
  const organizationsQuery = useOrganizations();
  const { organizations: cachedOrganizations, selectedOrganizationId, setSelectedOrganization } = useWorkspaceStore();
  const organizations = organizationsQuery.data ?? cachedOrganizations;

  if (organizations.length === 0) {
    return (
      <Select aria-label="Organization" disabled>
        <option>No organizations</option>
      </Select>
    );
  }

  return (
    <Select
      aria-label="Organization"
      value={selectedOrganizationId ?? ""}
      onChange={(event) => setSelectedOrganization(Number(event.target.value))}
    >
      {organizations.map((organization) => (
        <option key={organization.id} value={organization.id}>
          {organization.name}
        </option>
      ))}
    </Select>
  );
}
