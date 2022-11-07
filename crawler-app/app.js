import { Client } from 'brawlstats'
import async from 'async'
import { crawlerOptions, bsApiToken, mongoDBURI } from './options.js'
import mongoose from 'mongoose'
import { Battle, Player, Club } from './dbModels.js'
import { createHash } from 'crypto'

const bsClient = new Client({
    token: bsApiToken
})

await mongoose.connect(mongoDBURI, { dbName: 'browseStars' })

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

const getAllTagsFromBattles = (battlelogs, sourcePlayerTag) => {
    return battlelogs.map((battle) => (
        getTagsFromBattle(battle)
            .filter(tag => tag !== sourcePlayerTag)
    )).flat()
        .filter((tag, index, self) => self.indexOf(tag) === index)
}

const getHashFromBattle = ({ battle }) => {
    const hash = createHash('md5')
    hash.update(battle.battleTime.split('.')[0])
    getTagsFromBattle(battle).sort().forEach(tag => hash.update(tag))
    return hash.digest('hex')
}

const battlesQueue = async.queue(async (taskTag) => {
    const battlelogs = await bsClient.battlelogs.fetch(taskTag)
    getAllTagsFromBattles(battlelogs, taskTag).forEach(tag => {
        if (crawlerOptions.battlesQueue.length > battlesQueue.length()) {
            battlesQueue.push(tag)
        }
        if (crawlerOptions.playersQueue.length > playersQueue.length()) { 
            playersQueue.push(tag)
        }
    })
    battlelogs.forEach(battle => {
        battle.sourcePlayerTag = taskTag
        battle.hash = getHashFromBattle(battle)
        // await Battle.
    })
}, crawlerOptions.battlesQueue.numOfWorkers)

const playersQueue = async.queue(async (taskTag) => {
    const player = await bsClient.players.fetch(taskTag)
    if (player.club && crawlerOptions.clubsQueue.length > clubsQueue.length()) { 
        clubsQueue.push(player.club.tag)
    }
    // await Player.updateOne({ tag: player.tag }, player, { upsert: true })
}, crawlerOptions.playersQueue.numOfWorkers)

const clubsQueue = async.queue(async (taskTag) => {
    const club = await bsClient.clubs.fetch(taskTag)
    await Club.updateOne({ tag: club.tag }, club, { upsert: true })
}, crawlerOptions.clubsQueue.numOfWorkers)

setTimeout(() => battlesQueue.push('#YP9PCJ298'), 0)
// setInterval(() => {
//     console.log(battlesQueue.length(), playersQueue.length(), clubsQueue.length())
// }, 5000)
