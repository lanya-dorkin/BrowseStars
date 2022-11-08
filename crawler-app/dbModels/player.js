import mongoose from "mongoose"

const playerSchema = new mongoose.Schema({
    tag: {
        type: String,
        required: true,
        uppercase: true,
        unique: true
    },
    name: String,
    nameColor: String,
    icon: { id: Number },
    trophies: Number,
    highestTrophies: Number,
    highestPowerPlayPoints: Number,
    expLevel: Number,
    expPoints: Number,
    isQualifiedFromChampionshipChallenge: Boolean,
    trioVictories: Number,
    soloVictories: Number,
    duoVictories: Number,
    bestRoboRumbleTime: Number,
    bestTimeAsBigBrawler: Number,
    club: { tag: { type: String, uppercase: true }, name: String },
    brawlers: [
        {
        id: Number,
        name: { type: String, uppercase: true},
        power: Number,
        rank: Number,
        trophies: Number,
        highestTrophies: Number,
        gears: [{ id: Number, name: { type: String, uppercase: true, level: Number } }],
        starPowers: [{ id: Number, name: { type: String, uppercase: true } }],
        gadgets: [{ id: Number, name: { type: String, uppercase: true } }]
        }
    ]
}, { timestamps: true })

playerSchema.index({"updatedAt": 1})

export default mongoose.model('Player', playerSchema)