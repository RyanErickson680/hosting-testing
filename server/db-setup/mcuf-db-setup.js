// ---------- Select database ----------
// Make sure your playground is connected to the *mcuf-dev* cluster.
// This just selects/creates the mcuf_app database on that cluster.
use("mcuf_app");


// ---------- 1. users collection ----------
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "role", "firstName", "lastName", "createdAt"],
      properties: {
        email: { bsonType: "string", description: "User email (unique)" },
        role: {
          bsonType: "string",
          enum: ["admin", "staff", "volunteer", "donor"],
          description: "Role of the user"
        },
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" },
        passwordHash: { bsonType: "string", description: "Hashed password" },
        contactInfo: {
          bsonType: "object",
          properties: {
            phone: { bsonType: "string" },
            preferredContactMethod: { bsonType: "string" }
          }
        },
        volunteerProfile: {
          bsonType: ["object", "null"],
          properties: {
            availability: {
              bsonType: "array",
              items: {
                bsonType: "object",
                properties: {
                  day: { bsonType: "string" },
                  start: { bsonType: "string" },
                  end: { bsonType: "string" }
                }
              }
            },
            skills: {
              bsonType: "array",
              items: { bsonType: "string" }
            },
            waiverSigned: { bsonType: "bool" },
            approved: { bsonType: "bool" },
            totalHoursVolunteered: { bsonType: "double" }
          }
        },
        donorProfile: {
          bsonType: ["object", "null"],
          properties: {
            totalAmountDonated: { bsonType: "double" },
            recurringDonationCount: { bsonType: ["double", "int", "null"] }
          }
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  },
  validationLevel: "off"
});

// Indexes for users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ "volunteerProfile.approved": 1 });


// ---------- 2. projects collection ----------
db.createCollection("projects", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "description", "priority", "goalAmount", "status", "createdAt"],
      properties: {
        name: { bsonType: "string" },
        slug: { bsonType: "string" },
        priority: { bsonType: ["double", "int", "null"] },
        goalAmount: { bsonType: "double" },
        currentAmount: { bsonType: ["double", "null"] },
        description: { bsonType: ["string", "null"] },
        status: {
          bsonType: "string",
          enum: ["active", "completed", "proposed"]
        },
        timeline: {
          bsonType: ["object", "null"],
          properties: {
            startDate: { bsonType: "date" },
            targetEndDate: { bsonType: "date" }
          }
        },
        currentNeeds: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              item: { bsonType: "string" },
              quantity: { bsonType: "string" },
              priority: { bsonType: ["double", "int", "null"] }
            }
          }
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  },
  validationLevel: "off"
});

// Indexes for projects
db.projects.createIndex({ priority: 1, status: 1 });
db.projects.createIndex({ status: 1 });
db.projects.createIndex({ slug: 1 }, { unique: true });


// ---------- 3. donations collection ----------
db.createCollection("donations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "projectId", "amount", "currency", "donatedAt"],
      properties: {
        userId: { bsonType: "objectId" },
        projectId: { bsonType: "objectId" },
        amount: { bsonType: "double" },
        currency: { bsonType: "string" },
        donatedAt: { bsonType: "date" },
        message: { bsonType: ["string", "null"] },
        paymentProvider: { bsonType: "string" },
        providerTxnId: { bsonType: "string" },
        receiptEmailSent: { bsonType: "bool" }
      }
    }
  },
  validationLevel: "off"
});

// Indexes for donations
db.donations.createIndex({ userId: 1, donatedAt: -1 });
db.donations.createIndex({ projectId: 1 });


// ---------- 4. recurring_donations collection ----------
db.createCollection("recurring_donations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "projectId", "interval", "amount", "currency", "status"],
      properties: {
        userId: { bsonType: "objectId" },
        projectId: { bsonType: "objectId" },
        interval: {
          bsonType: "string",
          enum: ["weekly", "monthly", "yearly"]
        },
        amount: { bsonType: "double" },
        currency: { bsonType: "string" },
        provider: { bsonType: "string" },
        providerSubscriptionId: { bsonType: "string" },
        status: {
          bsonType: "string",
          enum: ["active", "paused", "cancelled"]
        },
        startDate: { bsonType: "date" },
        lastChargeDate: { bsonType: ["date", "null"] },
        nextChargeDate: { bsonType: ["date", "null"] }
      }
    }
  },
  validationLevel: "off"
});

// Indexes for recurring_donations
db.recurring_donations.createIndex({ userId: 1, status: 1 });
db.recurring_donations.createIndex({ projectId: 1, status: 1 });


