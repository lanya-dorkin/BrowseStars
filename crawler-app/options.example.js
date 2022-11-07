export const crawlerOptions = {
    battlesQueue: {
        length: 3333,
        numOfWorkers: 8
    },
    playersQueue: {
        length: 3333,
        numOfWorkers: 8
    },
    clubsQueue: {
        length: 3333,
        numOfWorkers: 8
    }  
}

export const bsApiToken = 'your api token from developer.brawlstars.com'
export const mongoDBURI = 'your mongo db uri'