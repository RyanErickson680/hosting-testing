import * as volunteeringService from 'services/volunteering.service'
import {
    assertAccountWaiverForEventRegistration,
    ACCOUNT_WAIVER_REQUIRED_CODE,
} from 'services/accountWaiver.service'
import mongoose from 'mongoose'
import EventRegistration from 'models/event-registration.model'

async function loadPayPalService() {
    const module = await import('services/paypal.service.js')
    return module
}

async function loadEmailService() {
    const module = await import('services/email.service.js')
    return module
}

async function getRegisteredParticipantContacts(eventId) {
    const participants = await EventRegistration.aggregate([
        {
            $match: {
                eventId: new mongoose.Types.ObjectId(eventId),
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
                _id: 0,
                email: '$user.email',
                firstName: '$user.firstName',
            },
        },
    ])

    const uniqueByEmail = new Map()
    for (const participant of participants) {
        if (participant?.email) {
            uniqueByEmail.set(participant.email, participant)
        }
    }

    return Array.from(uniqueByEmail.values())
}

function getChangedEventFields(before, after) {
    if (!before || !after) return []
    const comparableFields = [
        'name',
        'description',
        'date',
        'endTime',
        'location',
        'eventType',
        'status',
        'cost',
        'volunteersNeeded',
        'waiverRequired',
    ]

    return comparableFields.filter((field) => {
        if (field === 'date') {
            return new Date(before.date).getTime() !== new Date(after.date).getTime()
        }
        return JSON.stringify(before[field] ?? null) !== JSON.stringify(after[field] ?? null)
    })
}

async function notifyEventUpdatedParticipants({ eventId, beforeEvent, afterEvent }) {
    const changedFields = getChangedEventFields(beforeEvent, afterEvent)
    if (!changedFields.length) return

    const recipients = await getRegisteredParticipantContacts(eventId)
    if (!recipients.length) return

    const emailService = await loadEmailService()
    await Promise.allSettled(
        recipients.map((recipient) =>
            emailService.sendVolunteerEventUpdatedEmail({
                email: recipient.email,
                firstName: recipient.firstName,
                oldEvent: beforeEvent,
                newEvent: afterEvent,
                changedFields,
            })
        )
    )
}

async function notifyEventCancelledParticipants({ eventId, event }) {
    const recipients = await getRegisteredParticipantContacts(eventId)
    if (!recipients.length) return

    const emailService = await loadEmailService()
    await Promise.allSettled(
        recipients.map((recipient) =>
            emailService.sendVolunteerEventCancelledEmail({
                email: recipient.email,
                firstName: recipient.firstName,
                event,
            })
        )
    )
}

async function createEvent(req, res) { 
    try { 
        const { name, date, endTime, status, attendanceToken: _ignoreToken, ...rest } = req.body
        if(!name || !date || !endTime || !status) { 
            return res.status(400).json({error: "name, date, endTime, and status are required"})
        }
        const eventData = { 
            name: name.trim(), 
            date: new Date(date), 
            endTime: String(endTime).trim(),
            status, 
            createdAt: new Date(),
            ...rest
        }
        if (eventData.cost !== undefined) {
            eventData.cost = Number(eventData.cost)
        }
        const event = await volunteeringService.createEvent(eventData)

        // Fire-and-forget newsletter emails to subscribed users
        try {
          const User = (await import('models/user.model.js')).default
          const { sendNewEventNewsletterEmail } = await loadEmailService()
          const subscribers = await User.find({ newsletterSubscribed: true }).select('email firstName').lean()
          for (const sub of subscribers) {
            sendNewEventNewsletterEmail(sub.email, sub.firstName, event).catch((err) =>
              console.error(`Newsletter email failed for ${sub.email}:`, err.message)
            )
          }
        } catch (err) {
          console.error('Failed to send event newsletter emails:', err.message)
        }

        return res.status(201).json({ event: volunteeringService.toPublicEvent(event) })
    } catch (error) { 
        console.error(error)
        if (error.message?.includes('endTime') || error.message?.includes('date and endTime')) {
            return res.status(400).json({ error: error.message })
        }
        return res.status(500).json({error: "Internal server error"})
    }
}

async function getEvent(req, res) {
    try {
        const id = req.params.id
        if(!id) return res.status(400).json({error: "Event ID is required"})
        const event = await volunteeringService.getEvent(id)
        if(!event) return res.status(404).json({error: "Event not found"})
        return res.json({ event: volunteeringService.toPublicEvent(event) })
    } catch (error) {
        console.error(error)
        return res.status(500).json({error: "Failed to fetch event"})
    }
}