// ---------- 5. events collection ----------
db.createCollection("events", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "date", "status", "createdAt"],
      properties: {
        name: { bsonType: "string" },
        description: { bsonType: ["string", "null"] },
        date: { bsonType: "date" },
        endDate: { bsonType: ["date", "null"] },
        skillsNeeded: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        volunteersNeeded: { bsonType:["double", "int", "null"] },
        location: { bsonType: ["string", "null"] },
        priority: { bsonType:["double", "int", "null"] },
        waiverRequired: { bsonType: "bool" },
        status: {
          bsonType: "string",
          enum: ["open", "full", "completed", "cancelled"]
        },
        currentVolunteerCount: { bsonType:["double", "int", "null"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  },
  validationLevel: "off"
});

// Indexes for events
db.events.createIndex({ date: 1 });
db.events.createIndex({ status: 1, date: 1 });
db.events.createIndex({ priority: 1, date: 1 });


// ---------- 6. event_registrations collection ----------
db.createCollection("event_registrations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["eventId", "userId", "registeredAt"],
      properties: {
        eventId: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        registeredAt: { bsonType: "date" },
        attended: { bsonType: ["bool", "null"] },
        hoursCredited: { bsonType: ["double", "null"] },
        notes: { bsonType: ["string", "null"] }
      }
    }
  },
  validationLevel: "off"
});

// Indexes for event_registrations
db.event_registrations.createIndex(
  { userId: 1, eventId: 1 },
  { unique: true }
);
db.event_registrations.createIndex({ eventId: 1 });
db.event_registrations.createIndex({ userId: 1 });


// ---------- 7. waivers collection ----------
db.createCollection("waivers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "version", "signedAt"],
      properties: {
        userId: { bsonType: "objectId" },
        version: { bsonType: "string" },
        signedAt: { bsonType: "date" },
        method: { bsonType: "string" },
        signatureData: {
          bsonType: ["object", "null"],
          properties: {
            ipAddress: { bsonType: "string" },
            userAgent: { bsonType: "string" }
          }
        }
      }
    }
  },
  validationLevel: "off"
});

// Indexes for waivers
db.waivers.createIndex({ userId: 1, signedAt: -1 });


// ---------- 8. inventory_logs collection ----------
db.createCollection("inventory_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["type", "cropType", "date"],
      properties: {
        type: {
          bsonType: "string",
          enum: ["harvest", "distribution"]
        },
        cropType: { bsonType: "string" },
        weightKg: { bsonType: ["double", "null"] },
        distributionLocation: { bsonType: ["string", "null"] },
        peopleServed: { bsonType:["double", "int", "null"] },
        date: { bsonType: "date" },
        recordedByUserId: { bsonType: ["objectId", "null"] },
        notes: { bsonType: ["string", "null"] }
      }
    }
  },
  validationLevel: "off"
});

// Indexes for inventory_logs
db.inventory_logs.createIndex({ date: -1 });
db.inventory_logs.createIndex({ cropType: 1, date: -1 });
db.inventory_logs.createIndex({ type: 1, date: -1 });
db.inventory_logs.createIndex({ distributionLocation: 1, date: -1 });


// ---------- 9. crops collection (lookup) ----------
db.createCollection("crops", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name"],
      properties: {
        name: { bsonType: "string" },
        category: { bsonType: ["string", "null"] }
      }
    }
  },
  validationLevel: "off"
});

// Indexes for crops
db.crops.createIndex({ name: 1 }, { unique: true });


// ---------- 10. distribution_locations collection (lookup) ----------
db.createCollection("distribution_locations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name"],
      properties: {
        name: { bsonType: "string" },
        type: { bsonType: ["string", "null"] } // e.g. "on-site", "partner"
      }
    }
  },
  validationLevel: "off"
});

// Indexes for distribution_locations
db.distribution_locations.createIndex({ name: 1 }, { unique: true });


// ---------- 11. subscriptions collection ----------
db.createCollection("subscriptions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "status", "createdAt"],
      properties: {
        userId: { bsonType: ["objectId", "null"] },
        email: { bsonType: "string" },
        lists: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        mailchimpSubscriberId: { bsonType: ["string", "null"] },
        status: {
          bsonType: "string",
          enum: ["subscribed", "unsubscribed"]
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: ["date", "null"] }
      }
    }
  },
  validationLevel: "off"
});

// Indexes for subscriptions
db.subscriptions.createIndex({ email: 1 });
db.subscriptions.createIndex({ status: 1 });

// Final result
"All collections and indexes created in mcuf_app on the connected cluster.";