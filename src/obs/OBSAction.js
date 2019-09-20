import Action from '../Action.js';
import OBSController from "./OBSController.js";

export default class OBSAction extends Action {
    obsController;
    action;
    data;

    /**
     *
     * @param obsController {OBSController}
     * @param action
     * @param data
     */
    constructor(obsController, action, data) {
        super();
        this.obsController = obsController;
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
}