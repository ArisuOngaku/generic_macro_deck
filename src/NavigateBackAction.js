import InternalAction from "./InternalAction";

export default class NavigateBackAction extends InternalAction {
    static reviver = config => new NavigateBackAction(config);

    constructor(config) {
        super(config, () => config.popLayout());
    }
}