/**
 * Stub: @/lib/permissions
 * Simple role-based permission checker.
 */

/**
 * Check if a given role is in the list of allowed roles.
 * @param {string} role - The user's role (e.g. 'ADMIN', 'STUDENT')
 * @param {string[]} allowedRoles - Array of roles that have permission
 * @returns {boolean}
 */
export function hasPermission(role, allowedRoles) {
  if (!role || !allowedRoles) return false;
  return allowedRoles.includes(role);
}
