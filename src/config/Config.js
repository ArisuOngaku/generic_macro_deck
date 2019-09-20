import Layout from "./Layout";
import KeyboardUI from "../ui/KeyboardUI";

export const configDirectory = 'config';

export default class Config {
    keyboardName = null;
    keyMap = {};
    /**
     * @type {Array<Layout>}
     */
    layouts = [];
    navigation = [];

    constructor(quitFunction, obsController, data) {
        this.quitFunction = quitFunction;
        this.confirmQuit = false;
        this.obsController = obsController;
        this.keyboardUI = new KeyboardUI(this);

        if (data != null) {
            this.deserialize(data);
        }
    }

    map(keyCode, key) {
        this.keyMap[keyCode] = key;
    }

    getKey(keyCode) {
        return this.keyMap[keyCode];
    }

    getAction(key) {
        if (this.navigation.length === 0) return null;

        return this.layouts[this.navigation[this.navigation.length - 1]].actions[key];
    }

    addLayout(layout) {
        this.layouts.push(layout);
    }

    navigateToLayout(layoutName) {
        let index = -1;
        for (const layout of this.layouts) {
            if (layout.name === layoutName) {
                index = this.layouts.indexOf(layout);
                break;
            }
        }

        if (index >= 0) {
            this.navigation.push(index);
            this.logNavigation();
        } else {
            throw new Error('No layout found with the name ' + layoutName);
        }
    }

    popLayout() {
        this.navigation.pop();
        this.logNavigation();
    }

    logNavigation() {
        let path = '';
        for (const layoutIndex of this.navigation.slice(1)) {
            path += '/' + this.layouts[layoutIndex].name;
        }
        if (path.length === 0) path = '/';
        console.log('Navigated to', path);
    }

    quit() {
        if (!this.confirmQuit) {
            this.confirmQuit = true;
        } else {
            this.quitFunction();
        }
    }

    resetQuit() {
        this.confirmQuit = false;
    }

    toggleOSD() {
        this.keyboardUI.toggle();
    }

    serialize() {
        return {
            keyboardName: this.keyboardName,
            keyMap: this.keyMap,
            layouts: this.layouts.map(layout => layout.serialize()),
            navigation: this.navigation,
        };
    }

    deserialize(data) {
        this.keyboardName = data.keyboardName;
        this.keyMap = data.keyMap;
        this.layouts = data.layouts.map(d => new Layout(null, this, d));
        this.navigation = data.navigation;
    }
}