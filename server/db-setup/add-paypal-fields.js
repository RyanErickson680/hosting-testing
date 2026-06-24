/**
 * Migration Script: Add PayPal Fields to Existing Donations
 * 
 * This script adds default values for new PayPal fields to existing donation records.
 * Run this once after updating the donation model schema.
 * 
 * Usage: node db-setup/add-paypal-fields.js
 */

import 'dotenv/config'
import mongoose from 'mongoose'

const updateDonations = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGO_URI)
    const db = mongoose.connection.db

    console.log('✅ Connected to MongoDB')
    console.log(`   Database: ${db.databaseName}\n`)

    const donationsCollection = db.collection('donations')

    // Count existing donations
    const totalDonations = await donationsCollection.countDocuments()
    console.log(`📊 Found ${totalDonations} donations in collection\n`)

    if (totalDonations === 0) {
      console.log('✅ No donations to update. Migration complete.')
      await mongoose.connection.close()
      return
    }

    // Update donations that don't have paymentStatus field
    const result = await donationsCollection.updateMany(
      { paymentStatus: { $exists: false } },
      {
        $set: {
          paymentStatus: 'completed', // Assume existing donations are completed
          paypalOrderId: null,
          paypalPayerId: null,
        },
      }
    )

    console.log(`✅ Updated ${result.modifiedCount} donation(s)`)
    console.log(`   - Added paymentStatus: 'completed'`)
    console.log(`   - Added paypalOrderId: null`)
    console.log(`   - Added paypalPayerId: null\n`)

    // Verify update
    const updatedCount = await donationsCollection.countDocuments({
      paymentStatus: { $exists: true },
    })
    console.log(`✅ Verification: ${updatedCount} donations now have paymentStatus field`)

    if (updatedCount === totalDonations) {
      console.log('✅ Migration successful! All donations updated.\n')
    } else {
      console.log(`⚠️  Warning: ${totalDonations - updatedCount} donations still missing paymentStatus\n`)
    }

    await mongoose.connection.close()
    console.log('🔌 MongoDB connection closed')
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  }
}

updateDonations()
