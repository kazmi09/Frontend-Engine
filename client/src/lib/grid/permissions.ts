import type { ColumnConfig } from './types'

/**
 * Resolve column-level permissions for the current user role in a
 * completely data-agnostic way.
 *
 * - Filters out columns the user is not allowed to VIEW
 * - Normalizes the `editable` flag to reflect EDIT permissions
 *
 * All rules are driven purely by column configuration. No roles are
 * hard-coded here; we only compare string identifiers.
 */
export function resolveColumnPermissions(
  columns: ColumnConfig[],
  userRole: string | null | undefined,
): ColumnConfig[] {
  if (!columns || columns.length === 0) return []

  // If we don't know the user role yet, return columns as-is
  if (!userRole) return columns

  return columns
    .filter((col) => {
      const perms = col.permissions

      // Explicit view list takes precedence
      if (perms?.view && perms.view.length > 0) {
        return perms.view.includes(userRole)
      }

      // Backwards-compatible: legacy requiredPermissions means
      // "must have this role to see (and potentially edit)"
      if (col.requiredPermissions && col.requiredPermissions.length > 0) {
        return col.requiredPermissions.includes(userRole)
      }

      // No view restriction configured → visible to all roles
      return true
    })
    .map((col) => {
      const perms = col.permissions

      // Base editability from config (defaults to true if not explicitly false)
      const baseEditable = col.editable !== false

      let canEdit = baseEditable

      if (perms?.edit && perms.edit.length > 0) {
        canEdit = baseEditable && perms.edit.includes(userRole)
      } else if (col.requiredPermissions && col.requiredPermissions.length > 0) {
        // Legacy behaviour: if requiredPermissions is set and we passed the
        // view check above, we still gate editing by the same list.
        canEdit = baseEditable && col.requiredPermissions.includes(userRole)
      }

      return {
        ...col,
        editable: canEdit,
      }
    })
}



