/**
 * Returns true only when ALL permissions in the chain are granted.
 * Used to enforce the permission hierarchy in settings pages:
 *   every child permission requires its parent(s) to also be present.
 */
export function hasHierarchicalPermission(
  can: (code: string) => boolean,
  ...permissions: string[]
): boolean {
  return permissions.every((p) => can(p));
}
