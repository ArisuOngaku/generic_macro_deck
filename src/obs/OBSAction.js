import Action from '../Action';

export default class OBSAction extends Action {
    static reviver = (config, data) => new OBSAction(config, data.action, data.data);

    obsController;
    action;
    data;

    constructor(config, action, data) {
        super(config);
        this.obsController = config.obsController;
        this.action = action;
        this.data = data;
    }

    async canBeExecuted() {
        if (!this.obsController.isReady) {
            await this.obsController.getReady();
        }
        return this.obsController.isReady;
    }

    async run() {
        return this.obsController.send(this.action, this.data);
    }

    serialize() {
        let obj = super.serialize();
        obj.action = this.action;
        obj.data = this.data;
        return obj;
    }
}