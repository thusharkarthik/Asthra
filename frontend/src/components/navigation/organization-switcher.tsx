"use client";

import { Select } from "@/components/ui/select";
import { usePlatformContext } from "@/context/platformContext";

export function OrganizationSwitcher() {
  const { organizations, currentScope, setSelectedOrganization } = usePlatformContext();

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
      value={currentScope.organizationId ?? ""}
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
