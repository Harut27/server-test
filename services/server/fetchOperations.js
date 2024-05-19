const { exec } = require('child_process');

// const util = require('util');
// const execPromisified = util.promisify(exec);

const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const spawn = require('child_process').spawn;
// const { Client } = require('pg');
const crypto = require('crypto');

const forge = require('node-forge');
const dns = require('dns');
const dotenv = require('dotenv');


import { dir, warn } from 'console';
import { executeLinuexCommands } from '../../app/api/deploy/spawnProcccess';
import { argv } from 'process';
import { IconsManifest } from 'react-icons';


export const _installedAppsSample = {
    active: false,
    nextjs: false,
    nextjsVersion: '',
    reactjs: false,
    reactjsVersion: '',
    nodejs: false,
    html: false,
    php: false,
};


export const nginxConfigComments = {
    dummyConofig: "# rp_c&&dummyConfif",
    localHostConfig: "# rp_c&&localHostConfig",
    sslDomainConfig: "# rp_c&&sslConfig",
    noneSslDomainConfig: "# rp_c&&noneSslDomainConfig",
    forwardingConfig: "# rp_c&&forwardingConfig",
}

const __jsonStorePath = '/var/www/reactPanel/reactPanelStore';
export const _jsonStoreFolderPaths = {
    _jsonStorePath: __jsonStorePath,
    account: __jsonStorePath,
    projects: __jsonStorePath + '/projects',
    proccesses: __jsonStorePath + '/proccesses',
    sql: __jsonStorePath + '/sql',
    postgresql: __jsonStorePath + '/postgresql',
    mysql: __jsonStorePath + '/mysql',
}


const getAlgConfig = () => {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from('021ebdf93adfc01a4df233454517ceceaf1e1fafd0c0e273ed2ce4816f3e9027', 'hex');
    const iv = Buffer.from('58c2aafc72c1980136e3273f4a27344c', 'hex');
    return { algorithm, key, iv };
};
// Encrypts text
function encryptPass(text) {
    const { algorithm, key, iv } = getAlgConfig();
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// Decrypts text
function decryptPass(text) {
    const { algorithm, key } = getAlgConfig();
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

const getServerIP = () => {
    const networkInterfaces = os.networkInterfaces();

    for (let interfaceName in networkInterfaces) {
        const netInterface = networkInterfaces[interfaceName];

        for (let i = 0; i < netInterface.length; i++) {
            const alias = netInterface[i];

            if ('IPv4' === alias.family && alias.internal === false) {
                // Return the first external IPv4 address
                return alias.address;
            }
        }
    }

    return '0.0.0.0';
};

const isPortFree = async (port) => {
    const pr = new Promise((resolve) => {
        const server = net.createServer()
            .once('error', () => resolve(true)) // if error, port is in use
            .once('listening', () => server.once('close', () => resolve(false)).close()) // if listening, port is not in use
            .listen(port);
    });

    const result = await pr;
    const isFree = result ? false : true;
    // console.log("isFree: ", port, isFree);
    return isFree;
};

const getFreePort = async (port) => {
    let newPort = port;
    let isFree = await isPortFree(newPort);
    while (!isFree) {
        newPort++;
        isFree = await isPortFree(newPort);
    }
    // console.log("newPort: ", newPort);
    return newPort;
};

const dbExcludeList = [
    'information_schema', 'performance_schema', 'mysql',
    'sys', 'template1', 'template0', 'postgres', 'Role Name'
];
const dbUsersExcludeList = [
    'root', 'mysql.session', 'mysql.sys', 'mysqlxsys', 'debian-sys-maint',
    'pma', 'mysql.infoschema', 'postgres', 'Role Name'
];
const serviceDatabaseNames = ["mysql", "postgresql"];

const additionalDirs = {
    mysql: [
        '/var/lib/mysql',
        '/etc/mysql',
        '/var/log/mysql',
        '/var/run/mysqld'
    ],
}

// ====================================================================


export const getOperations = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }
    const rConfig = { ...reqConfig };
    const all = rConfig.all || false;
    const itemKey = rConfig.itemKey;
    const itemId = rConfig.itemId;

    // console.log("rConfig: ", rConfig);


    // console.log("rConfig: ", rConfig);
    try {
        // console.log("server req data: ", reqConfig);
        if (rConfig.itsForType === "services") {
            if (rConfig.itsFor === "systemInfo") {
                resObj = await getSystemGeneralInfo();
            }
            else if (rConfig.itsFor === "databases") {
                if (all && !itemKey) {

                    const r = [];
                    for (let i = 0; i < serviceDatabaseNames.length; i++) {
                        const dbName = serviceDatabaseNames[i];
                        const res = await getServiceStatus(dbName);
                        r.push(res);
                    }
                    resObj.success = true;
                    resObj.message = "status data fetched successfully";
                    resObj.data = r.map((d, i) => {
                        return { [serviceDatabaseNames[i]]: d.data }
                    });
                } else {
                    resObj = await getServiceStatus(rConfig.itemKey);
                    // console.log("main-----resObj: ", resObj);
                }
            }
            else if (rConfig.itsFor === "projects") {

                if (all) {
                    const r = await getAllProjects(rConfig);
                    resObj = r;
                } else {
                    const r = await getProjectDetails(rConfig);
                    resObj = r;
                }
            } else if (rConfig.itsFor === "files") {
                const r = await getFilesService(rConfig);
                resObj = r;
            }
        }
        else if (rConfig.itsForType === "databases") {
            if (rConfig.itsFor === "mysql") {
                if (itemKey === 'databases') {
                    const dbName = "mysql";
                    if (all) {
                        const r = await getAllDatabases(dbName);
                        resObj = r;
                    }
                    if (!all && itemId) {
                        const r = await getAllDatabases(dbName);
                        const theDb = r.data.find(d => d.name === itemId);
                        resObj.success = true;
                        resObj.message = "Database fetched successfully";
                        resObj.data = theDb || {};
                    }
                }
                if (itemKey === "users") {
                    if (all) {
                        const r = await getAllMysqlUsers('mysql');
                        resObj = r;
                    }
                    if (!all && itemId) {
                        const r = await getAllMysqlUsers('mysql');
                        const theDb = r.data.find(d => d.name === itemId);
                        resObj.success = true;
                        resObj.message = "Database fetched successfully";
                        resObj.data = theDb || {};
                    }
                }
            } else if (rConfig.itsFor === "postgresql") {

                if (itemKey === 'databases') {
                    const dbName = "postgresql";
                    const r = await getAllPostgreSqlDatabases(dbName);
                    resObj = r;
                } else if (itemKey === 'users') {
                    const dbName = "postgresql";
                    const r = await getAllPostgreSqlUsers(dbName);
                    resObj = r;
                }
            }

        } else {
            resObj.message = "Invalid request, request configuration missing or invalid";
        }

    } catch (error) {
        console.error("error: ", error);
    }

    // console.log("resObj: ", resObj);

    return resObj;
};

export const installOperations = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }
    const rConfig = { ...reqConfig };
    console.log("rConfig: ", rConfig);
    const itemKey = rConfig.itemKey;



    try {
        // console.log("server req data: ", reqConfig);
        if (rConfig.itsForType === "services") {
            if (rConfig.itsFor === "databases") {
                const all = rConfig.all || false;

            }
        }
        else if (rConfig.itsForType === "databases") {
            if (rConfig.itsFor === "mysql") {
                const dbName = "mysql";
                const r = await installDatabase(dbName);
                resObj.success = true;
                resObj.message = "All databases fetched successfully";
                resObj.data = r
            } else if (rConfig.itsFor === "postgresql") {
                const dbName = "postgresql";
                const r = await installDatabase(dbName);
                resObj = r;
            }
        } else {
            resObj.message = "Invalid request, request configuration missing or invalid";
        }

    } catch (error) {
        console.error("error: ", error);
    }

    // console.log("resObj: ", resObj);

    return resObj;
};

export const createOperations = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }


    //create database, user ...etc
    const itemKey = reqConfig.itemKey;


    try {
        // console.log("server req data: ", reqConfig);
        if (reqConfig.itsForType === "databases") {
            if (reqConfig.itsFor === "mysql") {
                if (itemKey === 'database') {
                    const r = await createMysqlDatabase(reqConfig);
                    // resObj.success = true;
                    // resObj.message = "Database created successfully";
                    // resObj.data = r
                    resObj = r;
                }
                if (itemKey === 'user') {
                    const r = await createMysqlUser(reqConfig);
                    // resObj.success = true;
                    // resObj.message = "Database created successfully";
                    // resObj.data = r
                    resObj = r;
                }
            } else if (reqConfig.itsFor === "postgresql") {
                if (itemKey === 'database') {
                    const r = await createPostgreSqlDatabase(reqConfig);
                    resObj = r;
                }
                if (itemKey === 'user') {
                    const r = await createPostgreSqlUser(reqConfig);
                    resObj = r;
                }
            }


        } else if (reqConfig.itsForType === "services") {
            if (reqConfig.itsFor === "projects") {
                const r = await createProject(reqConfig);
                resObj = r;
            }
        }
        else {
            resObj.message = "Invalid request, request configuration missing or invalid";
        }

        return resObj;

    } catch (error) {
        console.error("error: ", error);
        return resObj;
    }

    // console.log("resObj: ", resObj);

    return resObj;
};

export const deleteOperations = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }


    //create database, user ...etc
    const itemKey = reqConfig.itemKey;

    try {
        // console.log("server req data: ", reqConfig);
        if (reqConfig.itsForType === "databases") {
            if (reqConfig.itsFor === "mysql") {
                if (itemKey === 'database') {
                    const r = await deleteMysqlDatabase(reqConfig);
                    // resObj.success = true;
                    // resObj.message = "Database created successfully";
                    // resObj.data = r
                    resObj = r;
                }
                if (itemKey === 'user') {
                    const r = await deleteMysqlUser(reqConfig);
                    resObj = r;
                }
            } else if (reqConfig.itsFor === "postgresql") {
                if (itemKey === 'database') {
                    const r = await deletePostgreSqlDatabase(reqConfig);
                    resObj = r;
                }
                if (itemKey === 'user') {
                    const r = await deletePostgreSqlUser(reqConfig);
                    resObj = r;
                }
            }

        }
        else if (reqConfig.itsForType === "services") {
            if (reqConfig.itsFor === "projects") {
                const r = await deleteProject(reqConfig);
                resObj = r;
            }
        }
        else {

            resObj.message = "Invalid request, request configuration missing or invalid";
        }

    } catch (error) {
        console.error("error: ", error);
    }

    // console.log("resObj: ", resObj);

    return resObj;
};

export const updateOperations = async (reqConfig) => {

    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }
    // console.log("reqConfig: ", reqConfig);

    //create database, user ...etc
    const itemKey = reqConfig.itemKey;
    const operation = reqConfig.operation;

    try {
        // console.log("server req data: ", reqConfig);
        if (reqConfig.itsForType === "databases") {
            if (reqConfig.itsFor === "mysql") {
                const r = await updateMysqlDatabase(reqConfig);
                resObj = r;
            } else if (reqConfig.itsFor === "postgresql") {
                const r = await updatePostgresqlDatabase(reqConfig);
                resObj = r;
            }
        } else if (reqConfig.itsForType === "services") {
            if (reqConfig.itsFor === "projects") {
                const r = await updateProjectDetails(reqConfig);
                resObj = r;
            } else if (reqConfig.itsFor === "files") {
                const r = await updateFileService(reqConfig);
                resObj = r;
            }
        };

    } catch (error) {
        console.error("error: ", error);
    }

    // console.log("resObj: ", resObj);

    return resObj;
};




// ====================================================================








// =======service for status data

