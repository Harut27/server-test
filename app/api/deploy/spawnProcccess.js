// const { exec } = require('child_process');
const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const net = require('net');
// const spawn = require('child_process').spawn;
const spawn = require('cross-spawn');
const { spawnSync } = require('child_process');


const commandsExmaple = [
    {
        command: "ls",
        args: ["-a"],
        dir: "/var/www"
    },
    {
        command: "top",
        args: ['-bn1'],
        dir: "/var/www"
    }
];

const rejectFilter = (errorMess, commandString) => {


    let isReject = true;
    let sendSuccess = false;
    let m = errorMess.trim();
    let resObj = {
        isReject: isReject,
        sendSuccess: sendSuccess
    }




    // special error handling
    if (
        m === 'Error: %CPU'
        || m === 'error: %CPU\n'
        || m === '%CPU'
        || m === 'Error: %MEM'
        || m === 'error: %MEM\n'
        || m === '%MEM'
        || m === 'RSS'
    ) {
        resObj.sendSuccess = true;
        resObj.isReject = false;
    } else if (
        m.includes('No such file or directory') && commandString.includes('ls -l')
        || m.includes('No such file or directory') && commandString.includes('du -sh')
    ) {
        resObj.sendSuccess = false;
        resObj.isReject = false;
    }
    else {
        resObj.sendSuccess = false;
        resObj.isReject = true;
        // console.log("=====spawn error filteting not appl =====");
    }


    // if (!resObj.isReject) {
    //     console.log(' ');
    //     console.log("===rejectFilter start =====");
    //     console.log("filtering applied: true");
    //     console.log("commandString: ", commandString);
    //     console.log(' ');
    //     console.log("--message start--");
    //     console.log(m);
    //     console.log("--message end--");
    //     console.log(' ');
    //     console.log('filter res: ', resObj);
    //     console.log("===rejectFilter end =====");
    //     console.log(' ');
    // }




    return resObj
};

export const executeLinuexCommands = async (commands) => {

    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    };

    let linuxCommands = commands || [];
    const commandStringForLog = commands[0].command + ' ' + commands[0].args.join(' ');
    //if not array then return
    if (!Array.isArray(linuxCommands)) {
        resObj.message = "Invalid commands, should be an array of commands";
        return resObj;
    }

    const checkIfCildProccesesAreDone = (childProcesses) => {
        let isDone = true;
        for (let childProcess of childProcesses) {
            if (childProcess.exitCode === null) {
                isDone = false;
                break;
            }
        }
        return isDone;
    }

    for (let linuxCommand of linuxCommands) {

        let cmdResObj = {
            success: false,
            message: "Forbidden",
            data: '',
        }

        try {

            const promise = new Promise((resolve, reject) => {

                let outData = '';
                const c = linuxCommand.command;
                const a = linuxCommand.args;
                const d = linuxCommand.dir || '/var/www';
                const sh = linuxCommand.shell || false;
                const env = linuxCommand.env || false;

                const commandString = `${c} ${a.join(' ')}`;
                // console.log("spawn executing: ", commandString);
                
                let spawnConf = {}
                spawnConf.cwd = d;
                sh ? spawnConf.shell = sh : null;
                env ? spawnConf.env = env : null;


                // async spawn start
                // console.log("spawnConf: ", spawnConf);
                const process = spawn(c, a, spawnConf);
                const pid = process.pid;
                // console.log(`Spawned child pid: ${pid}`);


                process.stdout.on('data', (data) => {
                    outData += data
                });

                process.stderr.on('data', (data) => {
                    outData += data
                });

                process.on('spawn error', (error) => {
                    cmdResObj.success = false;
                    cmdResObj.message = "error: " + error.message;
                    process.kill(); // kill the process on error

                    //spawn error needs to be checked if it is rejectable
                    const rejectObj = rejectFilter(error.message, commandString);
                    if (!rejectObj.isReject) {
                        cmdResObj.success = rejectObj.sendSuccess;
                        cmdResObj.success = true;
                        resolve('0');
                    } else {
                        cmdResObj.success = rejectObj.sendSuccess;
                        reject(error);
                    }
                });


                process.on('close', (code) => {
                    if (code !== 0) {
                        cmdResObj.success = false;
                        cmdResObj.message = "error: " + outData;

                        //spawn error needs to be checked if it is rejectable
                        const rejectObj = rejectFilter(outData, commandString);
                        if (!rejectObj.isReject) {
                            cmdResObj.success = rejectObj.sendSuccess;
                            resolve('0');
                        } else {
                            cmdResObj.success = rejectObj.sendSuccess;
                            reject(new Error(outData))
                        }
                    } else {
                        cmdResObj.success = true;
                        cmdResObj.message = "executed";
                        cmdResObj.data = outData;
                        resolve(outData);
                    }
                });


           
                // const process = spawnSync(c, a, spawnConf);
                // const pid = process.pid;
                // // console.log(`Spawned child pid: ${pid}`);
                // resolve(process);

            });
            const result = await promise;


            // //sync spawn start
            // // console.log("spawn result: ", {
            // //     stdout: result.stdout ? result.stdout.toString() : '',
            // //     stderr: result.stderr ? result.stderr.toString() : '',
            // //     status: result.status,
            // //     signal: result.signal,
            // // });

            // const stdout = result.stdout ? result.stdout.toString() : '';
            // const stderr = result.stderr ? result.stderr.toString() : '';
            // cmdResObj.success = true;
            // cmdResObj.data = stdout + (stderr.length > 0 ? ', error' + stderr : '');
            // cmdResObj.message = "executed";
            // //sync spawn end

            // console.log("spawn result: ", result);

        } catch (err) {
            console.log(' ');
            console.log('===== start reject, spawn Error: =====')
            console.log('commandString for log: ', commandStringForLog);
            console.error(err);
            console.log('===== end   reject, spawn Error: =====')
            console.log(' ');
        }

        // console.log("cmdResObj: ", cmdResObj);

        // cmdResObj.data = cmdResObj.data.replace(/\n/g, '-linebreak-');
        // cmdResObj.data = cmdResObj.data.replace(/\r/g, '-linebreak-');
        // cmdResObj.data = cmdResObj.data.trim();

        //replace /n by linebreak
        // resObj.data = resObj.data.replace(/\n/g, '-linebreak-');


        // cmdResObj.data = cmdResObj.data.join('-linebreak-');
        resObj.data.push(cmdResObj);
    }

    //if any of data is unsuccessful, then set success to false
    resObj.success = resObj.data.every(data => data.success);
    if (!resObj.success) {
        resObj.message = "Some commands failed";
    } else {
        resObj.message = "All commands executed successfully";
    }

    // console.log("resObj.data.length: ", resObj.data.length);
    // console.log("resObj.data.length: ", resObj.data);

    if (resObj.data.length === 1) {
        resObj.success = resObj.data[0].success;
        resObj.message = resObj.data[0].message;
        resObj.data = resObj.data[0].data;
    }

    // console.log("executeLinuexCommands: ", commandStringForLog);
    // console.log("executeLinuexCommands resObj: ", resObj);
    return resObj;

};

// executeLinuexCommands(commandsExmaple);