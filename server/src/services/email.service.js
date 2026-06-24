import nodemailer from 'nodemailer'
import User from 'models/user.model'

// SMTP via Nodemailer — typical for AWS/production. Many PaaS free tiers (e.g. Render) block outbound SMTP.
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

const ORG_NAME = process.env.ORG_NAME || 'Mill Creek Urban Farm'
const ORG_EMAIL_TEAM = process.env.ORG_EMAIL_TEAM || `${ORG_NAME} Team`

// ──────────────────────────────────────────────
// Shared layout builder
// ──────────────────────────────────────────────

/**
 * Wrap any email body HTML in the Mill Creek branded shell.
 * @param {string} title   - Text shown in the green header banner
 * @param {string} bodyHtml - Inner HTML for the white content area
 * @returns {string} Full HTML document string
 */
function buildEmailLayout(title, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2c5f2d; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">${title}</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9;">
        ${bodyHtml}
      </div>
      <div style="background-color: #f0f0f0; padding: 15px; text-align: center; color: #666; font-size: 12px;">
        <p style="margin: 0;">This is an automated message from ${ORG_NAME}. Please do not reply to this email.</p>
      </div>
    </div>
  `
}

/**
 * Format a monetary amount for display (e.g. "$25.00").
 */
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

/**
 * Build a progress-bar snippet showing project funding progress.
 * Returns an empty string when data is unavailable.
 */
function escapeHtml(value) {
  if (value == null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** HTML + plain-text snippets for PayPal txn id and donation reference (matches DonationSuccess page). */
function buildDonationConfirmationIdsHtml(paypalTransactionId, referenceId) {
  const lines = []
  if (paypalTransactionId) {
    lines.push(
      `<p style="margin: 0 0 8px 0; color: #444; font-size: 14px;"><strong>PayPal Transaction ID:</strong> ${escapeHtml(paypalTransactionId)}</p>`,
    )
  }
  if (referenceId) {
    lines.push(
      `<p style="margin: 0; color: #444; font-size: 14px;"><strong>Reference ID:</strong> ${escapeHtml(referenceId)}</p>`,
    )
  }
  if (!lines.length) return ''
  return `
    <div style="background-color: white; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px; margin: 20px 0; text-align: left;">
      ${lines.join('')}
    </div>
  `
}

function buildDonationConfirmationIdsText(paypalTransactionId, referenceId) {
  const parts = []
  if (paypalTransactionId) parts.push(`PayPal Transaction ID: ${paypalTransactionId}`)
  if (referenceId) parts.push(`Reference ID: ${referenceId}`)
  return parts.length ? `\n\n${parts.join('\n')}` : ''
}

/** @param {'weekly'|'monthly'|'yearly'|string|null|undefined} interval */
function getRecurringFrequencyCopy(interval) {
  if (interval == null || String(interval).trim() === '') return null
  const key = String(interval).toLowerCase()
  const map = {
    weekly: { title: 'Weekly', phrase: 'billed every week' },
    monthly: { title: 'Monthly', phrase: 'billed every month' },
    yearly: { title: 'Yearly', phrase: 'billed every year' },
  }
  return map[key] || { title: key, phrase: `recurring (${key})` }
}

/** Plain text after the amount, e.g. " (recurring, monthly)" — omit for one-time. */
function recurringInlineAfterAmountText(interval) {
  const copy = getRecurringFrequencyCopy(interval)
  if (!copy) return ''
  return ` (recurring, ${copy.title.toLowerCase()})`
}

/** Safe HTML fragment after the amount &lt;/strong&gt;, e.g. " (recurring, monthly)". */
function recurringInlineAfterAmountHtml(interval) {
  const copy = getRecurringFrequencyCopy(interval)
  if (!copy) return ''
  return ` (recurring, ${escapeHtml(copy.title.toLowerCase())})`
}

function buildImpactSection(projectName, currentAmount, goalAmount) {
  if (!goalAmount || goalAmount <= 0) return ''
  const pct = Math.min(Math.round((currentAmount / goalAmount) * 100), 100)
  return `
    <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
      <h3 style="color: #2c5f2d; margin-top: 0;">Your Impact</h3>
      <p style="margin: 4px 0;">
        <strong>${escapeHtml(projectName)}</strong> has raised
        <strong>${formatCurrency(currentAmount)}</strong> of its
        <strong>${formatCurrency(goalAmount)}</strong> goal.
      </p>
      <div style="background-color: #e0e0e0; border-radius: 4px; overflow: hidden; height: 14px; margin-top: 8px;">
        <div style="background-color: #2c5f2d; height: 100%; width: ${pct}%; border-radius: 4px;"></div>
      </div>
      <p style="text-align: right; font-size: 13px; color: #666; margin: 4px 0 0;">${pct}% funded</p>
    </div>
  `
}

// ──────────────────────────────────────────────
// Donor info resolver
// ──────────────────────────────────────────────

/**
 * Resolve the donor's contact info from a Donation document.
 * Tries the User collection first, then falls back to donation.donorEmail for guests.
 * @param {Object} donation - Mongoose Donation document
 * @returns {Promise<{email: string, firstName: string|null, lastName: string|null}|null>}
 */
export async function resolveDonorInfo(donation) {
  try {
    if (donation.userId) {
      const user = await User.findById(donation.userId).select('email firstName lastName').lean()
      if (user && user.email) {
        return { email: user.email, firstName: user.firstName, lastName: user.lastName }
      }
    }
  } catch {
    // User lookup failed — fall through to guest email
  }

  if (donation.donorEmail) {
    return { email: donation.donorEmail, firstName: null, lastName: null }
  }

  return null
}

// ──────────────────────────────────────────────
// Welcome email
// ──────────────────────────────────────────────

/**
 * Send welcome email to new users.
 * @param {string} email     - User's email address
 * @param {string} firstName - User's first name
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
export const sendWelcomeEmail = async (email, firstName) => {
  try {
    const bodyHtml = `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thank you for signing up with ${ORG_NAME}! We're excited to have you as part of our community.</p>
      <p>Whether you're here to support our causes through donations or volunteer your time, you're making a difference.</p>
      <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
        <h3 style="color: #2c5f2d; margin-top: 0;">What's Next?</h3>
        <ul>
          <li>Explore volunteer opportunities</li>
          <li>Support our active campaigns</li>
          <li>Join our community of changemakers</li>
        </ul>
      </div>
      <p>If you have any questions, feel free to reach out to our team.</p>
      <p>Best regards,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Welcome to ${ORG_NAME}!`,
      html: buildEmailLayout(`Welcome to ${ORG_NAME}!`, bodyHtml),
      text: `Welcome ${firstName}! Thank you for signing up with ${ORG_NAME}. You're now part of our community of changemakers.`,
    }
    const info = await transporter.sendMail(mailOptions)
    console.log('Welcome email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    throw new Error(`Failed to send welcome email: ${error.message}`)
  }
}

