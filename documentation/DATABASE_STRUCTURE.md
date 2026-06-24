# MCUF Database Structure Documentation

**Database:** `mcuf_app`

This document describes the complete database schema, including all collections, document structures, required fields, and indexes.

---

## Table of Contents

1. [users](#1-users)
2. [projects](#2-projects)
3. [donations](#3-donations)
4. [recurring_donations](#4-recurring_donations)
5. [events](#5-events)
6. [event_registrations](#6-event_registrations)
7. [waivers](#7-waivers)
8. [inventory_logs](#8-inventory_logs)
9. [crops](#9-crops)
10. [distribution_locations](#10-distribution_locations)
11. [subscriptions](#11-subscriptions)

---

## 1. users

**Description:** Stores user accounts with role-based profiles (admin, staff, volunteer, donor).

### Required Fields
- `email` (string) - User email (unique)
- `role` (string) - Must be one of: `"admin"`, `"staff"`, `"volunteer"`, `"donor"`
- `firstName` (string)
- `lastName` (string)
- `createdAt` (date)

### Optional Fields
- `passwordHash` (string) - Hashed password
- `contactInfo` (object)
  - `phone` (string)
  - `preferredContactMethod` (string)
- `volunteerProfile` (object | null)
  - `availability` (array of objects)
    - `day` (string)
    - `start` (string)
    - `end` (string)
  - `skills` (array of strings)
  - `waiverSigned` (bool)
  - `approved` (bool)
  - `totalHoursVolunteered` (double)
- `donorProfile` (object | null)
  - `totalAmountDonated` (double)
  - `recurringDonationCount` (double | int | null)
- `updatedAt` (date | null)

### Indexes
- `email` (unique)
- `role`
- `volunteerProfile.approved`

### Example Document
```javascript
{
  _id: ObjectId("..."),
  email: "user@example.org",
  role: "volunteer",
  firstName: "John",
  lastName: "Doe",
  passwordHash: "hashed_password",
  contactInfo: {
    phone: "555-1234",
    preferredContactMethod: "email"
  },
  volunteerProfile: {
    availability: [
      { day: "Saturday", start: "09:00", end: "13:00" }
    ],
    skills: ["gardening", "harvesting"],
    waiverSigned: true,
    approved: true,
    totalHoursVolunteered: 18.5
  },
  donorProfile: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-15")
}
```

---

## 2. projects

**Description:** Stores fundraising projects and initiatives.

### Required Fields
- `name` (string)
- `description` (string | null)
- `priority` (double | int | null)
- `goalAmount` (double)
- `status` (string) - Must be one of: `"active"`, `"completed"`, `"proposed"`
- `createdAt` (date)

### Optional Fields
- `slug` (string)
- `currentAmount` (double | null)
- `timeline` (object | null)
  - `startDate` (date)
  - `targetEndDate` (date)
- `currentNeeds` (array of objects)
  - `item` (string)
  - `quantity` (string)
  - `priority` (double | int | null)
- `updatedAt` (date | null)

### Indexes
- `priority` + `status` (compound)
- `status`
- `slug` (unique)

### Example Document
```javascript
{
  _id: ObjectId("..."),
  name: "Community Garden Expansion",
  slug: "community-garden-expansion",
  description: "Expanding our community garden to serve more families",
  priority: 1,
  goalAmount: 50000.0,
  currentAmount: 25000.0,
  status: "active",
  timeline: {
    startDate: new Date("2025-03-01"),
    targetEndDate: new Date("2025-06-30")
  },
  currentNeeds: [
    { item: "Seeds", quantity: "100 packets", priority: 1 }
  ],
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-15")
}
```

---

## 3. donations

**Description:** Records one-time donations from donors to projects.

### Required Fields
- `userId` (objectId) - Reference to users collection
- `projectId` (objectId) - Reference to projects collection
- `amount` (double)
- `currency` (string)
- `donatedAt` (date)

### Optional Fields
- `message` (string | null)
- `paymentProvider` (string)
- `providerTxnId` (string)
- `receiptEmailSent` (bool)

### Indexes
- `userId` + `donatedAt` (compound, descending on date)
- `projectId`

### Example Document
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  projectId: ObjectId("..."),
  amount: 100.0,
  currency: "USD",
  donatedAt: new Date("2025-01-15"),
  message: "Happy to support!",
  paymentProvider: "stripe",
  providerTxnId: "txn_123456",
  receiptEmailSent: true
}
```

---

## 4. recurring_donations

**Description:** Manages recurring donation subscriptions.

### Required Fields
- `userId` (objectId) - Reference to users collection
- `projectId` (objectId) - Reference to projects collection
- `interval` (string) - Must be one of: `"weekly"`, `"monthly"`, `"yearly"`
- `amount` (double)
- `currency` (string)
- `status` (string) - Must be one of: `"active"`, `"paused"`, `"cancelled"`

### Optional Fields
- `provider` (string)
- `providerSubscriptionId` (string)
- `startDate` (date)
- `lastChargeDate` (date | null)
- `nextChargeDate` (date | null)

### Indexes
- `userId` + `status` (compound)
- `projectId` + `status` (compound)

### Example Document
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  projectId: ObjectId("..."),
  interval: "monthly",
  amount: 25.0,
  currency: "USD",
  status: "active",
  provider: "stripe",
  providerSubscriptionId: "sub_123456",
  startDate: new Date("2025-01-01"),
  lastChargeDate: new Date("2025-01-01"),
  nextChargeDate: new Date("2025-02-01")
}
```

---

## 5. events

**Description:** Tracks volunteer events and activities.

### Required Fields
- `name` (string)
- `date` (date)
- `status` (string) - Must be one of: `"open"`, `"full"`, `"completed"`, `"cancelled"`
- `createdAt` (date)

### Optional Fields
- `description` (string | null)
- `endDate` (date | null)
- `skillsNeeded` (array of strings)
- `volunteersNeeded` (double | int | null)
- `location` (string | null)
- `priority` (double | int | null)
- `waiverRequired` (bool)
- `currentVolunteerCount` (double | int | null)
- `updatedAt` (date | null)

### Indexes
- `date`
- `status` + `date` (compound)
- `priority` + `date` (compound)

### Example Document
```javascript
{
  _id: ObjectId("..."),
  name: "Community Harvest Day",
  description: "Help harvest vegetables for distribution",
  date: new Date("2025-03-15"),
  endDate: new Date("2025-03-15"),
  skillsNeeded: ["gardening", "harvesting"],
  volunteersNeeded: 10,
  location: "Main Garden",
  priority: 1,
  waiverRequired: true,
  status: "open",
  currentVolunteerCount: 5,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-15")
}
```

---

## 6. event_registrations

**Description:** Records volunteer registrations for events.

### Required Fields
- `eventId` (objectId) - Reference to events collection
- `userId` (objectId) - Reference to users collection
- `registeredAt` (date)

### Optional Fields
- `attended` (bool | null)
- `hoursCredited` (double | null)
- `notes` (string | null)

### Indexes
- `userId` + `eventId` (compound, unique) - Ensures one registration per user per event
- `eventId`
- `userId`

### Example Document
```javascript
{
  _id: ObjectId("..."),
  eventId: ObjectId("..."),
  userId: ObjectId("..."),
  registeredAt: new Date("2025-01-10"),
  attended: true,
  hoursCredited: 4.0,
  notes: "Great event!"
}
```

---

## 7. waivers

**Description:** Tracks signed waivers by users.

### Required Fields
- `userId` (objectId) - Reference to users collection
- `version` (string) - Waiver version identifier
- `signedAt` (date)

### Optional Fields
- `method` (string)
- `signatureData` (object | null)
  - `ipAddress` (string)
  - `userAgent` (string)

### Indexes
- `userId` + `signedAt` (compound, descending on date)

### Example Document
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  version: "2025-01",
  signedAt: new Date("2025-01-05"),
  method: "digital",
  signatureData: {
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0..."
  }
}
```

---

## 8. inventory_logs

**Description:** Logs harvest and distribution activities.

### Required Fields
- `type` (string) - Must be one of: `"harvest"`, `"distribution"`
- `cropType` (string)
- `date` (date)

### Optional Fields
- `weightKg` (double | null)
- `distributionLocation` (string | null)
- `peopleServed` (double | int | null)
- `recordedByUserId` (objectId | null) - Reference to users collection
- `notes` (string | null)

### Indexes
- `date` (descending)
- `cropType` + `date` (compound, descending on date)
- `type` + `date` (compound, descending on date)
- `distributionLocation` + `date` (compound, descending on date)

### Example Document
```javascript
{
  _id: ObjectId("..."),
  type: "harvest",
  cropType: "Tomatoes",
  weightKg: 150.5,
  date: new Date("2025-03-10"),
  recordedByUserId: ObjectId("..."),
  notes: "Excellent harvest this week"
}
```

---

## 9. crops

**Description:** Lookup table for crop types and categories.

### Required Fields
- `name` (string)

### Optional Fields
- `category` (string | null)

### Indexes
- `name` (unique)

### Example Document
```javascript
{
  _id: ObjectId("..."),
  name: "Tomatoes",
  category: "Vegetables"
}
```

---

## 10. distribution_locations

**Description:** Lookup table for distribution locations.

### Required Fields
- `name` (string)

### Optional Fields
- `type` (string | null) - e.g., `"on-site"`, `"partner"`

### Indexes
- `name` (unique)

### Example Document
```javascript
{
  _id: ObjectId("..."),
  name: "Community Center",
  type: "on-site"
}
```

---

## 11. subscriptions

**Description:** Email subscription management (e.g., newsletter subscriptions).

### Required Fields
- `email` (string)
- `status` (string) - Must be one of: `"subscribed"`, `"unsubscribed"`
- `createdAt` (date)

### Optional Fields
- `userId` (objectId | null) - Reference to users collection
- `lists` (array of strings) - Subscription list names
- `mailchimpSubscriberId` (string | null)
- `updatedAt` (date | null)

### Indexes
- `email`
- `status`

### Example Document
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  email: "subscriber@example.org",
  lists: ["newsletter", "events"],
  mailchimpSubscriberId: "mc_123456",
  status: "subscribed",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-15")
}
```

---

## Data Type Reference

### BSON Types Used
- **string**: Text values
- **date**: Date/time values (use `new Date()` in JavaScript)
- **double**: Floating-point numbers
- **int**: Integer numbers
- **bool**: Boolean values (`true` or `false`)
- **objectId**: MongoDB ObjectId references
- **array**: Lists of values
- **object**: Nested objects
- **null**: Null values (when allowed)

### Important Notes

1. **Date Fields**: Always use `new Date()` or `new Date("ISO-string")` for date fields. Do not use strings.

2. **Enum Fields**: Fields with enum constraints must match exactly (case-sensitive).

3. **Nullable Fields**: Fields that allow `null` can be omitted or set to `null`, but cannot be `undefined`.

4. **ObjectId References**: Use `ObjectId("...")` or let MongoDB generate them automatically.

5. **Validation Level**: Currently set to `"off"` for all collections. Change to `"moderate"` or `"strict"` to enable validation.

---

## Index Summary

| Collection | Indexes |
|------------|---------|
| users | `email` (unique), `role`, `volunteerProfile.approved` |
| projects | `priority + status`, `status`, `slug` (unique) |
| donations | `userId + donatedAt`, `projectId` |
| recurring_donations | `userId + status`, `projectId + status` |
| events | `date`, `status + date`, `priority + date` |
| event_registrations | `userId + eventId` (unique), `eventId`, `userId` |
| waivers | `userId + signedAt` |
| inventory_logs | `date`, `cropType + date`, `type + date`, `distributionLocation + date` |
| crops | `name` (unique) |
| distribution_locations | `name` (unique) |
| subscriptions | `email`, `status` |

---

*Last Updated: Based on mcuf-db-setup.js*

