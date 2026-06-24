import User from 'models/user.model'
import to from 'await-to-js'
import mongoose from 'mongoose'
import { clampLimit } from 'utils/pagination'
import { issueAccountWaiverTokenAndEmail } from 'services/accountWaiver.service'
import { hashPassword, comparePassword } from 'services/auth.service'

/**
 * .lean() returns an object rather than the mongoose document
 * this makes queries faster, but you cannot modify the returned result
 */

/**
 * GET /api/user
 * Query parameters:
 * - role: filter by role (admin, staff, user)
 * - email: filter by email (exact match)
 * - approved: filter volunteers by approval status (true/false)
 * - waiverSigned: filter volunteers by waiver signed (true/false)
 * - hasVolunteerProfile: filter users with volunteer profiles (true/false)
 * - hasDonorProfile: filter users with donor profiles (true/false)
 * - limit: limit number of results (default: 100)
 * - skip: skip number of results (for pagination)
 */
export const getUsers = async (req, res) => {
  const {
    role,
    email,
    approved,
    waiverSigned,
    hasVolunteerProfile,
    hasDonorProfile,
    limit,
    skip = 0,
  } = req.query

  const clampedLimit = clampLimit(limit, 100)

  // Build query filter
  const filter = {}

  if (role) {
    if (!['admin', 'staff', 'user'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be one of: admin, staff, user',
      })
    }
    filter.role = role === 'user' ? { $in: ['user', 'volunteer', 'donor'] } : role
  }

  if (email) {
    filter.email = email
  }

  if (approved !== undefined) {
    filter['volunteerProfile.approved'] = approved === 'true'
  }

  if (waiverSigned !== undefined && waiverSigned !== '') {
    filter['volunteerProfile.waiverSigned'] = waiverSigned === 'true'
  }

  if (hasVolunteerProfile === 'true') {
    filter.volunteerProfile = { $exists: true, $ne: null }
  } else if (hasVolunteerProfile === 'false') {
    filter.$or = [
      { volunteerProfile: { $exists: false } },
      { volunteerProfile: null },
    ]
  }

  if (hasDonorProfile === 'true') {
    filter.donorProfile = { $exists: true, $ne: null }
  } else if (hasDonorProfile === 'false') {
    filter.$or = [
      ...(filter.$or || []),
      { donorProfile: { $exists: false } },
      { donorProfile: null },
    ]
  }

  const [error, users] = await to(
    User.find(filter)
      .limit(clampedLimit)
      .skip(parseInt(skip, 10))
      .sort({ createdAt: -1 })
      .lean()
  )

  if (error) return res.status(500).json({ error: 'Internal server error' })

  const [countError, total] = await to(User.countDocuments(filter))
  if (countError) {
    return res.status(500).json({ error: 'Internal server error' })
  }

  const normalizedUsers = users.map((user) => ({
    ...user,
    role: ['volunteer', 'donor'].includes(user.role) ? 'user' : user.role,
  }))

  return res.json({
    users: normalizedUsers,
    total,
    limit: clampedLimit,
    skip: parseInt(skip, 10),
  })
}

/**
 * GET /api/user/:id
 * Get a single user by ID
 */
export const getUser = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user ID format' })
  }

  // Users may only fetch their own profile; admins may fetch any profile
  if (req.userRole !== 'admin' && req.userId !== id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Admins see everything except passwordHash; users see their own profile
  // minus internal security tokens
  const excludeFields = req.userRole === 'admin'
    ? '-passwordHash'
    : '-passwordHash -resetToken -resetTokenExpiry -volunteerProfile.waiverToken -volunteerProfile.waiverTokenExpiresAt'

  const [error, user] = await to(User.findById(id).select(excludeFields).lean())
  if (error) return res.status(500).json({ error: 'Internal server error' })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  return res.json({
    user: {
      ...user,
      role: ['volunteer', 'donor'].includes(user.role) ? 'user' : user.role,
    },
  })
}

/**
 * GET /api/user/email/:email
 * Get a user by email
 */
