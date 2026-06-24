/**
 * Validates that all required environment variables are set at startup.
 * Call this before starting the server to fail fast with a clear error.
 */
const validateEnv = () => {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'CLIENT_URL',
  ]

  const optional = [
    'PORT',
    'NODE_ENV',
    'JWT_EXPIRES_IN',
    'EMAIL_SERVICE',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'EMAIL_FROM',
    'ORG_NAME',         // defaults to 'Mill Creek Urban Farm'
    'ORG_EMAIL_TEAM',   // defaults to '<ORG_NAME> Team'
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_MODE',
    'PAYPAL_PRODUCT_ID',
    'PAYPAL_WEBHOOK_ID',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (process.env.NODE_ENV === 'production' && !process.env.PAYPAL_WEBHOOK_ID) {
    if (!missing.includes('PAYPAL_WEBHOOK_ID')) missing.push('PAYPAL_WEBHOOK_ID')
  }

  if (missing.length > 0) {
    console.error('=== MISSING REQUIRED ENVIRONMENT VARIABLES ===')
    missing.forEach((key) => console.error(`  - ${key}`))
    console.error('Server cannot start without these. Check your .env file.')
    process.exit(1)
  }

  // Warn about missing optional vars that affect functionality (production-required vars excluded)
  const optionalForWarn = optional.filter((key) => key !== 'PAYPAL_WEBHOOK_ID')
  const missingOptional = optionalForWarn.filter((key) => !process.env[key])
  if (missingOptional.length > 0) {
    console.warn('=== MISSING OPTIONAL ENVIRONMENT VARIABLES ===')
    missingOptional.forEach((key) => console.warn(`  - ${key}`))
    console.warn('Some features may not work without these.')
  }

  if (process.env.NODE_ENV !== 'production' && !process.env.PAYPAL_WEBHOOK_ID) {
    console.warn(
      '=== PAYPAL WEBHOOKS (non-production) ===\n' +
        '  PAYPAL_WEBHOOK_ID is not set. Webhook POSTs will return 503 until you add it (use the sandbox webhook ID from the PayPal developer dashboard).',
    )
  }
}

export default validateEnv
