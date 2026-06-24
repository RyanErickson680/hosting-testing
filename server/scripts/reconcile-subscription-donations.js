/**
 * Compare (or sync) PayPal subscription billing vs Donation rows.
 *
 * Default: every active recurring subscription in MongoDB (distinct paypalSubscriptionId).
 *
 * Dry-run (report only):
 *   npx babel-node scripts/reconcile-subscription-donations.js
 *   npx babel-node scripts/reconcile-subscription-donations.js [daysBack]        # all subs, custom window
 *   npx babel-node scripts/reconcile-subscription-donations.js <I-...subscriptionId> [daysBack]
 *
 * Apply missing rows (updates project + user totals; default: no receipt emails):
 *   ... --apply
 *
 * With receipt emails (can spam if many rows):
 *   ... --apply --send-receipts
 *
 * Explicit “all” (same as no first arg):
 *   npx babel-node scripts/reconcile-subscription-donations.js all [daysBack] [--apply]
 *
 * Fix RecurringDonation amount/currency from PayPal (last payment or plan price):
 *   ... [--update-recurring-amounts]           # dry-run: show would_update / unchanged
 *   ... [--update-recurring-amounts] --apply  # persist corrections (can combine with donation insert --apply)
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import RecurringDonation from 'models/recurring-donation.model'
import {
  listMissingSubscriptionCharges,
  insertMissingSubscriptionDonations,
  syncRecurringDonationAmountsFromPaypal,
} from 'services/syncSubscriptionDonationsFromPaypal'

function parseArgs(argv) {
  const flagSet = new Set()
  const pos = []
  argv.forEach((a) => {
    if (a.startsWith('--')) flagSet.add(a)
    else pos.push(a)
  })
  return {
    positional: pos,
    apply: flagSet.has('--apply'),
    sendReceipts: flagSet.has('--send-receipts'),
    updateRecurringAmounts: flagSet.has('--update-recurring-amounts'),
  }
}

const { positional, apply, sendReceipts, updateRecurringAmounts } = parseArgs(
  process.argv.slice(2)
)

/**
 * No args → all active subscriptions, 90 days.
 * One arg: if numeric, all subs and that daysBack; else subscription id or "all".
 * Two args: subscription id | "all", then daysBack.
 */
function resolvePositional(pos) {
  if (pos.length === 0) {
    return { subIdOrAll: 'all', daysBackStr: '90' }
  }
  if (pos.length === 1) {
    const a = pos[0]
    if (/^\d+$/.test(a)) {
      return { subIdOrAll: 'all', daysBackStr: a }
    }
    return { subIdOrAll: a, daysBackStr: '90' }
  }
  return { subIdOrAll: pos[0], daysBackStr: pos[1] }
}

const { subIdOrAll, daysBackStr } = resolvePositional(positional)
const daysBack = parseInt(daysBackStr, 10)
if (Number.isNaN(daysBack) || daysBack < 1) {
  // eslint-disable-next-line no-console
  console.error('daysBack must be a positive number')
  process.exit(1)
}

async function runOne(subscriptionId) {
  if (apply) {
    const result = await insertMissingSubscriptionDonations(
      subscriptionId,
      daysBack,
      {
        sendReceipts,
      }
    )
    return { subscriptionId, mode: 'apply', ...result }
  }
  const summary = await listMissingSubscriptionCharges(subscriptionId, daysBack)
  return {
    subscriptionId,
    mode: 'report',
    paypalTransactionCount: summary.paypalTransactionCount,
    hasActiveRecurringDonation: Boolean(summary.recurringDonation),
    missingDonationRows: summary.missing.map((m) => ({
      id: m.id,
      amount: m.amount,
      currency: m.currency,
      time: m.time?.toISOString?.() || m.time,
    })),
  }
}

async function main() {
  if (!process.env.MONGO_URI) {
    // eslint-disable-next-line no-console
    console.error('MONGO_URI is required')
    process.exit(1)
  }
  await mongoose.connect(process.env.MONGO_URI)

  const activePayPalSubscriptionIds =
    subIdOrAll === 'all'
      ? await RecurringDonation.distinct('paypalSubscriptionId', {
          paypalSubscriptionId: { $exists: true, $nin: [null, ''] },
          status: 'active',
        })
      : [subIdOrAll]

  let results
  if (subIdOrAll === 'all') {
    results = await Promise.all(
      activePayPalSubscriptionIds.map(async (sid) => {
        try {
          return await runOne(sid)
        } catch (err) {
          return { subscriptionId: sid, error: err.message }
        }
      })
    )
  } else {
    results = await runOne(subIdOrAll)
  }

  let amountSync
  if (updateRecurringAmounts) {
    amountSync = await syncRecurringDonationAmountsFromPaypal({
      subscriptionIds: activePayPalSubscriptionIds,
      dryRun: !apply,
    })
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      updateRecurringAmounts ? { reconcile: results, amountSync } : results,
      null,
      2
    )
  )
  await mongoose.disconnect()
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
