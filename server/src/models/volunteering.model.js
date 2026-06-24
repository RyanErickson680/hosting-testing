import mongoose from 'mongoose'

const volunteeringEventSchema = new mongoose.Schema({ 
    name: {type: String, required: true}, 
    description: {type: String, default: null}, 
    eventType: {type: String, default: "volunteering", enum: ["volunteering", "regular", "paid"], required: true}, 
    cost: {type: Number, default: 0, required: function() { return this.eventType === 'paid'; }},
    date: {type: Date, required: true}, 
    endTime: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    skillsNeeded: {type: [String], default: []}, 
    location: {type: String, default: null}, 
    priority: {type: Number, default: null}, 
    waiverRequired: {type: Boolean, default: false}, 
    currentVolunteerCount: {type: Number, default: 0}, 
    status: { 
        type: String, 
        enum: ['open', 'full', 'completed', 'cancelled'],
        required: true, 
        default: "open", 
    },
    /** Secret for QR attendance links; never expose on public list/get. */
    attendanceToken: {
        type: String,
        default: null,
        select: false,
    },
    createdAt: {type: Date, default: Date.now}, 
    updatedAt: {type: Date, default: Date.now}, 
}, { 
    collection: "events"
})

volunteeringEventSchema.index({ attendanceToken: 1 }, { unique: true, sparse: true })

export default mongoose.model("VolunteeringEvent", volunteeringEventSchema, 'events')