async function listEvents(req, res) { 
    try { 
        const filters = { 
            status: req.query.status,
            eventType: req.query.eventType,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            limit: req.query.limit,
            skip: req.query.skip,
        }
        const result = await volunteeringService.getEvents(filters)
        return res.json({
            events: result.events.map((e) => volunteeringService.toPublicEvent(e)),
            total: result.total,
        })
    } catch (error) { 
        console.error(error)
        return res.status(500).json({error: "Failed to fetch events"})
    }
}

async function updateEvent(req, res) {
    try {
        const id = req.params.id
        if(!id) return res.status(400).json({error: "Event ID is required"})

        const existingEvent = await volunteeringService.getEvent(id)
        if(!existingEvent) return res.status(404).json({error: "Event not found"})
        
        const { name, date, endTime, status, attendanceToken: _ignoreToken, ...rest } = req.body
        const updateData = {}
        
        if(name) updateData.name = name.trim()
        if(date) updateData.date = new Date(date)
        if(endTime) updateData.endTime = String(endTime).trim()
        if(status) updateData.status = status
        
        Object.assign(updateData, rest)
        if (updateData.cost !== undefined) {
            updateData.cost = Number(updateData.cost)
        }
        
        const event = await volunteeringService.updateEvent(id, updateData)
        if(!event) return res.status(404).json({error: "Event not found"})

        const changedFields = getChangedEventFields(existingEvent, event)
        if (changedFields.includes('date') || changedFields.includes('endTime')) {
            await EventRegistration.updateMany(
                { eventId: new mongoose.Types.ObjectId(id) },
                { $set: { reminder24hSentAt: null } }
            )
        }

        if (existingEvent.status !== 'cancelled' && event.status === 'cancelled') {
            await notifyEventCancelledParticipants({ eventId: id, event })
        } else {
            await notifyEventUpdatedParticipants({
                eventId: id,
                beforeEvent: existingEvent,
                afterEvent: event,
            })
        }

        return res.json({ event: volunteeringService.toPublicEvent(event) })
    } catch (error) {
        console.error(error)
        if (error.message?.includes('endTime') || error.message?.includes('date and endTime')) {
            return res.status(400).json({ error: error.message })
        }
        return res.status(500).json({error: "Failed to update event"})
    }
}

async function deleteEvent(req, res) { 
    try { 
        const id = req.params.id
        if(!id) return res.status(400).json({error: "Event ID is required"})

        const event = await volunteeringService.getEvent(id)
        if(!event) return res.status(404).json({error: "Event not found"})

        await notifyEventCancelledParticipants({ eventId: id, event })

        await volunteeringService.deleteEvent(id)
        await EventRegistration.deleteMany({eventId: id})
        res.json({success: true})
    } catch (error) { 
        console.error(error)
        return res.status(500).json({error: "Failed to delete event"})
    }
}

async function registerForEvent(req, res) {
    try {
        const eventId = req.params.id
        const userId = req.userId

        if(!eventId) {
            return res.status(400).json({error: "Event ID is required"})
        }

        const event = await volunteeringService.getEvent(eventId)
        if (!event) {
            return res.status(404).json({ error: 'Event not found' })
        }
        if (event.eventType === 'paid') {
            return res.status(400).json({ error: 'Use paid checkout flow for paid events' })
        }

        const { registration } = await volunteeringService.registerUserForEvent(userId, eventId, {
            notes: req.body?.notes,
        })

        // Send confirmation email (non-blocking)
        try {
            const { default: User } = await import('models/user.model.js')
            const user = await User.findById(userId).select('email firstName').lean()
            if (user && user.email) {
                const emailService = await loadEmailService()
                await emailService.sendEventRegistrationEmail(user.email, user.firstName, event.name, event.date)
            }
        } catch (emailError) {
            console.error('Warning: Failed to send event registration email:', emailError.message)
        }

        return res.status(201).json({ registration })
    } catch (error) {
        console.error(error)
        if (error.code === ACCOUNT_WAIVER_REQUIRED_CODE) {
            return res.status(403).json({ error: error.message, code: ACCOUNT_WAIVER_REQUIRED_CODE })
        }
        if(error.message.includes("already registered")) {
            return res.status(409).json({error: error.message})
        }
        if(error.message.includes("not found") || error.message.includes("not open") || error.message.includes("full") || error.message.includes('Payment') || error.message.includes('paid checkout') || error.message.includes('ended')) {
            const status = error.message.includes("not found") ? 400 : (error.message.includes("already registered") ? 409 : 400)
            return res.status(status).json({error: error.message})
        }
        return res.status(500).json({error: "Failed to register for event"})
    }
}

