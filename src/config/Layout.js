import {registry} from "../Action";
import QuitAction from "../QuitAction";

export default class Layout {
    name;
    actions = {};

    constructor(name, config, data) {
        this.name = name;
        if (data != null) {
            this.deserialize(config, data);
        }
    }

    addAction(key, action) {
        this.actions[key] = action;
    }

    serialize() {
        const actions = {};
        for (const key of Object.keys(this.actions)) {
            actions[key] = this.actions[key].serialize();
        }
        return {
            name: this.name,
            actions: actions,
        }
    }

    deserialize(config, data) {
        this.name = data.name;
        for (const key of Object.keys(data.actions)) {
            const d = data.actions[key];
            this.actions[key] = registry[d.type](config, d);
        }
    }
}