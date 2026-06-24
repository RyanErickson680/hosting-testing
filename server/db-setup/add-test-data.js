/**
 * Add synthetic test data for donation campaigns
 * Creates 3 new projects with 4-7 donations each
 * Dates: 10-15-2025 to 02-06-2026
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import mongoose from 'mongoose'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from server/.env
dotenv.config({ path: join(__dirname, '../.env') })

// Helper function to generate random date between two dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper function to generate slug from name
function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Date range: 10-15-2025 to 02-06-2026
const startDate = new Date('2025-10-15')
const endDate = new Date('2026-02-06')

const addTestData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGO_URI)
    const db = mongoose.connection.db
    console.log('✅ Connected to MongoDB')
    console.log(`   Database: ${db.databaseName}\n`)

    const usersCollection = db.collection('users')
    const projectsCollection = db.collection('projects')
    const donationsCollection = db.collection('donations')

    console.log('📊 Creating synthetic test data...\n')

    // Get or create test users
    const testUsers = []
    const userEmails = [
      'sarah.chen@example.com',
      'michael.rodriguez@example.com',
      'emily.johnson@example.com',
      'david.kim@example.com',
      'jennifer.martinez@example.com',
      'robert.williams@example.com',
      'lisa.anderson@example.com',
    ]

    for (const email of userEmails) {
      let user = await usersCollection.findOne({ email })
      if (!user) {
        const names = email.split('@')[0].split('.')
        const userDoc = {
          email,
          role: 'user',
          firstName: names[0].charAt(0).toUpperCase() + names[0].slice(1),
          lastName: names[1].charAt(0).toUpperCase() + names[1].slice(1),
          donorProfile: {
            totalAmountDonated: 0,
            recurringDonationCount: 0,
          },
          createdAt: randomDate(startDate, endDate),
        }
        const result = await usersCollection.insertOne(userDoc)
        user = { _id: result.insertedId, ...userDoc }
        console.log(`✅ Created user: ${user.firstName} ${user.lastName}`)
      } else {
        console.log(`ℹ️  User already exists: ${user.firstName} ${user.lastName}`)
      }
      testUsers.push(user)
    }

    // Project 1: Community Kitchen Renovation
    const project1Doc = {
      name: 'Community Kitchen Renovation',
      slug: 'community-kitchen-renovation',
      description: 'Renovate and expand our community kitchen to support meal preparation for local families. This includes new appliances, counter space, and storage solutions.',
      priority: 1,
      goalAmount: 25000,
      currentAmount: 0,
      status: 'active',
      timeline: {
        startDate: new Date('2025-11-01'),
        targetEndDate: new Date('2026-03-31'),
      },
      currentNeeds: [
        { item: 'Commercial Refrigerator', quantity: '1 unit', priority: 1 },
        { item: 'Stainless Steel Countertops', quantity: '20 linear feet', priority: 2 },
        { item: 'Storage Shelving', quantity: '15 units', priority: 3 },
      ],
      createdAt: new Date('2025-10-20'),
      updatedAt: new Date('2025-10-20'),
    }
    const project1Result = await projectsCollection.insertOne(project1Doc)
    const project1 = { _id: project1Result.insertedId, ...project1Doc }
    console.log(`\n✅ Created project: ${project1.name}`)

    // Donations for Project 1
    const project1Donations = [
      { amount: 500, message: 'This is such an important project for our community. Happy to support!' },
      { amount: 250, message: 'Looking forward to seeing the renovated kitchen in action!' },
      { amount: 1000, message: 'Kitchens are the heart of any community space. Proud to contribute.' },
      { amount: 150, message: 'Every bit helps! Keep up the great work.' },
      { amount: 750, message: 'This will make such a difference for meal preparation programs.' },
      { amount: 300, message: 'Supporting our neighbors one meal at a time.' },
    ]

    let project1Total = 0
    const project1DonationDocs = []
    for (let i = 0; i < project1Donations.length; i++) {
      const donationData = project1Donations[i]
      const donationDoc = {
        userId: testUsers[i % testUsers.length]._id,
        projectId: project1._id,
        amount: donationData.amount,
        currency: 'USD',
        message: donationData.message,
        donatedAt: randomDate(startDate, endDate),
        paymentStatus: 'completed',
        paymentProvider: 'paypal',
        providerTxnId: `TEST_TXN_${Date.now()}_${i}`,
      }
      project1DonationDocs.push(donationDoc)
      project1Total += donationData.amount
      console.log(`  💰 Donation: $${donationData.amount} - "${donationData.message.substring(0, 50)}..."`)
    }
    await donationsCollection.insertMany(project1DonationDocs)

    // Update project total
    await projectsCollection.updateOne(
      { _id: project1._id },
      { $set: { currentAmount: project1Total } }
    )
    console.log(`  📊 Project total: $${project1Total.toLocaleString()}\n`)

    // Project 2: Solar Panel Installation
    const project2Doc = {
      name: 'Solar Panel Installation',
      slug: 'solar-panel-installation',
      description: 'Install solar panels to reduce energy costs and make our operations more sustainable. This will help us allocate more funds directly to community programs.',
      priority: 2,
      goalAmount: 35000,
      currentAmount: 0,
      status: 'active',
      timeline: {
        startDate: new Date('2025-12-01'),
        targetEndDate: new Date('2026-05-31'),
      },
      currentNeeds: [
        { item: 'Solar Panels', quantity: '40 panels', priority: 1 },
        { item: 'Inverter System', quantity: '1 unit', priority: 1 },
        { item: 'Installation Labor', quantity: '80 hours', priority: 2 },
      ],
      createdAt: new Date('2025-11-10'),
      updatedAt: new Date('2025-11-10'),
    }
    const project2Result = await projectsCollection.insertOne(project2Doc)
    const project2 = { _id: project2Result.insertedId, ...project2Doc }
    console.log(`✅ Created project: ${project2.name}`)

    // Donations for Project 2
    const project2Donations = [
      { amount: 2000, message: 'Sustainability is crucial for our future. Proud to support green energy!' },
      { amount: 500, message: 'Reducing energy costs means more money for programs. Great initiative!' },
      { amount: 1500, message: 'This is exactly the kind of forward-thinking project we need.' },
      { amount: 300, message: 'Every step toward sustainability matters. Thank you for leading the way.' },
      { amount: 1000, message: 'Solar power will make such a difference for long-term operations.' },
      { amount: 750, message: 'Supporting environmental responsibility in our community.' },
      { amount: 250, message: 'Small contribution, big impact on sustainability!' },
    ]

    let project2Total = 0
    const project2DonationDocs = []
    for (let i = 0; i < project2Donations.length; i++) {
      const donationData = project2Donations[i]
      const donationDoc = {
        userId: testUsers[(i + 2) % testUsers.length]._id,
        projectId: project2._id,
        amount: donationData.amount,
        currency: 'USD',
        message: donationData.message,
        donatedAt: randomDate(startDate, endDate),
        paymentStatus: 'completed',
        paymentProvider: 'paypal',
        providerTxnId: `TEST_TXN_${Date.now()}_${i + 10}`,
      }
      project2DonationDocs.push(donationDoc)
      project2Total += donationData.amount
      console.log(`  💰 Donation: $${donationData.amount} - "${donationData.message.substring(0, 50)}..."`)
    }
    await donationsCollection.insertMany(project2DonationDocs)

    // Update project total
    await projectsCollection.updateOne(
      { _id: project2._id },
      { $set: { currentAmount: project2Total } }
    )
    console.log(`  📊 Project total: $${project2Total.toLocaleString()}\n`)

    // Project 3: Educational Garden Expansion
    const project3Doc = {
      name: 'Educational Garden Expansion',
      slug: 'educational-garden-expansion',
      description: 'Expand our educational garden to include more hands-on learning spaces for children and adults. This includes raised beds, signage, and interactive learning stations.',
      priority: 3,
      goalAmount: 15000,
      currentAmount: 0,
      status: 'active',
      timeline: {
        startDate: new Date('2026-01-15'),
        targetEndDate: new Date('2026-06-30'),
      },
      currentNeeds: [
        { item: 'Raised Garden Beds', quantity: '12 units', priority: 1 },
        { item: 'Educational Signage', quantity: '20 signs', priority: 2 },
        { item: 'Soil and Compost', quantity: '50 cubic yards', priority: 1 },
        { item: 'Seeds and Seedlings', quantity: '200 varieties', priority: 2 },
      ],
      createdAt: new Date('2025-12-05'),
      updatedAt: new Date('2025-12-05'),
    }
    const project3Result = await projectsCollection.insertOne(project3Doc)
    const project3 = { _id: project3Result.insertedId, ...project3Doc }
    console.log(`✅ Created project: ${project3.name}`)

    // Donations for Project 3
    const project3Donations = [
      { amount: 400, message: 'Education is key! This garden will teach so many people about growing food.' },
      { amount: 200, message: 'Love the idea of hands-on learning for kids and adults alike.' },
      { amount: 600, message: 'Educational gardens create lasting impact. Happy to contribute!' },
      { amount: 150, message: 'Can\'t wait to see the expanded garden and all the learning it will enable.' },
      { amount: 350, message: 'Supporting education and food security - what a perfect combination!' },
    ]

    let project3Total = 0
    const project3DonationDocs = []
    for (let i = 0; i < project3Donations.length; i++) {
      const donationData = project3Donations[i]
      const donationDoc = {
        userId: testUsers[(i + 4) % testUsers.length]._id,
        projectId: project3._id,
        amount: donationData.amount,
        currency: 'USD',
        message: donationData.message,
        donatedAt: randomDate(startDate, endDate),
        paymentStatus: 'completed',
        paymentProvider: 'paypal',
        providerTxnId: `TEST_TXN_${Date.now()}_${i + 20}`,
      }
      project3DonationDocs.push(donationDoc)
      project3Total += donationData.amount
      console.log(`  💰 Donation: $${donationData.amount} - "${donationData.message.substring(0, 50)}..."`)
    }
    await donationsCollection.insertMany(project3DonationDocs)

    // Update project total
    await projectsCollection.updateOne(
      { _id: project3._id },
      { $set: { currentAmount: project3Total } }
    )
    console.log(`  📊 Project total: $${project3Total.toLocaleString()}\n`)

    // Update user donor profiles
    console.log('📈 Updating user donor profiles...')
    for (const user of testUsers) {
      const userDonations = await donationsCollection.find({ userId: user._id }).toArray()
      const totalDonated = userDonations.reduce((sum, d) => sum + d.amount, 0)
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { 'donorProfile.totalAmountDonated': totalDonated } }
      )
    }

    console.log('\n✅ Test data creation complete!')
    console.log('\n📊 Summary:')
    console.log(`   - Projects created: 3`)
    console.log(`   - Total donations: ${project1Donations.length + project2Donations.length + project3Donations.length}`)
    console.log(`   - Project 1 total: $${project1Total.toLocaleString()}`)
    console.log(`   - Project 2 total: $${project2Total.toLocaleString()}`)
    console.log(`   - Project 3 total: $${project3Total.toLocaleString()}`)
    console.log(`   - Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`)

    await mongoose.connection.close()
    console.log('\n🔌 MongoDB connection closed')
  } catch (error) {
    console.error('❌ Error creating test data:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

addTestData()