// ──────────────────────────────────────────────
// Donation receipt emails
// ──────────────────────────────────────────────

/**
 * Send a personalized donation receipt to a registered user.
 * Includes donor name, amount, project name, and impact progress.
 *
 * @param {string}  email           - Recipient email
 * @param {string}  donorName       - Donor's first name (or full name)
 * @param {number}  amount          - Donation amount
 * @param {string}  currency        - ISO currency code
 * @param {string}  projectName     - Name of the funded project
 * @param {{currentAmount: number, goalAmount: number}|null} projectProgress
 * @param {string|null|undefined} paypalTransactionId - PayPal capture / txn id (same as confirmation page)
 * @param {string|null|undefined} referenceId        - Donation document id (same as confirmation page)
 * @param {'weekly'|'monthly'|'yearly'|string|null|undefined} recurringInterval - If set, email states recurring + frequency (omit for one-time)
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
export const sendDonationReceiptEmail = async (
  email,
  donorName,
  amount,
  currency,
  projectName,
  projectProgress,
  paypalTransactionId,
  referenceId,
  recurringInterval = null,
) => {
  try {
    const formattedAmount = formatCurrency(amount, currency)
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const impactHtml = projectProgress
      ? buildImpactSection(projectName, projectProgress.currentAmount, projectProgress.goalAmount)
      : ''

    const confirmationIdsHtml = buildDonationConfirmationIdsHtml(paypalTransactionId, referenceId)
    const confirmationIdsText = buildDonationConfirmationIdsText(paypalTransactionId, referenceId)
    const recurringAfterAmountHtml = recurringInlineAfterAmountHtml(recurringInterval)
    const recurringAfterAmountText = recurringInlineAfterAmountText(recurringInterval)

    const bodyHtml = `
      <p>Hi ${escapeHtml(donorName)},</p>
      <p>Thank you for your generous donation of <strong>${formattedAmount}</strong>${recurringAfterAmountHtml} to
         <strong>${escapeHtml(projectName)}</strong> on ${date}.</p>
      ${confirmationIdsHtml}
      <p>Your contribution is making a real difference in our community.</p>
      ${impactHtml}
      <p>We truly appreciate your support. Together we are building a stronger, greener neighborhood.</p>
      <p>With gratitude,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Thank you for your donation to ${projectName}, ${donorName}!`,
      html: buildEmailLayout('Thank You for Your Donation!', bodyHtml),
      text: `Hi ${donorName}, thank you for your donation of ${formattedAmount}${recurringAfterAmountText} to ${projectName} on ${date}.${confirmationIdsText} Your support means the world to us. — ${ORG_NAME}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Donation receipt email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending donation receipt email:', error)
    throw new Error(`Failed to send donation receipt email: ${error.message}`)
  }
}

/**
 * Send a generic donation receipt (for guest donors with no account).
 *
 * @param {string} email       - Recipient email
 * @param {number} amount      - Donation amount
 * @param {string} currency    - ISO currency code
 * @param {string} projectName - Name of the funded project
 * @param {string|null|undefined} paypalTransactionId - PayPal capture / txn id
 * @param {string|null|undefined} referenceId          - Donation document id
 * @param {'weekly'|'monthly'|'yearly'|string|null|undefined} recurringInterval - If set, states recurring + frequency
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
export const sendGenericDonationReceiptEmail = async (
  email,
  amount,
  currency,
  projectName,
  paypalTransactionId,
  referenceId,
  recurringInterval = null,
) => {
  try {
    const formattedAmount = formatCurrency(amount, currency)
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const confirmationIdsHtml = buildDonationConfirmationIdsHtml(paypalTransactionId, referenceId)
    const confirmationIdsText = buildDonationConfirmationIdsText(paypalTransactionId, referenceId)
    const recurringAfterAmountHtml = recurringInlineAfterAmountHtml(recurringInterval)
    const recurringAfterAmountText = recurringInlineAfterAmountText(recurringInterval)

    const bodyHtml = `
      <p>Thank you for your generous donation of <strong>${formattedAmount}</strong>${recurringAfterAmountHtml} to
         <strong>${escapeHtml(projectName)}</strong> on ${date}.</p>
      ${confirmationIdsHtml}
      <p>Your contribution is helping us build a stronger community.</p>
      <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
        <h3 style="color: #2c5f2d; margin-top: 0;">Create an Account</h3>
        <p>Sign up for a free account to track your donation history, see your impact over time, and discover volunteer opportunities.</p>
      </div>
      <p>We truly appreciate your support.</p>
      <p>With gratitude,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Thank you for your donation to ${projectName}!`,
      html: buildEmailLayout('Thank You for Your Donation!', bodyHtml),
      text: `Thank you for your donation of ${formattedAmount}${recurringAfterAmountText} to ${projectName} on ${date}.${confirmationIdsText} Your support means the world to us. — ${ORG_NAME}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Generic donation receipt email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending generic donation receipt email:', error)
    throw new Error(`Failed to send generic donation receipt email: ${error.message}`)
  }
}

/**
 * Send a receipt for a recurring donation charge.
 *
 * @param {string} email       - Recipient email
 * @param {string} donorName   - Donor's first name
 * @param {number} amount      - Charge amount
 * @param {string} currency    - ISO currency code
 * @param {string} interval    - 'weekly' | 'monthly' | 'yearly'
 * @param {string} projectName - Name of the funded project
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
export const sendRecurringDonationReceiptEmail = async (
  email,
  donorName,
  amount,
  currency,
  interval,
  projectName,
) => {
  try {
    const formattedAmount = formatCurrency(amount, currency)
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const freq = getRecurringFrequencyCopy(interval)
    const recurringAfterAmountHtml = freq
      ? ` (recurring, ${escapeHtml(freq.title.toLowerCase())})`
      : ''
    const recurringAfterAmountText = freq
      ? ` (recurring, ${freq.title.toLowerCase()})`
      : ''

    const bodyHtml = `
      <p>Hi ${escapeHtml(donorName)},</p>
      <p>Thank you for your donation of <strong>${formattedAmount}</strong>${recurringAfterAmountHtml} to <strong>${escapeHtml(projectName)}</strong> on ${date}.</p>
      <p>Your ongoing support is what makes sustained progress possible. Thank you for standing with us.</p>
      <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
        <h3 style="color: #2c5f2d; margin-top: 0;">Manage Your Subscription</h3>
        <p>You can view or cancel your recurring donations at any time from your account dashboard.</p>
      </div>
      <p>With gratitude,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Thank you for your donation to ${projectName}`,
      html: buildEmailLayout('Thank You for Your Donation!', bodyHtml),
      text: `Hi ${donorName}, thank you for your donation of ${formattedAmount}${recurringAfterAmountText} to ${projectName} on ${date}. Thank you for your continued support. — ${ORG_NAME}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Recurring donation receipt email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending recurring donation receipt email:', error)
    throw new Error(`Failed to send recurring donation receipt email: ${error.message}`)
  }
}

function formatEventDateForEmail(date, endTime) {
  if (!date) return 'TBD'
  const start = new Date(date)
  if (Number.isNaN(start.getTime())) return 'TBD'

  const datePart = start.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const startTime = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  if (!endTime) return `${datePart} at ${startTime}`
  return `${datePart} from ${startTime} to ${endTime}`
}

function formatFieldLabel(field) {
  const labels = {
    name: 'Name',
    description: 'Description',
    date: 'Date',
    endTime: 'End Time',
    location: 'Location',
    eventType: 'Event Type',
    status: 'Status',
    cost: 'Price',
    volunteersNeeded: 'Volunteers Needed',
    waiverRequired: 'Waiver Required',
  }
  return labels[field] || field
}

function normalizeValue(value, field, event) {
  if (field === 'date') return formatEventDateForEmail(event?.date, event?.endTime)
  if (field === 'waiverRequired') return value ? 'Yes' : 'No'
  if (value === null || value === undefined || value === '') return 'Not set'
  return String(value)
}

/**
 * Send event update email to a registered participant.
 */
