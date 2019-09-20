import InternalAction from "./InternalAction";

export default class NavigateAction extends InternalAction {
    static reviver = (config, data) => new NavigateAction(config, data.layoutName);

    /**
     * @type {int}
     */
    layoutName;

    constructor(config, layoutName) {
        super(config, () => config.navigateToLayout(layoutName));
        this.layoutName = layoutName;
    }

    serialize() {
        let obj = super.serialize();
        obj.layoutName = this.layoutName;
        return obj;
    }
}