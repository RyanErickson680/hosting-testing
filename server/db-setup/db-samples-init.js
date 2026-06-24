// Use the mcuf_app database on your mcuf-dev cluster
use("mcuf_app");

// Helper ids so references line up
const volunteerId = ObjectId();
const donorId = ObjectId();
const staffId = ObjectId();

const projectGreenhouseId = ObjectId();
const projectYouthId = ObjectId();
const projectIrrigationId = ObjectId();

const eventWorkdayId = ObjectId();
const eventYouthDayId = ObjectId();
const eventMarketId = ObjectId();


// ---------- users ----------
db.users.insertMany([
  {
    _id: volunteerId,
    isSample: true,
    role: "volunteer",
    firstName: "Alicia",
    lastName: "Nguyen",
    email: "alicia.volunteer@example.org",
    passwordHash: "hash_volunteer",
    contactInfo: {
      phone: "555-000-0001",
      preferredContactMethod: "email"
    },
    volunteerProfile: {
      availability: [
        { day: "Saturday", start: "09:00", end: "13:00" },
        { day: "Wednesday", start: "16:00", end: "18:00" }
      ],
      skills: ["gardening", "harvesting"],
      waiverSigned: true,
      approved: true,
      totalHoursVolunteered: 18.5
    },
    donorProfile: null,
    createdAt: new Date("2025-03-01T10:00:00Z"),
    updatedAt: new Date("2025-03-10T12:00:00Z")
  },
  {
    _id: donorId,
    isSample: true,
    role: "donor",
    firstName: "Brian",
    lastName: "Lopez",
    email: "brian.donor@example.org",
    passwordHash: "hash_donor",
    contactInfo: {
      phone: "555-000-0002",
      preferredContactMethod: "email"
    },
    volunteerProfile: null,
    donorProfile: {
      totalAmountDonated: 350.0,
      recurringDonationCount: 1
    },
    createdAt: new Date("2025-02-15T09:00:00Z"),
    updatedAt: new Date("2025-03-05T09:30:00Z")
  },
  {
    _id: staffId,
    isSample: true,
    role: "staff",
    firstName: "Carla",
    lastName: "Reed",
    email: "carla.staff@example.org",
    passwordHash: "hash_staff",
    contactInfo: {
      phone: "555-000-0003",
      preferredContactMethod: "phone"
    },
    volunteerProfile: null,
    donorProfile: null,
    createdAt: new Date("2025-01-10T08:30:00Z"),
    updatedAt: new Date("2025-03-01T14:45:00Z")
  }
]);


// ---------- projects ----------
db.projects.insertMany([
  {
    _id: projectGreenhouseId,
    isSample: true,
    name: "Greenhouse Construction",
    slug: "greenhouse-construction",
    priority: 1,
    goalAmount: 10000.0,
    currentAmount: 3250.0,
    description: "Build a new greenhouse to extend the growing season.",
    status: "active",
    timeline: {
      startDate: new Date("2025-03-01T00:00:00Z"),
      targetEndDate: new Date("2025-08-31T00:00:00Z")
    },
    currentNeeds: [
      { item: "Lumber", quantity: "40 boards", priority: 1 },
      { item: "Soil bags", quantity: "25 bags", priority: 2 }
    ],
    createdAt: new Date("2025-02-20T10:00:00Z"),
    updatedAt: new Date("2025-03-15T11:00:00Z")
  },
  {
    _id: projectYouthId,
    isSample: true,
    name: "Youth Education Program",
    slug: "youth-education-program",
    priority: 2,
    goalAmount: 5000.0,
    currentAmount: 2200.0,
    description: "Workshops for local youth on urban agriculture and nutrition.",
    status: "active",
    timeline: {
      startDate: new Date("2025-04-01T00:00:00Z"),
      targetEndDate: new Date("2025-10-01T00:00:00Z")
    },
    currentNeeds: [
      { item: "Workshop materials", quantity: "30 kits", priority: 1 }
    ],
    createdAt: new Date("2025-03-05T09:00:00Z"),
    updatedAt: new Date("2025-03-20T09:30:00Z")
  },
  {
    _id: projectIrrigationId,
    isSample: true,
    name: "Irrigation System Upgrade",
    slug: "irrigation-upgrade",
    priority: 3,
    goalAmount: 7500.0,
    currentAmount: 500.0,
    description: "Upgrade drip irrigation to save water and time.",
    status: "proposed",
    timeline: null,
    currentNeeds: [],
    createdAt: new Date("2025-03-18T13:00:00Z"),
    updatedAt: null
  }
]);


