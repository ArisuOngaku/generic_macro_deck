import UI from "./UI";
import {ipcMain} from "electron";

export default class KeyboardUI extends UI {
    constructor(config) {
        super();
        this.config = config;
    }

    show() {
        super.show();
        this.load('keyboard').then(() => {
            ipcMain.on('keyboard', (event, arg) => {
                if (arg.type === 'request') {
                    event.reply('config', this.config);
                }
            })
        }).catch(console.error);
    }

    get title() {
        return 'GMD OSD';
    }

    get width() {
        return 500;
    }

    get height() {
        return 640;
    }
}