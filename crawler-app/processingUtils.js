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

const pushTags = (sourcePlayerTag, newTags, oldTags) => {
    newTags
        .filter(tag => !oldTags.includes(tag))
        .filter((tag, index, self) => self.indexOf(tag) === index)
        .filter(tag => tag !== sourcePlayerTag)
        .forEach(pushPlayerTag)
}