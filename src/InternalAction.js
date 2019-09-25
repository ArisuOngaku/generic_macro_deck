import Action from "./Action";

export default class InternalAction extends Action {
    callback;

    constructor(config, callback) {
        super(config);
        if (new.target === Action) throw new Error('Cannot instantiate InternalAction directly');
        if (typeof callback !== 'function') throw new Error('Parameter callback must be a function');
        this.callback = callback;
    }

    async canBeExecuted() {
        return true;
    }

    async run() {
        return this.callback();
    }
}