// ---------- donations ----------
db.donations.insertMany([
  {
    isSample: true,
    userId: donorId,
    projectId: projectGreenhouseId,
    amount: 150.0,
    currency: "USD",
    donatedAt: new Date("2025-03-01T14:00:00Z"),
    message: "Excited to see the new greenhouse!",
    paymentProvider: "paypal",
    providerTxnId: "PAYPAL-TXN-1001",
    receiptEmailSent: true
  },
  {
    isSample: true,
    userId: donorId,
    projectId: projectYouthId,
    amount: 200.0,
    currency: "USD",
    donatedAt: new Date("2025-03-10T16:30:00Z"),
    message: "Love the youth programming.",
    paymentProvider: "paypal",
    providerTxnId: "PAYPAL-TXN-1002",
    receiptEmailSent: true
  },
  {
    isSample: true,
    userId: donorId,
    projectId: projectGreenhouseId,
    amount: 50.0,
    currency: "USD",
    donatedAt: new Date("2025-03-20T11:15:00Z"),
    message: null,
    paymentProvider: "paypal",
    providerTxnId: "PAYPAL-TXN-1003",
    receiptEmailSent: false
  }
]);


// ---------- recurring_donations ----------
db.recurring_donations.insertMany([
  {
    isSample: true,
    userId: donorId,
    projectId: projectGreenhouseId,
    interval: "monthly",
    amount: 25.0,
    currency: "USD",
    provider: "paypal",
    providerSubscriptionId: "SUB-ABC-001",
    status: "active",
    startDate: new Date("2025-02-01T00:00:00Z"),
    lastChargeDate: new Date("2025-03-01T00:00:00Z"),
    nextChargeDate: new Date("2025-04-01T00:00:00Z")
  },
  {
    isSample: true,
    userId: donorId,
    projectId: projectYouthId,
    interval: "monthly",
    amount: 10.0,
    currency: "USD",
    provider: "paypal",
    providerSubscriptionId: "SUB-ABC-002",
    status: "paused",
    startDate: new Date("2025-01-15T00:00:00Z"),
    lastChargeDate: new Date("2025-02-15T00:00:00Z"),
    nextChargeDate: null
  }
]);


// ---------- events ----------
db.events.insertMany([
  {
    _id: eventWorkdayId,
    isSample: true,
    name: "Saturday Workday",
    description: "General field work: planting, weeding, bed prep.",
    date: new Date("2025-04-12T13:00:00Z"),
    endDate: new Date("2025-04-12T17:00:00Z"),
    skillsNeeded: ["gardening", "lifting"],
    volunteersNeeded: 15,
    location: "Main Field",
    priority: 1,
    waiverRequired: true,
    status: "open",
    currentVolunteerCount: 3,
    createdAt: new Date("2025-03-20T10:00:00Z"),
    updatedAt: new Date("2025-03-25T09:30:00Z")
  },
  {
    _id: eventYouthDayId,
    isSample: true,
    name: "Youth Garden Day",
    description: "Activities with neighborhood youth, teaching planting basics.",
    date: new Date("2025-04-19T14:00:00Z"),
    endDate: new Date("2025-04-19T18:00:00Z"),
    skillsNeeded: ["youth-education", "gardening"],
    volunteersNeeded: 10,
    location: "Education Plot",
    priority: 2,
    waiverRequired: true,
    status: "open",
    currentVolunteerCount: 1,
    createdAt: new Date("2025-03-22T11:00:00Z"),
    updatedAt: null
  },
  {
    _id: eventMarketId,
    isSample: true,
    name: "Farm Stand Market",
    description: "Selling produce and distributing to neighbors.",
    date: new Date("2025-04-05T13:00:00Z"),
    endDate: new Date("2025-04-05T17:00:00Z"),
    skillsNeeded: ["customer-service", "cash-handling"],
    volunteersNeeded: 8,
    location: "Farm Stand",
    priority: 1,
    waiverRequired: true,
    status: "completed",
    currentVolunteerCount: 8,
    createdAt: new Date("2025-03-15T09:00:00Z"),
    updatedAt: new Date("2025-04-06T09:00:00Z")
  }
]);


