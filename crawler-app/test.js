class queuesManager {
    constructor({} = {}) {
        this._smth = smth
    }

    set smth(smth) {
        this._smth = smth
    }

    get smth() {
        return this._smth
    }
}

const mngr = new queuesManager()

console.log(mngr.smth)