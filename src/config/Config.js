import Layout from "./Layout";
import KeyboardUI from "../ui/KeyboardUI";
import fs from "fs";

export const configDirectory = 'config';

export default class Config {
    keyboardName = null;
    keyMap = {};
    keys = [];
    gridColumns = 4;
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
        let index = this.keys.indexOf(key);
        if (index < 0) {
            this.keys.push(key);
            index = this.keys.length - 1;
        }
        this.keyMap[keyCode] = index;
    }

    reorderKeys(keys) {
        if (!Array.isArray(keys) || this.keys.length !== keys.length) throw new Error('Tried to reorder keys with invalid set of keys');
        let mapChanges = {};
        for (let i = 0; i < keys.length; i++) {
            if (this.keys[i] !== keys[i]) {
                let oldIndex = this.keys.indexOf(keys[i]);
                for (const keyCode of Object.keys(this.keyMap)) {
                    if (this.keyMap[keyCode] === oldIndex) {
                        mapChanges[keyCode] = i;
                    }
                }
            }
        }

        for (const keyCode of Object.keys(mapChanges)) {
            this.keyMap[keyCode] = mapChanges[keyCode];
        }

        console.log('Before:', this.keys);
        console.log('After:', keys);

        this.keys = keys;
        this.save();
    }

    getKey(keyCode) {
        return this.keys[this.keyMap[keyCode]];
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
            this.keyboardUI.syncNavigation();
        } else {
            throw new Error('No layout found with the name ' + layoutName);
        }
    }

    popLayout() {
        this.navigation.pop();
        this.logNavigation();
        this.keyboardUI.syncNavigation();
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

    onKeyPress(key) {
        this.keyboardUI.onKeyPress(this.keys.indexOf(key));
    }

    save() {
        fs.writeFileSync(configDirectory + '/' + this.keyboardName + '.json', JSON.stringify(this.serialize()));
    }

    serialize() {
        return {
            keyboardName: this.keyboardName,
            keyMap: this.keyMap,
            keys: this.keys,
            gridColumns: this.gridColumns,
            layouts: this.layouts.map(layout => layout.serialize()),
            navigation: this.navigation,
        };
    }

    deserialize(data) {
        this.keyboardName = data.keyboardName;
        this.keyMap = data.keyMap;
        this.keys = data.keys;
        this.gridColumns = data.gridColumns;
        this.layouts = data.layouts.map(d => new Layout(null, this, d));
        this.navigation = data.navigation;
    }
}