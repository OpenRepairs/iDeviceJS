let co = require('co');
const idevicejs = require('./dist');
let fs = require('fs');

const idevice = new idevicejs.default();

co(function* () {
    let devices = yield idevice.listDevices();
    console.log(devices);

    for (let i = 0; i < devices.length; i++) {
        const deviceSerial = devices[i];

        const properties = yield idevice.getProperties(deviceSerial);

        const packages = yield idevice.getPackages(deviceSerial, {list: 'user'});

        const diagnostics = yield idevice.diagnostics(deviceSerial);

        const resolution = yield idevice.getResolution(deviceSerial);

        //const name = yield idevice.name(deviceSerial, "Sam's iPhone 15 Pro");

        console.log(properties);

        //yield idevice.reboot(deviceSerial);
        //yield idevice.shutdown(deviceSerial);

        console.log('attempting logs')

        const tmpDir = yield idevice.logs(deviceSerial);
        console.log(tmpDir);
        
        console.log("Enter Recovery Mode")
        yield idevice.enterRecovery(deviceSerial);

        setTimeout((idevice)=>{
            console.log("Exit Recovery Mode")
            idevice.exitRecovery(deviceSerial);
        }, 1000 * 25, idevice)


    }

}).catch((err) => {
    console.log(err);
});
