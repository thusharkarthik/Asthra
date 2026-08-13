"use client";

import type { ComponentProps, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/queryKeys";
import { can as hasPermission } from "@/lib/permissions";
import { settingsApi } from "@/services/api/settings-api";
import { useAuthStore } from "@/stores/auth-store";
import { getActionDefinition, type ActionScope } from "@/access/actionRegistry";

type DeniedMode = "hide" | "disabled";

export type ActionAccess = {
  actionKey: string;
  permissionCode: string;
  label: string;
  allowed: boolean;
  isLoading: boolean;
  isDenied: boolean;
  missingAction: boolean;
};

function scopeIds(scope?: ActionScope) {
  return {
    orgId: scope?.organizationId ?? undefined,
    workspaceId: scope?.workspaceId ?? undefined,
    projectId: scope?.projectId ?? undefined
  };
}

export function useActionAccess(actionKey: string, scope?: ActionScope): ActionAccess {
  const accessToken = useAuthStore((state) => state.accessToken);
  const definition = getActionDefinition(actionKey);
  const ids = scopeIds(scope);
  const permissionQuery = useQuery({
    queryKey: queryKeys.permissions.current(ids.orgId, ids.workspaceId, ids.projectId),
    queryFn: () => settingsApi.getCurrentPermissions(accessToken ?? "", {
      org_id: ids.orgId,
      workspace_id: ids.workspaceId,
      project_id: ids.projectId
    }),
    enabled: Boolean(accessToken && !scope?.permissionCodes),
    staleTime: 60_000
  });
  const permissionCode = definition?.permissionCode ?? actionKey;
  const permissionCodes = scope?.permissionCodes ?? permissionQuery.data?.permission_codes ?? [];
  const isLoading = Boolean(scope?.isLoading ?? permissionQuery.isLoading);
  const allowed = definition ? hasPermission(permissionCodes, permissionCode) : false;

  return {
    actionKey,
    permissionCode,
    label: definition?.label ?? actionKey,
    allowed,
    isLoading,
    isDenied: !isLoading && !allowed,
    missingAction: !definition
  };
}

export function usePermission(permissionCode: string, scope?: ActionScope) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const ids = scopeIds(scope);
  const permissionQuery = useQuery({
    queryKey: queryKeys.permissions.current(ids.orgId, ids.workspaceId, ids.projectId),
    queryFn: () => settingsApi.getCurrentPermissions(accessToken ?? "", {
      org_id: ids.orgId,
      workspace_id: ids.workspaceId,
      project_id: ids.projectId
    }),
    enabled: Boolean(accessToken && !scope?.permissionCodes),
    staleTime: 60_000
  });
  const permissionCodes = scope?.permissionCodes ?? permissionQuery.data?.permission_codes ?? [];
  const isLoading = Boolean(scope?.isLoading ?? permissionQuery.isLoading);
  const allowed = hasPermission(permissionCodes, permissionCode);
  return {
    permissionCode,
    allowed,
    isLoading,
    isDenied: !isLoading && !allowed
  };
}

export function Can({
  actionKey,
  scope,
  children,
  deniedMode = "hide",
  deniedFallback = null,
  loadingFallback = null
}: {
  actionKey: string;
  scope?: ActionScope;
  children: ReactNode;
  deniedMode?: DeniedMode;
  deniedFallback?: ReactNode;
  loadingFallback?: ReactNode;
}) {
  const access = useActionAccess(actionKey, scope);
  if (access.isLoading) return <>{loadingFallback}</>;
  if (access.allowed) return <>{children}</>;
  if (deniedMode === "disabled") return <>{deniedFallback}</>;
  return null;
}

export function PermissionAction({
  actionKey,
  scope,
  children,
  deniedMode = "hide",
  disabledFallback = null
}: {
  actionKey: string;
  scope?: ActionScope;
  children: ReactNode;
  deniedMode?: DeniedMode;
  disabledFallback?: ReactNode;
}) {
  return (
    <Can actionKey={actionKey} scope={scope} deniedMode={deniedMode} deniedFallback={disabledFallback}>
      {children}
    </Can>
  );
}

export function PermissionButton({
  actionKey,
  scope,
  deniedMode = "hide",
  disabledTitle,
  children,
  ...buttonProps
}: ComponentProps<typeof Button> & {
  actionKey: string;
  scope?: ActionScope;
  deniedMode?: DeniedMode;
  disabledTitle?: string;
}) {
  const access = useActionAccess(actionKey, scope);
  const label = children ?? access.label;
  if (access.isLoading) {
    return <Button {...buttonProps} disabled>{label}</Button>;
  }
  if (access.allowed) {
    return <Button {...buttonProps}>{label}</Button>;
  }
  if (deniedMode === "disabled") {
    return <Button {...buttonProps} disabled title={disabledTitle ?? `Requires ${access.permissionCode}`}>{label}</Button>;
  }
  return null;
}

export function PermissionMenuItem({
  actionKey,
  scope,
  deniedMode = "hide",
  children,
  ...props
}: ComponentProps<"button"> & {
  actionKey: string;
  scope?: ActionScope;
  deniedMode?: DeniedMode;
}) {
  const access = useActionAccess(actionKey, scope);
  if (access.isLoading) {
    return <button {...props} disabled>{children ?? access.label}</button>;
  }
  if (access.allowed) {
    return <button {...props}>{children ?? access.label}</button>;
  }
  if (deniedMode === "disabled") {
    return <button {...props} disabled title={`Requires ${access.permissionCode}`}>{children ?? access.label}</button>;
  }
  return null;
}

export function PermissionLink({
  actionKey,
  scope,
  deniedMode = "hide",
  disabledTitle,
  children,
  href,
  className,
  ...props
}: ComponentProps<typeof Link> & {
  actionKey: string;
  scope?: ActionScope;
  deniedMode?: DeniedMode;
  disabledTitle?: string;
}) {
  const access = useActionAccess(actionKey, scope);
  if (access.isLoading) {
    return <span className={className} aria-disabled="true">{children ?? access.label}</span>;
  }
  if (access.allowed) {
    return <Link href={href} className={className} {...props}>{children ?? access.label}</Link>;
  }
  if (deniedMode === "disabled") {
    return <span className={className} aria-disabled="true" title={disabledTitle ?? `Requires ${access.permissionCode}`}>{children ?? access.label}</span>;
  }
  return null;
}

export function PermissionSection({
  actionKey,
  scope,
  children,
  deniedMode = "hide",
  deniedFallback = null,
  loadingFallback = null
}: {
  actionKey: string;
  scope?: ActionScope;
  children: ReactNode;
  deniedMode?: DeniedMode;
  deniedFallback?: ReactNode;
  loadingFallback?: ReactNode;
}) {
  return (
    <Can actionKey={actionKey} scope={scope} deniedMode={deniedMode} deniedFallback={deniedFallback} loadingFallback={loadingFallback}>
      {children}
    </Can>
  );
}
