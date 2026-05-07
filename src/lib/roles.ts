const ADMIN_ROLES = ['PLATFORM_MANAGER', 'SYSTEM_MANAGER', 'OPERATIONS_MANAGER', 'ADMIN', 'SUPER_ADMIN']

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false
  return ADMIN_ROLES.includes(role)
}
