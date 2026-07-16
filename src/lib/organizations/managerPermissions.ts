import type { OrgMembership } from '@/lib/organizations/auth'

export interface ManagerPermissions {
  can_see_all_locations: boolean
  can_access_billing: boolean
  can_edit_company_info: boolean
  can_manage_managers_org_wide: boolean
}

export const DEFAULT_MANAGER_PERMISSIONS: ManagerPermissions = {
  can_see_all_locations: false,
  can_access_billing: false,
  can_edit_company_info: false,
  can_manage_managers_org_wide: false,
}

export const MANAGER_PERMISSION_OPTIONS: Array<{
  key: keyof ManagerPermissions
  label: string
  description: string
}> = [
  {
    key: 'can_see_all_locations',
    label: 'See all locations',
    description: 'View listings from every location in the organization, not just assigned ones.',
  },
  {
    key: 'can_access_billing',
    label: 'Access billing',
    description: 'View the Billing tab, seat usage, and manage payment through Stripe.',
  },
  {
    key: 'can_edit_company_info',
    label: 'Edit company profile',
    description: 'Edit organization name, logo, and description on the Company Profile tab.',
  },
  {
    key: 'can_manage_managers_org_wide',
    label: 'Manage managers org-wide',
    description: 'Invite and remove Managers across all locations, not just their own.',
  },
]

export function permissionsFromMembership(
  membership: Pick<OrgMembership, keyof ManagerPermissions | 'role'>,
): ManagerPermissions {
  if (membership.role === 'owner') {
    return {
      can_see_all_locations: true,
      can_access_billing: true,
      can_edit_company_info: true,
      can_manage_managers_org_wide: true,
    }
  }
  return {
    can_see_all_locations: membership.can_see_all_locations,
    can_access_billing: membership.can_access_billing,
    can_edit_company_info: membership.can_edit_company_info,
    can_manage_managers_org_wide: membership.can_manage_managers_org_wide,
  }
}

export function parseManagerPermissionsInput(
  input: Partial<ManagerPermissions> | undefined,
): ManagerPermissions {
  if (!input) return { ...DEFAULT_MANAGER_PERMISSIONS }
  return {
    can_see_all_locations: Boolean(input.can_see_all_locations),
    can_access_billing: Boolean(input.can_access_billing),
    can_edit_company_info: Boolean(input.can_edit_company_info),
    can_manage_managers_org_wide: Boolean(input.can_manage_managers_org_wide),
  }
}

export function managerHasBillingAccess(
  membership: Pick<OrgMembership, 'role' | 'can_access_billing'>,
): boolean {
  return membership.role === 'owner' || membership.can_access_billing
}

export function managerHasProfileEditAccess(
  membership: Pick<OrgMembership, 'role' | 'can_edit_company_info'>,
): boolean {
  return membership.role === 'owner' || membership.can_edit_company_info
}

export function managerHasOrgWideManagerAccess(
  membership: Pick<OrgMembership, 'role' | 'can_manage_managers_org_wide'>,
): boolean {
  return membership.role === 'owner' || membership.can_manage_managers_org_wide
}
