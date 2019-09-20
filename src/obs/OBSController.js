import OBSWebSocket from "obs-websocket-js";
import * as util from 'util';

const sleep = util.promisify(setTimeout);

export default class OBSController {
    address;
    password;

    constructor(address, password) {
        this.address = address;
        this.password = password;
        this.connecting = false;
        this.connected = false;
        this.authenticated = false;
        this.onDisconnected = null;

        this.socket = new OBSWebSocket();
        this.socket.on('error', error => {
            console.error(error);
        }); // Recommended by the documentation
        this.socket.on('ConnectionOpened', () => {
            this.connected = true;
            this.connecting = false;
            console.log('OBS: connected');
        });
        this.socket.on('ConnectionClosed', () => {
            this.connected = false;
            this.authenticated = false;
            this.connecting = false;
            console.log('OBS: disconnected');

            if (typeof this.onDisconnected === 'function') this.onDisconnected();
        });
        this.socket.on('AuthenticationSuccess', () => {
            this.authenticated = true;
            this.connecting = false;
            console.log('OBS: authenticated');
        });
        this.socket.on('AuthenticationFailure', () => {
            this.authenticated = false;
            this.connecting = false;
            console.log('OBS: authentication failure');
        });
    }

    get isReady() {
        return this.connected && this.authenticated;
    }

    async getReady() {
        if (!this.connecting) {
            console.log('Connecting to OBS');
            await this.connect();
        }

        let timeout = 5;
        while (!this.isReady && timeout > 0) {
            console.log('Waiting for connection ...');
            await sleep(1000);
            console.log('out');
            timeout--;
        }

        this.connecting = false;

        return this.isReady;
    }

    async connect() {
        this.connecting = true;
        if (this.connected) {
            throw new Error('Already connected');
        }

        return this.socket.connect({address: this.address, password: this.password});
    }

    /**
     * @param action
     * @param data
     * @returns {Promise<RequestMethodReturnMap[*]>}
     */
    async send(action, data) {
        if (!this.isReady) {
            throw new Error('Not connected');
        }

        return new Promise(async (resolve, reject) => {
            this.onDisconnected = () => resolve('Disconnected');
            setTimeout(() => reject('Send timeout'), 2000);
            try {
                resolve(await this.socket.send(action, data));
            } catch (e) {
                reject(e);
            }
        });
    }
}