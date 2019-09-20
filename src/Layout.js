export default class Layout {
    name;
    actions = {};

    constructor(name) {
        this.name = name;
    }

    addAction(key, action) {
        this.actions[key] = action;
    }
}