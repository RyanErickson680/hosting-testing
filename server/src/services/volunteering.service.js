import crypto from 'crypto'
import mongoose from 'mongoose'
import VolunteeringEvent from 'models/volunteering.model'
import EventRegistration from 'models/event-registration.model'
import User from 'models/user.model'
import { assertAccountWaiverForEventRegistration } from 'services/accountWaiver.service'

async function loadEmailService() {
    const module = await import('services/email.service.js')
    return module
}

function getEventEndDateTime(eventLike) {
    if (!eventLike?.date || !eventLike?.endTime) return null
    const [hours, minutes] = String(eventLike.endTime).split(':').map((v) => parseInt(v, 10))
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null

    const endDateTime = new Date(eventLike.date)
    endDateTime.setHours(hours, minutes, 0, 0)
    return endDateTime
}

function getEventRegistrationCutoffDateTime(eventLike) {
    if (!eventLike?.date) return null
    const startDateTime = new Date(eventLike.date)
    if (Number.isNaN(startDateTime.getTime())) return null
    return new Date(startDateTime.getTime() + 15 * 60 * 1000)
}

function hasRegistrationWindowClosed(eventLike, now = new Date()) {
    const cutoff = getEventRegistrationCutoffDateTime(eventLike)
    if (!cutoff) return false
    return now >= cutoff
}

/** Start of the event's calendar day (local server TZ), aligned with how endTime is applied. */
function getAttendanceWindowStart(eventLike) {
    if (!eventLike?.date) return null
    const d = new Date(eventLike.date)
    if (Number.isNaN(d.getTime())) return null
    const start = new Date(d)
    start.setHours(0, 0, 0, 0)
    return start
}

