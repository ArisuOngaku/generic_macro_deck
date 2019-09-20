import {BrowserWindow} from "electron";
import ejs from "ejs";

const rootPath = './resources/';
const defaultLayout = 'layout';
const extension = '.ejs';

export default class UI {
    /**
     * @type {Electron.BrowserWindow}
     */
    window = null;

    constructor() {
        if (new.target === UI) {
            throw 'Cannot instantiate UI directly';
        }
    }

    show() {
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
            type: 'dialog'
        });
        // this.window.webContents.openDevTools();
    }

    close() {
        this.window.destroy();
        this.window = null;
    }

    get title() {
        throw 'Unimplemented';
    }

    get width() {
        throw 'Unimplemented';
    }

    get height() {
        throw 'Unimplemented';
    }

    async load(page) {
        const partial = rootPath + page + extension;
        return new Promise((resolve, reject) => {
            ejs.renderFile(partial, {}, {}, (err, renderedPartial) => {
                if (err) {
                    reject(err);
                    return;
                }

                const layout = rootPath + defaultLayout + extension;
                ejs.renderFile(layout, {content: renderedPartial}, {}, (err, finalRender) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    this.window.loadURL('data:text/html;charset=utf-8,' + encodeURI(finalRender));
                    resolve();
                });
            });
        });
    }
}