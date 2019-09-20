import * as util from 'util';
import * as child_process from 'child_process';
import * as fs from 'fs';

const exec = util.promisify(child_process.exec);

export async function detectKeyboard(keyboardName) {
    console.log('Detecting keyboard ' + keyboardName + '...');

    let {stdout, stderr} = await exec('xinput list');

    if (stderr) {
        console.error(stderr);
        return;
    }
    let xinput = stdout.split('\n');

    let devices = fs.readFileSync('/proc/bus/input/devices').toString();

    let entries = devices.split('\n\n');
    let keyboards = [];
    for (const entry of entries) {
        if (entry.indexOf(keyboardName) >= 0 && entry.indexOf('kbd event') >= 0 && entry.match('Consumer Control|System Control') == null) {
            let keyboard = {
                name: entry.match(/N: Name="(.+)"/)[1],
                eventId: entry.match(/event([0-9]+)/)[1],
            };
            for (const xinputEntry of xinput) {
                if (xinputEntry.match(keyboard.name + ' *\tid') != null) {
                    keyboard.xinputId = xinputEntry.match(/id=([0-9]+)/)[1];
                }
            }
            keyboards.push(keyboard);
            if (entry.indexOf('Consumer Control') < 0 && entry.indexOf('System Control') < 0) {
                keyboards.consumer = keyboard;
            }
        }
    }
    return keyboards;
}

const EVENT_TYPE = {
    EV_SYN: 0,
    EV_KEY: 1,
    EV_REL: 2,
    EV_ABS: 3,
    EV_MSC: 4,
    EV_SW: 5,
    EV_LED: 17,
    EV_SND: 18,
    EV_REP: 20,
    EV_FF: 21,
    EV_PWR: 22,
    EV_FF_STATUS: 23,
};

const SYNC_EVENT_TYPE = {
    SYN_REPORT: 0,
    SYN_CONFIG: 1,
    SYN_MT_REPORT: 2,
    SYN_DROPPED: 3,
};

const KEY_EVENT_TYPE = {
    DOWN: 0,
    UP: 1,
    REPEAT: 2,
};

export async function listen(inputId, quitSupplier, eventListener) {
    if (typeof quitSupplier !== 'function') throw new Error('quitSupplier must be a function');
    if (typeof eventListener !== 'function') throw new Error('eventListener must be a function');
    console.log('Listening to input events from /dev/input/event' + inputId);

    let file = fs.openSync('/dev/input/event' + inputId, 'r');

    while (!quitSupplier()) {
        let data = Buffer.alloc(24);
        let bytesRead = await new Promise(resolve => {
            fs.read(file, data, 0, 24, null, (err, bytesRead) => {
                if (err) throw err;
                resolve(bytesRead);
            });
        });

        if (bytesRead > 0) {
            const event = {
                time: {
                    tv_sec: data.readBigInt64LE(),
                    tv_usec: data.readBigInt64LE(8),
                },
                type: data.readUInt16LE(16),
                code: data.readUInt16LE(18),
                value: data.readInt32LE(20),
            };

            if (event.type === EVENT_TYPE.EV_KEY && event.value === KEY_EVENT_TYPE.DOWN) {
                try {
                    await eventListener(event);
                } catch (e) {
                    console.error(e);
                }
            }

        }
    }
    console.log('Quitting')
}