const getSystemGeneralInfo = async () => {
    // ip, cpu(usage and available), memory(usage and available), disk(usage and available)

    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    function getCpuUsed(str) {
        let breakPoint = false;
        const headerArr = [];
        const otherArr = [];
        const arrayFromStr = str.split('\n');
        arrayFromStr.forEach((line, index) => {
            if (line === '' && index < arrayFromStr.length - 1) {
                breakPoint = true;
                return;
            }
            if (breakPoint) {
                otherArr.push(line);
            } else {
                headerArr.push(line);
            }
        });

        //find cpu status in header arr 
        let cpuLineArr = [];
        headerArr.forEach((line, index) => {
            if (line.includes('Cpu(s):')) {
                cpuLineArr = line.split(',');
                cpuLineArr = cpuLineArr.map((l, i) => {
                    return l.trim();
                });
            }
        });

        let cpuAvailable = 0;
        cpuLineArr.forEach((line, index) => {
            if (line.includes('id')) {
                let v = line.replace('id', '');
                v = v.replace('%', '');
                v = v.trim();
                v = parseFloat(v);
                cpuAvailable = v;
            }
        });

        let cpuUsed = 100 - cpuAvailable
        // console.log("arrayFromStr: ", arrayFromStr);
        // console.log("cpuLineArr: ", cpuLineArr);

        const finalV = cpuUsed.toFixed(1);
        return finalV;
    }

    function getMemUsed(str) {
        let breakPoint = false;
        const headerArr = [];
        const otherArr = [];
        const arrayFromStr = str.split('\n');
        arrayFromStr.forEach((line, index) => {
            if (line === '' && index < arrayFromStr.length - 1) {
                breakPoint = true;
                return;
            }
            if (breakPoint) {
                otherArr.push(line);
            } else {
                headerArr.push(line);
            }
        });

        //find cpu status in header arr 
        let cpuLineArr = [];
        headerArr.forEach((line, index) => {
            if (line.includes('MiB Mem')) {
                cpuLineArr = line.split(',');
                cpuLineArr = cpuLineArr.map((l, i) => {
                    return l.trim();
                });
            }
        });

        let total = 0;
        let free = 0;
        cpuLineArr.forEach((line, index) => {
            if (line.includes('total')) {
                let a = line.replace('total', '');
                a = a.replace('MiB', '');
                a = a.replace('Mem', '');
                a = a.replace(':', '');
                a = a.replace('%', '');
                a = a.trim();
                a = parseFloat(a);
                total = a;
            }
            if (line.includes('free')) {
                let v = line.replace('free', '');
                v = v.replace('%', '');
                v = v.trim();
                v = parseFloat(v);
                free = v;
            }
        });
        // console.log("cpuLineArr: ", cpuLineArr);
        // console.log("cpuLineArr: ", total, free);


        let used = total - free;
        //mb to bytes
        used = used * 1024 * 1024;
        // console.log("arrayFromStr: ", arrayFromStr);
        // console.log("cpuLineArr: ", cpuLineArr);

        const finalV = used.toFixed(0);
        return finalV;
    }

    function formatMemSting(str) {
        let newStr = str.replace('MiB', '').trim();
        newStr = newStr.replace('\\n', '').trim();
        return newStr;

        // const arrayFromStr = str.split('\n');
        // const mem = arrayFromStr[1].trim();
        // return mem;
    }

    function formatDiskSting(str) {
        const arrayFromStr = str.split('\n');
        const disk = arrayFromStr[1].trim();
        return disk;
    }

    let smapleData = {
        ip: 'n/a',
        cpu: {
            total: 100,
            used: 0,
        },
        memory: {
            total: 0,
            used: 0,
        },
        disk: {
            total: 0,
            used: 0,
        }
    }

    try {

        //get ip
        const r_ip = await executeLinuexCommands([
            {
                command: 'hostname',
                args: ['-I'],
                dir: '/var/www'
            }
        ]);
        smapleData.ip = r_ip.success ? r_ip.data.trim() : 0;



        //cpu
        const r_cpu = await executeLinuexCommands([
            {
                command: 'top',
                args: ['-bn1'],
                dir: '/var/www'
            }
        ]);
        smapleData.cpu.used = r_cpu.success ? getCpuUsed(r_cpu.data.trim()) : 0;



        //memory
        const t_mem = await executeLinuexCommands([
            {
                command: 'lsmem -b --summary=only | sed -ne \'/online/s/.* //p\'',
                dir: '/var/www',
                args: [],
                shell: true
            }
        ]);
        smapleData.memory.total = t_mem.success ? formatMemSting(t_mem.data) : 0;


        //memory
        const u_mem = await executeLinuexCommands([
            {
                command: 'top',
                dir: '/var/www',
                args: ['-bn1'],
                // shell: true
            }
        ]);
        smapleData.memory.used = u_mem.success ? getMemUsed(u_mem.data) : 0;




        //disk
        const t_disk = await executeLinuexCommands([
            {
                command: `df --total -B1 | grep total | awk '{print $4}'`,
                dir: '/var/www',
                args: [],
                shell: true
            }
        ]);
        smapleData.disk.total = t_disk.success ? t_disk.data.trim() : 0;

        //disk used
        const u_disk = await executeLinuexCommands([
            {
                command: `df --total -B1 | grep total | awk '{print $3}'`,
                dir: '/var/www',
                args: [],
                shell: true
            }
        ]);
        // console.log("u_disk: ", u_disk);
        smapleData.disk.used = u_disk.success ? u_disk.data.trim() : 0;




        resObj.success = true;
        resObj.data = smapleData;

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;

}


const getServiceStatus = async (dbName) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    try {
        const args_i = dbName === 'postgresql' ? 'psql' : dbName;
        const install_r = await executeLinuexCommands([
            {
                command: 'which',
                args: [args_i],
                dir: '/var/www'
            }
        ]);


        const status_r = await executeLinuexCommands([
            {
                command: 'systemctl',
                args: ['status', dbName, '--no-pager'],
                dir: '/var/www'
            }
        ]);

        resObj = status_r;
        if (!status_r.success) {
            resObj.success = true;
            resObj.data = {};
            resObj.data.active = false;
            resObj.data.installed = install_r.success ? true : false;
        } else {
            resObj.data = formatStatusSting(status_r.data);
            resObj.data.installed = install_r.success ? true : false;
            // console.log("stataus resObj: ", resObj);
        }

        // console.log("resObj: ", resObj);
        // return resObj;

        console.log(`getting status details for ${dbName} service....`);
        //get cpu,memory,disk usage
        const pid = resObj.data?.main_pid || 0;
        // console.log("pid: ", pid);
        if (pid) {
            const c = await getPidCpu(pid);
            resObj.data.cpu = c.success ? c.data : 0;

            const m = await getPidMem(pid);
            resObj.data.memory = m.success ? m.data : 0;

            const d = await getPidDisk(pid);
            resObj.data.disk = d.success ? d.data : 0;
        }


    } catch (error) {
        console.error("error: ", error);
    }



    return resObj;
}


const formatStatusSting = (str) => {
    function correctStatusLine(line) {
        // console.log("line: ", line);
        if (line) {
            const title = Object.keys(line)[0];
            const value = line[title];
            if (title === 'active') {
                if (title === 'active' && (value.split(' ')[0] === 'active' || value.split(' ')[0] === 'running')) {
                    return { [title]: true };
                } else {
                    return { [title]: false };
                }
            }
            else if (title === 'loaded') {
                if (value.includes('loaded')) {
                    return { [title]: true };
                } else {
                    return { [title]: false };
                }
            }
            else if (title === 'process') {
                let v = value.split(' ')[0] || 0;
                if (value.includes(' ') && value.length > 1) {
                    return { [title]: v };
                } else {
                    return { [title]: v };
                }
            }
            else if (title === 'main_pid') {
                let v = value;
                v = v.trim();
                const vs = v.split(' ')
                vs.forEach((s, i) => {
                    const isNumbersOnly = /^\d+(\.\d+)?$/.test(s);
                    const isNotEmp = s !== '' || s.length > 0;
                    if (isNumbersOnly && isNotEmp) {
                        v = s;
                    }
                });
                return { [title]: v };
            }
            else if (title === 'tasks') {
                let v = value.split(' ')[0] || 0;
                if (value.includes(' ') && value.length > 1) {
                    return { [title]: v };
                } else {
                    return { [title]: v };
                }
            }
            else if (title === 'memory') {
                let v = value.replace('M', '')
                //conver mb to bytes
                v = parseInt(v);
                v = v * 1024 * 1024;
                v = v.toString();

                if (value.includes(' ') && value.length > 1) {
                    return { [title]: v };
                } else {
                    return { [title]: v };
                }
            }
            else {
                return line;
            }
        } else {
            return line;
        }
    }

    const results = [];
    //split the response into an array of lines
    const arrayFromStr = str.split('\n');
    // console.log(`==arrayFromStr=== : `, arrayFromStr);
    arrayFromStr.forEach((line, index) => {
        let newLine = line.trim();

        if (newLine && newLine.length > 0) {
            let lineObj = {};
            let n_line = newLine.split(": "); // split the line into two parts
            if (n_line[1]) {
                //add the rest of the line to the second part of the line
                n_line.forEach((l, i) => { i !== 0 && i !== 1 ? n_line[1] += `: ${l}` : null });
            }
            if (n_line.length > 1) {
                const title = n_line[0].toLowerCase().replace(' ', '_');
                lineObj[title] = n_line[1];
                lineObj = correctStatusLine(lineObj);
            } else {
                lineObj[`other-${index}`] = newLine;
                lineObj = correctStatusLine(lineObj);
            }
            results.push(lineObj);
        }
    });


    const objResults = {};
    results.forEach((r, i) => {
        const title = Object.keys(r)[0];
        const value = r[title];
        objResults[title] = value;
    });

    // console.log(`==objResults=== : `, objResults);

    return objResults;
}


const getPidCpu = async (servicePid) => {
    //get cpu,memory,disk usage

    let resObj = {
        success: false,
        message: "Forbidden",
        data: 0
    }
    // resObj.success = true;
    // return resObj;

    function formatCpuSting(_str) {
        let str = _str.trim();
        // console.log("cpu: ", str);
        let arrayFromStr = []
        if (str.includes('\n')) {
            arrayFromStr = str.split('\n');
        } else if (str.includes(' ')) {
            arrayFromStr = str.split(' ');
        } else {
            arrayFromStr.push(str);
        }

        let cpu = 0;
        // console.log("arrayFromStr: ", arrayFromStr);
        arrayFromStr.forEach((line, index) => {
            let l = line.trim();
            const isNumbersOnly = /^\d+(\.\d+)?$/.test(l);
            const isNotEmp = l !== '' || l.length > 0;
            if (isNumbersOnly && isNotEmp) {
                cpu = line;
            }
        });
        return cpu;
    }

    try {

        const p_res = await executeLinuexCommands([
            {
                command: 'ps',
                args: ['-p', servicePid, '-o', '%cpu'],
                dir: '/var/www'
            }
        ]);
        if (!p_res.success) {
            console.log(`command: 'ps -p ${servicePid} -o %cpu' failed`);
            console.log("error getPidCpu p_res: ", p_res);
            resObj.success = true;
            resObj.data = 0;
            return resObj;
        } else {
            resObj.success = true;
            let r = formatCpuSting(p_res.data);
            resObj.data = r;
        }

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;
}


const getPidMem = async (servicePid) => {
    //get cpu,memory,disk usage

    let resObj = {
        success: false,
        message: "Forbidden",
        data: 0
    }

    function formatMemSting(_str) {
        let str = _str.trim();
        let arrayFromStr = []
        if (str.includes('\n')) {
            arrayFromStr = str.split('\n');
        } else if (str.includes(' ')) {
            arrayFromStr = str.split(' ');
        } else {
            arrayFromStr.push(str);
        }

        let cpu = 0;
        arrayFromStr.forEach((line, index) => {
            let l = line.trim();
            const isNumbersOnly = /^\d+(\.\d+)?$/.test(l);
            const isNotEmp = l !== '' || l.length > 0;
            if (isNumbersOnly && isNotEmp) {
                cpu = line;
            }
        });
        return cpu;
    }

    try {
        const rn = await executeLinuexCommands([
            {
                command: 'ps',
                args: ['-p', servicePid, '-o', 'rss'],
                dir: '/var/www'
            }
        ]);

        resObj.success = true;
        resObj.data = formatMemSting(rn.data) || 0;

        if (!rn.success) {
            console.log("error getPidMem rn: ", rn);
        }


    } catch (error) {
        console.error("error: ", error);
    }

    //conver kn to bytes
    let v = resObj.data;
    v = parseInt(v);
    v = v * 1024;
    v = v.toString();
    resObj.data = v;

    return resObj;
}


const getPidDisk = async (servicePid) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: 0
    }

    function formatDiskSting(str) {
        let newStr = str.toString();
        if (newStr.includes('M')) {
            newStr = newStr.trim();
        }
        if (newStr.includes('M')) {
            newStr = newStr.replace('M', '').trim();
        }
        let disk = parseInt(newStr);
        disk = disk * 1024 * 1024;
        return disk.toString();
    }

    try {
        const fileDir = await getPidActualFileLocation(servicePid);
        if (!fileDir.success) {
            resObj.success = true;
            resObj.date = 0;
            return resObj;
        }

        // console.log("fileDir: ", fileDir);

        let moreDirsKey = 'none';
        if (fileDir.data.includes('mysql')) {
            moreDirsKey = 'mysql';
        }

        const a_dirs = additionalDirs[moreDirsKey] || [];
        if (!a_dirs.includes(fileDir.data)) {
            a_dirs.push(fileDir.data);
        }

        let totalDiskUsage = 0;

        for (const dir of a_dirs) {
            let n = 0;
            const r = await executeLinuexCommands([
                {
                    command: 'du',
                    args: ['-sh', dir],
                    dir: '/var/www'
                }
            ]);
            r.success ? n = r.data : n = 0;
            n = formatDiskSting(n);
            totalDiskUsage += parseInt(n);
        }

        resObj.success = true;
        resObj.data = totalDiskUsage.toString();

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;
}


