import { createElement } from 'react'
import OrgInvite from '../../../emails/templates/OrgInvite'
import PrimaryOwnerSetup from '../../../emails/templates/PrimaryOwnerSetup'
import OwnershipTransferRequest from '../../../emails/templates/OwnershipTransferRequest'
import { getEmailAppUrl } from './resendClient'
import { sendTransactionalEmailSafe } from './sendTransactionalEmail'

export function dispatchOrgInviteEmail(opts: {
  recipientEmail: string
  memberId: string
  organizationName: string
  role: 'owner' | 'manager'
  teamTag: string[] | null
  inviteToken: string
  inviterName: string
}): void {
  const inviteUrl = `${getEmailAppUrl()}/invite/accept?token=${opts.inviteToken}`

  sendTransactionalEmailSafe({
    templateType: 'OrgInvite',
    recipientEmail: opts.recipientEmail,
    relatedEntityType: 'org_member',
    relatedEntityId: opts.memberId,
    subject: `You're invited to join ${opts.organizationName}`,
    react: createElement(OrgInvite, {
      organizationName: opts.organizationName,
      role: opts.role,
      teamTag: opts.teamTag,
      inviteUrl,
      inviterName: opts.inviterName,
    }),
  })
}

/** Primary owner setup after Close as Enterprise — no existing inviter. */
export function dispatchPrimaryOwnerSetupEmail(opts: {
  recipientEmail: string
  memberId: string
  organizationName: string
  inviteToken: string
}): void {
  const inviteUrl = `${getEmailAppUrl()}/invite/accept?token=${opts.inviteToken}&setup=billing`

  sendTransactionalEmailSafe({
    templateType: 'PrimaryOwnerSetup',
    recipientEmail: opts.recipientEmail,
    relatedEntityType: 'org_member',
    relatedEntityId: opts.memberId,
    subject: `Set up ${opts.organizationName} on Black Diamond Enterprise`,
    react: createElement(PrimaryOwnerSetup, {
      organizationName: opts.organizationName,
      inviteUrl,
    }),
  })
}

export function dispatchOwnershipTransferRequestEmail(opts: {
  recipientEmail: string
  transferId: string
  organizationName: string
  currentOwnerName: string
  transferToken: string
}): void {
  const acceptUrl = `${getEmailAppUrl()}/dashboard/organization?transfer=${opts.transferToken}`

  sendTransactionalEmailSafe({
    templateType: 'OwnershipTransferRequest',
    recipientEmail: opts.recipientEmail,
    relatedEntityType: 'org_ownership_transfer',
    relatedEntityId: opts.transferId,
    subject: `Primary ownership transfer — ${opts.organizationName}`,
    react: createElement(OwnershipTransferRequest, {
      organizationName: opts.organizationName,
      currentOwnerName: opts.currentOwnerName,
      acceptUrl,
    }),
  })
}