export const getUserByEmail = async (req, res) => {
  const { email } = req.params

  const [error, user] = await to(User.findOne({ email }).lean())
  if (error) return res.status(500).json({ error: 'Internal server error' })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  return res.json({
    user: {
      ...user,
      role: ['volunteer', 'donor'].includes(user.role) ? 'user' : user.role,
    },
  })
}

/**
 * GET /api/user/role/:role
 * Get all users by role
 */
export const getUsersByRole = async (req, res) => {
  const { role } = req.params

  if (!['admin', 'staff', 'user'].includes(role)) {
    return res.status(400).json({
      error: 'Invalid role. Must be one of: admin, staff, user',
    })
  }

  const query = role === 'user'
    ? { role: { $in: ['user', 'volunteer', 'donor'] } }
    : { role }
  const [error, users] = await to(User.find(query).sort({ createdAt: -1 }).lean())
  if (error) return res.status(500).json({ error: 'Internal server error' })

  const normalizedUsers = users.map((user) => ({
    ...user,
    role: ['volunteer', 'donor'].includes(user.role) ? 'user' : user.role,
  }))
  return res.json({ users: normalizedUsers, count: normalizedUsers.length })
}

/**
 * GET /api/user/volunteers
 * Get all volunteers (users with volunteer profiles)
 * Query params: approved (true/false)
 */
export const getVolunteers = async (req, res) => {
  const { approved } = req.query

  const filter = {
    volunteerProfile: { $exists: true, $ne: null },
  }

  if (approved !== undefined) {
    filter['volunteerProfile.approved'] = approved === 'true'
  }

  const [error, volunteers] = await to(
    User.find(filter).sort({ createdAt: -1 }).lean()
  )
  if (error) return res.status(500).json({ error: 'Internal server error' })

  return res.json({ volunteers, count: volunteers.length })
}

/**
 * GET /api/user/donors
 * Get all donors (users with donor profiles)
 */
export const getDonors = async (req, res) => {
  const filter = {
    donorProfile: { $exists: true, $ne: null },
  }

  const [error, donors] = await to(
    User.find(filter).sort({ createdAt: -1 }).lean()
  )
  if (error) return res.status(500).json({ error: 'Internal server error' })

  return res.json({ donors, count: donors.length })
}

/**
 * POST /api/user
 * Create a new user
 * Required: email, role, firstName, lastName
 */
export const createUser = async (req, res) => {
  const {
    email,
    role,
    firstName,
    lastName,
    password,
    contactInfo,
    volunteerProfile,
    donorProfile,
  } = req.body

  // Validation
  if (!email) return res.status(400).json({ error: 'email is required' })
  if (!role) return res.status(400).json({ error: 'role is required' })
  if (!['admin', 'staff', 'user'].includes(role)) {
    return res.status(400).json({
      error: 'Invalid role. Must be one of: admin, staff, user',
    })
  }
  if (!firstName) return res.status(400).json({ error: 'firstName is required' })
  if (!lastName) return res.status(400).json({ error: 'lastName is required' })

  const userData = {
    email,
    role,
    firstName,
    lastName,
  }

  // Hash password server-side — never accept a pre-hashed value
  if (password) {
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }
    userData.passwordHash = await hashPassword(password)
  }

  if (contactInfo) userData.contactInfo = contactInfo
  if (volunteerProfile) userData.volunteerProfile = volunteerProfile
  if (donorProfile) userData.donorProfile = donorProfile

  const [error, user] = await to(User.create(userData))
  if (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' })
    }
    return res.status(500).json({ error: 'Internal server error' })
  }

  return res.status(201).json({ user })
}

/**
 * POST /api/user/:id/resend-waiver
 * Admin only: generate a new waiver token and email the volunteer (unsigned volunteers only).
 */