const getPidActualFileLocation = async (servicePid) => {
    //get cpu,memory,disk usage

    let resObj = {
        success: false,
        message: "Forbidden",
        data: "none"
    }

    function formatFileLocationSting(str) {
        const arrayFromStr = str.split(' -> ');
        const disk = arrayFromStr[1].trim();
        return disk;
    }

    try {

        const r = await executeLinuexCommands([
            {
                command: 'ls',
                args: ['-l', '/proc/' + servicePid + '/exe'],
                dir: '/var/www'
            }
        ]);

        // console.log("r: ", r);
        if (!r.success) {
            console.log(`error: getPidActualFileLocation PID-${servicePid} r: `, r);
            resObj.success = true;
            resObj.data = "none";
            return resObj;
        } else {
            resObj.success = true;
            resObj.data = formatFileLocationSting(r.data);
        }

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;
}



// ======================== database --- mysql

//getting dbs
const getAllDatabases = async (dbName) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }


    const formatDbandUsers = (string) => {
        const r = string;
        console.log("r: ", r);

        const t1 = r
            .split('\n')
            .filter((s, i) => {
                let isExclude = false;
                s === '' || s === 'Db\tUser' ? isExclude = true : null;
                return !isExclude;
            })

        const t2 = [];
        t1.map((s, i) => {
            const arr = s.split('\t');
            if (arr.length > 1) {
                t2.push({
                    name: arr[0].trim(),
                    user: arr[1].trim()
                });
            }
        });

        //exclude 
        const t3 = [];
        t2.forEach((o, i) => {
            const isExclude = dbExcludeList.includes(o.db);
            if (!isExclude) {
                t3.push(o);
            }
        });

        // console.log("t1: ", t1);
        // console.log("t2: ", t2);
        // console.log("t3: ", t3);

        return t3 || [];
    }

    const formatAllDbList = (string) => {
        const r = string;
        console.log("r: ", r);

        const t1 = r
            .split('\n')
            .filter((s, i) => {
                let isExclude = false;
                s === '' || s === 'Db\tUser' || s === 'Database' ? isExclude = true : null;
                return !isExclude;
            })
            .filter((s, i) => {
                const isExclude = dbExcludeList.includes(s);
                return !isExclude;
            });

        // console.log("t1: ", t1);
        return t1 || [];
    }


    try {
        const r = await executeLinuexCommands([
            {
                command: dbName,
                args: ['-u', 'root', '-e', ' SELECT Db, User FROM mysql.db;'],
                dir: '/var/www'
            }
        ]);

        const r2 = await executeLinuexCommands([
            {
                command: dbName,
                args: ['-u', 'root', '-e', ' SHOW DATABASES;'],
                dir: '/var/www'
            }
        ]);

        if (r.success && r2.success) {
            const dbwithUsers = formatDbandUsers(r.data);
            const allDbList = formatAllDbList(r2.data);
            const finalList = [];
            allDbList.forEach((db, i) => {
                const isExist = dbwithUsers.find((o, i) => o.name === db);
                if (isExist) {
                    finalList.push(isExist);
                } else {
                    finalList.push({ name: db, user: 'none' });
                }
            });

            resObj.success = true;
            resObj.message = "Databases fetched successfully";
            resObj.data = finalList;

        } else {
            console.log(`error: fetching databaes for ${dbName} failed`);
            console.log(r);
            console.log(r2);
            resObj.success = false;
            resObj.message = "Databases not fetched";
            resObj.data = [];
        }

        // console.log("resObj: ", resObj);
        return resObj;

    } catch (error) {
        console.error("error: ", error);
    }

    //console.log("resObj: ", resObj); 

    return resObj;
}


const getAllMysqlUsers = async (dbName) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    function formatUsersSting(str) {
        // console.log("str: ", str);
        const r_arr = [];
        const s_arr = str.split('\n');
        s_arr.forEach((s, i) => {
            const isNotTitle = s !== 'User';
            const isExclude = dbUsersExcludeList.includes(s);
            if (!isExclude && isNotTitle && s && s.length > 0) {
                r_arr.push(s);
            }
        });
        // console.log("r_arr: ", r_arr);

        return r_arr;
    }

    try {

        const r = await executeLinuexCommands([
            {
                command: dbName,
                args: ['-u', 'root', '-e', 'SELECT User FROM mysql.user;'],
                dir: '/var/www'
            }
        ]);
        // console.log("r: ", r);
        // console.log("r.data: ", formatUsersSting(r.data));
        if (r.success) {
            const d = formatUsersSting(r.data);
            resObj.success = true;
            resObj.message = "Users fetched successfully";
            resObj.data = d.map((user, i) => { return { name: user } });
        } else {
            resObj.success = false;
            resObj.message = "Users not fetched";
            resObj.data = [];
        }


        resObj.success = true;
        return resObj;

    } catch (error) {
        console.error("error: ", error);
    }

    //console.log("resObj: ", resObj); 

    return resObj;
}



//install database
//mysql
const installDatabase = async (dbName) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }
    // console.log("installDatabase: ", dbName);


    try {
        //create proccess json
        const proccessJsonFolder = _jsonStoreFolderPaths.proccesses;
        const proccessJsonPath = `${proccessJsonFolder}/${dbName}.json`;
        let proccessJson = {
            name: dbName,
            processType: 'install',
            status: 'pending',
            completed: false,
            message: 'Installing database ' + dbName,
        }
        const proccessJsonStr = JSON.stringify(proccessJson);
        //if folder not exist create it
        if (!fs.existsSync(proccessJsonFolder)) {
            fs.mkdirSync(proccessJsonFolder, { recursive: true });
        };
        //update proccess json
        fs.writeFileSync(proccessJsonPath, proccessJsonStr);

        // //test
        // const f = fs.readFileSync(proccessJsonPath);
        // const p = JSON.parse(f);
        // resObj.success = true;
        // resObj.message = "test";
        // resObj.data = p;    

        // return resObj;

        //update system
        async function startInstalation() {
            const a = await executeLinuexCommands([{
                command: "apt-get",
                args: ['update'],
                dir: "/var/www"
            }])

            if (!a.success) {
                resObj.success = false;
                resObj.message = "System update failed, (apt-get update)";
                return resObj;
            }

            //install db
            const b = await executeLinuexCommands([{
                command: "apt-get",
                args: ['install', dbName, '-y'],
                dir: "/var/www"
            }])

            if (!b.success) {
                resObj.success = false;
                resObj.message = "Database installation failed";
                return resObj;
            }

            if (a.success && b.success) {
                fs.unlinkSync(proccessJsonPath);
            } else {
                proccessJson.completed = true;
                proccessJson.status = 'failed';
                proccessJson.message = `Database installation failed, ${a.message}, ${b.message}`;
                const proccessJsonStr = JSON.stringify(proccessJson);
                fs.writeFileSync(proccessJsonPath, proccessJsonStr);
            }

        };
        startInstalation();

        resObj.success = true;
        resObj.message = `Database ${dbName} instalaion started`;

    } catch (error) {
        console.error("error: ", error);
    }

    resObj.success = true;
    resObj.message = "test";
    return resObj;
}

const createMysqlDatabase = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }
    const newItemData = reqConfig.data;
    // console.log("createDatabase: ", dbName, reqConfig);


    try {

        const r = await executeLinuexCommands([
            {
                command: 'mysql',
                args: ['-u', 'root', '-e', `CREATE DATABASE ${newItemData.name};`],
                dir: '/var/www'
            }
        ]);

        resObj = r;

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;
};

const createMysqlUser = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    const parentKey = reqConfig.parentKey;
    const parentId = reqConfig.parentId;
    const newItemData = reqConfig.data;
    // console.log("createDatabase: ", dbName, reqConfig);


    try {

        const r = await executeLinuexCommands([
            {
                command: 'mysql',
                args: ['-u', 'root', '-e', `CREATE USER '${newItemData.name}'@'localhost' IDENTIFIED BY '${newItemData.password}';`],
                dir: '/var/www'
            }
        ]);

        resObj = r;

    } catch (error) {
        console.error("error: ", error);

    }

    return resObj;
};


const deleteMysqlDatabase = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }
    const newItemData = reqConfig.data;
    // console.log("createDatabase: ", dbName, reqConfig);


    try {

        const r = await executeLinuexCommands([
            {
                command: 'mysql',
                args: ['-u', 'root', '-e', `DROP DATABASE ${newItemData.name};`],
                dir: '/var/www'
            }
        ]);

        resObj = r;

    } catch (error) {
        console.error("error: ", error);
    }


    return resObj;
};


const deleteMysqlUser = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    const parentKey = reqConfig.parentKey;
    const parentId = reqConfig.parentId;
    const newItemData = reqConfig.data;
    // console.log("createDatabase: ", dbName, reqConfig);

    let linuxCommand = `echo "DROP USER '${newItemData.name}'@'localhost'" | mysql -u root`;

    if (parentKey === 'database' && parentId) {
        linuxCommand = `echo "DROP USER '${newItemData.name}'@'localhost'" | mysql -u root -D ${parentId}`;
    }

    try {


        const r = await executeLinuexCommands([
            {
                command: 'mysql',
                args: ['-u', 'root', '-e', `DROP USER '${newItemData.name}'@'localhost';`],
                dir: '/var/www'
            }
        ]);

        resObj = r;

    } catch (error) {
        console.error("error: ", error);
    }


    return resObj;
};


