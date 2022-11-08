import mongoose from "mongoose"

const battleSchema = new mongoose.Schema({
    battleTime: { type: Date, expires: 30 * 24 * 60 * 60, required: true },
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
    hash: { type: String, unique: true, required: true }
})

export default mongoose.model('Battle', battleSchema)