import * as child_process from "child_process";
import * as util from 'util';
import {app, BrowserWindow, Menu, Tray} from "electron";
import KeyboardChoiceUI from './ui/KeyboardChoiceUI.js';
import {detectKeyboard, listen} from './KeyboardUtils.js';
import {configDirectory} from "./config/Config.js";
import makeDefaultConfig from './config/defaultConfig';
import OBSController from "./obs/OBSController.js";
import fs from "fs";
import Config from "./config/Config";
import QuitAction from "./QuitAction";
import {registry} from "./Action";
import NavigateBackAction from "./NavigateBackAction";
import NavigateAction from "./NavigateAction";
import OBSAction from "./obs/OBSAction";
import ToggleOSDAction from "./ToggleOSDAction";

const exec = util.promisify(child_process.exec);


console.log('GMD start');
let quit = false;
let tray = null;

// Register action types
registry.register(QuitAction);
registry.register(NavigateBackAction);
registry.register(NavigateAction);
registry.register(ToggleOSDAction);
registry.register(OBSAction);

// OBS
let obs = new OBSController('localhost:4444', 'oXCtkFxv37vozPlcNrZ6iXMQm4TD43UhaN4LSqHhVzYz2xQoMhsw7X6B8XEUeT7G');

// Config
const configurations = [];
let selectedConfiguration = 0;
if (!fs.existsSync(configDirectory) && !fs.mkdirSync(configDirectory) || !fs.statSync(configDirectory).isDirectory()) {
    throw new Error('Cannot create ' + configDirectory + ' directory');
}
for (const config of fs.readdirSync(configDirectory)) {
    console.log('Loading config file ' + config);
    configurations.push(new Config(() => quit = true, obs, JSON.parse(fs.readFileSync(configDirectory + '/' + config))));
}
if (configurations.length === 0) {
    let config = makeDefaultConfig(() => quit = true, obs);
    configurations.push(config);
    fs.writeFileSync(configDirectory + '/default.json', JSON.stringify(config.serialize()));
}


async function run() {
    let keyboardName;
    try {
        keyboardName = await (new KeyboardChoiceUI()).prompt(process.argv.length > 2 ? process.argv[2] : null);
    } catch (e) {
        console.error(e);
    }
    console.log('Chosen keyboard:', keyboardName);


    let keyboards = await detectKeyboard(keyboardName);
    if (keyboards.length === 0 || keyboards.consumer == null) {
        throw 'Cannot find keyboard ' + keyboardName;
    }

    console.log(keyboardName + ' matches with', keyboards.length, 'keyboards.');
    for (let keyboard of keyboards) {
        console.log('Disabling keyboard', keyboard.xinputId);
        let disablerProcess = await exec('xinput --disable ' + keyboard.xinputId);
        if (disablerProcess.stderr) {
            throw disablerProcess.stderr;
        }
    }

    console.log('Keyboards successfully disabled.');

    try {
        await listen(keyboards.consumer.eventId, () => quit, async event => {
            let keyCode = event.code;
            console.log('--------------------------------------------------------------------');
            let key = configurations[selectedConfiguration].getKey(keyCode);
            console.log('Key ', keyCode, '\tVirtual', key);
            let action = configurations[selectedConfiguration].getAction(key);
            if (action == null || action.constructor === QuitAction) configurations[selectedConfiguration].resetQuit();
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

app.on('ready', () => {
    tray = new Tray('resources/logo.png');
    tray.setToolTip('Generic Macro Deck');
    const menu = Menu.buildFromTemplate([
        {label: 'Generic Macro Deck', type: 'normal', enabled: false},
        {
            label: 'Open GMD', type: 'normal', click: () => {
                BrowserWindow.getAllWindows().forEach(w => w.show());
            }
        },
        {type: 'separator'},
        {label: 'Quit', type: 'normal', role: 'quit'},
    ]);
    tray.setContextMenu(menu);

    tray.on('click', event => {
        BrowserWindow.getAllWindows().forEach(w => w.isFocused() ? w.hide() : w.show());
    });

    run().then(() => {
        app.exit(0);
    }).catch(err => {
        console.error(err);
        app.exit(1);
    });
});