const updateMysqlDatabase = async (reqConfig) => {
    //for db name, user, password
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }
    // console.log("updateMysqlDatabase: ", reqConfig);

    // resObj.success = true;
    // return resObj;

    let dontSentData = false;
    const operation = reqConfig.operation;
    const commands = [];
    if (operation === 'addUserToDb') {
        const dbName = reqConfig.data.dbName;
        const user = reqConfig.data.user;
        commands.push({
            command: 'mysql',
            args: ['-u', 'root', '-e', `GRANT ALL PRIVILEGES ON ${dbName}.* TO '${user}'@'localhost';`],
            dir: '/var/www'
        });

    } else if (operation === 'removeUserFromDb') {
        const dbName = reqConfig.data.dbName;
        const user = reqConfig.data.user;
        commands.push({
            command: 'mysql',
            args: ['-u', 'root', '-e', `REVOKE ALL PRIVILEGES ON ${dbName}.* FROM '${user}'@'localhost';`],
            dir: '/var/www'
        });

    } else if (operation === 'start') {
        commands.push({
            command: 'systemctl',
            args: ['start', 'mysql'],
            dir: '/var/www'
        });
        dontSentData = true;
    } else if (operation === 'stop') {
        commands.push({
            command: 'systemctl',
            args: ['stop', 'mysql'],
            dir: '/var/www'
        });
        dontSentData = true;

    } else if (operation === 'restart') {
        commands.push({
            command: 'systemctl',
            args: ['reload', 'mysql'],
            dir: '/var/www'
        });
        dontSentData = true;
    } else if (operation === 'changeUserPassword') {
        const user = reqConfig.data.user;
        const password = reqConfig.data.password;
        commands.push({
            command: 'mysql',
            args: ['-u', 'root', '-e', `ALTER USER '${user}'@'localhost' IDENTIFIED BY '${password}';`],
            dir: '/var/www'
        });

    } else if (operation === 'uninstall') {
        commands.push({
            command: 'systemctl',
            args: ['stop', 'mysql'],
            dir: '/var/www'
        });
        commands.push({
            command: 'apt-get',
            args: ['remove', '--purge', 'mysql-server', 'mysql-client', 'mysql-common', '-y'],
            dir: '/var/www'
        });
        commands.push({
            command: 'apt-get',
            args: ['autoremove', '-y'],
            dir: '/var/www'
        });
        commands.push({
            command: 'apt-get',
            args: ['autoclean'],
            dir: '/var/www'
        });
        dontSentData = true;
    } else if (operation === 'install') {
        commands.push({
            command: 'apt-get',
            args: ['install', 'mysql-server', 'mysql-client', 'mysql-common', '-y'],
            dir: '/var/www'
        });
        dontSentData = true;
    }
    else {
        resObj.message = "Invalid request, request configuration missing or invalid";
        return resObj;
    }

    //SELECT * FROM mysql.db WHERE Db = 'database_name' AND User = 'username';
    if (commands.length === 0) {
        resObj.status = false;
        resObj.message = "Invalid request, request configuration missing or invalid";
        return resObj;
    };

    try {

        const r = await executeLinuexCommands(commands);
        resObj = r;
        resObj.data = dontSentData ? {} : r.data;
        console.log("r: ", r);

    } catch (error) {
        console.error("error: ", error);
    }


    return resObj;
};


//postgressql
const updatePostgresqlDatabase = async (reqConfig) => {
    //for db name, user, password
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    };

    let dontSendData = false;
    const commands = [];
    const operation = reqConfig.operation;

    // console.log("updatePostgresqlDatabase: ", reqConfig);

    if (operation === 'restart') {
        commands.push({
            command: 'systemctl',
            args: ['reload', 'postgresql'],
            dir: '/var/www'
        });
        resObj.message = "Postgresql restarted successfully";
    }

    if (operation === 'start') {
        commands.push({
            command: 'systemctl',
            args: ['start', 'postgresql'],
            dir: '/var/www'
        });
        resObj.message = "Postgresql started successfully";
    }

    if (operation === 'stop') {
        commands.push({
            command: 'systemctl',
            args: ['stop', 'postgresql'],
            dir: '/var/www'
        });
        resObj.message = "Postgresql stopped successfully";
    }

    if (operation === 'install') {
        commands.push({
            command: 'apt-get',
            args: ['update'],
            dir: '/var/www'
        });

        commands.push({
            command: 'apt-get',
            args: ['install', 'postgresql', 'postgresql-contrib', '-y'],
            dir: '/var/www'
        });

        commands.push({
            command: 'systemctl',
            args: ['reload', 'postgresql'],
            dir: '/var/www'
        });

        // commands.push({
        //     command: 'systemctl',
        //     args: ['enable', 'postgresql'],
        //     dir: '/var/www'
        // });

        dontSendData = true;
        resObj.message = "Postgresql installed successfully";
    }

    if (operation === 'uninstall') {
        //order
        // sudo apt-get --purge remove postgresql -y
        // sudo rm -rf /etc/postgresql
        // sudo rm -rf /var/lib/postgresql
        // sudo rm -rf /var/log/postgresql
        // DEBIAN_FRONTEND=noninteractive sudo apt-get --purge remove --allow-remove-essential postgresql\* --yes

        commands.push({
            command: 'systemctl',
            args: ['stop', 'postgresql'],
            dir: '/var/www'
        });

        commands.push({
            command: 'apt-get',
            args: ['--purge', 'remove', 'postgresql', '-y'],
            dir: '/var/www'
        });

        commands.push({
            command: 'rm',
            args: ['-rf', '/etc/postgresql'],
            dir: '/var/www'
        });

        commands.push({
            command: 'rm',
            args: ['-rf', '/var/lib/postgresql'],
            dir: '/var/www'
        });

        commands.push({
            command: 'rm',
            args: ['-rf', '/var/log/postgresql'],
            dir: '/var/www'
        });

        commands.push({
            command: 'apt-get',
            args: ['--purge', 'remove', '--allow-remove-essential', 'postgresql*', '--yes'],
            dir: '/var/www'
        });

        dontSendData = true;
        resObj.message = "Postgresql uninstalled successfully";
    }

    if (operation === 'addUserToDb') {
        const rs = await getPostgreSqlAccessCredentials(reqConfig);
        console.log("rs: ", rs);
        if (!rs.success) {
            resObj.message = 'Invalid request, request configuration missing or invalid';
            return resObj;
        } else {
            resObj.success = true;
            resObj.data = rs.data;
            resObj.message = 'Credentials fetched successfully';
            console.log("resObj: ", resObj);
            return resObj;
        }
    }



    if (commands.length === 0) {
        resObj.message = "Invalid request, request configuration missing or invalid";
        return resObj;
    }

    const r = await executeLinuexCommands(commands);

    resObj.success = r.success;
    resObj.data = r.data;
    if (!r.success) {
        resObj.message = r.message;
    }

    if (dontSendData) {
        resObj.data = {};
    }

    return resObj;
}


const getAllPostgreSqlDatabases = async (dbName) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    // resObj.success = true;
    // return resObj;


    // const commands = [];

    function formatDbsSting(str) {

        const s_arr = str.split('\n');
        // console.log("s_arr: ", s_arr);

        const s_arr_t = [];
        s_arr.forEach((s, i) => {
            let ns = s.trim();
            // console.log("trimed ns: ", ns);
            const isLineBreak = ns.includes('----------');
            const isTitle = ns.includes('List of databases');
            const isHeadings = ns.includes('Name') && ns.includes('Owner') && ns.includes('Encoding');
            // console.log("isLineBreak: ", isLineBreak, "isTitle: ", isTitle, "isHeadings: ", isHeadings);
            if (!isLineBreak && !isTitle && !isHeadings && ns.length > 0) {
                s_arr_t.push(s);
            }
        });
        // console.log("s_arr_t: ", s_arr_t);


        const o_arr = [];
        s_arr_t.forEach((s, i) => {
            let name = '';
            let owner = '';
            const splt = s.split('|');
            if (splt.length > 1) {
                name = splt[0].trim();
                owner = splt[1].trim();
            }

            if (owner.length > 0 && name.length > 0) {
                name = name.replace(/\s+/g, ' ');
                owner = owner.replace(/\s+/g, ' ');
                o_arr.push({
                    name: name,
                    owner: owner
                });
            }
        });
        // console.log("o_arr: ", o_arr);

        //exluede default dbs
        const o_arr_2 = o_arr.filter((o, i) => {
            const isExclude = dbExcludeList.includes(o.name);
            return !isExclude;
        });

        return o_arr_2;
    };



    try {
        //check if installed 
        // sudo -u postgres psql -c '\l'
        const postgresqlInstalledRes = await executeLinuexCommands([
            {
                command: 'psql',
                args: ['--version'],
                dir: '/var/www'
            }
        ]);
        if (!postgresqlInstalledRes.success) {
            resObj.success = true;
            resObj.message = "Postgresql not installed";
            return resObj;
        }


        // \pset pager
        // sudo -u postgres psql -c '\l'
        const databasesRes = await executeLinuexCommands([
            {
                command: 'sudo',
                args: ['-u', 'postgres', 'psql', '-c', '\\l'],
                dir: '/var/www'
            }
        ]);
        // console.log("databasesRes: ", databasesRes);
        // resObj.success = true;
        // return resObj;

        // console.log("databasesRes: ", databasesRes);
        if (!databasesRes.success) {
            resObj.success = false;
            resObj.message = databasesRes.message;
            return resObj;
        }

        // return resObj;
        const databases_1 = formatDbsSting(databasesRes.data);
        const databases_2 = databases_1.filter((d, i) => d.name !== 'template0' && d.name !== 'postgres');

        // console.log("databases: ", databases_2);
        resObj.success = true;
        resObj.message = "Databases fetched successfully";
        resObj.data = databases_2;


    } catch (error) {
        console.error("error: ", error);
    }


    return resObj;
}

