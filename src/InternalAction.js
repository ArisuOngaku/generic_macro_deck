import Action from "./Action.js";

export default class InternalAction extends Action {
    callback;

    constructor(callback) {
        super();
        if(typeof callback !== 'function') throw 'Parameter callback must be a function';
        this.callback = callback;
    }

    async canBeExecuted() {
        return true;
    }

    async run() {
        return this.callback();
    }
}