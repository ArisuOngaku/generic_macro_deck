import {ipcMain} from 'electron';
import UI from "./UI";
import * as child_process from "child_process";

export default class KeyboardChoiceUI extends UI {
    constructor() {
        super();
    }

    async prompt(defaultKeyboard) {
        if (defaultKeyboard != null) return defaultKeyboard;

        return new Promise((resolve, reject) => {
            this.show();

            let listener;
            ipcMain.on('keyboard_choice', listener = (event, arg) => {
                console.log(arg);
                if (arg.type === 'request') {
                    child_process.exec('xinput', (err, stdout, stderr) => {
                        if (stderr) {
                            reject(stderr);
                            return;
                        }

                        const keyboards = [];
                        for (let keyboard of stdout.split('\n')) {
                            let regExpMatchArray = keyboard.match('keyboard \\(3\\)');
                            if (regExpMatchArray != null && keyboard.match('(System|Consumer) Control') == null) {
                                keyboard = keyboard.match('↳ (.+?) *\tid=')[1];
                                if (keyboards.indexOf(keyboard) < 0) {
                                    keyboards.push(keyboard);
                                }
                            }
                        }
                        event.reply('keyboard_choice', keyboards);
                    });
                } else if (arg.type === 'input') {
                    ipcMain.removeListener('keyboard_choice', listener);
                    this.close();
                    resolve(arg.input);
                }
            });

            this.load('keyboard_choice').catch(err => {
                ipcMain.removeListener('keyboard_choice', listener);
                console.error(err);
            });
        });
    }

    get title() {
        return 'Generic Macro Deck';
    }

    get width() {
        return 600;
    }

    get height() {
        return 520;
    }
}