const getAllPostgreSqlUsers = async (dbName) => {

    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    // resObj.success = true;
    // return resObj;

    function formatUsersSting(str) {

        const s_arr = str.split('\n');

        const s_arr_t = [];
        s_arr.forEach((s, i) => {
            let ns = s.trim();
            // console.log("trimed ns: ", ns);
            const isLineBreak = ns.includes('----------');
            const isTitle = ns.includes('List of roles');
            const isHeadings = ns.includes('Role name') && ns.includes('Attributes');
            // console.log("isLineBreak: ", isLineBreak, "isTitle: ", isTitle, "isHeadings: ", isHeadings);
            if (!isLineBreak && !isTitle && !isHeadings && ns.length > 0) {
                s_arr_t.push(s);
            }
        });
        // console.log("s_arr_t: ", s_arr_t);


        const o_arr = [];
        s_arr_t.forEach((s, i) => {
            let name = '';
            let permissions = '';
            const splt = s.split('|');
            if (splt.length > 1) {
                name = splt[0].trim();
                permissions = splt[1].trim();
            }

            if (permissions.length > 0 && name.length > 0) {
                name = name.replace(/\s+/g, ' ');
                permissions = permissions.replace(/\s+/g, ' ');
                o_arr.push({
                    name: name,
                    permissions: permissions
                });
            }
        });
        // console.log("o_arr: ", o_arr);

        //exluede default users
        const o_arr_2 = o_arr.filter((o, i) => {
            const isExclude = dbUsersExcludeList.includes(o.name);
            return !isExclude;
        });
        return o_arr_2;
    };



    try {

        const res = await executeLinuexCommands([{
            command: 'sudo',
            args: ['-u', 'postgres', 'psql', '-c', '\\du'],
            dir: '/var/www'
        }]);

        if (!res.success) {
            resObj.success = false;
            resObj.message = res.message;
            return resObj;
        }

        const users = formatUsersSting(res.data);
        resObj.success = true;
        resObj.message = "Users fetched successfully";
        resObj.data = users;

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;
}

const createPostgreSqlDatabase = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    const dbName = reqConfig.data.name;
    // console.log("createDatabase: ", dbName, reqConfig);

    try {

        const r = await executeLinuexCommands([{
            command: 'sudo',
            args: ['-u', 'postgres', 'createdb', dbName],
            dir: '/var/www'
        }]);

        // console.log("r: ", r);

        resObj.success = r.success;
        resObj.data = r.data;
        if (!r.success) {
            resObj.message = r.message;
        }

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;

};

const deletePostgreSqlDatabase = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    const dbName = reqConfig.data.name;
    // console.log("createDatabase: ", dbName, reqConfig);

    try {

        const r = await executeLinuexCommands([{
            command: 'sudo',
            args: ['-u', 'postgres', 'dropdb', dbName],
            dir: '/var/www'
        }]);

        resObj.success = r.success;
        resObj.data = r.data;
        if (!r.success) {
            resObj.message = r.message;
        }

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;

};

const createPostgreSqlUser = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    const user = reqConfig.data.name;
    const password = reqConfig.data.password;
    if (!user || !password || user.length < 1 || password.length < 1) {
        resObj.message = "User name and password are invalid or missing";
        return resObj;
    }
    const storePath = _jsonStoreFolderPaths.postgresql;
    // console.log("createDatabase: ", dbName, reqConfig);

    try {

        const r = await executeLinuexCommands([
            {
                command: 'sudo',
                args: ['-u', 'postgres', 'psql', '-c', `CREATE USER ${user} WITH PASSWORD '${password}' CREATEDB CREATEROLE SUPERUSER REPLICATION`],
                dir: '/var/www'
            }
        ]);

        resObj.success = r.success;
        resObj.data = r.data;
        if (!r.success) {
            resObj.message = r.message;
        }

        //create user json with password
        const userJson = {
            name: user,
            password: encryptPass(password)
        };
        const userJsonStr = JSON.stringify(userJson);
        const jsonPath = `${storePath}/${user}.json`;
        //create store folder if not exist
        if (!fs.existsSync(storePath)) {
            fs.mkdirSync(storePath, { recursive: true });
        }

        fs.writeFileSync(jsonPath, userJsonStr);

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;

};

const deletePostgreSqlUser = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    const user = reqConfig.data.name;
    // console.log("createDatabase: ", dbName, reqConfig);

    try {

        const r = await executeLinuexCommands([{
            command: 'sudo',
            args: ['-u', 'postgres', 'psql', '-c', `DROP USER ${user}`],
            dir: '/var/www'
        }]);

        resObj.success = r.success;
        resObj.data = r.data;
        if (!r.success) {
            resObj.message = r.message;
        }

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;

};

const updatePostgreSqlDbandUsers = async (reqConfig) => {
    //for db name, user, password
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    };

    const commands = [];
    const operation = reqConfig.operation;

    if (operation === 'changeUserPassword') {
        const user = reqConfig.data.user;
        const password = reqConfig.data.password;
        commands.push({
            command: 'sudo',
            args: ['-u', 'postgres', 'psql', '-c', `ALTER USER ${user} WITH PASSWORD '${password}'`],
            dir: '/var/www'
        });
        resObj.message = "User password changed successfully";
    }

    if (commands.length === 0) {
        resObj.success = false;
        resObj.message = "Invalid request, request configuration missing or invalid";
        return resObj;
    }

    const r = await executeLinuexCommands(commands);

    resObj.success = r.success;
    resObj.data = r.data;
    if (!r.success) {
        resObj.message = r.message;
    }

    return resObj;
};

const getPostgreSqlAccessCredentials = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    // console.log("getPostgreSqlAccessCredentials: ", reqConfig);

    let connectionString = '';
    const dbName = reqConfig.data.dbName;
    const user = reqConfig.data.user;
    const jsonPath = `${_jsonStoreFolderPaths.postgresql}/${user}.json`;

    try {
        const data = fs.readFileSync(jsonPath);
        let jsonData = JSON.parse(data);
        jsonData.password = decryptPass(jsonData.password);
        connectionString = `postgresql://${user}:${jsonData.password}@localhost:5432/${dbName}`;
        jsonData.connectionString = connectionString;
        resObj.success = true;
        resObj.message = "Credentials fetched successfully";
        resObj.data = jsonData;

        // console.log("jsonData: ", jsonData);
    } catch (error) {
        resObj.message = "Error fetching credentials";
        console.error("error: ", error);
    }

    return resObj;
};


//==============projects

const getProjectDetails = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    const projectName = reqConfig.data.name;
    // console.log("getProjectDetails: ", projectName);

    try {

        const accountD_r = await getAccountJson();
        // console.log("accountD_r: ", accountD_r);

        if (!accountD_r.success) {
            resObj.success = false;
            resObj.message = accountD_r.message;
            return resObj;
        }
        const accountData = accountD_r.data;

        const projectJsonPath = `${_jsonStoreFolderPaths.projects}/${projectName}.json`;
        const projectFolderPath = `/var/www/${projectName}`;


        let installedApps = {..._installedAppsSample};
        const projectJsonRes = getProjectJson(projectName);
        if (!projectJsonRes.success) {
            resObj.success = false;
            resObj.message = projectJsonRes.message;
            return resObj;
        }
        const projectData = projectJsonRes.data;
        resObj.data = projectData;

        //navigate to project and check if there is a package.json file
        if (fs.existsSync(projectFolderPath)) {
            const pckJsonPath = path.join(projectFolderPath, 'package.json');
            const isExistsPckJsonPath = fs.existsSync(pckJsonPath);
            console.log("projectFolderPath: ", projectFolderPath);
            console.log("pckJsonPath: ", pckJsonPath);
            console.log("isExistsPckJsonPath: ", isExistsPckJsonPath);
            if (isExistsPckJsonPath) {
                const packageJsonRow = fs.readFileSync(pckJsonPath);
                const packageJson = JSON.parse(packageJsonRow);
                const dependencies = packageJson.dependencies || {};

                installedApps['nodejs'] = true;
                //check if it is a nextjs project
                if (dependencies['next']) {
                    installedApps.nextjs = true;
                    installedApps.nextjsVersion = dependencies['next'];
                };
                //check if it is a reactjs project
                if (dependencies['react']) {
                    installedApps.reactjs = true;
                    installedApps.reactjsVersion = dependencies['react'];
                };


                //check if project json has descrapency in installed apps if yes update it
                let isUpdateProjectJson = false;
                const projectJsonApps = projectData.installedApps;
                const projectJsonAppsKeys = Object.keys(projectJsonApps);
                projectJsonAppsKeys.forEach((k, i) => {
                    if (installedApps[k] !== projectJsonApps[k]) {
                        isUpdateProjectJson = true;
                    }
                });
                if (isUpdateProjectJson) {
                    projectData.installedApps = installedApps;
                    const projectJsonStr = JSON.stringify(projectData);
                    fs.writeFileSync(projectJsonPath, projectJsonStr);
                }

            }

            //check if it is a php project
            if (fs.existsSync(path.join(projectFolderPath, 'index.php'))) {
                installedApps.php = true;
            }

            //check if it is a wordpress project
            if (fs.existsSync(path.join(projectFolderPath, 'wp-config.php'))) {
                installedApps.php = true;
            }
        }




        if (installedApps?.nodejs) {
            const pm2Res = await getPm2Processes();
            if (!pm2Res.success) {
                console.error("error pm2Res: ", pm2Res);
            } else {
                const projectProccess = pm2Res.data.find((p, i) => p.name === projectName);
                resObj.data.proccessData = projectProccess ? projectProccess : null;
            }
        };


        resObj.data.installedApps = installedApps;
        resObj.success = true;
        const thisServerIP = getServerIP();
        const accessToken = accountData.accessToken;
        resObj.success = true;
        resObj.data.thisServerIP = thisServerIP;
        resObj.data.accessToken = accessToken;
        resObj.data.deployApi = `http://${thisServerIP}:${7000}/api/deploy?at=${accessToken}&pn=${projectName}`;

        // console.log("resObj: ", resObj);
    } catch (error) {
        console.error("error: ", error);
    }


    return resObj;
}

const getAllProjects = async (reqConfig) => {
    //get all folder names under /var/www

    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    const addAllProjectData = reqConfig?.isCompleteProjectData ? true : false;

    try {
        const storePath = _jsonStoreFolderPaths.projects;

        //read all file names except proccesses
        const projectFiles_r = [];
        if (!fs.existsSync(storePath)) {
            //continue
        } else {
            const projectFiles_r2 = fs.readdirSync(storePath);
            projectFiles_r2.forEach((f, i) => { projectFiles_r.push(f); });
        }

        //filter out main.json and proccesses
        const projectFiles = projectFiles_r.filter((f, i) => f !== 'main.json' && f !== 'proccesses');


        const resultProjects = [];
        projectFiles.forEach((f, i) => {
            if (f === 'main.json') return;
            if (!f.includes('.json')) return;
            const projectName = f.replace('.json', '');
            const projectJsonPath = `${storePath}/${f}`;
            const projectJsonRes = getProjectJson(projectName);
            if (projectJsonRes.success) {
                const d = projectJsonRes.data;
                let ds = d.domains.map((d, i) => d.name);
                ds = ds.join(', ');

                if (addAllProjectData) {
                    // const projectFolderPath = `/var/www/${d.name}`;
                    // const projectProccess = fs.existsSync(projectFolderPath) ? getPm2Process(projectName) : null;
                    resultProjects.push(d);
                } else {
                    resultProjects.push({
                        name: d.name,
                        port: d.port,
                        domains: d.domains.length,
                    });
                }
            }
        });


        const pm2Procceses = await getPm2Processes();
        // console.log("pm2Procceses: ", pm2Procceses);
        if (pm2Procceses.success && pm2Procceses.data.length > 0) {
            const pd = pm2Procceses.data;
            const keys = Object.keys(pd[0]);

            resultProjects.forEach((p, i) => {
                const proccess = pd.find((pr, j) => pr.name === p.name) || {};
                // keys.forEach((k, j) => {
                //     // console.log("k: ", k, j);
                //     p[k] = proccess[k] ? proccess[k] : '';
                // });
                p['uptime'] = proccess['uptime'] ? proccess['uptime'] : '';
                p['cpu'] = proccess['cpu'] ? proccess['cpu'] : '';
                p['memory'] = proccess['mem'] ? proccess['mem'] : '';
            });
        }


        resObj.success = true;
        resObj.message = "Projects fetched successfully";
        resObj.data = resultProjects;

    } catch (error) {
        resObj.success = false;
        resObj.message = "Error fetching projects";
        console.error("error: ", error);
    };




    return resObj;
}