async function createPaidEventOrder(req, res) {
    try {
        const eventId = req.params.id
        const userId = req.userId

        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' })
        }

        const event = await volunteeringService.getEvent(eventId)
        if (!event) {
            return res.status(404).json({ error: 'Event not found' })
        }
        if (event.eventType !== 'paid') {
            return res.status(400).json({ error: 'This endpoint is only for paid events' })
        }
        if (event.status !== 'open') {
            return res.status(400).json({ error: 'Event is not open for registrations' })
        }
        if (volunteeringService.hasRegistrationWindowClosed(event)) {
            return res.status(400).json({ error: 'Registration closed 15 minutes after event start' })
        }

        const existingRegistration = await EventRegistration.findOne({ eventId, userId }).lean()
        if (existingRegistration) {
            return res.status(409).json({ error: 'User is already registered for this event' })
        }

        try {
            await assertAccountWaiverForEventRegistration(userId, event)
        } catch (e) {
            if (e.code === ACCOUNT_WAIVER_REQUIRED_CODE) {
                return res.status(403).json({ error: e.message, code: ACCOUNT_WAIVER_REQUIRED_CODE })
            }
            throw e
        }

        const amount = Number(event.cost || 0)
        if (amount <= 0) {
            return res.status(400).json({ error: 'Paid event cost must be greater than 0' })
        }

        const paypalService = await loadPayPalService()
        const order = await paypalService.createOrder(
            amount,
            'USD',
            `event_${eventId}`,
            userId,
            null
        )

        return res.json({
            success: true,
            orderId: order.orderId,
            approvalUrl: order.links?.find((link) => link.rel === 'approve')?.href,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Failed to create paid event order' })
    }
}

async function capturePaidEventOrder(req, res) {
    try {
        const eventId = req.params.id
        const userId = req.userId
        const { orderId, payerId, notes } = req.body || {}

        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' })
        }
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' })
        }

        const event = await volunteeringService.getEvent(eventId)
        if (!event) {
            return res.status(404).json({ error: 'Event not found' })
        }
        if (event.eventType !== 'paid') {
            return res.status(400).json({ error: 'This endpoint is only for paid events' })
        }

        const existingRegistration = await EventRegistration.findOne({ eventId, userId }).lean()
        if (existingRegistration) {
            return res.status(409).json({ error: 'User is already registered for this event' })
        }

        try {
            await assertAccountWaiverForEventRegistration(userId, event)
        } catch (e) {
            if (e.code === ACCOUNT_WAIVER_REQUIRED_CODE) {
                return res.status(403).json({ error: e.message, code: ACCOUNT_WAIVER_REQUIRED_CODE })
            }
            throw e
        }

        const paypalService = await loadPayPalService()
        const capture = await paypalService.captureOrder(orderId)

        if (capture.status !== 'COMPLETED') {
            return res.status(400).json({
                error: `Payment not completed. Current status: ${capture.status}`,
            })
        }

        const { registration } = await volunteeringService.registerUserForEvent(userId, eventId, {
            notes,
            payment: {
                status: 'completed',
                provider: 'paypal',
                amount: capture.amount,
                currency: capture.currency,
                orderId,
                transactionId: capture.transactionId,
                payerId: payerId || capture.payerId,
            },
        })

        return res.status(201).json({
            success: true,
            registration,
            payment: {
                orderId,
                transactionId: capture.transactionId,
                amount: capture.amount,
                currency: capture.currency,
                status: capture.status,
            },
        })
    } catch (error) {
        console.error(error)
        if (error.code === ACCOUNT_WAIVER_REQUIRED_CODE) {
            return res.status(403).json({ error: error.message, code: ACCOUNT_WAIVER_REQUIRED_CODE })
        }
        if (error.message.includes('already registered')) {
            return res.status(409).json({ error: error.message })
        }
        if (error.message.includes('not found') || error.message.includes('not open') || error.message.includes('full') || error.message.includes('Payment')) {
            return res.status(400).json({ error: error.message })
        }
        return res.status(500).json({ error: 'Failed to capture paid event order' })
    }
}

