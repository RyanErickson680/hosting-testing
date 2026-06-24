import { Router } from 'express'
import * as controller from 'controllers/volunteering.controller'
import { authenticate, isAdmin } from 'middleware/auth.middleware'

const router = Router()

// Admin analytics (must come before /:id)
router.get('/stats', authenticate, isAdmin, controller.getEventStats)

// General endpoints (no auth required)
router.get('/', controller.listEvents)
router.get('/resolve-attendance-token', controller.resolveAttendanceToken)

// User-specific endpoints (require authentication) — must come before /:id
router.get('/me', authenticate, controller.getUserEventRegistrations)

// Paid event checkout
router.post('/:id/create-order', authenticate, controller.createPaidEventOrder)
router.post('/:id/capture-order', authenticate, controller.capturePaidEventOrder)

// Registration
router.post('/:id/register', authenticate, controller.registerForEvent)
router.delete('/:id/register', authenticate, controller.cancelRegistration)

// Self-service attendance (registered users only)
router.post('/:id/check-in', authenticate, controller.checkInEvent)
router.post('/:id/check-out', authenticate, controller.checkOutEvent)

// Admin: attendance roster for an event
router.get('/:id/attendance', authenticate, isAdmin, controller.getEventAttendance)
router.get('/:id/attendance-link', authenticate, isAdmin, controller.getEventAttendanceLink)

// Single event (after all /static routes to avoid conflicts)
router.get('/:id', controller.getEvent)

// Admin endpoints
router.post('/', authenticate, isAdmin, controller.createEvent)
router.patch('/:id', authenticate, isAdmin, controller.updateEvent)
router.delete('/:id', authenticate, isAdmin, controller.deleteEvent)


export default router