const createProject = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {},

    };
    let alreadyExists = false;
    const newItemData = reqConfig.data;
    // console.log("createDatabase: ", dbName, reqConfig);

    if (!newItemData.name) {
        resObj.message = "Invalid request, project name missing";
        return resObj;
    }
    const projectName = newItemData.name;


    try {

        const projectJsonPath = `${_jsonStoreFolderPaths.projects}/${projectName}.json`;

        //if project name already exists in /var/www
        const projectFolderPath = `/var/www/${projectName}`;
        const isExists = fs.existsSync(projectFolderPath);
        // console.log("project folder isExists: ", isExists);
        if (isExists) {
            resObj.message = "Project name already used in /var/www , please choose a different name or remove the existing project from Linux system /var/www";
            return resObj;
        }


        //account, project details
        const thisServerIP = getServerIP();
        const currentProjects = await getAllProjects(reqConfig);
        const allPorts = [];
        currentProjects.data.forEach((p, i) => { p.port ? allPorts.push(p.port) : null });
        let port = 7001;//dummy port
        while (allPorts.includes(port)) {
            port++;
        };
        port = await getFreePort(port);

        // console.log("port final 2: ", port);
        // console.log("allPorts: ", allPorts);
        // console.log("port: ", port);


        //get account details
        const accountJsonRes = getAccountJson();
        if (!accountJsonRes.success) {
            resObj.success = false;
            resObj.message = accountJsonRes.message || "Error fetching account details";
            return resObj;
        }
        const accountData = accountJsonRes.data;
        const accessToken = accountData.accessToken;


        //create project json in reactPanelStore
        const projectObj = {
            type: "html",
            name: projectName,
            path: `/var/www/${projectName}`,
            port: port,
            domains: [],
            deployApi: `http://${thisServerIP}:${7000}/api/deploy?at=${accessToken}`,
            whiteListedIps: [],
            installedApps: {..._installedAppsSample}
        };

        //create project json in /var/www/reactPanelStore
        const createJsonRes = createProjectJson(projectName, projectObj);
        if (!createJsonRes.success) {
            resObj.success = false;
            resObj.message = createJsonRes.message || "Error creating project json";
            return resObj;
        }



        //create project folder
        fs.mkdirSync(projectFolderPath, { recursive: true });

        //create index.html file
        const indexContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${newItemData.name}</title>
                </head>
                <body>
                    <h1>${newItemData.name}</h1>
                    <p>Welcome to ${newItemData.name} project</p>
                    <h2>created with reactPanel</h2>
                </body>
                </html>
            `;
        fs.writeFileSync(`${projectFolderPath}/index.html`, indexContent);



        //add routhing to nginx sites-available and sites-enabled
        // listen 80;default_server;
        const nginx_conf_dummy = `
            ${nginxConfigComments.dummyConofig}
            server {
                listen ${port};
                server_name ${thisServerIP};
                
                location / {
                    root /var/www/${newItemData.name};
                    index index.html;
                }
            }
        `;

        fs.writeFileSync(`/etc/nginx/sites-available/${newItemData.name}.conf`, nginx_conf_dummy);
        fs.writeFileSync(`/etc/nginx/sites-enabled/${newItemData.name}.conf`, nginx_conf_dummy);
        // console.log("nginx_conf_dummy: created");


        //reload nginx
        const nginxRestartRes = await executeLinuexCommands([{
            command: 'systemctl',
            args: ['reload', 'nginx'],
            dir: '/var/www'
        }]);

        //enable project port in firewall
        const firewallRes = await executeLinuexCommands([{
            command: 'ufw',
            args: ['allow', `${port}`],
            dir: '/var/www'
        }]);
        if (!firewallRes.success) {
            resObj.success = true;
            resObj.message = resObj.message.length > 0 ? ", " : "";
            resObj.message = firewallRes.message || "Error enabling port in firewall";
        }



        if (!nginxRestartRes.success) {
            resObj.success = false;
            resObj.message += resObj.message.length > 0 ? ", " : "";
            resObj.message = "Nginx not restarted";
            return resObj;
        }

        resObj.success = true;
        resObj.message = "Project created successfully";
        return resObj;


    } catch (error) {
        console.error("error: ", error);
        return resObj;
    }



    return resObj;

};


const deleteProject = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "",
        data: {}
    }
    const newItemData = reqConfig.data;
    // console.log("createDatabase: ", dbName, reqConfig);

    if (!newItemData.name) {
        resObj.message = "Invalid request, project name missing";
        return resObj;
    }

    try {

        //get project json data
        const projectJsonRes = getProjectJson(newItemData.name);
        if (!projectJsonRes.success) {
            resObj.success = false;
            resObj.message = projectJsonRes.message || "Error fetching project details";
            return resObj;
        }
        const projectJson = projectJsonRes.data;
        const installedApps = projectJson.installedApps || {..._installedAppsSample};
        const isNodeApp = installedApps.nodejs;

        //if noed app delete from pm2
        if (isNodeApp) {

            //stop
            const pm2StopRes = await executeLinuexCommands([{
                command: 'npx',
                args: ['pm2', 'stop', newItemData.name],
                dir: '/var/www'
            }]);
            if (!pm2StopRes.success) {
                resObj.message += resObj.message.length > 0 ? ", " : "";
                resObj.message += "PM2: Project not stopped";
            }

            //delete
            const pm2Res = await executeLinuexCommands([{
                command: 'npx',
                args: ['pm2', 'delete', newItemData.name],
                dir: '/var/www'
            }]);

            //close project port 


            if (!pm2Res.success) {
                resObj.message += resObj.message.length > 0 ? ", " : "";
                resObj.message += "PM2: Project not deleted";
            }

        };


        //delete project folder
        const projectPath = `/var/www/${newItemData.name}`;
        if (!fs.existsSync(projectPath)) {
            resObj.success = true;
            resObj.message += resObj.message.length > 0 ? ", " : "";
            resObj.message = "Project folder not found";
        } else {
            fs.rmSync(projectPath, { recursive: true });
        }

        //delete nginx config
        const saPath = `/etc/nginx/sites-available/${newItemData.name}.conf`;
        const sePath = `/etc/nginx/sites-enabled/${newItemData.name}.conf`;
        if (fs.existsSync(saPath)) {
            fs.rmSync(saPath);
        };

        if (fs.existsSync(sePath)) {
            fs.rmSync(sePath);
        };

        //delete project json
        const projectStoreFolderPath = _jsonStoreFolderPaths.projects;
        const projectJsonPath = projectStoreFolderPath + '/' + newItemData.name + '.json';
        if (fs.existsSync(projectJsonPath)) {
            fs.rmSync(projectJsonPath);
        };

        //close the port in firewall
        const port = projectJson.port;
        const firewallRes = await executeLinuexCommands([{
            command: 'ufw',
            args: ['delete', 'allow', `${port}`],
            dir: '/var/www'
        }]);
        if (!firewallRes.success) {
            resObj.success = true;
            resObj.message += resObj.message.length > 0 ? ", " : "";
            resObj.message = firewallRes.message || "Error enabling port in firewall";
        }


        //restart nginx
        const nginxRestartRes = await executeLinuexCommands([{
            command: 'systemctl',
            args: ['reload', 'nginx'],
        }]);

        if (!nginxRestartRes.success) {
            resObj.success = false;
            resObj.message += resObj.message.length > 0 ? ", " : "";
            resObj.message = "Nginx not restarted";
            return resObj;
        };



        resObj.success = true;
        resObj.message = "Project deleted successfully";
        return resObj;

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;
};


const updateProjectDetails = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }
    const newItemData = reqConfig.data;
    const operation = reqConfig.operation;



    if (!newItemData.name) {
        resObj.message = "Invalid request, project name missing";
        return resObj;
    }

    if (operation === 'start' || operation === 'stop' || operation === 'restart') {
        const r = await executeLinuexCommands([{
            command: 'npx',
            args: ['pm2', operation, newItemData.name],
            dir: '/var/www/' + newItemData.name
        }]);

        resObj = r;
        resObj.message = "Project " + operation + " successfully";
        return resObj;
    }

    if (operation === 'addDomain' || operation === 'updateDomain') {

        const isUpdateDomain = operation === 'updateDomain';
        try {

            //check if the new domain is added on any project for AddDomain
            if (!isUpdateDomain) {
                const allProjectsRes = await getAllProjects({ isCompleteProjectData: true });
                if (!allProjectsRes.success) {
                    resObj.success = false;
                    resObj.message = allProjectsRes.message || "Error fetching project details";
                    return resObj;
                }
                let isDomaindAdded = { status: false, project: '' }
                allProjectsRes.data.forEach((p, i) => {
                    p.domains.forEach((d, j) => {
                        if (d.name === newItemData.name) {
                            isDomaindAdded = { status: true, project: p.name };
                        }
                    });
                });

                if (isDomaindAdded.status) {
                    resObj.success = false;
                    resObj.message = `Domain already added to project ${isDomaindAdded.project}, remove it from there first and try again`;
                    return resObj;
                }
            }

            // console.log("addDomain: ", newItemData);
            const projectName = reqConfig.itemId || '';
            const domainObj = newItemData;
            domainObj.active = false;
            const domainName = domainObj.name;
            const isSSLenabled = newItemData.ssl;
            const isLetsEncrypt = newItemData.letsEncrypt;
            // resObj = await updateProjectJson(reqConfig);
            // return resObj;

            //update project json with new domain config
            const currentProjectJsonRes = getProjectJson(projectName);
            if (!currentProjectJsonRes.success) {
                resObj.success = false;
                resObj.message = currentProjectJsonRes.message || "Error fetching project details";
                return resObj;
            }
            let currentProjectJson = currentProjectJsonRes.data;
            const currentDomains = currentProjectJson.domains || [];
            let newDomains = [...currentDomains];
            const isDomainExits = currentDomains.find((d, i) => d.name === domainName);

            if (isUpdateDomain) {
                //update domain
                if (!isDomainExits) {
                    resObj.success = false;
                    resObj.message = "Domain does not exists, please refresh the page and try again";
                    return resObj;
                }
                currentDomains.forEach((d, i) => {
                    if (d.name === domainName) {
                        newDomains[i] = domainObj;
                    }
                });

            } else {
                //add domain
                if (isDomainExits) {
                    resObj.success = false;
                    resObj.message = "Domain already exists, please refresh the page and try again";
                    return resObj;
                }
                newDomains.push(domainObj);
            }

            currentProjectJson.domains = newDomains;
            const createRes = createProjectJson(projectName, currentProjectJson);
            if (!createRes.success) {
                resObj.success = false;
                resObj.message = createRes.message;
                return resObj;
            }
            const projectJson = currentProjectJsonRes.data;



            // SSL AREA START
            // check if domain is pointing to this server
            const domainIpRes = await getDomainIP(newItemData.name);

            let domainIp = '';
            if (!domainIpRes.success) {
                resObj.success = true;
                resObj.warning = true;
                resObj.message = "Domain added but there was no IP found for the domain, (A record)...etc";
                return resObj;
            } else {
                domainIp = domainIpRes.data;
            }

            const thisServerIP = getServerIP();
            const isDomainPointingToServer = domainIp === thisServerIP;
            if (!isDomainPointingToServer) {
                resObj.success = true;
                resObj.warning = true;
                resObj.message = "Domain added but domain is not pointing to this server, SSL will not be installed";
                return resObj;
            }


            //if SSL but not LetsEncrypt, check if fullchain and privkey are provided
            //with custom SSL
            let isUpdateNginx = false;
            if (isSSLenabled && !isLetsEncrypt) {
                //check if fullchain and privkey are provided and valid

                const fullchain = newItemData.fullchain;
                const privkey = newItemData.privkey;
                const sslFolder = `/etc/customSSL/live`;

                if (!fullchain || !privkey) {
                    resObj.success = true;
                    resObj.warning = true;
                    resObj.message = "Domain added but fullchain and privkey are required for SSL";
                    return resObj;
                }
                const isCertOK = validateCertChainAndKey(fullchain, privkey);
                if (!isCertOK) {
                    console.log("error: cetificate is invalid, ", isCertOK);
                    resObj.success = true;
                    resObj.warning = true;
                    resObj.message = "Domain added but invalid SSL certificate provided";
                    return resObj;
                }
                const isCertMatchesDomain = validateCertMatchesDomain(domainName, fullchain);
                if (!isCertMatchesDomain) {
                    console.log("error: cetificate does not match domain, ", isCertMatchesDomain);
                    resObj.success = true;
                    resObj.warning = true;
                    resObj.message = "Domain added but certificate does not match domain";
                    return resObj;
                }

                //create cert files 
                const pemPath = `${sslFolder}/${domainName}/${projectName}/fullchain.pem`;
                const keyPath = `${sslFolder}/${domainName}/${projectName}/privkey.pem`;

                const pemRes = createFile(pemPath, fullchain);
                if (!pemRes.success) {
                    resObj.success = false;
                    resObj.message = "Error asaving fullchain please try again";
                    return resObj;
                }
                const keyRes = createFile(keyPath, privkey);
                if (!keyRes.success) {
                    resObj.success = false;
                    resObj.message = "Error asaving key please try again";
                    return resObj;
                }


            };

            if (isSSLenabled && isLetsEncrypt) {
                const email = projectJson.projectEmail || 'info@adroot.io';
                //create cert files
                const certBotRes = await executeLinuexCommands([{
                    command: 'sudo',
                    args: [
                        'certbot', 'certonly', '--nginx', '--preferred-challenges',
                        'http', '--rsa-key-size', '2048', '--email', email,
                        '--agree-tos', '-d', domainName, '-d', 'www.' + domainName,
                        '--non-interactive'
                    ],
                    dir: '/var/www'
                }]);
                console.log("certBotRes: ", certBotRes);

                if (!certBotRes.success) {
                    resObj.message = resObj.message.length > 0 ? ", " : "";
                    resObj.message = "Error creating SSL certificate,checck if domain is pointing to this server and try updating ssl certificate(s) later both www and non-www";
                }
            };




            //update nginx config
            const nginxUpdateRes = await updateNginxConfig(projectName, projectJson, domainObj, false);
            if (!nginxUpdateRes.success) {
                resObj.success = false;
                resObj.message = nginxUpdateRes.message || "Error updating nginx config";
                return resObj;
            }


        } catch (error) {
            console.error("error: ", error);
            resObj.success = false;
            resObj.message = "Error adding domain, error: " + error;
        }
        resObj.success = true;
        resObj.message = isUpdateDomain ? "Domain updated successfully" : "Domain added successfully";
        return resObj;
    }

    if (operation === 'deleteDomain') {
        //continue to update project json
    };


    try {

        //get current project data
        const currentProjectRes = await getProjectDetails(reqConfig);
        if (!currentProjectRes.success) {
            resObj.success = false;
            resObj.message = currentProjectRes.message;
            return resObj;
        }

        const currentProjectData = currentProjectRes.data;
        let newProjectData = { ...currentProjectData };
        newProjectData.whiteListedIps = newItemData.whiteListedIps ? newItemData.whiteListedIps.map((ip, i) => ip.trim()) : [];
        newProjectData.projectEmail = newItemData.projectEmail || '';
        newProjectData.domains = newItemData.domains || [];



        //update project json 
        const storePromise = new Promise((resolve, reject) => {
            const folderPath = _jsonStoreFolderPaths.projects;
            const filePath = folderPath + '/' + newItemData.name + '.json';
            if (fs.existsSync(filePath)) {
                const data = JSON.stringify(newProjectData, null, 2);
                fs.writeFile(filePath, data, (err) => {
                    if (err) {
                        console.error("err: ", err);
                        resObj.success = false;
                        resObj.message += resObj.message.length > 0 ? ", " : "";
                        resObj.message = "Error updating project json file";
                        reject(false);
                        return;
                    }

                    resObj.success = true;
                    // resObj.message += resObj.message.length > 0 ? ", " : "";
                    // resObj.message = "Project file updated successfully";
                    resolve(true);
                });
            } else {
                resObj.success = false;
                resObj.message += resObj.message.length > 0 ? ", " : "";
                resObj.message = "Project json file not found";
                reject(false);
            }

        });
        await storePromise;
        if (!storePromise) { return resObj; }

        resObj.message = "Project updated successfully";
        resObj.data = newProjectData;

    } catch (error) {
        console.error("error: ", error);
    }

    return resObj;
}



const runNodeVersion = async (projectPath) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    try {
        const nodeVersion = new Promise((resolve, reject) => {
            const process = spawn('node', ['--version'], { cwd: projectPath });
            let stdoutData = '';
            let stderrData = '';

            process.stdout.on('data', (data) => {
                stdoutData += data;
            });

            process.stderr.on('data', (data) => {
                stderrData += data;
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    resObj.success = false;
                    resObj.message = "node version error " + stderrData;
                    reject(new Error(stderrData));
                } else {
                    resObj.success = true;
                    resObj.message = "node version success";
                    resObj.data = stdoutData;
                    resolve(stdoutData);
                }
            });
        });
        const result = await nodeVersion;
    }
    catch (err) {
        resObj.success = false;
        resObj.message = "node version error";
        console.error(err);
    }
    return resObj;
};



//==============files, service 

const getFilesService = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    };

    const rData = reqConfig.data;
    const requestPath = rData.path || '/var/www';

    try {
        //get all files and folders in the requested path
        const isExists = fs.existsSync(requestPath);
        if (!isExists) {
            resObj.success = false;
            resObj.message = "Path not found";
            return resObj;
        }
        const files = fs.readdirSync(requestPath, { withFileTypes: true });

        const filesWithContent = [];
        for (const file of files) {
            const fileName = file.name;
            // const filePath = path.join(requestPath, fileName);
            const filePath = path.join(requestPath, fileName);

            //check if valid file with extension
            const fileNameSplit = fileName.split('.');
            const hasExtension = fileName.includes('.') && fileNameSplit[fileNameSplit.length - 1].length > 0;

            if (file.isFile() && hasExtension) {
                // console.log("fileName: ", fileName);
                // console.log("filePath: ", filePath);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                filesWithContent.push({
                    name: fileName,
                    path: requestPath,
                    content: fileContent,
                    type: 'file'
                });

            } else {
                filesWithContent.push({
                    name: fileName,
                    path: requestPath,
                    content: '',
                    type: 'folder'
                });
            }
        };

        resObj.success = true;
        resObj.message = "Files fetched successfully";
        resObj.data = filesWithContent;

        return resObj;
    } catch (err) {
        resObj.success = false;
        resObj.message = "Error fetching files";
        console.error("error: ", err);
        resObj.data = [];
        return resObj;
    }

    return resObj;
};

const updateFileService = async (reqConfig) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {},
    };

    const operation = reqConfig.operation;
    const data = reqConfig.data;
    const isCreate = operation === 'create';

    try {
        //checks
        if (!data.name || data.name === '' && !isCreate) {
            resObj.success = false;
            resObj.message = "Invalid request, file name is invalid";
            return resObj;
        }
        if (!data.path || data.path === '' && !isCreate) {
            resObj.success = false;
            resObj.message = "Invalid request, file path is invalid";
            return resObj;
        }

        const filePath = path.join(data.path, data.name);
        if (!isCreate) {
            const isExists = fs.existsSync(filePath);
            if (!isExists) {
                resObj.success = false;
                resObj.message = "File not found";
                return resObj;
            }
        }

        if (operation === 'updateNameOrContent') {

            const fileName = data.name;
            const fileNewName = data.newName || data.name;
            const fileContent = data.content || null;

            //update file content
            if (fileContent) {
                fs.writeFileSync(filePath, fileContent);
            }

            //rename file
            if (fileName !== fileNewName) {
                const newFilePath = path.join(data.path, fileNewName);
                fs.renameSync(filePath, newFilePath);
            }

            resObj.success = true;
            resObj.message = "Updated";
            return resObj;


        };

        if (operation === 'create') {
            // console.log("create file reqConfig: ", reqConfig);
            const fileName = data.name;
            const fileContent = data.content || '';
            const filePath = path.join(data.path, fileName);
            const fileType = data.type || 'file';

            //check if already exists
            const isExists = fs.existsSync(filePath);
            if (isExists) {
                resObj.success = false;
                resObj.message = "File already exists";
                return resObj;
            }

            //create file
            if (fileType === 'file') {
                console.log("create fileContent: ", fileContent);
                fs.writeFileSync(filePath, fileContent);
            } else {
                fs.mkdirSync(filePath, { recursive: true });
            }

            resObj.success = true;
            resObj.message = "File created";
            return resObj;
        }

        if (operation === 'delete') {
            fs.rmSync(filePath);
            resObj.success = true;
            resObj.message = "File deleted";
            return resObj;
        }


        return resObj;

    } catch (err) {
        resObj.success = false;
        resObj.message = "Error updating file";
        console.error("error: ", err);
        return resObj;
    }

    return resObj;

};


//=============UTILS


const getProjectJson = (projectName) => {
    const projectJsonPath = `${_jsonStoreFolderPaths.projects}/${projectName}.json`;
    let result = {
        success: false,
        message: "Forbidden",
        data: {}
    }
    try {
        const isExists = fs.existsSync(projectJsonPath);
        if (!isExists) {
            result.success = false;
            result.message = "Project json file not found";
            return result;
        }
        const data = fs.readFileSync(projectJsonPath);
        const jsonData = JSON.parse(data);

        result.success = true;
        result.message = "Project fetched successfully";
        result.data = jsonData;
    } catch (error) {
        result.success = false;
        result.message = "Error fetching project";
        console.error("error: ", error);
    }

    return result;
};

const createProjectJson = (projectName, projectObj) => {
    const storePath = _jsonStoreFolderPaths.projects;
    const projectJsonPath = `${storePath}/${projectName}.json`;
    let result = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    try {
        //create store folder if not exist
        if (!fs.existsSync(storePath)) {
            fs.mkdirSync(storePath, { recursive: true });
        }

        const data = JSON.stringify(projectObj, null, 2);
        fs.writeFileSync(projectJsonPath, data);
        result.success = true;
        result.message = "Project created successfully";
        result.data = projectObj;
    } catch (error) {
        result.success = false;
        result.message = "Error creating project";
        console.error("error: ", error);
    }

    return result;
};

const getAccountJson = () => {
    let result = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    try {
        const accountJsonPath = _jsonStoreFolderPaths.account + '/main.json';
        const data = fs.readFileSync(accountJsonPath);
        const jsonData = JSON.parse(data);
        result.success = true;
        result.message = "Account fetched successfully";
        result.data = jsonData;
    } catch (error) {
        result.success = false;
        result.message = "Error fetching account";
        result.data = {};
        console.error("error: ", error);
    }

    return result;
};


const getAllProjects2 = async (projectPath) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    const workDir = '/var/www';
    try {
        const promise = new Promise((resolve, reject) => {

            const process = spawn('top', ['-bn1'], { cwd: workDir });
            let stdoutData = '';
            let stderrData = '';

            process.stdout.on('data', (data) => {
                stdoutData += data;
            });

            process.stderr.on('data', (data) => {
                stderrData += data;
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    resObj.success = false;
                    resObj.message = "node version error " + stderrData;
                    reject(new Error(stderrData));
                } else {
                    resObj.success = true;
                    resObj.message = "node version success";
                    resObj.data = stdoutData;
                    resolve(stdoutData);
                }
            });
        });
        const result = await promise;
    }
    catch (err) {
        resObj.success = false;
        resObj.message = "node version error";
        console.error(err);
    }

    console.log("spawn ==== resObj: ", resObj);
    return resObj;
};

const getPm2Processes = async () => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    };

    //check if project is running on pm2
    function formatPm2OutPut(output) {
        // Split output into lines
        const lines = output.split('\n');

        // Filter out lines that don't represent data
        const dataLines = lines.filter(line => !line.includes('┌') && !line.includes('├') && !line.includes('└'));

        // Map each line to an object
        const data = dataLines.map(line => {
            // Split line into columns
            const columns = line.split('│').map(column => column.trim());

            // Return object with properties corresponding to columns
            return {
                id: columns[1],
                name: columns[2],
                namespace: columns[3],
                version: columns[4],
                mode: columns[5],
                pid: columns[6],
                uptime: columns[7],
                restarts: columns[8],
                status: columns[9],
                cpu: columns[10],
                mem: columns[11],
                user: columns[12],
                watching: columns[13]
            };
        });

        const filteredData = data.filter(d => {
            const isInvalidId = !d.id || d.id === 'id' || d.id === '';
            return !isInvalidId;
        });

        return filteredData;
    }

    const pm2Res = await executeLinuexCommands([{
        command: 'npx',
        args: ['pm2', 'list'],
        dir: '/var/www'
    }]);

    // console.log("pm2Res: ", pm2Res);
    // console.log("pm2Res.data: ", formatPm2OutPut(pm2Res.data));
    if (!pm2Res.success) {
        resObj.success = false;
        resObj.message = pm2Res.message || "Error fetching pm2 processes";
        return resObj;
    }

    resObj.success = true;
    resObj.message = "Pm2 processes fetched successfully";
    resObj.data = formatPm2OutPut(pm2Res.data) || [];


    return resObj;
};


async function getDomainIP(domain) {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    try {
        const promise = new Promise((resolve, reject) => {
            dns.lookup(domain, (err, address) => {
                if (err) {
                    resObj.success = false;
                    resObj.message = "Error fetching domain IP";
                    reject(err);
                } else {
                    resObj.success = true;
                    resObj.message = "Domain IP fetched successfully";
                    resObj.data = address;
                    resolve(address);
                }
            });
        });
        await promise;

    } catch (error) {
        resObj.success = false;
        resObj.message = "Error fetching domain IP";
        // console.error("error: ", error);
    }

    return resObj;
}

function validateCertChainAndKey(_chainPem, _keyPem) {

    let isVal = false;
    try {
        // Parse the JSON strings back to regular strings
        let chainPem = _chainPem;
        let keyPem = _keyPem;

        //   const pki = forge.pki;
        //   var privateKey = pki.privateKeyFromPem(keyPem);
        //   console.log(privateKey);



        // Parse the private key from PEM to a forge object
        const key = forge.pki.privateKeyFromPem(keyPem);
        // console.log("key: ", key);

        // Split the chain into individual certificates
        const certs = chainPem.trim().split(/(?=-----BEGIN CERTIFICATE-----)/g);

        // Parse the end-entity certificate (the first one in the chain) from PEM to a forge object
        const cert = forge.pki.certificateFromPem(certs[0]);

        // Get the public key from the certificate
        const certPublicKey = cert.publicKey;

        // Get the public key from the private key
        const keyPublicKey = forge.pki.setRsaPublicKey(key.n, key.e);

        // Compare the public keys
        isVal = certPublicKey.n.compareTo(keyPublicKey.n) === 0 && certPublicKey.e.compareTo(keyPublicKey.e) === 0;


    } catch (error) {
        console.error("error: ", error);
    }

    return isVal;
}


function validateCertMatchesDomain(domain, _chainPem) {
    let isVal = false;
    try {
        // Parse the JSON strings back to regular strings
        let chainPem = _chainPem;

        // Split the chain into individual certificates
        const certs = chainPem.trim().split(/(?=-----BEGIN CERTIFICATE-----)/g);

        // Parse the end-entity certificate (the first one in the chain) from PEM to a forge object
        const cert = forge.pki.certificateFromPem(certs[0]);

        // Get the subject common name from the certificate
        const commonName = cert.subject.getField('CN').value;
        console.log("commonName: ", commonName);
        // Check if the common name matches the domain
        isVal = commonName === domain;

    } catch (error) {
        console.error("error: ", error);
    }

    return isVal;
}

export const getFile = (filePath) => {
    const projectJsonPath = filePath;
    let result = {
        success: false,
        message: "Forbidden",
        data: {}
    }
    try {
        const isNoneJsonFileExt = !filePath.includes('.json');
        const isExists = fs.existsSync(projectJsonPath);
        if (!isExists) {
            result.success = false;
            result.message = "Project json file not found";
            return result;
        }
        let data = '';
        let jsonData = {};
        if (isNoneJsonFileExt) {
            data = fs.readFileSync(projectJsonPath, 'utf8');
            jsonData = data;
        } else {
            data = fs.readFileSync(projectJsonPath);
            jsonData = JSON.parse(data);
        }

        result.success = true;
        result.message = "File Fetched successfully";
        result.data = jsonData;
    } catch (error) {
        result.success = false;
        result.message = "Error fetching file";
        console.error("error: ", error);
    }

    return result;
};



export const createFile = (filePath, data) => {
    let result = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    try {
        //create store folder if not exist
        let dirPath = path.dirname(filePath);

        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, data);
        result.success = true;
        result.message = "File created successfully";
        result.data = data;
    } catch (error) {
        result.success = false;
        result.message = "Error creating file";
        console.error("error: ", error);
    }

    return result;
};

export const createFolder = (folderPath) => {
    let result = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    try {
        //create store folder if not exist
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        result.success = true;
        result.message = "Folder created successfully";
    } catch (error) {
        result.success = false;
        result.message = "Error creating folder";
        console.error("error: ", error);
    }

    return result;
};

export const getEnvFiles = (dir) => {
    try {
        const files = fs.readdirSync(dir);
        const envFiles = files.filter(file => file === '.env' || file.startsWith('.env.'));
        console.log("====test==== envFiles: ", envFiles);
        const envObjects = envFiles.map(file => {
            const filePath = path.join(dir, file);
            try {
                const env = dotenv.config({ path: filePath });
                return env.parsed;
            } catch (error) {
                console.error(`Error parsing ${filePath}:`, error);
                return null;
            }
        });

        return envObjects.filter(Boolean); // Filter out null values
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
        return [];
    }
};

export const updateNginxConfig = async (projectName, projectJson, domainObj, isDeploy) => {
    let resObj = {
        success: false,
        warning: false,
        message: "Forbidden",
        data: {}
    };

    const thisServerIP = getServerIP();
    const nginxConfPath_a = `/etc/nginx/sites-available/${projectName}.conf`;
    const nginxConfPath_e = `/etc/nginx/sites-enabled/${projectName}.conf`;
    const projectNginxPath = nginxConfPath_a;
    console.log("projectJson: ", projectJson);
    const isNode = projectJson.installedApps && projectJson.installedApps?.nodejs ? true : false;
    const isDomainUpdate = domainObj ? true : false;

    const domains = projectJson.domains;
    const customSSLFolderPath = `/etc/customSSL/live/${projectName}`;
    const letsEncryptFolderPath = `/etc/letsencrypt/live`;

    const currentNginxConfigRes = getFile(nginxConfPath_a);
    if (!currentNginxConfigRes.success) {
        resObj.success = false;
        resObj.message = "Project nginx config not found, there could be an issue when when project was added, please try recreating project to solve the issue";
        return resObj;
    };
    const currentNginxConfig = currentNginxConfigRes.data || '';
    console.log("currentNginxConfig: ", currentNginxConfig);

    const isDummyConfig = currentNginxConfig.includes(nginxConfigComments.dummyConofig);
    const isLocalHostConfig = currentNginxConfig.includes(nginxConfigComments.localHostConfig);


    console.log("nginx project deployment: ", isDeploy);
    console.log("nginx isDummyConfig: ", isDummyConfig);
    if (isDeploy && !isDummyConfig) {
        //if deploy but not dummy config then return
        resObj.success = true;
        resObj.message = "Nginx config already updated";
        return resObj;
    }
    console.log("nginx continuing nginx config update, isNode: ", isNode);



    let nginxFullConfig = '';
    let nginxConfigLocation = '';
    let localHostConfing = '';
    let domainsConfig = '';
    if (isNode) {
        nginxConfigLocation = `
        location / {
            proxy_pass http://localhost:${projectJson.port};
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
        `;
    } else {
        nginxConfigLocation = `
        location / {
            root /var/www/${projectName};
            index index.html;
        }
        `;
    }

    //add local host config for accessing over ip
    localHostConfing = `
    ${nginxConfigComments.localHostConfig}
    server {
        listen 80;
        server_name ${thisServerIP}:${projectJson.port};
        ${nginxConfigLocation}
    }`;

    // add server block for domains
    const sslAddedDomains = [];
    domains.forEach((d, i) => {
        const isLetsEncrypt = d.letsEncrypt;
        const isSSL = d.ssl;
        const sslKeyPath = isLetsEncrypt
            ? `${letsEncryptFolderPath}/${d.name}/privkey.pem`
            : `${customSSLFolderPath}/${projectName}/privkey.pem`;

        const fullChainPath = isLetsEncrypt
            ? `${letsEncryptFolderPath}/${d.name}/fullchain.pem`
            : `${customSSLFolderPath}/${projectName}/fullchain.pem`;

        const isFullChainExists = fs.existsSync(fullChainPath);
        const isKeyExists = fs.existsSync(sslKeyPath);

        const sslDomainConfig = isSSL && isFullChainExists && isKeyExists
            ? `${nginxConfigComments.sslDomainConfig + ' ' + d.name}
        server {
            listen 80;
            server_name ${d.name} www.${d.name};
            location / {
                return 301 https://${d.name}$request_uri;
            }
        }
        server {
            listen 443 ssl;
            server_name www.${d.name};

            ssl_certificate ${fullChainPath};
            ssl_certificate_key ${sslKeyPath};
            
            location / {
                return 301 https://${d.name}$request_uri;
            }
        }
        server {
            listen 443 ssl;
            server_name ${d.name};
            
            ssl_certificate ${fullChainPath};
            ssl_certificate_key ${sslKeyPath};
            
            ${nginxConfigLocation}
        }
        `
            : `server {
            listen 80;
            server_name ${d.name} www.${d.name};
            ${nginxConfigLocation}
        }`; //none ssl

        if (sslAddedDomains.includes(d.name) && isSSL && isFullChainExists && isKeyExists) {
            sslAddedDomains.push(d.name);
        }

        domainsConfig += sslDomainConfig;
    });

    if (domains.length === 0) {
        //if no domains add local host config
        nginxFullConfig = localHostConfing;
    } else {
        //add local host config
        nginxFullConfig += domainsConfig;
    }

    console.log("domains", domains);
    console.log("");
    console.log("======nginxFullConfig start======");
    console.log(nginxFullConfig);
    console.log("======nginxFullConfig  end======");
    console.log("");



    //update nginx config files
    const af = nginxConfPath_a;
    const createFileRes_a = createFile(af, nginxFullConfig);
    if (!createFileRes_a.success) {
        resObj.success = false;
        resObj.message = createFileRes_a.message || "Error updating nginx config";
        return resObj;
    }

    const ef = nginxConfPath_e;
    const createFileRes_e = createFile(ef, nginxFullConfig);
    if (!createFileRes_e.success) {
        resObj.success = false;
        resObj.message = createFileRes_e.message || "Error updating nginx config";
        return resObj;
    }

    //
    //  NGINX 
    //check if current nginx is the same as the new one
    if (currentNginxConfig === nginxFullConfig) {
        resObj.success = true;
        resObj.message = "Nginx config already updated";
        return resObj;
    } else {
        //restart nginx
        const nginxRestartRes = await executeLinuexCommands([{
            command: 'systemctl',
            args: ['reload', 'nginx'],
        }]);

        //if not success try 3 more tiems with 5s interval
        let maxTries = 6;
        let nginxSuccess = false;
        let isRevertConfig = false;
        if (!nginxRestartRes.success) {
            function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            let i = 0;
            while (i < maxTries) {
                await sleep(5000);
                const nginxRestartRes = await executeLinuexCommands([{
                    command: 'systemctl',
                    args: ['reload', 'nginx'],
                }]);
                if (nginxRestartRes.success) {
                    nginxSuccess = true;
                    break;
                } else {
                    if (i > 2 && !isRevertConfig && !nginxSuccess) {
                        isRevertConfig = true;
                        console.log("nginx restart failed, reverting back to previous config");
                        // fs.rmSync(projectNginxPath);
                        fs.writeFileSync(nginxConfPath_a, currentNginxConfig);
                        fs.writeFileSync(nginxConfPath_e, currentNginxConfig);
                        resObj.success = false;
                        resObj.message = "SSL installation failed, please try again (nginx restart failed)";
                    }
                }

                i++;
            }
        } else {
            nginxSuccess = true;
        }



        //update project json all domains with ssl=true should be have sslInstalled=true
        const updatedDomains = domains.map((d, i) => {
            if (d.ssl && sslAddedDomains.includes(d.name)) {
                d.active = nginxSuccess ? true : false;
                d.sslInstalled = nginxSuccess ? true : false;
            }
            return d;
        });
        projectJson.domains = updatedDomains;
        const createRes = createProjectJson(projectName, projectJson);
        if (!nginxSuccess) {
            resObj.success = false;
            resObj.message = "Nginx not restarted, SSL installation failed, please try again (nginx restart failed)";
            return resObj;
        };
        if (!createRes.success) {
            //delete new config
            resObj.success = false;
            resObj.message = 'Error updating project data, please try again, ' + createRes.message;
            return resObj;
        }

    };


    resObj.success = true;
    resObj.message = "Nginx config updated successfully";
    return resObj;

};