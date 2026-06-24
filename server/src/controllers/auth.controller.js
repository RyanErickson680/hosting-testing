import crypto from 'crypto'
import validator from 'validator'
import {
  createUser,
  findUserByEmail,
  findUserById,
  comparePassword,
  generateToken,
  generateResetToken,
  findUserByResetToken,
  clearResetToken,
  hashPassword,
} from '../services/auth.service.js'
import { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from '../services/email.service.js'
import { issueAccountWaiverTokenAndEmail } from '../services/accountWaiver.service.js'
import User from '../models/user.model.js'

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, isVolunteer, waiverSigned, contactInfo } = req.body

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' })
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    // Create user
    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      isVolunteer: isVolunteer || false,
      waiverSigned: !!waiverSigned,
      contactInfo,
    })

    // Send welcome email — fire and forget so it never blocks the signup response
    sendWelcomeEmail(email, firstName).catch((emailError) => {
      console.error('Warning: Failed to send welcome email:', emailError.message)
    })

    // Waiver email is not sent on signup; volunteers request it from waiver-required events (or admins resend).

    // Generate token with role and tokenVersion
    const token = generateToken(user._id.toString(), user.role, user.tokenVersion ?? 0)

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development', // HTTPS in production and staging; only plain HTTP in local dev
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    })

    return res.status(201).json({
      message: 'User created successfully',
      user,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({ error: 'Failed to create user' })
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Find user
    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check if user has password (should have one for authentication)
    if (!user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate token with role and tokenVersion
    const token = generateToken(user._id.toString(), user.role, user.tokenVersion ?? 0)

    // Set httpOnly cookie — 30 days if rememberMe, otherwise 24 hours
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    })

    // Remove passwordHash from response
    const userObj = user.toObject()
    delete userObj.passwordHash

    return res.status(200).json({
      message: 'Login successful',
      user: userObj,
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Login failed' })
  }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const user = await findUserById(userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({ user })
  } catch (error) {
    console.error('Get current user error:', error)
    return res.status(500).json({ error: 'Failed to get user' })
  }
}

/**
 * Get volunteer waiver details by token (public)
 * GET /api/auth/waiver/:token
 */
export const getAccountWaiverDetails = async (req, res) => {
  try {
    const { token } = req.params
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({ 'volunteerProfile.waiverToken': hashedToken })
      .select('firstName lastName email volunteerProfile.waiverSigned volunteerProfile.waiverToken volunteerProfile.waiverTokenExpiresAt')
      .lean()

    if (!user) {
      return res.status(404).json({ error: 'Waiver link not found or already used.' })
    }

    if (user.volunteerProfile.waiverSigned) {
      return res.status(409).json({ error: 'This waiver has already been signed.' })
    }

    if (new Date() > new Date(user.volunteerProfile.waiverTokenExpiresAt)) {
      return res.status(410).json({ error: 'This waiver link has expired. Please contact us to get a new one.' })
    }

    return res.status(200).json({
      volunteer: { firstName: user.firstName, lastName: user.lastName, email: user.email },
    })
  } catch (error) {
    console.error('Get account waiver details error:', error)
    return res.status(500).json({ error: 'Failed to load waiver' })
  }
}

/**
 * Approve volunteer waiver by token (public)
 * POST /api/auth/waiver/:token/approve
 */
export const approveAccountWaiver = async (req, res) => {
  try {
    const { token } = req.params
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({ 'volunteerProfile.waiverToken': hashedToken })

    if (!user) {
      return res.status(404).json({ error: 'Waiver link not found or already used.' })
    }

    if (user.volunteerProfile.waiverSigned) {
      return res.status(409).json({ error: 'This waiver has already been signed.' })
    }

    if (new Date() > new Date(user.volunteerProfile.waiverTokenExpiresAt)) {
      return res.status(410).json({ error: 'This waiver link has expired.' })
    }

    user.volunteerProfile.waiverSigned = true
    user.volunteerProfile.waiverSignedAt = new Date()
    user.volunteerProfile.waiverToken = null
    user.volunteerProfile.waiverTokenExpiresAt = null
    user.volunteerProfile.approved = true
    await user.save()

    return res.status(200).json({ message: 'Waiver approved successfully.' })
  } catch (error) {
    console.error('Approve account waiver error:', error)
    return res.status(500).json({ error: 'Failed to approve waiver' })
  }
}

/**
 * Logged-in volunteer: request a waiver signing link by email (e.g. from waiver-required events).
 * POST /api/auth/request-waiver-email
 */
export const requestAccountWaiverEmail = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (!user.volunteerProfile) {
      return res.status(400).json({ error: 'Only users with a volunteer profile can request a waiver email' })
    }
    if (user.volunteerProfile.waiverSigned) {
      return res.status(400).json({ error: 'You have already signed the waiver' })
    }

    await issueAccountWaiverTokenAndEmail(user, { reason: 'event' })

    return res.status(200).json({
      message: 'Check your email for a link to sign the volunteer waiver.',
    })
  } catch (error) {
    console.error('Request waiver email error:', error)
    return res.status(500).json({ error: 'Failed to send waiver email' })
  }
}

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // Clear httpOnly cookie
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 0, // Expire immediately
    })

    return res.status(200).json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({ error: 'Logout failed' })
  }
}
/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    // Validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Find user by email
    const user = await findUserByEmail(email)

    // Always return success (don't reveal if email exists for security)
    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      })
    }

    // Generate reset token
    const plainToken = await generateResetToken(user._id.toString())

    // Build reset link (should match your frontend URL)
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${plainToken}`

    // Send password reset email — fire and forget so it never blocks the response
    sendPasswordResetEmail(email, user.firstName, resetLink).catch((emailError) => {
      console.error('Warning: Failed to send password reset email:', emailError.message)
    })

    return res.status(200).json({ 
      success: true, 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return res.status(500).json({ error: 'Failed to process password reset request' })
  }
}

/**
 * Verify reset token validity
 * GET /api/auth/verify-reset-token/:token
 */
export const verifyResetTokenEndpoint = async (req, res) => {
  try {
    const { token } = req.params

    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token is required' })
    }

    const user = await findUserByResetToken(token)
    if (!user) {
      return res.status(400).json({ valid: false, error: 'Invalid or expired reset token' })
    }

    return res.status(200).json({
      valid: true,
      message: 'Reset token is valid.',
    })
  } catch (error) {
    console.error('Verify reset token error:', error)
    return res.status(500).json({ valid: false, error: 'Failed to verify token' })
  }
}

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    // Validation
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' })
    }

    // Password validation
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const user = await findUserByResetToken(token)

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    // Update password and increment tokenVersion to invalidate existing sessions
    const hashedPassword = await hashPassword(newPassword)
    const userId = user._id.toString()
    await User.findByIdAndUpdate(userId, {
      passwordHash: hashedPassword,
      $inc: { tokenVersion: 1 },
    })

    // Clear reset token
    await clearResetToken(userId)

    // Notify account owner that password was changed (fire-and-forget)
    sendPasswordChangedEmail(user.email, user.firstName).catch((emailErr) => {
      console.error('Warning: Failed to send password-changed notification:', emailErr.message)
    })

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return res.status(500).json({ error: 'Failed to reset password' })
  }
}
