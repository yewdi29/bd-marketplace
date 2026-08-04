/**
 * Admin-only batch test-send: one sample of every transactional email template
 * through the real sendTransactionalEmail pipeline (Resend + email_log).
 *
 * Never queries the database for recipients or content — all sample data is fake.
 * Sends to exactly one address per run.
 *
 * Usage:
 *   npx tsx scripts/test-send-all-emails.ts you@example.com
 *   TEST_EMAIL_RECIPIENT=you@example.com npx tsx scripts/test-send-all-emails.ts
 *
 * Requires .env.local (or exported env): RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY (for email_log writes via the real send path).
 */

import { readFileSync } from 'fs'
import React, { createElement, type ReactElement } from 'react'

// Email templates omit React imports (Next.js automatic JSX runtime).
// Expose React globally so @react-email/render works under tsx.
;(globalThis as typeof globalThis & { React: typeof React }).React = React

import ListingApproved from '../emails/templates/ListingApproved'
import ListingNeedsChanges from '../emails/templates/ListingNeedsChanges'
import ListingRemoved from '../emails/templates/ListingRemoved'
import NewInquirySeller from '../emails/templates/NewInquirySeller'
import InquiryReceivedBuyer from '../emails/templates/InquiryReceivedBuyer'
import PlanDowngradeListingOverflow from '../emails/templates/PlanDowngradeListingOverflow'
import OrgInvite from '../emails/templates/OrgInvite'
import PrimaryOwnerSetup from '../emails/templates/PrimaryOwnerSetup'
import OwnershipTransferRequest from '../emails/templates/OwnershipTransferRequest'
import OwnershipTransferCompleted from '../emails/templates/OwnershipTransferCompleted'
import Welcome from '../emails/templates/Welcome'
import AuthConfirmation from '../emails/templates/AuthConfirmation'
import AuthPasswordReset from '../emails/templates/AuthPasswordReset'
import ListingLimitUpsell from '../emails/templates/ListingLimitUpsell'
import SubscriptionConfirmed from '../emails/templates/SubscriptionConfirmed'
import PaymentFailed from '../emails/templates/PaymentFailed'
import UpcomingRenewal from '../emails/templates/UpcomingRenewal'
import SeatBillingReceipt from '../emails/templates/SeatBillingReceipt'
import {
  sendTransactionalEmail,
  type EmailTemplateType,
} from '../src/lib/email/sendTransactionalEmail'

