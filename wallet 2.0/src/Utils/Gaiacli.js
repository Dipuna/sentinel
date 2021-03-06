const electron = window.require('electron');
const { exec, execSync } = window.require('child_process');
const remote = electron.remote;
const path = window.require('path');

export function runGaiacli(cb) {
    if (remote.process.platform === 'linux') {
        try {
            execSync('chmod +x /usr/lib/sentinel/public/gaiacli');
            // exec('/usr/lib/sentinel/public/gaiacli advanced rest-server --node tcp://209.182.217.171:26657 --chain-id=Sentinel-dev-testnet',
            exec('/usr/lib/sentinel/public/gaiacli advanced rest-server --node http://tm-lcd.sentinelgroup.io:26657 --chain-id=Sentinel-testnet-1.1',
                function (err, stdout, stderr) {
                    if (err) {
                        cb(true)
                    }
                    else {
                        cb(false)
                    }
                })
        } catch (error) {
            cb(true);
        }
    } else if (remote.process.platform === 'darwin') {
        try {
            let gaiacliPath = path.join(remote.process.resourcesPath, 'gaiacli');
            execSync(`chmod +x ${gaiacliPath}`);
            // exec(`${gaiacliPath} advanced rest-server --node tcp://209.182.217.171:26657 --chain-id=Sentinel-dev-testnet`,
            exec(`${gaiacliPath} advanced rest-server --node http://tm-lcd.sentinelgroup.io:26657 --chain-id=Sentinel-testnet-1.1`,

                function (err, stdout, stderr) {
                    if (err) {
                        cb(true)
                    }
                    else {
                        cb(false)
                    }
                })
        } catch (error) {
            cb(true);
        }
    }
    else {
        exec('resources\\extras\\gaiacli.exe advanced rest-server --node http://tm-lcd.sentinelgroup.io:26657 --chain-id=Sentinel-testnet-1.1',
            function (err, stdout, stderr) {
                if (err) {
                    cb(true)
                }
                else {
                    cb(false)
                }
            })
    }
}