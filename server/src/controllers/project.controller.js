import Project from 'models/project.model'
import to from 'await-to-js'
import mongoose from 'mongoose'
import { clampLimit } from 'utils/pagination'
import { safeRegexSubstring } from 'utils/regex'

/**
 * GET /api/projects
 * Query parameters:
 * - status: filter by status (active, completed, proposed)
 * - priority: filter by priority level (number)
 * - search: search in name and description (case-insensitive)
 * - limit: limit number of results (default: 100)
 * - skip: skip number of results (for pagination)
 */
export const getProjects = async (req, res) => {
  const {
    status,
    priority,
    search,
    limit,
    skip = 0,
  } = req.query

  const clampedLimit = clampLimit(limit, 100)

  // Build query filter
  const filter = {}

  if (status) {
    if (!['active', 'completed', 'proposed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: active, completed, proposed',
      })
    }
    filter.status = status
  }

  if (priority !== undefined) {
    const priorityNum = parseInt(priority, 10)
    if (isNaN(priorityNum)) {
      return res.status(400).json({
        error: 'Invalid priority. Must be a number',
      })
    }
    filter.priority = priorityNum
  }

  if (search) {
    const safe = safeRegexSubstring(search)
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
    ]
  }

  // Build sort: priority ascending (nulls last), then createdAt descending
  const sort = {}
  // For null handling, we'll use a two-stage sort or handle in application
  // MongoDB doesn't have a direct "nulls last" option, so we'll sort by priority first
  // and handle nulls by sorting them after non-nulls
  sort.priority = 1 // ascending
  sort.createdAt = -1 // descending

  const [error, projects] = await to(
    Project.find(filter)
      .limit(clampedLimit)
      .skip(parseInt(skip, 10))
      .sort(sort)
      .lean()
  )

  if (error) return res.status(500).json({ error: 'Internal server error' })

  // Sort projects to handle null priorities (put them last)
  const sortedProjects = projects.sort((a, b) => {
    // If both have priority, sort by priority
    if (a.priority != null && b.priority != null) {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
    }
    // If only one has priority, prioritize it
    if (a.priority != null && b.priority == null) return -1
    if (a.priority == null && b.priority != null) return 1
    // If both are null or equal priority, sort by createdAt descending
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  const [countError, total] = await to(Project.countDocuments(filter))
  if (countError) {
    return res.status(500).json({ error: countError.message })
  }

  return res.json({
    projects: sortedProjects,
    total,
    limit: parseInt(limit, 10),
    skip: parseInt(skip, 10),
  })
}

/**
 * POST /api/projects
 * Create a new project (admin only)
 */
export const createProject = async (req, res) => {
  const { name, description, goalAmount, status, priority, currentAmount, startDate, targetEndDate, currentNeeds } = req.body

  if (!name || !description || goalAmount == null || !status || priority == null) {
    return res.status(400).json({ error: 'name, description, goalAmount, status, and priority are required' })
  }

  const projectData = { name, description, goalAmount, status, priority, createdAt: new Date() }
  if (currentAmount != null) projectData.currentAmount = currentAmount
  if (startDate || targetEndDate) projectData.timeline = { startDate: startDate || undefined, targetEndDate: targetEndDate || undefined }
  if (currentNeeds) projectData.currentNeeds = currentNeeds

  const [error, project] = await to(Project.create(projectData))
  if (error) return res.status(500).json({ error: 'Internal server error' })

  // Fire-and-forget newsletter emails to subscribed users
  try {
    const User = (await import('models/user.model')).default
    const { sendNewCampaignNewsletterEmail } = await import('services/email.service')
    const subscribers = await User.find({ newsletterSubscribed: true }).select('email firstName').lean()
    for (const sub of subscribers) {
      sendNewCampaignNewsletterEmail(sub.email, sub.firstName, project).catch((err) =>
        console.error(`Newsletter email failed for ${sub.email}:`, err.message)
      )
    }
  } catch (err) {
    console.error('Failed to send campaign newsletter emails:', err.message)
  }

  return res.status(201).json({ project })
}

/**
 * PUT /api/projects/:id
 * Update an existing project (admin only)
 */
export const updateProject = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid project ID format' })
  }

  const allowed = ['name', 'description', 'goalAmount', 'status', 'priority', 'timeline', 'currentNeeds', 'slug']
  const updates = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }
  if (req.body.startDate !== undefined || req.body.targetEndDate !== undefined) {
    updates.timeline = { startDate: req.body.startDate || undefined, targetEndDate: req.body.targetEndDate || undefined }
  }
  updates.updatedAt = new Date()

  const [error, project] = await to(
    Project.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).lean()
  )
  if (error) return res.status(500).json({ error: 'Internal server error' })
  if (!project) return res.status(404).json({ error: 'Project not found' })

  return res.json({ project })
}

/**
 * DELETE /api/projects/:id
 * Delete a project (admin only)
 */
export const deleteProject = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid project ID format' })
  }

  const [error, project] = await to(Project.findByIdAndDelete(id).lean())
  if (error) return res.status(500).json({ error: 'Internal server error' })
  if (!project) return res.status(404).json({ error: 'Project not found' })

  return res.json({ project })
}

/**
 * PATCH /api/projects/:id/images
 * Admin only: replace the images array for a project.
 * Body: { images: [{ url: string, caption?: string }] }
 */
export const updateProjectImages = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid project ID format' })
  }

  const { images } = req.body
  if (!Array.isArray(images)) {
    return res.status(400).json({ error: 'images must be an array' })
  }
  for (const img of images) {
    if (!img.url || typeof img.url !== 'string') {
      return res.status(400).json({ error: 'Each image must have a url string' })
    }
  }

  const [error, project] = await to(
    Project.findByIdAndUpdate(id, { images, updatedAt: new Date() }, { returnDocument: 'after' }).lean()
  )
  if (error) return res.status(500).json({ error: 'Internal server error' })
  if (!project) return res.status(404).json({ error: 'Project not found' })

  return res.json({ project })
}

/**
 * GET /api/projects/:id
 * Get a single project by ID
 */
export const getProject = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid project ID format' })
  }

  const [error, project] = await to(Project.findById(id).lean())
  if (error) return res.status(500).json({ error: 'Internal server error' })

  if (!project) {
    return res.status(404).json({ error: 'Project not found' })
  }

  return res.json({ project })
}