async function cancelRegistration(req, res) {
    try {
        const eventId = req.params.id
        const userId = req.userId
        
        if(!eventId) {
            return res.status(400).json({error: "Event ID is required"})
        }
        
        await volunteeringService.cancelEventRegistration(userId, eventId)
        return res.json({success: true})
    } catch (error) {
        console.error(error)
        if(error.message.includes("not found")) {
            return res.status(404).json({error: error.message})
        }
        return res.status(500).json({error: "Failed to cancel registration"})
    }
}

/**
 * GET /api/events/me
 * Get current user's event registrations
 */
async function getUserEventRegistrations(req, res) {
    try {
        const userId = req.userId
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' })
        }

        const { limit: rawLimit, skip = 0, status } = req.query
        const MAX_LIMIT = 200
        const parsedLimit = parseInt(rawLimit, 10)
        const limit = (!parsedLimit || parsedLimit < 1) ? 20 : Math.min(parsedLimit, MAX_LIMIT)
        const now = new Date()

        const pipeline = [
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
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
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    eventEndDateTime: {
                        $dateFromString: {
                            dateString: {
                                $concat: [
                                    { $dateToString: { format: '%Y-%m-%d', date: '$event.date' } },
                                    'T',
                                    { $ifNull: ['$event.endTime', '23:59'] },
                                    ':00',
                                ],
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    isUpcoming: { $gt: ['$eventEndDateTime', now] },
                    isPast: { $lt: ['$eventEndDateTime', now] },
                },
            },
        ]

        if (status === 'attended') {
            pipeline.push({ $match: { attended: true } })
        } else if (status === 'upcoming') {
            pipeline.push({ $match: { isUpcoming: true } })
        } else if (status === 'past') {
            pipeline.push({ $match: { isPast: true } })
        }

        pipeline.push({ $sort: { 'event.date': -1 } })

        const countPipeline = [...pipeline, { $count: 'total' }]
        const [countResult] = await EventRegistration.aggregate(countPipeline)
        const total = countResult?.total || 0

        pipeline.push(
            { $skip: parseInt(skip, 10) },
            { $limit: parseInt(limit, 10) }
        )

        pipeline.push({
            $project: {
                _id: 1,
                eventId: '$event._id',
                eventName: '$event.name',
                eventDate: '$event.date',
                eventEndTime: '$event.endTime',
                eventLocation: '$event.location',
                eventSkillsNeeded: '$event.skillsNeeded',
                registeredAt: 1,
                attended: 1,
                hoursCredited: 1,
                notes: 1,
                isUpcoming: 1,
                isPast: 1,
                waiverSigned: 1,
                waiverRequired: '$event.waiverRequired',
                signedInAt: 1,
                signedOutAt: 1,
                attendanceNotes: 1,
            },
        })

        const registrations = await EventRegistration.aggregate(pipeline)

        return res.json({
            registrations,
            total,
            limit: parseInt(limit, 10),
            skip: parseInt(skip, 10),
        })
    } catch (error) {
        console.error('Get user event registrations error:', error)
        return res.status(500).json({ error: 'Failed to fetch event registrations' })
    }
}

/**
 * GET /api/events/stats
 * Admin only: aggregate volunteer hour data for analytics.
 * Returns:
 *   - monthlyHours: [{ month: 'YYYY-MM', hours, registrations }] for last 12 months
 *   - topEvents: [{ eventId, name, totalAttended, totalHours }]
 */
async function checkInEvent(req, res) {
    try {
        const eventId = req.params.id
        const userId = req.userId
        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' })
        }
        const { attendanceNotes, attendanceToken } = req.body || {}
        const { registration, event } = await volunteeringService.recordEventCheckIn(userId, eventId, {
            attendanceNotes,
            attendanceToken,
        })
        return res.json({
            registration,
            event: event
                ? { _id: event._id, name: event.name, date: event.date, endTime: event.endTime }
                : null,
        })
    } catch (error) {
        console.error(error)
        const msg = error.message || 'Failed to sign in'
        if (
            msg.includes('not registered') ||
            msg.includes('cancelled') ||
            msg.includes('already') ||
            msg.includes('token') ||
            msg.includes('during') ||
            msg.includes('ended') ||
            msg.includes('Attendance') ||
            msg.includes('schedule') ||
            msg.includes('configured')
        ) {
            return res.status(400).json({ error: msg })
        }
        if (msg.includes('not found')) {
            return res.status(404).json({ error: msg })
        }
        return res.status(500).json({ error: 'Failed to sign in' })
    }
}

