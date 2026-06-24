import Feedback from 'models/feedback.model'
import User from 'models/user.model'
import to from 'await-to-js'
import mongoose from 'mongoose'
import { sendStaffFeedbackEmail } from 'services/email.service'

/**
 * POST /api/feedback
 * Admin sends feedback to a user.
 */
export const createFeedback = async (req, res) => {
  try {
    const { recipientUserId, category, message } = req.body

    if (!recipientUserId || !category || !message) {
      return res.status(400).json({ error: 'recipientUserId, category, and message are required' })
    }

    if (!mongoose.Types.ObjectId.isValid(recipientUserId)) {
      return res.status(400).json({ error: 'Invalid recipientUserId' })
    }

    const [recipientErr, recipient] = await to(
      User.findById(recipientUserId).select('email firstName').lean()
    )
    if (recipientErr) {
      console.error('createFeedback recipient lookup error', recipientErr)
      return res.status(500).json({ error: 'Failed to verify recipient user' })
    }
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient user not found' })
    }

    const [err, feedback] = await to(
      Feedback.create({
        recipientUserId: new mongoose.Types.ObjectId(recipientUserId),
        senderUserId: new mongoose.Types.ObjectId(req.userId),
        category,
        message,
      })
    )

    if (err) {
      console.error('createFeedback error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }

    if (recipient.email) {
      try {
        const [senderErr, sender] = await to(
          User.findById(req.userId).select('firstName lastName').lean()
        )
        const senderLabel =
          !senderErr && sender
            ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Mill Creek Urban Farm staff'
            : 'Mill Creek Urban Farm staff'
        await sendStaffFeedbackEmail(
          recipient.email,
          recipient.firstName,
          category,
          message,
          senderLabel
        )
      } catch (emailErr) {
        console.error('Warning: Feedback saved but email failed:', emailErr.message)
      }
    }

    return res.status(201).json({ feedback })
  } catch (error) {
    console.error('createFeedback exception', error)
    return res.status(500).json({ error: 'Failed to create feedback' })
  }
}

/**
 * GET /api/feedback/me
 * Authenticated user retrieves feedback sent to them.
 */
export const getUserFeedback = async (req, res) => {
  try {
    const [err, items] = await to(
      Feedback.find({ recipientUserId: new mongoose.Types.ObjectId(req.userId) })
        .populate('senderUserId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .lean()
    )

    if (err) {
      console.error('getUserFeedback error', err)
      return res.status(500).json({ error: 'Internal server error' })
    }

    return res.json({ feedback: items })
  } catch (error) {
    console.error('getUserFeedback exception', error)
    return res.status(500).json({ error: 'Failed to fetch feedback' })
  }
}
