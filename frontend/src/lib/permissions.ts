export function can(permissionCodes: string[] | undefined, permissionCode: string) {
  return Boolean(permissionCodes?.includes(permissionCode));
}