async function checkOutEvent(req, res) {
    try {
        const eventId = req.params.id
        const userId = req.userId
        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' })
        }
        const { attendanceToken } = req.body || {}
        const { registration, event } = await volunteeringService.recordEventCheckOut(userId, eventId, {
            attendanceToken,
        })
        return res.json({
            registration,
            event: event
                ? { _id: event._id, name: event.name, date: event.date, endTime: event.endTime }
                : null,
        })
    } catch (error) {
        console.error(error)
        const msg = error.message || 'Failed to sign out'
        if (
            msg.includes('not registered') ||
            msg.includes('Sign in') ||
            msg.includes('already') ||
            msg.includes('token') ||
            msg.includes('during') ||
            msg.includes('ended') ||
            msg.includes('Attendance') ||
            msg.includes('schedule') ||
            msg.includes('configured')
        ) {
            return res.status(400).json({ error: msg })
        }
        if (msg.includes('not found')) {
            return res.status(404).json({ error: msg })
        }
        return res.status(500).json({ error: 'Failed to sign out' })
    }
}

async function resolveAttendanceToken(req, res) {
    try {
        const raw = req.query.t ?? req.query.token
        if (raw == null || String(raw).trim() === '') {
            return res.status(400).json({ error: 'token is required' })
        }
        const event = await volunteeringService.getEventSummaryByAttendanceToken(raw)
        if (!event) {
            return res.status(404).json({ error: 'Invalid or unknown attendance link' })
        }
        return res.json({
            eventId: event._id,
            name: event.name,
            date: event.date,
            endTime: event.endTime,
            status: event.status,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Failed to resolve attendance link' })
    }
}

async function getEventAttendanceLink(req, res) {
    try {
        const eventId = req.params.id
        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' })
        }
        const event = await volunteeringService.getEvent(eventId)
        if (!event) {
            return res.status(404).json({ error: 'Event not found' })
        }
        if (event.status === 'cancelled') {
            return res.status(400).json({ error: 'Cannot generate attendance link for a cancelled event' })
        }
        const data = await volunteeringService.getAttendanceLinkForEvent(eventId)
        if (!data) {
            return res.status(404).json({ error: 'Event not found' })
        }
        return res.json(data)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Failed to build attendance link' })
    }
}

async function getEventAttendance(req, res) {
    try {
        const eventId = req.params.id
        if (!eventId) {
            return res.status(400).json({ error: 'Event ID is required' })
        }
        const data = await volunteeringService.getEventAttendanceList(eventId)
        if (!data) {
            return res.status(404).json({ error: 'Event not found' })
        }
        return res.json(data)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Failed to load attendance' })
    }
}

async function getEventStats(req, res) {
    try {
        const twelveMonthsAgo = new Date()
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
        twelveMonthsAgo.setDate(1)
        twelveMonthsAgo.setHours(0, 0, 0, 0)

        const VolunteeringEvent = mongoose.model('volunteering_event')

        const [monthlyHours, topEvents] = await Promise.all([
            EventRegistration.aggregate([
                { $match: { registeredAt: { $gte: twelveMonthsAgo } } },
                {
                    $group: {
                        _id: { year: { $year: '$registeredAt' }, month: { $month: '$registeredAt' } },
                        hours: { $sum: { $ifNull: ['$hoursCredited', 0] } },
                        registrations: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
                {
                    $project: {
                        _id: 0,
                        month: {
                            $concat: [
                                { $toString: '$_id.year' },
                                '-',
                                { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] },
                            ],
                        },
                        hours: 1,
                        registrations: 1,
                    },
                },
            ]),
            EventRegistration.aggregate([
                {
                    $group: {
                        _id: '$eventId',
                        totalAttended: { $sum: { $cond: ['$attended', 1, 0] } },
                        totalHours: { $sum: { $ifNull: ['$hoursCredited', 0] } },
                    },
                },
                {
                    $lookup: {
                        from: 'volunteering_events',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'event',
                    },
                },
                { $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        eventId: '$_id',
                        name: { $ifNull: ['$event.name', 'Unknown Event'] },
                        totalAttended: 1,
                        totalHours: 1,
                    },
                },
                { $sort: { totalHours: -1 } },
                { $limit: 10 },
            ]),
        ])

        return res.json({ monthlyHours, topEvents })
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' })
    }
}

export {
    createEvent,
    listEvents,
    resolveAttendanceToken,
    registerForEvent,
    createPaidEventOrder,
    capturePaidEventOrder,
    cancelRegistration,
    getEvent,
    updateEvent,
    deleteEvent,
    getUserEventRegistrations,
    getEventStats,
    checkInEvent,
    checkOutEvent,
    getEventAttendanceLink,
    getEventAttendance,
}
