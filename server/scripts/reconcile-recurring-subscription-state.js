/**
 * Reconcile active/paused recurring rows against PayPal subscription state.
 *
 * Dry run:
 *   cd server && npx babel-node scripts/reconcile-recurring-subscription-state.js
 *
 * Apply updates:
 *   cd server && npx babel-node scripts/reconcile-recurring-subscription-state.js --apply
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import RecurringDonation from 'models/recurring-donation.model'
import * as paypalService from 'services/paypal.service'

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply'),
  }
}

function mapPayPalStatusToDb(paypalStatus) {
  const s = String(paypalStatus || '').toUpperCase()
  if (s === 'ACTIVE' || s === 'APPROVED') {
    return { status: 'active', paymentStatus: 'active' }
  }
  if (s === 'SUSPENDED') {
    return { status: 'paused', paymentStatus: 'suspended' }
  }
  if (s === 'CANCELLED') {
    return { status: 'cancelled', paymentStatus: 'cancelled' }
  }
  if (s === 'EXPIRED') {
    return { status: 'cancelled', paymentStatus: 'expired' }
  }
  return null
}

async function main() {
  const { apply } = parseArgs(process.argv.slice(2))

  if (!process.env.MONGO_URI) {
    // eslint-disable-next-line no-console
    console.error('MONGO_URI is required')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)

  const rows = await RecurringDonation.find({
    status: { $in: ['active', 'paused'] },
    paypalSubscriptionId: { $exists: true, $nin: [null, ''] },
  })
    .select('paypalSubscriptionId status paymentStatus cancellationReason')
    .lean()

  const checks = await Promise.all(
    rows.map(async (row) => {
      const id = row.paypalSubscriptionId
      try {
        const details = await paypalService.getSubscriptionDetails(id)
        const mapped = mapPayPalStatusToDb(details?.status)
        const dbNow = {
          status: row.status,
          paymentStatus: row.paymentStatus || null,
        }
        const needsUpdate =
          mapped &&
          (mapped.status !== dbNow.status ||
            mapped.paymentStatus !== dbNow.paymentStatus)
        return {
          recurringDonationId: row._id.toString(),
          paypalSubscriptionId: id,
          ok: true,
          paypalStatus: details?.status || null,
          dbNow,
          dbTarget: mapped,
          needsUpdate: Boolean(needsUpdate),
          reason: needsUpdate ? 'status_mismatch' : null,
        }
      } catch (error) {
        const notFound = paypalService.isPayPalSubscriptionNotFoundError(error)
        return {
          recurringDonationId: row._id.toString(),
          paypalSubscriptionId: id,
          ok: false,
          notFound,
          error: error.message,
          dbNow: {
            status: row.status,
            paymentStatus: row.paymentStatus || null,
          },
          dbTarget: notFound
            ? {
                status: 'cancelled',
                paymentStatus: 'cancelled',
                cancellationReason:
                  'Reconciled: subscription not found in PayPal for current API credentials',
              }
            : null,
          needsUpdate: Boolean(notFound),
          reason: notFound ? 'paypal_not_found' : 'paypal_error',
        }
      }
    })
  )

  const updates = checks.filter((c) => c.needsUpdate && c.dbTarget)
  let modifiedCount = 0

  if (apply && updates.length > 0) {
    const ops = updates.map((u) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(u.recurringDonationId) },
        update: { $set: u.dbTarget },
      },
    }))
    const writeResult = await RecurringDonation.bulkWrite(ops)
    modifiedCount = writeResult.modifiedCount || 0
  }

  const summary = {
    apply,
    paypalMode: process.env.PAYPAL_MODE || 'sandbox',
    scanned: rows.length,
    needsUpdate: updates.length,
    modifiedCount,
    notFoundCount: checks.filter((c) => c.reason === 'paypal_not_found').length,
    mismatchCount: checks.filter((c) => c.reason === 'status_mismatch').length,
    paypalErrorCount: checks.filter((c) => c.reason === 'paypal_error').length,
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ summary, checks }, null, 2))
  await mongoose.disconnect()
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