export const sendVolunteerEventUpdatedEmail = async ({
  email,
  firstName,
  oldEvent,
  newEvent,
  changedFields,
}) => {
  try {
    const safeName = firstName || 'Volunteer'
    const eventName = newEvent?.name || oldEvent?.name || 'an event'
    const changedRows = (changedFields || []).map((field) => {
      const before = escapeHtml(normalizeValue(oldEvent?.[field], field, oldEvent))
      const after = escapeHtml(normalizeValue(newEvent?.[field], field, newEvent))
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>${formatFieldLabel(field)}</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${before}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${after}</td>
        </tr>
      `
    }).join('')

    const bodyHtml = `
      <p>Hi ${escapeHtml(safeName)},</p>
      <p>The event you registered for, <strong>${escapeHtml(eventName)}</strong>, has been updated.</p>
      <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
        <h3 style="color: #2c5f2d; margin-top: 0;">Updated Event Details</h3>
        <p style="margin: 5px 0;"><strong>When:</strong> ${formatEventDateForEmail(newEvent?.date, newEvent?.endTime)}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${escapeHtml(newEvent?.location || 'TBD')}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background: #f4f4f4;">Field</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background: #f4f4f4;">Previous</th>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd; background: #f4f4f4;">Updated</th>
          </tr>
        </thead>
        <tbody>
          ${changedRows}
        </tbody>
      </table>
      <p>If this change affects your availability, please visit your dashboard to manage your registration.</p>
      <p>Thank you,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Event Updated: ${eventName}`,
      html: buildEmailLayout('Volunteer Event Update', bodyHtml),
      text: `Hi ${safeName}, the event "${eventName}" has been updated. New schedule: ${formatEventDateForEmail(newEvent?.date, newEvent?.endTime)}.`,
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending volunteer event update email:', error)
    throw new Error(`Failed to send volunteer event update email: ${error.message}`)
  }
}

/**
 * Send event cancellation email to a registered participant.
 */
export const sendVolunteerEventCancelledEmail = async ({ email, firstName, event }) => {
  try {
    const safeName = firstName || 'Volunteer'
    const eventName = event?.name || 'an event'
    const bodyHtml = `
      <p>Hi ${escapeHtml(safeName)},</p>
      <p>We regret to inform you that <strong>${escapeHtml(eventName)}</strong> has been cancelled.</p>
      <div style="background-color: white; padding: 15px; border-left: 4px solid #b91c1c; margin: 20px 0;">
        <h3 style="color: #b91c1c; margin-top: 0;">Cancelled Event</h3>
        <p style="margin: 5px 0;"><strong>Scheduled for:</strong> ${formatEventDateForEmail(event?.date, event?.endTime)}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${escapeHtml(event?.location || 'TBD')}</p>
      </div>
      <p>We apologize for any inconvenience and appreciate your understanding.</p>
      <p>Thank you for being part of our community,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Event Cancelled: ${eventName}`,
      html: buildEmailLayout('Volunteer Event Cancelled', bodyHtml),
      text: `Hi ${safeName}, the event "${eventName}" has been cancelled. We apologize for the inconvenience.`,
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending volunteer cancellation email:', error)
    throw new Error(`Failed to send volunteer cancellation email: ${error.message}`)
  }
}

// ──────────────────────────────────────────────
// Password reset email
// ──────────────────────────────────────────────

/**
 * Send password reset email with a secure reset link.
 *
 * @param {string} email      - User's email address
 * @param {string} firstName  - User's first name
 * @param {string} resetLink  - Full reset link (e.g., https://yourfrontend.com/reset-password?token=xyz)
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
export const sendPasswordResetEmail = async (email, firstName, resetLink) => {
  try {
    const bodyHtml = `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
      <div style="background-color: white; padding: 20px; border-left: 4px solid #2c5f2d; margin: 20px 0; text-align: center;">
        <a href="${resetLink}" style="display: inline-block; background-color: #2c5f2d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset Your Password
        </a>
      </div>
      <p style="color: #666; font-size: 13px;">
        <strong>This link will expire in 1 hour.</strong> If the button above doesn't work, you can copy and paste this link into your browser:
      </p>
      <p style="word-break: break-all; color: #666; font-size: 12px; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
        ${resetLink}
      </p>
      <p style="color: #666; margin-top: 20px;">
        If you didn't request a password reset, please ignore this email or contact our support team if you have concerns about your account security.
      </p>
      <p>Best regards,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Reset Your ${ORG_NAME} Password`,
      html: buildEmailLayout('Password Reset Request', bodyHtml),
      text: `Hi ${firstName}, we received a request to reset your password. Click this link to reset: ${resetLink}. This link will expire in 1 hour. If you didn't request this, please ignore this email. — ${ORG_NAME}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Password reset email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error(`Failed to send password reset email: ${error.message}`)
  }
}

// ──────────────────────────────────────────────
// Password changed notification
// ──────────────────────────────────────────────

/**
 * Notify the account owner that their password was successfully changed.
 * Sent after a password reset so they know if someone else changed it.
 *
 * @param {string} email     - User's email address
 * @param {string} firstName - User's first name
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
export const sendPasswordChangedEmail = async (email, firstName) => {
  try {
    const bodyHtml = `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>This is a confirmation that the password for your ${ORG_NAME} account was recently changed.</p>
      <p>If you made this change, no action is needed.</p>
      <p style="color: #b91c1c;"><strong>If you did not change your password</strong>, please contact us immediately and secure your account by requesting a new password reset.</p>
      <p>Best regards,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Your ${ORG_NAME} password was changed`,
      html: buildEmailLayout('Password Changed', bodyHtml),
      text: `Hi ${firstName}, your ${ORG_NAME} account password was recently changed. If you did not make this change, please contact us immediately. — ${ORG_NAME}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Password changed notification sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending password changed email:', error)
    throw new Error(`Failed to send password changed email: ${error.message}`)
  }
}

// ──────────────────────────────────────────────
// Volunteer event registration email
// ──────────────────────────────────────────────

/**
 * Send event registration confirmation email to a volunteer.
 *
 * @param {string} email       - Volunteer's email address
 * @param {string} firstName   - Volunteer's first name
 * @param {string} eventName   - Name of the event they registered for
 * @param {Date}   eventDate   - Date of the event
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
export const sendEventRegistrationEmail = async (email, firstName, eventName, eventDate) => {
  try {
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const bodyHtml = `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thank you for registering to volunteer at <strong>${escapeHtml(eventName)}</strong>!</p>
      <p>We're excited to have you join us and make a difference in our community.</p>
      <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
        <h3 style="color: #2c5f2d; margin-top: 0;">Event Details</h3>
        <p style="margin: 8px 0;"><strong>Event:</strong> ${escapeHtml(eventName)}</p>
        <p style="margin: 8px 0;"><strong>Date & Time:</strong> ${formattedDate}</p>
      </div>
      <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
        <h3 style="color: #2c5f2d; margin-top: 0;">What's Next?</h3>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Mark your calendar for the event date</li>
          <li>Arrive a few minutes early on the day of the event</li>
          <li>Come ready to make a positive impact!</li>
        </ul>
      </div>
      <p>If you need to cancel or have any questions, please reach out to our team.</p>
      <p>Thank you for your commitment to ${ORG_NAME}!</p>
      <p>Best regards,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `You're registered for ${eventName}!`,
      html: buildEmailLayout('Event Registration Confirmed', bodyHtml),
      text: `Hi ${firstName}, thank you for registering to volunteer at ${eventName} on ${formattedDate}. We're excited to have you! — ${ORG_NAME}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Event registration email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending event registration email:', error)
    throw new Error(`Failed to send event registration email: ${error.message}`)
  }
}

/**
 * Send waiver signing email to a registered volunteer.
 *
 * @param {string} email      - Volunteer's email address
 * @param {string} firstName  - Volunteer's first name
 * @param {string} eventName  - Name of the event
 * @param {Date}   eventDate  - Date of the event
 * @param {string} waiverUrl  - Full URL the volunteer visits to sign the waiver
 */
export const sendWaiverEmail = async (email, firstName, eventName, eventDate, waiverUrl) => {
  try {
    const formattedDate = eventDate
      ? new Date(eventDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'TBD'

    const bodyHtml = `
      <p>Hi ${escapeHtml(firstName)},</p>
      <p>Thanks for signing up to volunteer at <strong>${escapeHtml(eventName)}</strong> on ${formattedDate}!</p>
      <p>This event requires a waiver to be completed before you can participate. Please click the button below to review and approve it — it only takes a moment.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${waiverUrl}"
           style="display: inline-block; background-color: #2c5f2d; color: #ffffff; text-decoration: none;
                  font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
          Review &amp; Sign Waiver
        </a>
      </div>
      <p style="font-size: 13px; color: #666;">This link will expire in 30 days. If you did not register for this event, you can safely ignore this email.</p>
      <p>Thank you,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Action Required: Sign Your Waiver for ${eventName}`,
      html: buildEmailLayout('Waiver Signature Required', bodyHtml),
      text: `Hi ${firstName}, you need to sign a waiver for ${eventName} on ${formattedDate}. Visit this link to approve it: ${waiverUrl}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Waiver email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending waiver email:', error)
    throw new Error('Failed to send waiver email')
  }
}

/**
 * Send the volunteer membership waiver email when a user first registers an account,
 * or when they need a fresh link to sign before registering for waiver-required events.
 *
 * @param {string} email      - Volunteer's email address
 * @param {string} firstName  - Volunteer's first name
 * @param {string} waiverUrl  - Full URL the volunteer visits to sign the waiver
 * @param {{ reason?: 'signup' | 'event' }} [opts]
 */
export const sendAccountWaiverEmail = async (email, firstName, waiverUrl, opts = {}) => {
  try {
    const reason = opts.reason || 'signup'
    const intro =
      reason === 'event'
        ? `<p>Hi ${escapeHtml(firstName)},</p>
      <p>An event you want to join requires a signed volunteer liability waiver. Please review and sign using the link below (this is the same waiver you complete when you register as a volunteer).</p>
      <p>After you sign, return to the volunteer opportunities page and sign up for the event again.</p>`
        : `<p>Hi ${escapeHtml(firstName)},</p>
      <p>Welcome to the ${ORG_NAME} volunteer community! Before you can be approved for volunteer events, we need you to review and sign our volunteer liability waiver.</p>
      <p>This is a one-time step and only takes a moment.</p>`

    const bodyHtml = `
      ${intro}
      <div style="text-align: center; margin: 32px 0;">
        <a href="${waiverUrl}"
           style="display: inline-block; background-color: #2c5f2d; color: #ffffff; text-decoration: none;
                  font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px;">
          Review &amp; Sign Waiver
        </a>
      </div>
      <p style="font-size: 13px; color: #666;">This link will expire in 30 days. If you did not request this, you can safely ignore this email.</p>
      <p>Thank you,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const subject =
      reason === 'event'
        ? 'Action Required: Sign waiver to complete event signup'
        : 'Action Required: Sign Your Volunteer Waiver'

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      html: buildEmailLayout('Volunteer Waiver Required', bodyHtml),
      text:
        reason === 'event'
          ? `Hi ${firstName}, sign your volunteer waiver to finish event signup: ${waiverUrl}`
          : `Hi ${firstName}, welcome to ${ORG_NAME}! Please sign your volunteer waiver at this link: ${waiverUrl}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Account waiver email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending account waiver email:', error)
    throw new Error('Failed to send account waiver email')
  }
}

/**
 * Notify a volunteer that their account has been approved by an administrator.
 *
 * @param {string} email      - Volunteer's email address
 * @param {string} firstName  - Volunteer's first name
 */
export const sendVolunteerApprovedEmail = async (email, firstName) => {
  try {
    const safeName = firstName || 'Volunteer'
    const bodyHtml = `
      <p>Hi ${escapeHtml(safeName)},</p>
      <p>Great news — your volunteer account at ${ORG_NAME} has been <strong>approved</strong>.</p>
      <p>You can now sign in and register for volunteer opportunities, track your hours, and stay connected with the farm.</p>
      <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
        <h3 style="color: #2c5f2d; margin-top: 0;">What's next?</h3>
        <ul style="margin: 8px 0; padding-left: 20px;">
          <li>Browse upcoming events on our website</li>
          <li>Complete any remaining waiver steps if prompted</li>
          <li>Reach out if you have questions — we're glad you're here</li>
        </ul>
      </div>
      <p>Thank you for volunteering with us.</p>
      <p>Best regards,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Your volunteer account has been approved',
      html: buildEmailLayout('Volunteer account approved', bodyHtml),
      text: `Hi ${safeName}, your ${ORG_NAME} volunteer account has been approved. You can sign in and register for volunteer opportunities. Thank you! — ${ORG_NAME}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Volunteer approved email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending volunteer approved email:', error)
    throw new Error(`Failed to send volunteer approved email: ${error.message}`)
  }
}

const FEEDBACK_CATEGORY_LABEL = {
  thank_you: 'Thank you',
  suggestion: 'Suggestion',
  concern: 'Concern',
  general: 'General feedback',
}

function escapeHtmlForEmail(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Notify a user that staff sent them feedback (also visible on their volunteer dashboard).
 *
 * @param {string} email           - Recipient email
 * @param {string} firstName       - Recipient first name
 * @param {string} category        - feedback category key
 * @param {string} message         - Feedback body
 * @param {string} [senderLabel]   - e.g. "Jane D." or "Mill Creek staff"
 */
export const sendStaffFeedbackEmail = async (
  email,
  firstName,
  category,
  message,
  senderLabel = `${ORG_NAME} staff`
) => {
  try {
    const safeName = firstName || 'there'
    const categoryLabel = FEEDBACK_CATEGORY_LABEL[category] || category || 'Feedback'
    const safeMessageHtml = escapeHtmlForEmail(message).replace(/\n/g, '<br />')

    const bodyHtml = `
      <p>Hi ${escapeHtmlForEmail(safeName)},</p>
      <p>You have new feedback from <strong>${escapeHtmlForEmail(senderLabel)}</strong>.</p>
      <p style="margin: 8px 0 4px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.06em;">Category</p>
      <p style="margin: 0 0 16px; font-weight: 600; color: #2c5f2d;">${escapeHtmlForEmail(categoryLabel)}</p>
      <div style="background-color: white; padding: 16px; border-left: 4px solid #2c5f2d; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333;">${safeMessageHtml}</p>
      </div>
      <p style="font-size: 13px; color: #666;">You can also read this message anytime in your volunteer dashboard when you’re signed in.</p>
      <p>Thank you for being part of ${ORG_NAME}.</p>
      <p>Best regards,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `New feedback: ${categoryLabel}`,
      html: buildEmailLayout('Feedback from the team', bodyHtml),
      text: `Hi ${safeName}, you have new feedback from ${senderLabel} (${categoryLabel}):\n\n${message}\n\nYou can also view this in your volunteer dashboard. — ${ORG_NAME}`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Staff feedback email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending staff feedback email:', error)
    throw new Error(`Failed to send staff feedback email: ${error.message}`)
  }
}

/**
 * Send 24-hour reminder email to a registered participant.
 */
export const sendVolunteerEventReminderEmail = async ({ email, firstName, event }) => {
  try {
    const safeName = firstName || 'Volunteer'
    const eventName = event?.name || 'your event'
    const bodyHtml = `
      <p>Hi ${escapeHtml(safeName)},</p>
      <p>This is a reminder that <strong>${escapeHtml(eventName)}</strong> is happening in about 24 hours.</p>
      <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
        <h3 style="color: #2c5f2d; margin-top: 0;">Event Details</h3>
        <p style="margin: 5px 0;"><strong>When:</strong> ${formatEventDateForEmail(event?.date, event?.endTime)}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${escapeHtml(event?.location || 'TBD')}</p>
        ${event?.waiverRequired ? '<p style="margin: 5px 0;"><strong>Reminder:</strong> A signed waiver is required.</p>' : ''}
      </div>
      <p>We are excited to see you there. Thank you for supporting ${ORG_NAME}.</p>
      <p>Best regards,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `24-Hour Reminder: ${eventName}`,
      html: buildEmailLayout('Event Reminder', bodyHtml),
      text: `Hi ${safeName}, reminder: "${eventName}" starts in about 24 hours. ${formatEventDateForEmail(event?.date, event?.endTime)} at ${event?.location || 'TBD'}.`,
    }

    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending volunteer reminder email:', error)
    throw new Error(`Failed to send volunteer reminder email: ${error.message}`)
  }
}

// ──────────────────────────────────────────────
// Admin: volunteer self-service attendance
// ──────────────────────────────────────────────

function formatAttendanceTimestamp(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return String(d)
  }
}

/**
 * Notify all admin users when a volunteer completes sign-out (attendance record).
 */
export async function sendAdminVolunteerAttendanceEmail({
  volunteerName,
  volunteerEmail,
  event,
  signedInAt,
  signedOutAt,
  attendanceNotes,
}) {
  const admins = await User.find({ role: 'admin' }).select('email').lean()
  const toList = [...new Set(admins.map((a) => a.email).filter(Boolean))]
  if (!toList.length) {
    console.warn('sendAdminVolunteerAttendanceEmail: no admin recipients')
    return { sent: 0 }
  }

  const eventName = escapeHtml(event?.name || 'Event')
  const eventWhen = formatAttendanceTimestamp(event?.date)
  const inStr = formatAttendanceTimestamp(signedInAt)
  const outStr = formatAttendanceTimestamp(signedOutAt)
  const safeName = escapeHtml(volunteerName || 'Participant')
  const safeEmail = volunteerEmail ? escapeHtml(volunteerEmail) : ''
  const notesBlock =
    attendanceNotes && String(attendanceNotes).trim()
      ? `<p style="margin: 12px 0 0;"><strong>Note from participant (at sign-in):</strong><br/>${escapeHtml(String(attendanceNotes).trim()).replace(/\n/g, '<br/>')}</p>`
      : ''

  const bodyHtml = `
    <p>A volunteer has completed self-service attendance for an event.</p>
    <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
      <h3 style="color: #2c5f2d; margin-top: 0;">${eventName}</h3>
      <p style="margin: 5px 0;"><strong>Participant:</strong> ${safeName}${safeEmail ? ` (${safeEmail})` : ''}</p>
      <p style="margin: 5px 0;"><strong>Event date:</strong> ${escapeHtml(eventWhen)}</p>
      <p style="margin: 5px 0;"><strong>Signed in:</strong> ${escapeHtml(inStr)}</p>
      <p style="margin: 5px 0;"><strong>Signed out:</strong> ${escapeHtml(outStr)}</p>
      ${notesBlock}
    </div>
    <p>Their registration is marked as attended in the system.</p>
  `

  const textLines = [
    `Participant: ${volunteerName || 'Participant'}${volunteerEmail ? ` (${volunteerEmail})` : ''}`,
    `Event: ${event?.name || 'Event'}`,
    `Event date: ${formatAttendanceTimestamp(event?.date)}`,
    `Signed in: ${inStr}`,
    `Signed out: ${outStr}`,
  ]
  if (attendanceNotes && String(attendanceNotes).trim()) {
    textLines.push(`Note: ${String(attendanceNotes).trim()}`)
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: toList.join(','),
    subject: `Attendance: ${volunteerName || 'Volunteer'} — ${event?.name || 'Event'}`,
    html: buildEmailLayout('Event attendance', bodyHtml),
    text: `Volunteer attendance completed.\n\n${textLines.join('\n')}`,
  }

  const info = await transporter.sendMail(mailOptions)
  return { success: true, messageId: info.messageId, sent: toList.length }
}

// ──────────────────────────────────────────────
// Newsletter emails
// ──────────────────────────────────────────────

/**
 * Send a newsletter notification about a new volunteer event.
 * @param {string} email
 * @param {string} firstName
 * @param {{ name: string, date: Date, location: string, description: string }} event
 */
export const sendNewEventNewsletterEmail = async (email, firstName, event) => {
  const safeName = firstName || 'Community Member'
  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'TBD'

  const bodyHtml = `
    <p>Hi ${escapeHtml(safeName)},</p>
    <p>A new volunteer opportunity has just been posted at ${ORG_NAME}!</p>
    <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
      <h3 style="color: #2c5f2d; margin-top: 0;">${escapeHtml(event.name)}</h3>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
      ${event.location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${escapeHtml(event.location)}</p>` : ''}
      ${event.description ? `<p style="margin: 10px 0 0;">${escapeHtml(event.description)}</p>` : ''}
    </div>
    <p>Log in to sign up for this event and make a difference in your community.</p>
    <p>Best regards,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
  `

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `New Volunteer Opportunity: ${event.name}`,
    html: buildEmailLayout('New Volunteer Opportunity', bodyHtml),
    text: `Hi ${safeName}, a new volunteer event "${event.name}" has been posted at ${ORG_NAME}. Date: ${eventDate}. Log in to sign up!`,
  }

  const info = await transporter.sendMail(mailOptions)
  return { success: true, messageId: info.messageId }
}

/**
 * Send a newsletter notification about a new donation campaign.
 * @param {string} email
 * @param {string} firstName
 * @param {{ name: string, description: string, goalAmount: number }} project
 */
export const sendNewCampaignNewsletterEmail = async (email, firstName, project) => {
  const safeName = firstName || 'Community Member'
  const goal = project.goalAmount
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.goalAmount)
    : null

  const bodyHtml = `
    <p>Hi ${escapeHtml(safeName)},</p>
    <p>A new donation campaign has launched at ${ORG_NAME}!</p>
    <div style="background-color: white; padding: 15px; border-left: 4px solid #2c5f2d; margin: 20px 0;">
      <h3 style="color: #2c5f2d; margin-top: 0;">${escapeHtml(project.name)}</h3>
      ${goal ? `<p style="margin: 5px 0;"><strong>Goal:</strong> ${goal}</p>` : ''}
      ${project.description ? `<p style="margin: 10px 0 0;">${escapeHtml(project.description)}</p>` : ''}
    </div>
    <p>Visit our donation campaigns page to learn more and contribute.</p>
    <p>With gratitude,<br><strong>${ORG_EMAIL_TEAM}</strong></p>
  `

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `New Campaign: ${project.name}`,
    html: buildEmailLayout('New Donation Campaign', bodyHtml),
    text: `Hi ${safeName}, a new donation campaign "${project.name}" has launched at ${ORG_NAME}. Visit our site to learn more!`,
  }

  const info = await transporter.sendMail(mailOptions)
  return { success: true, messageId: info.messageId }
}
