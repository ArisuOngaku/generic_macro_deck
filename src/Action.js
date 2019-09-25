import Profile from './config/Profile';

export const registry = {
    register: function (type) {
        registry[type.name] = type.reviver;
    }
};

export default class Action {
    /**
     * @type {Profile}
     */
    config;

    constructor(config) {
        if (new.target === Action) {
            throw new Error('This class is abstract');
        }
        if (config == null) throw new Error('config must not be null');
        this.config = config;
    }

    async execute() {
        if (!(await this.canBeExecuted())) {
            throw new Error('OBS Controller is not connected');
        }

        return this.run();
    }

    async canBeExecuted() {
        throw new Error('Unimplemented');
    }

    async run() {
        throw new Error('Unimplemented');
    }

    serialize() {
        return {
            type: this.constructor.name,
        };
    }
}