function compareAttendanceTokens(a, b) {
    if (a == null || b == null) return false
    const bufA = Buffer.from(String(a), 'utf8')
    const bufB = Buffer.from(String(b), 'utf8')
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Check-in/out are allowed from the start of the event day onward,
 * and require a valid attendance token.
 */
function assertAttendanceWindowAndToken(event, opts = {}) {
    const now = new Date()
    const windowStart = getAttendanceWindowStart(event)
    if (!windowStart) {
        throw new Error('Invalid event schedule')
    }
    if (now < windowStart) {
        throw new Error('Check-in is only available during the event')
    }
    const provided = opts.attendanceToken != null ? String(opts.attendanceToken).trim() : ''
    if (!event.attendanceToken) {
        throw new Error('Attendance is not configured for this event yet')
    }
    if (!compareAttendanceTokens(provided, event.attendanceToken)) {
        throw new Error('Invalid or missing attendance token')
    }
}

/** Remove secret token from API payloads shown to non-admins. */
function toPublicEvent(event) {
    if (!event) return event
    const o = typeof event.toObject === 'function' ? event.toObject() : { ...event }
    delete o.attendanceToken
    return o
}

function generateAttendanceToken() {
    return crypto.randomBytes(32).toString('base64url')
}

async function ensureAttendanceTokenForEvent(eventId) {
    const existing = await VolunteeringEvent.findById(eventId).select('+attendanceToken').lean()
    if (!existing) return null
    if (existing.attendanceToken) return existing
    const attendanceToken = generateAttendanceToken()
    const updated = await VolunteeringEvent.findByIdAndUpdate(
        eventId,
        { $set: { attendanceToken, updatedAt: new Date() } },
        { new: true }
    ).select('+attendanceToken').lean()
    return updated
}

async function getAttendanceLinkForEvent(eventId) {
    const event = await ensureAttendanceTokenForEvent(eventId)
    if (!event) return null
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')
    const url = `${clientUrl}/event-attendance/check-in/${encodeURIComponent(String(eventId))}?t=${encodeURIComponent(event.attendanceToken)}`
    return { url }
}

/** Public: resolve QR token to minimal event info (no secret fields). */
async function getEventSummaryByAttendanceToken(rawToken) {
    if (rawToken == null || String(rawToken).trim() === '') return null
    const token = String(rawToken).trim()
    return VolunteeringEvent.findOne({ attendanceToken: token })
        .select('_id name date endTime status')
        .lean()
}

function hasEventEnded(eventLike, now = new Date()) {
    const endDateTime = getEventEndDateTime(eventLike)
    if (!endDateTime) return false
    return endDateTime <= now
}

function validateOneDayEventTiming(data) {
    if (!data?.date || !data?.endTime) {
        throw new Error('date and endTime are required')
    }

    const startDate = new Date(data.date)
    const endDateTime = getEventEndDateTime({ date: startDate, endTime: data.endTime })

    if (!endDateTime || Number.isNaN(startDate.getTime()) || Number.isNaN(endDateTime.getTime())) {
        throw new Error('Invalid date or endTime')
    }

    if (endDateTime <= startDate) {
        throw new Error('endTime must be after start time for one-day events')
    }
}

async function syncExpiredEventStatuses(now = new Date()) {
    const candidates = await VolunteeringEvent.find({
        status: { $in: ['open', 'full'] },
        date: { $lte: now },
    })
        .select('_id date endTime')
        .lean()

    const expiredIds = candidates
        .filter((event) => hasEventEnded(event, now))
        .map((event) => event._id)

    if (!expiredIds.length) {
        return { matchedCount: 0, modifiedCount: 0 }
    }

    return VolunteeringEvent.updateMany(
        {
            _id: { $in: expiredIds },
            status: { $in: ['open', 'full'] },
        },
        {
            $set: {
                status: 'completed',
                updatedAt: now,
            },
        }
    )
}

async function createEvent(data) {
    validateOneDayEventTiming(data)
    const { attendanceToken: _omit, ...rest } = data || {}
    const attendanceToken = generateAttendanceToken()
    const event = await VolunteeringEvent.create({ ...rest, attendanceToken })
    return event
}

async function getEvent(id) {
    if(!id) throw new Error("Event ID is required")
    return VolunteeringEvent.findById(id).lean()
}

async function getEvents(filters = {}) { 
    const query = {}
    if (filters.status) query.status = filters.status
    if (filters.eventType) query.eventType = filters.eventType
    if (filters.startDate || filters.endDate) { 
        query.date = {}
    if(filters.startDate) query.date.$gte = new Date(filters.startDate)
    if(filters.endDate) query.date.$lte = new Date(filters.endDate)
    }

    const MAX_LIMIT = 200
    const parsedLimit = parseInt(filters.limit, 10) || 100
    const limit = Math.min(parsedLimit, MAX_LIMIT)
    const skip = parseInt(filters.skip, 10) || 0

    const [events, total] = await Promise.all([
        VolunteeringEvent.find(query).sort({date: 1}).skip(skip).limit(limit).lean(),
        VolunteeringEvent.countDocuments(query)
    ])

    return {events, total}
}

async function updateEvent(id, data) {
    if(!id) throw new Error("Event ID is required")

    const { attendanceToken: _omit, ...safeData } = data || {}

    if (safeData.date || safeData.endTime) {
        const existing = await VolunteeringEvent.findById(id).select('date endTime').lean()
        if (!existing) return null
        validateOneDayEventTiming({
            date: safeData.date || existing.date,
            endTime: safeData.endTime || existing.endTime,
        })
    }

    const event = await VolunteeringEvent.findByIdAndUpdate(
        id,
        { ...safeData, updatedAt: new Date() },
        { returnDocument: 'after', runValidators: true }
    ).lean()
    return event
}

async function deleteEvent(id) { 
    if(!id) throw new Error("Event ID is required")
    return VolunteeringEvent.findByIdAndDelete(id)
}

async function registerUserForEvent(userId, eventId, opts = {}) {
    if(!userId || !eventId) throw new Error("User ID and Event ID are required")

    await syncExpiredEventStatuses()

    const eventPre = await VolunteeringEvent.findById(eventId).lean()
    if(!eventPre) throw new Error("Event not found")
    if (hasRegistrationWindowClosed(eventPre)) {
        throw new Error('Registration closed 15 minutes after event start')
    }
    if(hasEventEnded(eventPre)) {
        await VolunteeringEvent.updateOne(
            { _id: eventId, status: { $in: ['open', 'full'] } },
            { $set: { status: 'completed', updatedAt: new Date() } },
        )
        throw new Error('Event has already ended')
    }
    if(eventPre.status !== 'open') throw new Error("Event is not open for registrations")

    const isPaidEvent = eventPre.eventType === 'paid'
    const expectedAmount = Number(eventPre.cost || 0)
    const payment = opts?.payment || null
    if (isPaidEvent) {
        if (!payment || payment.status !== 'completed') {
            throw new Error('Payment is required to register for this paid event')
        }
        if (Number(payment.amount || 0) < expectedAmount) {
            throw new Error('Payment amount is less than event cost')
        }
    }

    // Account-level waiver only (same as registration). Issues email + throws if not signed.
    await assertAccountWaiverForEventRegistration(userId, eventPre)

    const session = await mongoose.startSession()
    try {
        session.startTransaction()

        const event = await VolunteeringEvent.findById(eventId).session(session)
        if(!event) throw new Error("Event not found")
        if (hasRegistrationWindowClosed(event)) {
            throw new Error('Registration closed 15 minutes after event start')
        }
        if(hasEventEnded(event)) {
            await VolunteeringEvent.updateOne(
                { _id: eventId, status: { $in: ['open', 'full'] } },
                { $set: { status: 'completed', updatedAt: new Date() } },
                { session }
            )
            throw new Error('Event has already ended')
        }
        if(event.status !== 'open') throw new Error("Event is not open for registrations")

        // No per-event waiver: account waiver was already enforced above when event.waiverRequired

        // Check if user is already registered (transactional)
        const existingRegistration = await EventRegistration.findOne({ userId, eventId }).session(session)
        if(existingRegistration) throw new Error("User is already registered for this event")

        // Create registration within session
        const [registration] = await EventRegistration.create(
            [{
                userId,
                eventId,
                registeredAt: new Date(),
                notes: opts.notes || null,
                paymentRequired: isPaidEvent,
                amountPaid: isPaidEvent ? Number(payment.amount || 0) : 0,
                currency: isPaidEvent ? (payment.currency || 'USD') : 'USD',
                paymentProvider: isPaidEvent ? (payment.provider || 'paypal') : null,
                paymentStatus: isPaidEvent ? 'completed' : 'not_required',
                paypalOrderId: isPaidEvent ? (payment.orderId || null) : null,
                paypalTransactionId: isPaidEvent ? (payment.transactionId || null) : null,
                waiverSigned: true,
                waiverSignedAt: new Date(),
                waiverToken: null,
                waiverTokenExpiresAt: null,
            }],
            { session }
        )

        // Increment volunteer count and handle capacity/status
        if (typeof event.volunteersNeeded === 'number') {
            const updated = await VolunteeringEvent.findOneAndUpdate(
                { _id: eventId, currentVolunteerCount: { $lt: event.volunteersNeeded } },
                { $inc: { currentVolunteerCount: 1 } },
                { new: true, session }
            )

            if(!updated) {
                throw new Error('Event is full')
            }

            if (updated.currentVolunteerCount >= (updated.volunteersNeeded || 0)) {
                await VolunteeringEvent.updateOne({ _id: eventId }, { $set: { status: 'full' } }, { session })
            }
        } else {
            await VolunteeringEvent.findByIdAndUpdate(eventId, { $inc: { currentVolunteerCount: 1 } }, { new: true, session })
        }

        await session.commitTransaction()
        session.endSession()

        return { registration }
    } catch (err) {
        await session.abortTransaction().catch(() => {})
        session.endSession()

        if (err && err.code === 11000) {
            throw new Error('User is already registered for this event')
        }
        throw err
    }
}

async function cancelEventRegistration(userId, eventId) {
    if(!userId || !eventId) throw new Error("User ID and Event ID are required")

    const session = await mongoose.startSession()
    try {
        session.startTransaction()

        const registration = await EventRegistration.findOneAndDelete({ userId, eventId }).session(session)
        if(!registration) throw new Error("Registration not found")

        const updated = await VolunteeringEvent.findByIdAndUpdate(
            eventId,
            { $inc: { currentVolunteerCount: -1 } },
            { new: true, session }
        )

        if(updated && typeof updated.volunteersNeeded === 'number') {
            if(updated.status === 'full' && updated.currentVolunteerCount < updated.volunteersNeeded) {
                await VolunteeringEvent.updateOne({ _id: eventId }, { $set: { status: 'open' } }, { session })
            }
        }

        if(updated && updated.currentVolunteerCount < 0) {
            await VolunteeringEvent.updateOne({ _id: eventId }, { $set: { currentVolunteerCount: 0 } }, { session })
        }

        await session.commitTransaction()
        session.endSession()

        return { success: true }
    } catch (err) {
        await session.abortTransaction().catch(() => {})
        session.endSession()
        throw err
    }
}

async function getUserEventRegistrations(userId) {
    if(!userId) throw new Error("User ID is required")

    const registrations = await EventRegistration.find({ userId })
        .sort({ registrationDate: -1 })
        .populate({ path: 'eventId', model: 'VolunteeringEvent' })
        .lean()

    return registrations
}

/**
 * Send reminder emails for events happening around 24 hours from now.
 * A 60-minute window is used so a periodic scheduler can catch each registration exactly once.
 */
async function send24HourEventReminders(now = new Date()) {
    const windowStart = new Date(now.getTime() + ((24 * 60 - 30) * 60 * 1000))
    const windowEnd = new Date(now.getTime() + ((24 * 60 + 30) * 60 * 1000))

    const pendingReminders = await EventRegistration.aggregate([
        {
            $match: {
                $or: [
                    { reminder24hSentAt: { $exists: false } },
                    { reminder24hSentAt: null },
                ],
            },
        },
        {
            $lookup: {
                from: 'events',
                localField: 'eventId',
                foreignField: '_id',
                as: 'event',
            },
        },
        {
            $unwind: {
                path: '$event',
                preserveNullAndEmptyArrays: false,
            },
        },
        {
            $match: {
                'event.status': { $in: ['open', 'full'] },
                'event.date': { $gte: windowStart, $lte: windowEnd },
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        {
            $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: false,
            },
        },
        {
            $project: {
                _id: 1,
                email: '$user.email',
                firstName: '$user.firstName',
                event: {
                    name: '$event.name',
                    date: '$event.date',
                    endTime: '$event.endTime',
                    location: '$event.location',
                    waiverRequired: '$event.waiverRequired',
                },
            },
        },
    ])

    if (!pendingReminders.length) {
        return { attempted: 0, sent: 0 }
    }

    const emailService = await loadEmailService()
    let sentCount = 0

    for (const reminder of pendingReminders) {
        if (!reminder.email) continue

        try {
            await emailService.sendVolunteerEventReminderEmail({
                email: reminder.email,
                firstName: reminder.firstName,
                event: reminder.event,
            })

            await EventRegistration.updateOne(
                { _id: reminder._id },
                { $set: { reminder24hSentAt: now } }
            )
            sentCount += 1
        } catch (error) {
            console.error('Failed sending 24-hour event reminder:', error)
        }
    }

    return { attempted: pendingReminders.length, sent: sentCount }
}

const MAX_ATTENDANCE_NOTES_LENGTH = 2000

/**
 * Self-service check-in for a registered participant (one sign-in per registration until sign-out).
 */
async function recordEventCheckIn(userId, eventId, opts = {}) {
    if (!userId || !eventId) throw new Error('User ID and Event ID are required')

    const event = await VolunteeringEvent.findById(eventId).select('+attendanceToken').lean()
    if (!event) throw new Error('Event not found')
    if (event.status === 'cancelled') throw new Error('This event was cancelled')

    assertAttendanceWindowAndToken(event, opts)

    const reg = await EventRegistration.findOne({ userId, eventId })
    if (!reg) throw new Error('You are not registered for this event')
    if (reg.signedOutAt) {
        throw new Error('Attendance for this event is already complete')
    }
    if (reg.signedInAt) {
        throw new Error('You have already signed in for this event')
    }

    let notes = opts.attendanceNotes != null ? String(opts.attendanceNotes).trim() : null
    if (notes && notes.length > MAX_ATTENDANCE_NOTES_LENGTH) {
        notes = notes.slice(0, MAX_ATTENDANCE_NOTES_LENGTH)
    }

    reg.signedInAt = new Date()
    if (notes) reg.attendanceNotes = notes
    await reg.save()

    return { registration: reg.toObject(), event }
}

/**
 * Self-service check-out; sets attended and notifies admins by email.
 */
async function recordEventCheckOut(userId, eventId, opts = {}) {
    if (!userId || !eventId) throw new Error('User ID and Event ID are required')

    const event = await VolunteeringEvent.findById(eventId).select('+attendanceToken').lean()
    if (!event) throw new Error('Event not found')
    if (event.status === 'cancelled') throw new Error('This event was cancelled')

    assertAttendanceWindowAndToken(event, opts)

    const reg = await EventRegistration.findOne({ userId, eventId })
    if (!reg) throw new Error('You are not registered for this event')
    if (!reg.signedInAt) throw new Error('Sign in before signing out')
    if (reg.signedOutAt) throw new Error('You have already signed out')

    const now = new Date()
    reg.signedOutAt = now
    reg.attended = true
    const elapsedMs = Math.max(0, now.getTime() - new Date(reg.signedInAt).getTime())
    const eventStart = new Date(event.date)
    const eventEnd = getEventEndDateTime(event)
    let creditedMs = elapsedMs
    if (eventEnd && !Number.isNaN(eventStart.getTime())) {
        const scheduledMs = Math.max(0, eventEnd.getTime() - eventStart.getTime())
        creditedMs = Math.min(elapsedMs, scheduledMs)
    }
    reg.hoursCredited = Math.round((creditedMs / (1000 * 60 * 60)) * 100) / 100
    await reg.save()

    const user = await User.findById(userId).select('email firstName lastName').lean()
    const volunteerName = user
        ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Participant'
        : 'Participant'

    try {
        const emailService = await loadEmailService()
        await emailService.sendAdminVolunteerAttendanceEmail({
            volunteerName,
            volunteerEmail: user?.email || null,
            event,
            signedInAt: reg.signedInAt,
            signedOutAt: reg.signedOutAt,
            attendanceNotes: reg.attendanceNotes || null,
        })
    } catch (err) {
        console.error('Failed to send admin attendance notification:', err.message)
    }

    return { registration: reg.toObject(), event }
}

/**
 * Admin: list attendance rows for an event with participant names.
 */
async function getEventAttendanceList(eventId) {
    if (!eventId) throw new Error('Event ID is required')

    const event = await getEvent(eventId)
    if (!event) return null

    const rows = await EventRegistration.aggregate([
        { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                userId: 1,
                registeredAt: 1,
                notes: 1,
                waiverSigned: 1,
                attended: 1,
                signedInAt: 1,
                signedOutAt: 1,
                attendanceNotes: 1,
                firstName: '$user.firstName',
                lastName: '$user.lastName',
                email: '$user.email',
            },
        },
        { $sort: { registeredAt: 1 } },
    ])

    return { event: toPublicEvent(event), attendance: rows }
}

export { 
    createEvent,
    getEvent,
    getEvents,
    deleteEvent,
    registerUserForEvent,
    cancelEventRegistration,
    getUserEventRegistrations,
    updateEvent,
    syncExpiredEventStatuses,
    getEventEndDateTime,
    getEventRegistrationCutoffDateTime,
    hasRegistrationWindowClosed,
    send24HourEventReminders,
    recordEventCheckIn,
    recordEventCheckOut,
    getEventAttendanceList,
    toPublicEvent,
    ensureAttendanceTokenForEvent,
    getAttendanceLinkForEvent,
    getAttendanceWindowStart,
    getEventSummaryByAttendanceToken,
}
