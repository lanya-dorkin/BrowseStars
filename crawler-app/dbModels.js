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

export const Player = mongoose.model('Player', playerSchema)

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

export const Club = mongoose.model('Club', clubSchema)

const battleSchema = new mongoose.Schema({
    battleTime: Date,
    event: { id: Number, mode: String, map: String },
    battle: {
        mode: String,
        type: { type: String },
        result: String,
        rank: Number,
        duration: Number,
        trophyChange: Number,
        starPlayer: {
            tag: { type: String, uppercase: true },
            name: String,
            brawler: {
                id: Number,
                name: { type: String, uppercase: true},
                power: Number,
                trophies: Number
            }
        },
        teams: [[{
            tag: { type: String, uppercase: true },
            name: String,
            brawler: {
                id: Number,
                name: { type: String, uppercase: true},
                power: Number,
                trophies: Number
            }
        }]],
        players: [{
            tag: { type: String, uppercase: true },
            name: String,
            brawler: {
                id: Number,
                name: { type: String, uppercase: true },
                power: Number,
                trophies: Number
            }
        }]
    },
    sourcePlayerTag: { type: String, uppercase: true, required: true },
    hash: { type: String, unique: true }
})

export const Battle = mongoose.model('Battle', battleSchema)