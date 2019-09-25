import {homedir} from "os";
import path from "path";
import fs from "fs";

export const configDirectory = path.resolve(homedir(), '.generic_macro_deck');
export const profileDirectory = path.resolve(configDirectory, 'profiles');

const configFile = path.resolve(configDirectory, 'config.json');

export default class Config {
    currentProfile;

    constructor() {
    }

    load() {
        let data = {};
        if (fs.existsSync(configFile) && fs.statSync(configFile).isFile()) data = fs.readFileSync(configFile);

        this.loadProperty('currentProfile', data, null);
    }

    loadProperty(name, data, defaultValue) {
        this[name] = data[name] !== undefined ? data[name] : defaultValue;
    }

    save() {
        fs.writeFileSync(configFile, JSON.stringify(this));
    }
}