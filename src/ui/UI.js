import {BrowserWindow} from "electron";
import ejs from "ejs";
import path from "path";

export const resourcesDirectory = path.resolve(__dirname, '../../resources');
const defaultLayout = 'layout';
const extension = '.ejs';

export default class UI {
    /**
     * @type {Electron.BrowserWindow}
     */
    window = null;

    constructor() {
        if (new.target === UI) {
            throw new Error('Cannot instantiate UI directly');
        }
    }

    show() {
        if (this.window != null) {
            this.window.show();
        } else {
            const title = this.title;
            this.window = new BrowserWindow({
                width: this.width,
                height: this.height,
                title: title,
                webPreferences: {
                    nodeIntegration: true,
                },
                alwaysOnTop: true,
                modal: true,
                type: 'dialog',
                autoHideMenuBar: true,
                frame: this.decorated,
                transparent: !this.decorated,
                titleBarStyle: this.decorated ? 'default' : 'hidden'
            });
            this.window.webContents.openDevTools({
                mode: 'detach',
            });
        }
    }

    hide() {
        this.window.hide();
    }

    close() {
        this.window.destroy();
        this.window = null;
    }

    toggle() {
        if (this.window == null || !this.window.isFocused()) {
            this.show();
        } else {
            this.hide();
        }
    }

    get title() {
        throw new Error('Unimplemented');
    }

    get width() {
        throw new Error('Unimplemented');
    }

    get height() {
        throw new Error('Unimplemented');
    }

    get decorated() {
        return false;
    }

    onKeyPress(key) {
    }

    async load(page) {
        const partial = path.resolve(resourcesDirectory, page + extension);
        return new Promise((resolve, reject) => {
            ejs.renderFile(partial, {}, {}, (err, renderedPartial) => {
                if (err) {
                    reject(err);
                    return;
                }

                const layout = path.resolve(resourcesDirectory, defaultLayout + extension);
                ejs.renderFile(layout, {content: renderedPartial}, {}, (err, finalRender) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    this.window.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(finalRender));
                    resolve();
                });
            });
        });
    }
}