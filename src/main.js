import * as child_process from "child_process";
import * as util from 'util';
import {app, Menu, Tray} from "electron";
import KeyboardChoiceUI from './ui/KeyboardChoiceUI';
import {detectKeyboard, listen} from './KeyboardUtils';
import Config, {configDirectory, profileDirectory} from "./config/Config";
import OBSController from "./obs/OBSController";
import fs from "fs";
import Profile from "./config/Profile";
import QuitAction from "./QuitAction";
import {registry} from "./Action";
import NavigateBackAction from "./NavigateBackAction";
import NavigateAction from "./NavigateAction";
import OBSAction from "./obs/OBSAction";
import ToggleOSDAction from "./ToggleOSDAction";
import path from "path";
import {openUIs, resourcesDirectory} from "./ui/UI";
import makeDefaultProfile from "./config/defaultProfile";

const exec = util.promisify(child_process.exec);


console.log('GMD start');
let quit = false;
let tray = null;


async function run() {
    // System tray
    tray = new Tray(path.resolve(resourcesDirectory, 'logo.png'));
    tray.setToolTip('Generic Macro Deck');
    const menu = Menu.buildFromTemplate([
        {label: 'Generic Macro Deck', type: 'normal', enabled: false},
        {
            label: 'Open GMD', type: 'normal', click: () => {
                for (const openUI of openUIs) {
                    openUI.show();
                }
            }
        },
        {type: 'separator'},
        {label: 'Quit', type: 'normal', role: 'quit', click: () => app.exit(0)},
    ]);
    tray.setContextMenu(menu);

    tray.on('click', event => {
        for (const openUI of openUIs) {
            if (openUI.window.isFocused()) {
                openUI.hide();
            } else {
                openUI.show();
            }
        }
    });

    // Register action types
    registry.register(QuitAction);
    registry.register(NavigateBackAction);
    registry.register(NavigateAction);
    registry.register(ToggleOSDAction);
    registry.register(OBSAction);

    // OBS
    let obs = new OBSController('localhost:4444', 'oXCtkFxv37vozPlcNrZ6iXMQm4TD43UhaN4LSqHhVzYz2xQoMhsw7X6B8XEUeT7G');

    // Config
    const config = new Config();
    if (!fs.existsSync(configDirectory)) fs.mkdirSync(configDirectory);
    if (!fs.statSync(configDirectory).isDirectory()) throw new Error('Cannot create ' + configDirectory + ' directory');
    config.load();

    // Profiles
    const profiles = [];
    /**
     * @type {Profile}
     */
    let selectedProfile = null;
    if (!fs.existsSync(profileDirectory)) fs.mkdirSync(profileDirectory);
    if (!fs.statSync(profileDirectory).isDirectory()) throw new Error('Cannot create ' + profileDirectory + ' directory');

    for (const profile of fs.readdirSync(profileDirectory)) {
        console.log('Loading profile file ' + profile);
        profiles.push(new Profile(() => quit = true, obs, profile.split('.')[0], JSON.parse(fs.readFileSync(path.resolve(profileDirectory, profile)))));
    }

    let newKeyboard = false;
    if (profiles.length === 0) {
        newKeyboard = true;
        let profile = makeDefaultProfile(() => quit = true, obs);
        profiles.push(profile);
        profile.save();
        selectedProfile = profile;
    } else {
        for (const profile of profiles) {
            if (profile.name === config.currentProfile) {
                selectedProfile = profile;
                break;
            }
        }
    }

    if (selectedProfile == null) {
        selectedProfile = profiles[0];
        newKeyboard = true;
    }

    if (newKeyboard) {
        config.currentProfile = selectedProfile.name;
        config.save();
    }


    // Keyboard choice
    let keyboardName;
    let keyboards;
    let firstAttempt = true;
    do {
        if (!firstAttempt) {
            console.log('Cannot find keyboard', keyboardName);
        }

        let defaultKeyboardName = null;
        if (firstAttempt && selectedProfile.keyboardName != null) {
            defaultKeyboardName = selectedProfile.keyboardName;
        }
        keyboardName = await (new KeyboardChoiceUI()).prompt(defaultKeyboardName);
        console.log('Chosen keyboard:', keyboardName);


        // Keyboard detection
        keyboards = await detectKeyboard(keyboardName);
        firstAttempt = false;
    } while (keyboards.length === 0 || keyboards.consumer == null);

    // Keyboard disabling
    console.log(keyboardName + ' matches with', keyboards.length, 'keyboards.');
    for (let keyboard of keyboards) {
        console.log('Disabling keyboard', keyboard.xinputId);
        let disablerProcess = await exec('xinput --disable ' + keyboard.xinputId);
        if (disablerProcess.stderr) {
            throw disablerProcess.stderr;
        }
    }
    console.log('Keyboards successfully disabled.');

    selectedProfile.keyboardName = keyboardName;
    selectedProfile.save();
    selectedProfile.load();

    try {
        await listen(keyboards.consumer.eventId, () => quit, async event => {
            let keyCode = event.code;
            console.log('--------------------------------------------------------------------');
            let key = selectedProfile.getKey(keyCode);
            console.log('Key ', keyCode, '\tVirtual', key);
            selectedProfile.onKeyPress(key);
            let action = selectedProfile.getAction(key);
            if (action == null || action.constructor !== QuitAction) selectedProfile.resetQuit();
            if (action != null) {
                console.log('Executing action of type', action.constructor.name);
                try {
                    let result = await action.execute();
                    console.log('Success: ', result);
                } catch (e) {
                    console.error('Fail: ', e);
                }
            }
        });
    } catch (e) {
        console.error(e);
    }

    for (let keyboard of keyboards) {
        console.log('Re-enabling keyboard', keyboard.xinputId);
        let disablerProcess = await exec('xinput --enable ' + keyboard.xinputId);
        if (disablerProcess.stderr) {
            throw disablerProcess.stderr;
        }
    }

    console.log('GMD end');
}

app.on('window-all-closed', e => e.preventDefault());

app.on('ready', async () => {
    try {
        await run();
        app.exit(0);
    } catch (e) {
        console.error(e);
        app.exit(1);
    }
});