function loadEnvLocal() {
  try {
    const raw = readFileSync('.env.local', 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // .env.local optional when env vars are already exported
  }
}

loadEnvLocal()

// ── Sample / fake data only — never loaded from the database ─────────────────
const FAKE = {
  // Real active listing slug so InquiryReceivedBuyer / listing CTAs resolve when clicked in QA
  listingTitle: '5" S-135 Drill Pipe — Range 2',
  listingUrl: 'https://blackdiamondmkt.com/listings/5-s-135-drill-pipe-range-2-b56ac51c',
  editUrl: 'https://blackdiamondmkt.com/dashboard',
  dashboardUrl: 'https://blackdiamondmkt.com/dashboard',
  upgradeUrl: 'https://blackdiamondmkt.com/dashboard/upgrade',
  browseUrl: 'https://blackdiamondmkt.com/search',
  companySettingsUrl: 'https://blackdiamondmkt.com/dashboard/organization',
  inviteUrl: 'https://blackdiamondmkt.com/invite/accept?token=sample-test-token',
  transferAcceptUrl: 'https://blackdiamondmkt.com/dashboard/organization?transfer=sample-test-token',
  buyerName: 'Jordan Reyes',
  buyerEmail: 'jordan.reyes.sample@example.com',
  buyerCompany: 'Reyes Heavy Civil LLC',
  buyerPhone: '+1 (432) 555-0199',
  buyerMessage:
    'Interested in this excavator for a pipeline ROW project starting next month. Can you confirm hours and undercarriage condition?',
  flagComment:
    'Please add at least two more photos showing the undercarriage and bucket, and clarify total machine hours in the description.',
  removalReason:
    'This listing was removed because the photos and description did not match the stated equipment condition after review.',
  organizationName: 'Sample Energy Services Co.',
  inviterName: 'Alex Morgan',
  currentOwnerName: 'Alex Morgan',
  firstName: 'Jordan',
  otpCode: '482917',
  resetUrl:
    'https://blackdiamondmkt.com/auth/reset-password?token_hash=sample-token-hash&type=recovery',
  // Fixed fake UUIDs so email_log related_entity_id stays valid without real rows
  relatedId: '00000000-0000-4000-8000-000000000001',
} as const

/**
 * Add new templates here as one-line entries when emails are built.
 * Each item uses sendTransactionalEmail with hardcoded fake props — no DB reads.
 */
type TestEmailJob = {
  templateType: EmailTemplateType
  subject: string
  relatedEntityType: string
  react: ReactElement
}

function buildJobs(): TestEmailJob[] {
  return [
    {
      templateType: 'ListingApproved',
      subject: `[TEST] Your listing is now live — ${FAKE.listingTitle}`,
      relatedEntityType: 'listing',
      react: createElement(ListingApproved, {
        listingTitle: FAKE.listingTitle,
        listingUrl: FAKE.listingUrl,
      }),
    },
    {
      templateType: 'ListingNeedsChanges',
      subject: `[TEST] Updates needed on your listing — ${FAKE.listingTitle}`,
      relatedEntityType: 'listing',
      react: createElement(ListingNeedsChanges, {
        listingTitle: FAKE.listingTitle,
        flagComment: FAKE.flagComment,
        editUrl: FAKE.editUrl,
      }),
    },
    {
      templateType: 'ListingRemoved',
      subject: `[TEST] Your listing has been removed — ${FAKE.listingTitle}`,
      relatedEntityType: 'listing',
      react: createElement(ListingRemoved, {
        listingTitle: FAKE.listingTitle,
        removalReason: FAKE.removalReason,
      }),
    },
    {
      templateType: 'NewInquirySeller',
      subject: `[TEST] New inquiry on your listing — ${FAKE.listingTitle}`,
      relatedEntityType: 'inquiry',
      react: createElement(NewInquirySeller, {
        listingTitle: FAKE.listingTitle,
        buyerName: FAKE.buyerName,
        buyerEmail: FAKE.buyerEmail,
        buyerCompany: FAKE.buyerCompany,
        buyerPhone: FAKE.buyerPhone,
        buyerMessage: FAKE.buyerMessage,
        listingUrl: FAKE.listingUrl,
        showVerification: true,
        trustLabel: 'verified_member',
        buyerTierAtSubmission: 'starter',
        contentRiskScore: 12,
        contentRiskFlagSummary: 'None',
        agentReasoning: 'Buyer message is specific to the equipment and shows purchase intent.',
      }),
    },
    {
      templateType: 'InquiryReceivedBuyer',
      subject: `[TEST] We've received your inquiry — Black Diamond Marketplace`,
      relatedEntityType: 'inquiry',
      react: createElement(InquiryReceivedBuyer, {
        listingTitle: FAKE.listingTitle,
        listingUrl: FAKE.listingUrl,
      }),
    },
    {
      templateType: 'PlanDowngradeListingOverflow',
      subject: `[TEST] 5 listings unpublished — Free plan`,
      relatedEntityType: 'user',
      react: createElement(PlanDowngradeListingOverflow, {
        newPlanLabel: 'Free',
        unpublishedCount: 5,
        keptActiveCount: 3,
        dashboardUrl: FAKE.dashboardUrl,
        upgradeUrl: FAKE.upgradeUrl,
      }),
    },
    {
      templateType: 'OrgInvite',
      subject: `[TEST] You're invited to join ${FAKE.organizationName}`,
      relatedEntityType: 'org_member',
      react: createElement(OrgInvite, {
        organizationName: FAKE.organizationName,
        role: 'manager',
        teamTag: ['Permian Basin', 'Eagle Ford'],
        inviteUrl: FAKE.inviteUrl,
        inviterName: FAKE.inviterName,
      }),
    },
    {
      templateType: 'PrimaryOwnerSetup',
      subject: `[TEST] Welcome to Black Diamond Enterprise — ${FAKE.organizationName}`,
      relatedEntityType: 'org_member',
      react: createElement(PrimaryOwnerSetup, {
        organizationName: FAKE.organizationName,
        inviteUrl: FAKE.inviteUrl,
      }),
    },
    {
      templateType: 'OwnershipTransferRequest',
      subject: `[TEST] Primary ownership transfer — ${FAKE.organizationName}`,
      relatedEntityType: 'org_ownership_transfer',
      react: createElement(OwnershipTransferRequest, {
        organizationName: FAKE.organizationName,
        currentOwnerName: FAKE.currentOwnerName,
        acceptUrl: FAKE.transferAcceptUrl,
      }),
    },
    {
      templateType: 'Welcome',
      subject: `[TEST] Welcome to Black Diamond Marketplace`,
      relatedEntityType: 'user',
      react: createElement(Welcome, {
        firstName: FAKE.firstName,
        browseUrl: FAKE.browseUrl,
        dashboardUrl: FAKE.dashboardUrl,
      }),
    },
    {
      templateType: 'OwnershipTransferCompleted',
      subject: `[TEST] You're now the primary owner — ${FAKE.organizationName}`,
      relatedEntityType: 'org_ownership_transfer',
      react: createElement(OwnershipTransferCompleted, {
        organizationName: FAKE.organizationName,
        companySettingsUrl: FAKE.companySettingsUrl,
      }),
    },
    {
      templateType: 'AuthConfirmation',
      subject: `[TEST] Confirm your email — Black Diamond Marketplace`,
      relatedEntityType: 'user',
      react: createElement(AuthConfirmation, {
        otpCode: FAKE.otpCode,
      }),
    },
    {
      templateType: 'AuthPasswordReset',
      subject: `[TEST] Reset your password — Black Diamond Marketplace`,
      relatedEntityType: 'user',
      react: createElement(AuthPasswordReset, {
        resetUrl: FAKE.resetUrl,
      }),
    },
    {
      templateType: 'ListingLimitUpsell',
      subject: `[TEST] You've reached your Free listing limit`,
      relatedEntityType: 'user',
      react: createElement(ListingLimitUpsell, {
        firstName: FAKE.firstName,
        currentPlanLabel: 'Free',
        currentLimit: 3,
        nextPlanLabel: 'Starter',
        nextListingAllowance: '15 active listings',
        upgradeUrl: FAKE.upgradeUrl,
      }),
    },
    {
      templateType: 'ListingLimitUpsell',
      subject: `[TEST] You've reached your Starter listing limit`,
      relatedEntityType: 'user',
      react: createElement(ListingLimitUpsell, {
        firstName: FAKE.firstName,
        currentPlanLabel: 'Starter',
        currentLimit: 15,
        nextPlanLabel: 'Pro',
        nextListingAllowance: '40 active listings',
        upgradeUrl: FAKE.upgradeUrl,
      }),
    },
    {
      templateType: 'ListingLimitUpsell',
      subject: `[TEST] You've reached your Pro listing limit`,
      relatedEntityType: 'user',
      react: createElement(ListingLimitUpsell, {
        firstName: FAKE.firstName,
        currentPlanLabel: 'Pro',
        currentLimit: 40,
        nextPlanLabel: 'Max',
        nextListingAllowance: 'unlimited active listings',
        upgradeUrl: FAKE.upgradeUrl,
      }),
    },
    {
      templateType: 'SubscriptionConfirmed',
      subject: `[TEST] You're on the Starter plan — Black Diamond Marketplace`,
      relatedEntityType: 'user',
      react: createElement(SubscriptionConfirmed, {
        firstName: FAKE.firstName,
        planId: 'starter',
        planLabel: 'Starter',
        billingPeriodLabel: 'monthly',
        features: [
          '15 active listings',
          'AI listing generation',
          'BD Verified badge',
          'Video upload',
          'Business Directory Access',
        ],
        manageBillingUrl: FAKE.dashboardUrl + '/settings',
      }),
    },
    {
      templateType: 'SubscriptionConfirmed',
      subject: `[TEST] You're on the Pro plan — Black Diamond Marketplace`,
      relatedEntityType: 'user',
      react: createElement(SubscriptionConfirmed, {
        firstName: FAKE.firstName,
        planId: 'pro',
        planLabel: 'Pro',
        billingPeriodLabel: 'annual',
        features: [
          'Everything in Starter, plus:',
          '40 active listings',
          'Monthly analytics report',
          '1 newsletter feature/week',
        ],
        manageBillingUrl: FAKE.dashboardUrl + '/settings',
      }),
    },
    {
      templateType: 'SubscriptionConfirmed',
      subject: `[TEST] You're on the Max plan — Black Diamond Marketplace`,
      relatedEntityType: 'user',
      react: createElement(SubscriptionConfirmed, {
        firstName: FAKE.firstName,
        planId: 'max',
        planLabel: 'Max',
        billingPeriodLabel: 'monthly',
        features: [
          'Everything in Pro, plus:',
          'Unlimited listings',
          'Exclusive newsletter blast (monthly)',
          'Business Directory priority placement',
          'Home Page Partner Spotlight',
          'Priority support',
        ],
        manageBillingUrl: FAKE.dashboardUrl + '/settings',
      }),
    },
    {
      templateType: 'PaymentFailed',
      subject: `[TEST] Payment failed for your Starter plan`,
      relatedEntityType: 'user',
      react: createElement(PaymentFailed, {
        firstName: FAKE.firstName,
        planLabel: 'Starter',
        amountDue: '$299.00',
        updatePaymentUrl: FAKE.dashboardUrl + '/settings',
      }),
    },
    {
      templateType: 'UpcomingRenewal',
      subject: `[TEST] Your Starter plan renews on April 15, 2026`,
      relatedEntityType: 'user',
      react: createElement(UpcomingRenewal, {
        firstName: FAKE.firstName,
        planLabel: 'Starter',
        amountDue: '$299.00',
        renewalDate: 'April 15, 2026',
        manageBillingUrl: FAKE.dashboardUrl + '/settings',
      }),
    },
    {
      templateType: 'SeatBillingReceipt',
      subject: `[TEST] Seat added — ${FAKE.organizationName}`,
      relatedEntityType: 'seat_change_log',
      react: createElement(SeatBillingReceipt, {
        organizationName: FAKE.organizationName,
        changeType: 'add',
        actorName: 'Sam Manager',
        showActorLine: true,
        newSeatCount: 7,
        amountLabel: '$12.50 charge (prorated)',
        billingUrl: FAKE.companySettingsUrl + '?tab=billing',
      }),
    },
  ]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function resolveRecipient(): string {
  const fromArg = process.argv.slice(2).filter(a => !a.startsWith('-') && !a.startsWith('--only'))
  if (fromArg.length > 1) {
    console.error('Error: pass exactly one email address (or use TEST_EMAIL_RECIPIENT).')
    process.exit(1)
  }

  const raw = (fromArg[0] ?? process.env.TEST_EMAIL_RECIPIENT ?? '').trim()
  if (!raw) {
    console.error(
      'Usage: npx tsx scripts/test-send-all-emails.ts you@example.com\n' +
        '   or: TEST_EMAIL_RECIPIENT=you@example.com npx tsx scripts/test-send-all-emails.ts\n' +
        'Optional: --only=ListingLimitUpsell,SubscriptionConfirmed',
    )
    process.exit(1)
  }

  if (raw.includes(',') || raw.includes(';') || /\s/.test(raw)) {
    console.error('Error: only one recipient address is allowed per run.')
    process.exit(1)
  }

  if (!EMAIL_RE.test(raw)) {
    console.error('Error: invalid email address:', raw)
    process.exit(1)
  }

  return raw
}

function resolveOnlyFilter(): Set<string> | null {
  const onlyArg = process.argv.slice(2).find(a => a.startsWith('--only='))
  if (!onlyArg) return null
  const types = onlyArg
    .slice('--only='.length)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  return types.length > 0 ? new Set(types) : null
}

async function main() {
  const recipient = resolveRecipient()
  const only = resolveOnlyFilter()

  if (!process.env.RESEND_API_KEY) {
    console.error('Error: RESEND_API_KEY is not set (check .env.local).')
    process.exit(1)
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Supabase service env vars required for email_log via sendTransactionalEmail.')
    process.exit(1)
  }

  const jobs = buildJobs().filter(job => (only ? only.has(job.templateType) : true))
  if (jobs.length === 0) {
    console.error('Error: no jobs matched --only filter.')
    process.exit(1)
  }
  console.log(`Sending ${jobs.length} transactional templates via sendTransactionalEmail`)
  console.log(`Recipient: ${recipient}`)
  if (only) console.log(`Filter: ${Array.from(only).join(', ')}`)
  console.log('---')

  let ok = 0
  let failed = 0

  for (const job of jobs) {
    process.stdout.write(`${job.templateType} ... `)
    try {
      const result = await sendTransactionalEmail({
        templateType: job.templateType,
        recipientEmail: recipient,
        subject: job.subject,
        react: job.react,
        relatedEntityType: job.relatedEntityType,
        relatedEntityId: FAKE.relatedId,
      })
      if (result.sent) {
        ok++
        console.log('sent')
      } else {
        failed++
        console.log('FAILED (see email_log / Resend)')
      }
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : String(err)
      console.log(`FAILED — ${message}`)
    }
  }

  console.log('---')
  console.log(`Done. sent=${ok} failed=${failed} total=${jobs.length}`)
  if (failed > 0) process.exit(1)
}

main()
