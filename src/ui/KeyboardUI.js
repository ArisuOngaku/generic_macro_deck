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
                } else if (arg.type === 'reorder') {
                    this.config.reorderKeys(arg.keys);
                }
            });
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

    get decorated() {
        return false;
    }

    toggle() {
        if (this.window != null && this.window.isVisible()) {
            this.hide();
        } else {
            this.show();
        }
    }

    onKeyPress(key) {
        if (this.window != null) {
            this.window.webContents.send('key_press', key);
        }
    }

    syncNavigation() {
        if (this.window != null) {
            this.window.webContents.send('navigation', this.config.navigation);
        }
    }
}