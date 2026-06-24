/**
 * Backfill missing recurringDonationId on initial recurring donations.
 *
 * Usage:
 *   npx babel-node scripts/link-initial-recurring-donations.js [email] [--apply]
 *
 * Defaults:
 *   email: all users
 *   mode: dry-run (use --apply to persist)
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import Donation from 'models/donation.model'
import RecurringDonation from 'models/recurring-donation.model'
import User from 'models/user.model'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const emailArg = args.find((a) => !a.startsWith('--')) || null

async function main() {
  if (!process.env.MONGO_URI) {
    // eslint-disable-next-line no-console
    console.error('MONGO_URI is required')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)

  let userIdFilter = null
  if (emailArg) {
    const user = await User.findOne({ email: emailArg }).select('_id email').lean()
    if (!user) {
      // eslint-disable-next-line no-console
      console.log(`No user found for email: ${emailArg}`)
      await mongoose.disconnect()
      return
    }
    userIdFilter = user._id
  }

  const filter = {
    providerTxnId: { $regex: '^subscription_initial_' },
    paymentStatus: 'completed',
    $or: [{ recurringDonationId: { $exists: false } }, { recurringDonationId: null }],
  }
  if (userIdFilter) filter.userId = userIdFilter

  const candidates = await Donation.find(filter)
    .select('_id userId providerTxnId recurringDonationId donatedAt amount')
    .lean()

  let matched = 0
  let updated = 0
  const missing = []

  for (const d of candidates) {
    const rid = String(d.providerTxnId || '').replace('subscription_initial_', '')
    if (!mongoose.Types.ObjectId.isValid(rid)) {
      missing.push({ donationId: d._id, reason: 'invalid recurring id in providerTxnId' })
      continue
    }

    const recurring = await RecurringDonation.findById(rid).select('_id userId').lean()
    if (!recurring) {
      missing.push({ donationId: d._id, recurringId: rid, reason: 'recurring record not found' })
      continue
    }

    if (String(recurring.userId) !== String(d.userId)) {
      missing.push({ donationId: d._id, recurringId: rid, reason: 'user mismatch' })
      continue
    }

    matched += 1
    if (apply) {
      await Donation.updateOne({ _id: d._id }, { $set: { recurringDonationId: recurring._id } })
      updated += 1
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        mode: apply ? 'apply' : 'dry-run',
        email: emailArg || 'all',
        candidates: candidates.length,
        matched,
        updated,
        unresolved: missing.length,
        unresolvedSamples: missing.slice(0, 10),
      },
      null,
      2
    )
  )

  await mongoose.disconnect()
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
