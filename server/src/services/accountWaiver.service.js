import crypto from 'crypto'
import User from 'models/user.model'
import { sendAccountWaiverEmail } from 'services/email.service'

/** Thrown when event.waiverRequired but volunteer has not signed the account waiver */
export const ACCOUNT_WAIVER_REQUIRED_CODE = 'ACCOUNT_WAIVER_REQUIRED'

/**
 * Generate a fresh waiver token, save expiry on the user, and email the signing link.
 * Caller must ensure user has a volunteer profile and has not already signed.
 *
 * @param {import('mongoose').Document} user - Mongoose user document (mutated + saved)
 * @param {{ reason?: 'signup' | 'event' }} [opts] - Email template variant (default 'signup')
 * @returns {Promise<{ waiverUrl: string }>}
 */
export async function issueAccountWaiverTokenAndEmail(user, opts = {}) {
  const waiverToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(waiverToken).digest('hex')
  const waiverTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  user.volunteerProfile.waiverToken = hashedToken
  user.volunteerProfile.waiverTokenExpiresAt = waiverTokenExpiresAt

  await user.save()

  const waiverUrl = `${process.env.CLIENT_URL}/account-waiver/${waiverToken}`

  const reason = opts.reason || 'signup'
  await sendAccountWaiverEmail(user.email, user.firstName, waiverUrl, { reason })

  return { waiverUrl }
}

/**
 * If the event requires a waiver, the volunteer must have signed the account-level
 * liability waiver. If not signed, throws ACCOUNT_WAIVER_REQUIRED_CODE (no email sent).
 *
 * @param {string} userId
 * @param {{ waiverRequired?: boolean }} event
 */
export async function assertAccountWaiverForEventRegistration(userId, event) {
  if (!event?.waiverRequired) return

  const user = await User.findById(userId)
  if (!user) {
    const err = new Error('User not found')
    err.code = 'USER_NOT_FOUND'
    throw err
  }

  if (!user.volunteerProfile) return

  if (user.volunteerProfile.waiverSigned) return

  const err = new Error(
    'You must sign the volunteer liability waiver before registering for this event. Use “Send waiver email” on the volunteer page if you need a signing link.'
  )
  err.code = ACCOUNT_WAIVER_REQUIRED_CODE
  throw err
}
