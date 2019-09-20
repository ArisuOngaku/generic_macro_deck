import InternalAction from "./InternalAction";

export default class QuitAction extends InternalAction {
    static reviver = config => new QuitAction(config);

    constructor(config) {
        super(config, () => config.quit());
    }
}