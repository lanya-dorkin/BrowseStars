import dotenv from 'dotenv'
import { Client } from 'brawlstats'
import async from 'async'
import crawlerOptions from './crawler.config.js'
import mongoose from 'mongoose'
import Battle from './dbModels/battle.js'
import Player from './dbModels/player.js'
import Club from './dbModels/club.js'
import moment from 'moment'
import CRC32 from 'crc-32' 

dotenv.config()
const bsClient = new Client()
mongoose.connect(process.env.MONGO_DB_URI, { dbName: 'browseStars' }, () => console.log('connected to db'))


const getTagsFromBattle = ({ battle }) => {
    const playerTags = []
    if (battle.teams) {
        battle.teams.flat().forEach(player => (
            playerTags.push(player.tag)
        ))
    }
    if (battle.players) {
        battle.players.forEach(player => (
            playerTags.push(player.tag)
        ))
    }
    return playerTags
}

const getHashFromBattle = (battle) => {
    const strToHash = [battle.battleTime, ...getTagsFromBattle(battle).sort()].join('')
    return CRC32.buf(Buffer.from(strToHash, "binary"), 0)
}

const prepareBattleForDB = (battle, taskTag) => {
    battle.hash = getHashFromBattle(battle)
    battle.battleTime = moment(battle.battleTime).toDate()
    battle.sourcePlayerTag = taskTag
    return battle
}


const battlesQueue = async.queue(async (taskTag) => {
    const battlelogs = await bsClient.battlelogs.fetch(taskTag)
        .map(battle => prepareBattleForDB(battle, taskTag))
    const insertedBattles = await Battle.insertMany(battlelogs, { ordered: false })
    const tags = insertedBattles.map(battle => getTagsFromBattle(battle)).flat()
        .filter((tag, index, arr) => (arr.indexOf(tag) === index) && (tag !== taskTag))
    if (crawlerOptions.battlesQueue.length > battlesQueue.length() + tags.length) {
        battlesQueue.push(tags)
    }
    if (crawlerOptions.playersQueue.length > playersQueue.length() + tags.length) {
        playersQueue.push(tags)
    }
}, crawlerOptions.battlesQueue.numOfWorkers)

const playersQueue = async.queue(async (taskTag) => {
    const player = await bsClient.players.fetch(taskTag)
    if (player.club && crawlerOptions.clubsQueue.length > clubsQueue.length()) { 
        clubsQueue.push(player.club.tag)
    }
    Player.updateOne({ tag: player.tag }, player, { upsert: true })
}, crawlerOptions.playersQueue.numOfWorkers)

const clubsQueue = async.queue(async (taskTag) => {
    const club = await bsClient.clubs.fetch(taskTag)
    await Club.updateOne({ tag: club.tag }, club, { upsert: true })
}, crawlerOptions.clubsQueue.numOfWorkers)

setTimeout(() => battlesQueue.push('#YP9PCJ298'), 0)
// setInterval(() => {
//     console.log(battlesQueue.length(), playersQueue.length(), clubsQueue.length())
// }, 5000)

// class queuesManager {
//     constructor({ battlesQueue = undefined })
// }
