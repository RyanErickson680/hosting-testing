/**
 * For each active recurring donation, GET PayPal subscription details using server credentials.
 * Use this to see which ids return 200 vs 404 (credential / app mismatch vs valid id).
 *
 *   cd server && npx babel-node scripts/diagnose-paypal-subscriptions.js
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import RecurringDonation from 'models/recurring-donation.model'
import * as paypalService from 'services/paypal.service'

async function main() {
  if (!process.env.MONGO_URI) {
    // eslint-disable-next-line no-console
    console.error('MONGO_URI is required')
    process.exit(1)
  }
  await mongoose.connect(process.env.MONGO_URI)

  const rows = await RecurringDonation.find({
    status: 'active',
    paypalSubscriptionId: { $exists: true, $nin: [null, ''] },
  })
    .select('paypalSubscriptionId amount status')
    .lean()

  // eslint-disable-next-line no-console
  console.log(
    `PAYPAL_MODE=${process.env.PAYPAL_MODE || 'sandbox'} — checking ${
      rows.length
    } active recurring row(s)\n`
  )

  const results = await Promise.all(
    rows.map(async (r) => {
      const id = r.paypalSubscriptionId
      try {
        const details = await paypalService.getSubscriptionDetails(id)
        return {
          paypalSubscriptionId: id,
          ok: true,
          paypalStatus: details.status,
          amount: r.amount,
        }
      } catch (e) {
        return {
          paypalSubscriptionId: id,
          ok: false,
          error: e.message,
          notFound: paypalService.isPayPalSubscriptionNotFoundError(e),
          amount: r.amount,
        }
      }
    })
  )

  results.forEach((obj) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(obj))
  })

  await mongoose.disconnect()
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
