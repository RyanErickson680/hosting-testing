import 'dotenv/config'
import validateEnv from 'config/validateEnv'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import mongoConnect from 'config/db'
import rootRouter from 'routes'
import equipmentRouter from 'routes/equipment.route'
import webhookRoutes from 'routes/webhook.route'
import feedbackRouter from 'routes/feedback.route'
import wishlistRouter from 'routes/wishlist.route'
import volunteeringRoutes from 'routes/volunteering.route'
import * as volunteeringService from 'services/volunteering.service'

// Validate environment variables before anything else
validateEnv()

const app = express()
const DEFAULT_PORT = 8080
const hasExplicitPort = Boolean(process.env.PORT)
const preferredPort = hasExplicitPort ? Number(process.env.PORT) : DEFAULT_PORT

if (
  !Number.isInteger(preferredPort) ||
  preferredPort < 0 ||
  preferredPort > 65535
) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`)
}

const listen = async (port) =>
  new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(server))

    server.once('error', async (error) => {
      if (error.code === 'EADDRINUSE' && hasExplicitPort) {
        reject(
          new Error(
            `Port ${port} is already in use. Stop the other process or change PORT.`
          )
        )
        return
      }

      if (error.code === 'EADDRINUSE') {
        try {
          const fallbackPort = port + 1
          console.warn(
            `Port ${port} is already in use, retrying on ${fallbackPort}...`
          )
          resolve(await listen(fallbackPort))
          return
        } catch (fallbackError) {
          reject(fallbackError)
          return
        }
      }

      reject(error)
    })
  })

// Trust Render's proxy (required for express-rate-limit and secure cookies)
app.set('trust proxy', 1)

const defaultDevOrigins = ['http://localhost:5173', 'http://localhost:5174']
const configuredOrigins = [process.env.CLIENT_URL, process.env.CLIENT_URL_ALT]
  .filter(Boolean)
  .map((origin) => String(origin).replace(/\/$/, ''))
const allowedOrigins = [
  ...new Set(
    process.env.NODE_ENV === 'development'
      ? [...configuredOrigins, ...defaultDevOrigins]
      : configuredOrigins
  ),
]

// Middlewares
app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g., curl, Postman) with no Origin header.
      if (!origin) return callback(null, true)
      const normalizedOrigin = String(origin).replace(/\/$/, '')
      if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true)
      return callback(
        new Error(`CORS blocked for origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`)
      )
    },
    optionsSuccessStatus: 200,
    credentials: true,
  })
)
app.use(bodyParser.json({ limit: '1mb' }))
app.use(bodyParser.urlencoded({ extended: false, limit: '1mb' }))
app.use(cookieParser())

// set up api routes
app.use('/api', rootRouter)
app.use('/api/equipment', equipmentRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/wishlist', wishlistRouter)
app.use('/api/webhooks', webhookRoutes) // PayPal webhooks (public endpoint)
app.use('/api/events', volunteeringRoutes)

// 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

const startServer = async () => {
  await mongoConnect()

  await volunteeringService.syncExpiredEventStatuses().catch((error) => {
    console.error('Initial volunteering status sync failed:', error)
  })

  await volunteeringService.send24HourEventReminders().catch((error) => {
    console.error('Initial 24-hour reminder run failed:', error)
  })

  // Use recursive setTimeout so each tick waits for the previous one to finish,
  // preventing overlap if the task takes longer than the interval.
  const timerIds = []

  const scheduleRecurring = (fn, intervalMs) => {
    let timerId
    const tick = async () => {
      try {
        await fn()
      } catch (error) {
        console.error(`Recurring task error (${fn.name}):`, error)
      } finally {
        timerId = setTimeout(tick, intervalMs)
        timerIds.push(timerId)
      }
    }
    timerId = setTimeout(tick, intervalMs)
    timerIds.push(timerId)
  }

  scheduleRecurring(volunteeringService.syncExpiredEventStatuses, 60 * 1000)
  scheduleRecurring(volunteeringService.send24HourEventReminders, 15 * 60 * 1000)

  const server = await listen(preferredPort)
  const actualPort = server.address()?.port

  console.log(`node env: ${process.env.NODE_ENV}`)
  console.log(`server listening on port ${actualPort}`)

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`)
    server.close(async () => {
      timerIds.forEach(clearTimeout)
      await mongoose.disconnect()
      process.exit(0)
    })
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

startServer().catch((error) => {
  console.error('Server startup failed:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})
