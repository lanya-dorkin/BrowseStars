import dotenv from 'dotenv'
import { Client } from 'brawlstats'
import async from 'async'
import crawlerOptions from './crawler.config.js'
import mongoose from 'mongoose'
import Battle from './dbModels/battle.js'
import Player from './dbModels/player.js'
import Club from './dbModels/club.js'
import { createHash } from 'crypto'

dotenv.config()
const bsClient = new Client({ token: process.env.BS_API_TOKEN })
mongoose.connect(process.env.MONGO_DB_URI, { dbName: 'browseStars' })


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

const getHashFromBattle = ({ battle }) => {
    const hash = createHash('md5')
    hash.update(battle.battleTime)
    getTagsFromBattle(battle).sort().forEach(tag => hash.update(tag))
    return hash.digest('hex')
}

const prepareBattle = (battle, taskTag) => {
    battle.hash = getHashFromBattle(battle)
    battle.battleTime = moment(battle.battleTime).toDate()
    battle.sourcePlayerTag = taskTag
    return battle
}

const pushPlayerTag = (tag) => {
    if (crawlerOptions.battlesQueue.length > battlesQueue.length()) {
        battlesQueue.push(tag)
    }
    if (crawlerOptions.playersQueue.length > playersQueue.length()) { 
        playersQueue.push(tag)
    }
}

const pushTags = (taskTag, newTags, oldTags) => {
    newTags
        .filter(tag => !oldTags.includes(tag))
        .filter((tag, index, self) => self.indexOf(tag) === index)
        .filter(tag => tag !== taskTag)
        .forEach(pushPlayerTag)
}


const battlesQueue = async.queue(async (taskTag) => {
    const battlelogs = await bsClient.battlelogs.fetch(taskTag)
    const oldTags = [], newTags = []
    battlelogs.forEach(battle => {
        battle = prepareBattle(battle, taskTag)
        Battle.create(battle, (err, data) => {
            if (err) {
                oldTags.push(...getTagsFromBattle(battle))
            } else if (data) {
                newTags.push(...getTagsFromBattle(battle))
            }
        })
    })
    pushTags(taskTag, newTags, oldTags)
}, crawlerOptions.battlesQueue.numOfWorkers)

const playersQueue = async.queue(async (taskTag) => {
    const player = await bsClient.players.fetch(taskTag)
    if (player.club && crawlerOptions.clubsQueue.length > clubsQueue.length()) { 
        clubsQueue.push(player.club.tag)
    }
    Player.updateOne({ tag: player.tag }, player, { upsert: true }, (err, data) => {
        if (err) {
            console.log(err.message)
        } else if (data) {
            console.log(data)
        }
    })
}, crawlerOptions.playersQueue.numOfWorkers)

const clubsQueue = async.queue(async (taskTag) => {
    const club = await bsClient.clubs.fetch(taskTag)
    await Club.updateOne({ tag: club.tag }, club, { upsert: true }, (err, data) => {
        if (err) {
            console.log(err.message)
        } else if (data) {
            console.log(data)
        }
    })
}, crawlerOptions.clubsQueue.numOfWorkers)

setTimeout(() => battlesQueue.push('#YP9PCJ298'), 0)
// setInterval(() => {
//     console.log(battlesQueue.length(), playersQueue.length(), clubsQueue.length())
// }, 5000)
