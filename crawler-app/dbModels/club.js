import mongoose from "mongoose"

const clubSchema = new mongoose.Schema({
    tag: {
        type: String,
        required: true,
        uppercase: true,
        unique: true
    },
    name: String,
    description: String,
    type: String,
    badgeId: Number,
    requiredTrophies: String,
    trophies: String,
    members: [{
        tag: {
            type: String,
            uppercase: true,
        },
        name: String,
        nameColor: String,
        role: String,
        trophies: Number,
        icon: { id: Number }
    }]
}, { timestamps: true })

clubSchema.index({"updatedAt": 1})

export default mongoose.model('Club', clubSchema)