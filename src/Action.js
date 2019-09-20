export default class Action {
    constructor() {
        if (new.target === Action) {
            throw 'This class is abstract';
        }
    }

    async execute() {
        if (!(await this.canBeExecuted())) {
            throw 'OBS Controller is not connected';
        }

        return this.run();
    }

    async canBeExecuted() {
        throw 'Unimplemented';
    }

    async run() {
        throw 'Unimplemented';
    }
}