// ---------- event_registrations ----------
db.event_registrations.insertMany([
  {
    isSample: true,
    eventId: eventWorkdayId,
    userId: volunteerId,
    registeredAt: new Date("2025-03-25T12:00:00Z"),
    attended: null,
    hoursCredited: null,
    notes: "Requested carpool information"
  },
  {
    isSample: true,
    eventId: eventYouthDayId,
    userId: volunteerId,
    registeredAt: new Date("2025-03-28T15:30:00Z"),
    attended: null,
    hoursCredited: null,
    notes: null
  },
  {
    isSample: true,
    eventId: eventMarketId,
    userId: volunteerId,
    registeredAt: new Date("2025-03-30T10:15:00Z"),
    attended: true,
    hoursCredited: 4.0,
    notes: "Helped with setup and teardown"
  }
]);


// ---------- waivers ----------
db.waivers.insertMany([
  {
    isSample: true,
    userId: volunteerId,
    version: "2025-01",
    signedAt: new Date("2025-03-01T12:00:00Z"),
    method: "online",
    signatureData: {
      ipAddress: "203.0.113.10",
      userAgent: "Mozilla/5.0 Sample"
    }
  },
  {
    isSample: true,
    userId: staffId,
    version: "2025-01",
    signedAt: new Date("2025-01-10T09:00:00Z"),
    method: "paper",
    signatureData: null
  }
]);


// ---------- crops ----------
db.crops.insertMany([
  {
    isSample: true,
    name: "kale",
    category: "leafy-greens"
  },
  {
    isSample: true,
    name: "tomato",
    category: "fruiting"
  },
  {
    isSample: true,
    name: "collards",
    category: "leafy-greens"
  }
]);


// ---------- distribution_locations ----------
db.distribution_locations.insertMany([
  {
    isSample: true,
    name: "Farm Stand",
    type: "on-site"
  },
  {
    isSample: true,
    name: "Church Pantry",
    type: "partner"
  },
  {
    isSample: true,
    name: "Community Center",
    type: "partner"
  }
]);


// ---------- inventory_logs ----------
db.inventory_logs.insertMany([
  {
    isSample: true,
    type: "harvest",
    cropType: "kale",
    weightKg: 5.5,
    distributionLocation: null,
    peopleServed: null,
    date: new Date("2025-03-28T14:00:00Z"),
    recordedByUserId: staffId,
    notes: "First spring kale harvest"
  },
  {
    isSample: true,
    type: "distribution",
    cropType: "kale",
    weightKg: 3.0,
    distributionLocation: "Farm Stand",
    peopleServed: 20,
    date: new Date("2025-03-29T16:00:00Z"),
    recordedByUserId: staffId,
    notes: "Market day distribution"
  },
  {
    isSample: true,
    type: "harvest",
    cropType: "tomato",
    weightKg: 8.2,
    distributionLocation: null,
    peopleServed: null,
    date: new Date("2025-07-10T15:30:00Z"),
    recordedByUserId: staffId,
    notes: "Mid-season tomato harvest"
  },
  {
    isSample: true,
    type: "distribution",
    cropType: "tomato",
    weightKg: 4.0,
    distributionLocation: "Church Pantry",
    peopleServed: 30,
    date: new Date("2025-07-11T10:00:00Z"),
    recordedByUserId: staffId,
    notes: "Pantry drop-off"
  }
]);

db.subscriptions.insertOne({
    email: "test@example.org",
    status: "subscribed",  // Must be "subscribed" or "unsubscribed"
    createdAt: new Date(),  // ✅ Must be Date object, NOT a string
    userId: null,  // ✅ null is allowed for userId
    updatedAt: null,  // ✅ null is allowed for updatedAt
    isSample: true  // Optional, but if present must be boolean
  });
// ---------- subscriptions ----------
db.subscriptions.insertMany([
  {
    isSample: true,
    userId: donorId,
    email: "brian.donor@example.org",
    lists: ["general", "fundraising"],
    mailchimpSubscriberId: "MC-001",
    status: "subscribed",
    createdAt: new Date("2025-02-15T09:05:00Z"),
    updatedAt: new Date("2025-03-01T09:05:00Z")
  },
  {
    isSample: true,
    userId: volunteerId,
    email: "alicia.volunteer@example.org",
    lists: ["general", "volunteer"],
    mailchimpSubscriberId: "MC-002",
    status: "subscribed",
    createdAt: new Date("2025-03-01T10:05:00Z"),
    updatedAt: new Date("2025-03-01T10:05:00Z")
  },
  {
    isSample: true,
    userId: staffId,
    email: "carla.staff@example.org",
    lists: ["general"],
    mailchimpSubscriberId: "MC-003",
    status: "unsubscribed",
    createdAt: new Date("2025-03-05T12:10:00Z"),
    updatedAt: new Date("2025-03-20T12:10:00Z")
  }
]);

"Inserted sample documents into all collections.";