/**
 * Remove all donations with paymentStatus 'pending'.
 * Rolls back project + user donor totals only when providerTxnId is set (PENDING capture path
 * that incremented totals in captureDonationOrder).
 *
 * Usage: cd server && npx babel-node scripts/remove-pending-donations.js
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import Donation from 'models/donation.model'
import Project from 'models/project.model'
import User from 'models/user.model'

async function main() {
  if (!process.env.MONGO_URI) {
    // eslint-disable-next-line no-console
    console.error('MONGO_URI is required')
    process.exit(1)
  }
  await mongoose.connect(process.env.MONGO_URI)

  const pending = await Donation.find({ paymentStatus: 'pending' }).lean()
  let rolledBack = 0

  for (const d of pending) {
    if (d.providerTxnId) {
      await Project.findByIdAndUpdate(d.projectId, {
        $inc: { currentAmount: -d.amount },
      })
      if (d.userId) {
        await User.findByIdAndUpdate(d.userId, {
          $inc: { 'donorProfile.totalAmountDonated': -d.amount },
        })
      }
      rolledBack += 1
    }
  }

  const result = await Donation.deleteMany({ paymentStatus: 'pending' })

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        deletedCount: result.deletedCount,
        pendingFound: pending.length,
        totalsRolledBackFor: rolledBack,
      },
      null,
      2,
    ),
  )

  await mongoose.disconnect()
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
