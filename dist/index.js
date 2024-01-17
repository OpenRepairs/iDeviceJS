"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const plist = require("plist");
const exec_1 = __importDefault(require("./exec"));
let _checkSerial = (serial) => {
    return /^[a-z0-9]{40,40}$/.test(serial)
        || /^[A-Z0-9]{8}-[A-Z0-9]{16}$/.test(serial); // fix for iphone xs xr xmax
};
class iDeviceClient extends events_1.EventEmitter {
    constructor() {
        super();
    }
    /**
     * Gets a list of all currently connected devices.
     * @returns {Promise<DeviceSerial[]>} A promise that resolves with an array containing the I/O serials of the connected devices.
     */
    listDevices() {
        return (0, exec_1.default)('idevice_id', ['-l']).then(output => {
            let stdout = output[0];
            let stderr = output[1];
            let devices = stdout.split('\n');
            let result = [];
            for (let device of devices) {
                device = device.trim();
                if (_checkSerial(device)) {
                    result.push(device);
                }
            }
            return result;
        });
    }
    /**
     * Retrieves properties of a device.
     *
     * @param {DeviceSerial} serial - The serial number of the device.
     * @param {object} option - The options for retrieving properties. This object can contain the following properties:
     *   - simple: If true, retrieves only the simple properties. Default is undefined.
     *   - domain: Specifies the domain of the properties to retrieve. Default is undefined.
     * @returns {Promise<plist.PlistObject>} A promise that resolves with the properties of the device, or rejects with an error message if the serial number is invalid.
     * @throws {Error} If there is an error parsing the properties.
     */
    getProperties(serial, option) {
        if (!_checkSerial(serial))
            return Promise.reject('Invalid I/O serial number');
        const args = ['-u', serial, '-x'];
        if (option) {
            if (('simple' in option) && (option['simple'])) {
                args.push('-s');
            }
            if (('domain' in option) && (option['domain'])) {
                args.push('-q', option['domain']);
            }
        }
        return (0, exec_1.default)('ideviceinfo', args).then(output => {
            try {
                let stdout = output[0];
                let stderr = output[1];
                let result = plist.parse(stdout);
                return result;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Gets the device name.
     *
     * @param {DeviceSerial} serial - The serial number of the device.
     * @param {object} option - The options for retrieving the device name. This object can contain the following properties:
     *  - list: Specifies the types of packages to list. Default is 'user', otherwise can be 'system' or 'all'.
     * @returns {Promise<string>} A promise that resolves with the device name, or rejects with an error message if the serial number is invalid.
     */
    getPackages(serial, option = { list: 'user' }) {
        if (!_checkSerial(serial))
            return Promise.reject('invalid serial number');
        const args = ['-u', serial, '-l', '-o', 'xml'];
        if (option['list'] === 'system') {
            args.push('-o', 'list_system');
        }
        if (option['list'] === 'all') {
            args.push('-o', 'list_all');
        }
        return (0, exec_1.default)('ideviceinstaller', args).then(output => {
            try {
                let stdout = output[0];
                let stderr = output[1];
                let result = [];
                let packages = plist.parse(stdout);
                for (let packageObj of packages) {
                    result.push(packageObj['CFBundleIdentifier']);
                }
                return result;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * Retrieves various diagnostics of the devices.
     * @param {DeviceSerial} serial
     * @param {object} option
     * @returns {Promise<object>}  A promise that resolves with the diagnostics of the device, or rejects with an error message if the serial number is invalid.
     */
    diagnostics(serial, option = { command: 'diagnostics', key: 'All' }) {
        if (!_checkSerial(serial))
            return Promise.reject('invalid serial number');
        const args = ['-u', serial, option['command']];
        if (('key' in option) && (option['key'])) {
            args.push(option['key']);
        }
        return (0, exec_1.default)('idevicediagnostics', args).then(output => {
            try {
                let stdout = output[0];
                let stderr = output[1];
                let result = plist.parse(stdout);
                return result;
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * This function starts a syslog service for a device with a given serial number.
     * It uses the 'idevicesyslog' command to start the service, and emits log data as it is received.
     * If the serial number is invalid, it returns a rejected Promise.
     *
     * @param {DeviceSerial} serial - The serial number of the device.
     * @returns {Promise<EventEmitter>} - Returns a Promise that resolves to an EventEmitter. The EventEmitter emits 'log' events with the log data, and a 'close' event when the syslog service ends.
     * @deprecated This function is currently deprecated due to it's buggy nature, and will be removed in a future release.
     * @throws Will throw an error if the serial number is invalid.
    */
    syslog(serial) {
        if (!_checkSerial(serial))
            return Promise.reject('invalid serial number');
        let patternFile = require('path').join(__dirname, 'patterns.yml');
        let spawn = require('child_process').spawn;
        let emitter = new events_1.EventEmitter();
        let process = spawn('idevicesyslog', ['-u', serial]);
        let Logparser = require('logagent-js');
        let lp = new Logparser(patternFile);
        process.stdout.setEncoding('utf8');
        process.stdout.on('data', (data) => {
            let str = data.toString(), lines = str.split(/(\r?\n)/g);
            for (let line of lines) {
                lp.parseLine(line, 'log', (err, data) => {
                    if (err.message) {
                    }
                    else {
                        emitter.emit('log', data);
                    }
                });
            }
        });
        process.stdout.on('end', () => {
            emitter.emit('close');
        });
        emitter.on('close', () => {
            process.kill();
        });
        return Promise.resolve(emitter);
    }
    /**
     * This function will command the device to reboot
     * @param {DeviceSerial} serial - The I/O serial number of the device.
     * @returns {true} Returns true when complete
     */
    reboot(serial) {
        if (!_checkSerial(serial))
            return Promise.reject('invalid serial number');
        return (0, exec_1.default)('idevicediagnostics', ['restart', '-u', serial]).then(() => {
            return true;
        });
    }
    /**
     * This function will command the device to shutdown
     * @param {DeviceSerial} serial - The I/O serial number of the device.
     * @returns {true} Returns true when complete
     */
    shutdown(serial) {
        if (!_checkSerial(serial))
            return Promise.reject('invalid serial number');
        return (0, exec_1.default)('idevicediagnostics', ['shutdown', '-u', serial]).then(() => {
            return true;
        });
    }
    /**
     * This function will command the device to enter recovery mode
     * @param {DeviceSerial} serial - The I/O serial number of the device.
     * @returns {true} Returns true when complete
     */
    enterRecovery(serial) {
        if (!_checkSerial(serial))
            return Promise.reject('invalid serial number');
        return (0, exec_1.default)('ideviceenterrecovery', [serial]).then(() => {
            return true;
        });
    }
    exitRecovery(serial) {
        if (!_checkSerial(serial))
            return Promise.reject('invalid serial number');
        return (0, exec_1.default)('irecovery', ['-n', '-i', "0x" + serial.split("-")[1].toLowerCase()]).then(() => {
            return true;
        });
    }
    /**
     * This function will retrieve or set the name of the device.
     * @param {DeviceSerial} serial - The I/O serial number of the device.
     * @param {string} newName - The new name of the device.
     * @returns {string} Returns confirmation new name of the device if it was set, otherwise returns original name.
     */
    name(serial, newName) {
        if (!_checkSerial(serial))
            return Promise.reject('invalid serial number');
        const args = ['-u', serial];
        if (typeof newName !== 'undefined') {
            args.push(newName);
        }
        return (0, exec_1.default)('idevicename', args).then(output => {
            let stdout = output[0];
            return stdout.trim();
        });
    }
    /**
     * This function will retrieve the screen resolution of the device.
     * @param {DeviceSerial} serial - The I/O serial number of the device.
     * @returns {Promise<ScreenDetails>} A promise that resolves with the screen resolution of the device, or rejects with an error message if the serial number is invalid.
     */
    getResolution(serial) {
        return this.getProperties(serial, { simple: undefined, domain: 'com.apple.mobile.iTunes' })
            .then((result) => {
            let resolution = {
                width: parseInt(result['ScreenWidth'].toString(), 10),
                height: parseInt(result['ScreenHeight'].toString(), 10),
                scale: parseInt(result['ScreenScaleFactor'].toString(), 10),
                points: {
                    width: null,
                    height: null
                }
            };
            let points = {
                width: Math.floor(resolution.width / resolution.scale),
                height: Math.floor(resolution.height / resolution.scale)
            };
            if ((resolution.width === 1080) && (resolution.height === 1920)) {
                // There is some diffences between Physical Pixels and Rendered Pixels
                // on device iPhone [6,6s,7] plus.
                points = {
                    width: 414,
                    height: 736
                };
            }
            resolution.points = points;
            return resolution;
        });
    }
    /**
     * This function will retrieve the storage information of the device.
     * @param {DeviceSerial} serial
     * @returns {Promise<{StorageDetails}>}
     */
    getStorage(serial) {
        return this.getProperties(serial, { simple: undefined, domain: 'com.apple.disk_usage' })
            .then((result) => {
            let size = result['TotalDataCapacity'];
            let free = result['TotalDataAvailable'];
            let used = size - free;
            return {
                size: size,
                used: used,
                free: free,
                free_percent: (free * 100 / (size + 2))
            };
        });
    }
    /**
     * This function will retrieve the battery information of the device.
     * @param {DeviceSerial} serial
     * @returns {Promise<object>}
     */
    getBattery(serial) {
        return this.getProperties(serial, { simple: undefined, domain: 'com.apple.mobile.battery' })
            .then((result) => {
            const batteryInfo = Object.assign({}, result);
            batteryInfo['level'] = result['BatteryCurrentCapacity'];
            return batteryInfo;
        });
    }
    /**
     * This function will retrieve the device's logs and save them to a temporary directory.
     * @date 17/01/2024
     *
     * @param {DeviceSerial} serial
     * @param {string} filter
     * @returns {Promise<string>} A promise that resolves with the path to the temporary directory containing the logs, or rejects with an error message if the serial number is invalid.
     */
    logs(serial, filter) {
        if (!_checkSerial(serial))
            return Promise.reject('invalid serial number');
        return (0, exec_1.default)('mktemp', ['-d']).then((output) => {
            let stdout = output[0];
            let stderr = output[1];
            let tmpDir = stdout.trim();
            let args = ['-u', serial];
            if (filter) {
                args.push('-f');
                args.push(filter);
            }
            args.push(tmpDir);
            return (0, exec_1.default)('idevicecrashreport', args).then(() => {
                return tmpDir;
            });
        });
    }
}
exports.default = iDeviceClient;
//# sourceMappingURL=index.js.map