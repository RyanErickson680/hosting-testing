import { Router } from 'express'
import { handlePayPalWebhook } from 'controllers/webhook.controller'

const webhookRouter = Router()

// PayPal webhook endpoint (no auth cookie — verified via PayPal signature using PAYPAL_WEBHOOK_ID)
webhookRouter.post('/paypal', handlePayPalWebhook)

export default webhookRouter