export const resendVolunteerWaiver = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user ID format' })
  }

  const [findErr, user] = await to(User.findById(id))
  if (findErr) {
    return res.status(500).json({ error: findErr.message })
  }
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  if (!user.volunteerProfile) {
    return res.status(400).json({ error: 'Only users with a volunteer profile can receive a waiver email' })
  }
  if (user.volunteerProfile.waiverSigned) {
    return res.status(400).json({ error: 'This volunteer has already signed the waiver' })
  }

  try {
    await issueAccountWaiverTokenAndEmail(user, { reason: 'signup' })
  } catch (e) {
    console.error('Warning: Failed to send waiver email:', e.message)
    return res.status(500).json({ error: 'Waiver link was saved but the email could not be sent' })
  }

  return res.json({ message: 'Waiver email sent.' })
}

/**
 * PATCH /api/user/me/newsletter
 * Authenticated: toggle newsletter subscription on/off.
 * Body: { subscribed: boolean }
 */
export const updateNewsletterSubscription = async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Authentication required' })

  const { subscribed } = req.body
  if (typeof subscribed !== 'boolean') {
    return res.status(400).json({ error: 'subscribed must be a boolean' })
  }

  const [error, user] = await to(
    User.findByIdAndUpdate(
      userId,
      { newsletterSubscribed: subscribed },
      { returnDocument: 'after' }
    ).lean()
  )
  if (error) return res.status(500).json({ error: 'Internal server error' })
  if (!user) return res.status(404).json({ error: 'User not found' })

  return res.json({ newsletterSubscribed: user.newsletterSubscribed })
}

/**
 * PATCH /api/user/me/password
 * Authenticated: change own password.
 * Body: { currentPassword: string, newPassword: string }
 */
export const changePassword = async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Authentication required' })

  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' })
  }

  const [findErr, user] = await to(User.findById(userId))
  if (findErr) return res.status(500).json({ error: findErr.message })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const valid = await comparePassword(currentPassword, user.passwordHash)
  if (!valid) return res.status(400).json({ error: 'Current password is incorrect' })

  const hashed = await hashPassword(newPassword)
  const [saveErr] = await to(User.findByIdAndUpdate(userId, { passwordHash: hashed }))
  if (saveErr) return res.status(500).json({ error: saveErr.message })

  return res.json({ message: 'Password updated successfully' })
}

/**
 * PATCH /api/user/me
 * Authenticated: update own profile (firstName, lastName, contactInfo).
 */
export const updateOwnProfile = async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Authentication required' })

  const { firstName, lastName, contactInfo } = req.body
  const updates = {}
  if (firstName) updates.firstName = firstName
  if (lastName) updates.lastName = lastName
  if (contactInfo) updates.contactInfo = contactInfo

  const [error, user] = await to(
    User.findByIdAndUpdate(userId, updates, { returnDocument: 'after' }).lean()
  )
  if (error) return res.status(500).json({ error: 'Internal server error' })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const { passwordHash: _, ...safeUser } = user
  return res.json({ user: safeUser })
}

/**
 * DELETE /api/user/me
 * Authenticated: delete own account.
 */
export const deleteOwnAccount = async (req, res) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Authentication required' })

  const { currentPassword } = req.body
  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required to delete your account' })
  }

  const [findErr, user] = await to(User.findById(userId))
  if (findErr) return res.status(500).json({ error: 'Internal server error' })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const valid = await comparePassword(currentPassword, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Incorrect password' })

  const [deleteErr] = await to(User.findByIdAndDelete(userId))
  if (deleteErr) return res.status(500).json({ error: 'Internal server error' })

  res.clearCookie('token')
  return res.json({ message: 'Account deleted successfully' })
}

/**
 * PATCH /api/user/email/:email
 * Update a user
 */
export const updateUser = async (req, res) => {
  const { email } = req.params

  const updateData = { ...req.body }

  // Don't allow updating email to one that already exists on another account
  if (updateData.email) {
    const [checkError, existingUser] = await to(
      User.findOne({ $and: [{ email: updateData.email }, { email: { $ne: email } }] })
    )
    if (checkError) {
      return res.status(500).json({ error: checkError.message })
    }
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' })
    }
  }

  // Validate role if provided
  if (updateData.role && !['admin', 'staff', 'user'].includes(updateData.role)) {
    return res.status(400).json({
      error: 'Invalid role. Must be one of: admin, staff, user',
    })
  }

  const [error, user] = await to(
    User.findOneAndUpdate({ email }, updateData, {
      returnDocument: 'after',
      runValidators: true,
    }).lean()
  )

  if (error) return res.status(500).json({ error: 'Internal server error' })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  return res.json({ user })
}

