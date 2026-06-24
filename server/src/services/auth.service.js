import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/user.model.js'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const SALT_ROUNDS = 12

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare a password with a hash
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

/**
 * Generate JWT token for a user
 * @param {string} userId
 * @param {string} role - user role (admin, staff, user)
 * @param {number} tokenVersion - incremented on password reset to invalidate old tokens
 */
export const generateToken = (userId, role, tokenVersion = 0) => {
  return jwt.sign({ userId, role, tokenVersion }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Create a new user
 */
export const createUser = async (userData) => {
  const { email, password, firstName, lastName, isVolunteer, waiverSigned, contactInfo } = userData

  const role = 'user'

  // Hash password
  const passwordHash = await hashPassword(password)

  // Build user object
  const user = {
    email,
    passwordHash,
    firstName,
    lastName,
    role,
  }

  // Add contact info if provided
  if (contactInfo) {
    user.contactInfo = contactInfo
  }

  // Add volunteer profile if the user opted in during signup
  if (isVolunteer) {
    user.volunteerProfile = {
      skills: [],
      waiverSigned: !!waiverSigned,
      approved: false,
      totalHoursVolunteered: 0,
      availability: [],
    }
  }

  // Keep donor metrics available for all base users
  user.donorProfile = {
    totalAmountDonated: 0,
    recurringDonationCount: 0,
  }

  const newUser = new User(user)
  await newUser.save()

  // Remove passwordHash from returned user
  const userObj = newUser.toObject()
  delete userObj.passwordHash

  return userObj
}

/**
 * Find user by email
 */
export const findUserByEmail = async (email) => {
  return await User.findOne({ email })
}

/**
 * Find user by ID
 */
export const findUserById = async (userId) => {
  const user = await User.findById(userId)
  if (!user) return null

  // Remove passwordHash from returned user
  const userObj = user.toObject()
  delete userObj.passwordHash

  return userObj
}
// ──────────────────────────────────────────────
// Password Reset Token Management
// ──────────────────────────────────────────────

/**
 * Generate a reset token and store hashed version in DB
 * @param {string} userId - User ID to generate token for
 * @returns {Promise<string>} The plain reset token (to be sent in email link)
 */
export const generateResetToken = async (userId) => {
  // Generate random token
  const plainToken = crypto.randomBytes(32).toString('hex')

  // Hash the token with SHA-256 for storage (safe for random 32-byte values)
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex')

  // Set expiry to 1 hour from now
  const expiryTime = new Date(Date.now() + 60 * 60 * 1000)

  // Update user with hashed token and expiry
  await User.findByIdAndUpdate(userId, {
    resetToken: hashedToken,
    resetTokenExpiry: expiryTime,
  })

  return plainToken
}

/**
 * Verify reset token against user's stored hash
 * @param {string} userId - User ID
 * @param {string} plainToken - Plain reset token (from URL)
 * @returns {Promise<boolean>} True if token is valid and not expired
 */
export const verifyResetToken = async (userId, plainToken) => {
  const user = await User.findById(userId)

  if (!user || !user.resetToken) {
    return false
  }

  if (new Date() > user.resetTokenExpiry) {
    return false
  }

  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex')
  // Use constant-time comparison to prevent timing attacks on the token
  const storedBuf = Buffer.from(user.resetToken, 'hex')
  const inputBuf = Buffer.from(hashedToken, 'hex')
  if (storedBuf.length !== inputBuf.length) return false
  return crypto.timingSafeEqual(storedBuf, inputBuf)
}

/**
 * Find a user by a valid, unexpired reset token.
 * Since reset tokens are stored hashed, this checks candidate users with
 * active reset tokens and returns the first hash match.
 * @param {string} plainToken - Plain reset token from the reset link
 * @returns {Promise<Object|null>} Matching user document or null
 */
export const findUserByResetToken = async (plainToken) => {
  const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex')
  return User.findOne({
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: new Date() },
  })
}

/**
 * Clear reset token from user (after successful reset)
 * @param {string} userId - User ID
 */
export const clearResetToken = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    resetToken: null,
    resetTokenExpiry: null,
  })
}
