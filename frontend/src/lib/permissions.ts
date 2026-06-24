export function permissionMatches(permissionCode: string, requiredPermission: string) {
  if (requiredPermission === "*") return true;
  if (permissionCode === requiredPermission) return true;

  const requiredParts = requiredPermission.split(".");
  const permissionParts = permissionCode.split(".");
  if (requiredParts.length !== permissionParts.length) return false;

  return requiredParts.every((part, index) => part === "*" || part === permissionParts[index]);
}

export function can(permissionCodes: string[] | undefined, permissionCode: string) {
  return Boolean(permissionCodes?.some((code) => permissionMatches(code, permissionCode)));
}

export function canAny(permissionCodes: string[] | undefined, permissionCodesToCheck: string[]) {
  return permissionCodesToCheck.some((permissionCode) => can(permissionCodes, permissionCode));
}
