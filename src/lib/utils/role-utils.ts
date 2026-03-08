import { UserRoleEnum, type UserRole } from '@/types/admin.types'

/**
 * Normalize raw role values into a standard UserRole enum string.
 * Should not be called for unauthenticated users.
 *
 * If role is null/undefined/empty, returns 'user'.
 *
 * @param role - Raw role value from auth metadata or other sources.
 * @returns Normalized UserRole enum value.
 */
export const normalizeUserRole = (role: string | null | undefined): UserRole => {
  if (!role) return UserRoleEnum.USER

  const normalized = role.toLowerCase().trim()

  switch (normalized) {
    case 'authenticated':
      return UserRoleEnum.USER
    case 'supabase_admin':
      return UserRoleEnum.ADMIN
    case 'admin':
      return UserRoleEnum.ADMIN
    case 'moderator':
      return UserRoleEnum.MODERATOR
    case 'root':
      return UserRoleEnum.ROOT
    case 'guest':
      return UserRoleEnum.GUEST
    case 'user':
      return UserRoleEnum.USER
    default:
      return UserRoleEnum.USER
  }
}