/**
 * DELETE /api/user/:id
 * Delete a user
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user ID format' })
  }

  const [error, user] = await to(User.findByIdAndDelete(id).lean())
  if (error) return res.status(500).json({ error: 'Internal server error' })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  return res.json({ user, message: 'User deleted successfully' })
}

/**
 * GET /api/user/stats
 * Get user statistics
 */
export const getUserStats = async (req, res) => {
  const [error, stats] = await to(
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$count' },
          byRole: {
            $push: {
              role: '$_id',
              count: '$count',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          byRole: 1,
        },
      },
    ])
  )

  if (error) return res.status(500).json({ error: 'Internal server error' })

  const [volunteerError, waiverSignedVolunteers] = await to(
    User.countDocuments({
      volunteerProfile: { $exists: true, $ne: null },
      'volunteerProfile.waiverSigned': true,
    })
  )

  if (volunteerError) {
    return res.status(500).json({ error: volunteerError.message })
  }

  const [donorError, totalDonated] = await to(
    User.aggregate([
      {
        $match: {
          donorProfile: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$donorProfile.totalAmountDonated' },
          count: { $sum: 1 },
        },
      },
    ])
  )

  if (donorError) {
    return res.status(500).json({ error: donorError.message })
  }

  return res.json({
    ...(stats[0] || { total: 0, byRole: [] }),
    waiverSignedVolunteers,
    totalDonated: totalDonated[0]?.total || 0,
    donorCount: totalDonated[0]?.count || 0,
  })
}

/**
 * GET /api/user/impact-stats
 * Get current user's impact statistics (donations and volunteering)
 */
export const getUserImpactStats = async (req, res) => {
  const userId = req.userId

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const userIdObj = new mongoose.Types.ObjectId(userId)

  try {
    // Import models
    const Donation = (await import('models/donation.model')).default
    const RecurringDonation = (await import('models/recurring-donation.model')).default
    
    // EventRegistration - model should be registered by volunteering routes
    // Use mongoose.model which will work if the model is already registered
    const EventRegistration = mongoose.model('event_registration')

    // Aggregate all stats in parallel
    const [
      donationStats,
      recurringStats,
      volunteerStats,
    ] = await Promise.all([
      // Donation stats: total donated and count
      Donation.aggregate([
        {
          $match: {
            userId: userIdObj,
            paymentStatus: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            totalDonated: { $sum: '$amount' },
            totalDonationsCount: { $sum: 1 },
          },
        },
      ]),

      // Recurring donations: count of active subscriptions
      RecurringDonation.countDocuments({
        userId: userIdObj,
        status: 'active',
      }),

      // Volunteer stats: total hours and events attended
      EventRegistration.aggregate([
        {
          $match: {
            userId: userIdObj,
          },
        },
        {
          $group: {
            _id: null,
            totalVolunteerHours: {
              $sum: { $ifNull: ['$hoursCredited', 0] },
            },
            eventsParticipated: {
              $sum: {
                $cond: [{ $eq: ['$attended', true] }, 1, 0],
              },
            },
          },
        },
      ]),
    ])

    // Extract results
    const donationResult = donationStats[0] || {
      totalDonated: 0,
      totalDonationsCount: 0,
    }
    const volunteerResult = volunteerStats[0] || {
      totalVolunteerHours: 0,
      eventsParticipated: 0,
    }

    return res.json({
      totalDonated: donationResult.totalDonated || 0,
      totalDonationsCount: donationResult.totalDonationsCount || 0,
      activeRecurringCount: recurringStats || 0,
      totalVolunteerHours: volunteerResult.totalVolunteerHours || 0,
      eventsParticipated: volunteerResult.eventsParticipated || 0,
    })
  } catch (error) {
    console.error('Get user impact stats error:', error)
    return res.status(500).json({ error: 'Failed to fetch impact stats' })
  }
}
