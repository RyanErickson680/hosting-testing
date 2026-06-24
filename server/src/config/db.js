import mongoose from 'mongoose'

const MONGO_OPTS = {
  maxPoolSize: 10,
  socketTimeoutMS: 45_000,
  serverSelectionTimeoutMS: 10_000,
}

async function connectWithRetry(mongoURI, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await mongoose.connect(mongoURI, MONGO_OPTS)
      return // success
    } catch (err) {
      if (i === attempts) throw err
      const delayMs = 2000 * i
      console.warn(`⚠️  MongoDB connect attempt ${i}/${attempts} failed: ${err.message}. Retrying in ${delayMs}ms...`)
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}

const connectMongo = async () => {
  const mongoURI = process.env.MONGO_URI

  if (!mongoURI) {
    console.error('❌ Missing MONGO_URI environment variable')
    console.error('   Please set MONGO_URI in your server/.env file')
    throw new Error('MONGO_URI not set')
  }

  // Parse the connection string to show what we're connecting to
  try {
    const url = new URL(mongoURI.replace('mongodb://', 'http://').replace('mongodb+srv://', 'https://'))
    const dbName = url.pathname?.replace('/', '') || 'default'
    console.log(`🔌 Connecting to MongoDB...`)
    console.log(`   Database: ${dbName}`)
    console.log(`   Host: ${url.hostname}`)
  } catch {
    console.log(`🔌 Connecting to MongoDB...`)
  }

  await connectWithRetry(mongoURI)

  const db = mongoose.connection
  const dbName = db.db?.databaseName || 'unknown'
  console.log(`✅ Connected to MongoDB`)
  console.log(`   Database: ${dbName}`)
  console.log(`   Ready to accept connections`)

  db.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message)
  })

  db.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected')
  })
}

export default connectMongo
