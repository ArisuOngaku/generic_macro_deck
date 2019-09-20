import * as child_process from "child_process";
import * as util from 'util';
import * as electron from 'electron';

const exec = util.promisify(child_process.exec);

import chooseKeyboard from './ui/keyboard_choice.js';
import {detectKeyboard, listen} from './KeyboardUtils.js';
import Config from "./Config.js";
import Layout from './Layout.js';
import InternalAction from "./InternalAction.js";
import OBSController from "./obs/OBSController.js";
import OBSAction from "./obs/OBSAction.js";


// Check command line arguments
if (process.argv.length <= 2) {
    console.log('<script> <keyboard name>');
    process.exit(1);
}

// Load arguments
let keyboardName = chooseKeyboard(process.argv[2]);

// Config
// todo

// Internal actions
let quit = false;
let confirmQuit = false;
let quitAction = new InternalAction(() => {
    if (!confirmQuit) {
        confirmQuit = true;
    } else {
        quit = true;
    }
    return true;
});

// OBS actions
let obs = new OBSController('localhost:4444', 'oXCtkFxv37vozPlcNrZ6iXMQm4TD43UhaN4LSqHhVzYz2xQoMhsw7X6B8XEUeT7G');

// Layout
const config = new Config();
config.map(82, 0);
config.map(79, 1);
config.map(80, 2);
config.map(81, 3);
config.map(75, 4);
config.map(76, 5);
config.map(77, 6);
config.map(71, 7);
config.map(72, 8);
config.map(73, 9);
config.map(98, '/');
config.map(55, '*');
config.map(74, '-');
config.map(78, '+');
config.map(14, 'backspace');
config.map(96, 'enter');
config.map(52, '.');
config.map(111, '.');
config.map(69, 'numlock');
config.map(102, 'home');
config.map(110, 0);
config.map(107, 1);
config.map(108, 2);
config.map(109, 3);
config.map(105, 4);
config.map(106, 6);
config.map(103, 8);
config.map(104, 9);

const rootLayout = new Layout('');
config.browseLayout(rootLayout);
const subLayouts = [];
rootLayout.addAction('-', quitAction);

// Obs layouts
const obsLayouts = [];
const kingdomTwoCrowns = new Layout('Kingdom Two Crowns');
rootLayout.addAction(0, new InternalAction(() => config.browseLayout(kingdomTwoCrowns)));
obsLayouts.push(kingdomTwoCrowns);

kingdomTwoCrowns.addAction(0, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Layout'}));
kingdomTwoCrowns.addAction(1, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Arisu/Syra'}));
kingdomTwoCrowns.addAction(2, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Arisu'}));
kingdomTwoCrowns.addAction(3, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Syra'}));

for (let obsLayout of obsLayouts) {
    obsLayout.addAction(7, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Start'}));
    obsLayout.addAction(8, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'Pause'}));
    obsLayout.addAction(9, new OBSAction(obs, 'SetCurrentScene', {'scene-name': 'End'}));
    subLayouts.push(obsLayout);
}

for (let subLayout of subLayouts) {
    subLayout.addAction('backspace', new InternalAction(() => config.popLayout()));
}


(async function run() {
    console.log('GMD start');

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
            let key = config.getKey(keyCode);
            console.log('Key ', keyCode, '\tVirtual', key);
            let action = config.getAction(key);
            if (confirmQuit && action !== quitAction) confirmQuit = false;
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
})()
    .catch(console.error);