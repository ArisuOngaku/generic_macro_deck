import InternalAction from "./InternalAction";

export default class ToggleOSDAction extends InternalAction {
    static reviver = config => new ToggleOSDAction(config);

    constructor(config) {
        super(config, () => config.toggleOSD());
    }
}