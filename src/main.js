import * as child_process from "child_process";
import * as util from 'util';
import {app} from "electron";

const exec = util.promisify(child_process.exec);

import KeyboardChoiceUI from './ui/KeyboardChoiceUI.js';
import {detectKeyboard, listen} from './KeyboardUtils.js';
import Config from "./config/Config.js";
import makeDefaultConfig from './config/defaultConfig';
import Layout from './Layout.js';
import InternalAction from "./InternalAction.js";
import OBSController from "./obs/OBSController.js";
import OBSAction from "./obs/OBSAction.js";


console.log('GMD start');


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

// OBS
let obs = new OBSController('localhost:4444', 'oXCtkFxv37vozPlcNrZ6iXMQm4TD43UhaN4LSqHhVzYz2xQoMhsw7X6B8XEUeT7G');

// Config
const config = makeDefaultConfig(quitAction, obs);


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
}

app.on('window-all-closed', e => e.preventDefault());

app.on('ready', () => {
    run().then(() => {
        app.exit(0);
    }).catch(err => {
        console.error(err);
        app.exit(1);
    });
});