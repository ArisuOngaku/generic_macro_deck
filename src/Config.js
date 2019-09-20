export default class Config {
    keyMap = {};
    layouts = [];

    constructor() {
    }

    map(keyCode, key) {
        this.keyMap[keyCode] = key;
    }

    getKey(keyCode) {
        return this.keyMap[keyCode];
    }

    getAction(key) {
        if (this.layouts.length === 0) return null;

        return this.layouts[this.layouts.length - 1].actions[key];
    }

    browseLayout(layout) {
        this.layouts.push(layout);
        this.logNavigation();
    }

    popLayout() {
        this.layouts.pop();
        this.logNavigation();
    }

    logNavigation() {
        let path = '';
        for (let layout of this.layouts.slice(1)) {
            path += '/' + layout.name;
        }
        if(path.length === 0) path = '/';
        console.log('Navigated to', path);
    }

}