import { checkPrimeSync } from "crypto";
import path from "path";
const fs = require('fs');
const os = require('os');
import { executeLinuexCommands } from './spawnProcccess.js';
import { _jsonStoreFolderPaths, updateNginxConfig, getEnvFiles, getFile, createFile } from '../../../services/server/fetchOperations';
import { dir } from "console";
import { execa } from 'execa';
import { get } from "http";
const { exec } = require('child_process');


const getServerIP = () => {
    const networkInterfaces = os.networkInterfaces();

    for (let interfaceName in networkInterfaces) {
        const netInterface = networkInterfaces[interfaceName];

        for (let i = 0; i < netInterface.length; i++) {
            const alias = netInterface[i];

            if ('IPv4' === alias.family && alias.internal === false) {
                // Return the first external IPv4 address
                const ip = JSON.stringify(alias.address);
                return alias.address;
            }
        }
    }

    return '0.0.0.0';
};
const thisServerIP = getServerIP();

export const deployProject = async (req) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    let proccessResObj = {
        "processType": "deployment",
        "projectName": "",
        "status": "",
        "message": "",
        completed: false
    };

    const accessTokenRes = await getAccountAccessTokens(req);
    if (!accessTokenRes.success) {
        resObj.message = 'Error fetching access token';
        return resObj;
    }


    const requestUrl = req.url;
    const accountAccessToken = accessTokenRes.data;
    const reqAccessToken = getAccessTokenFromReqUrl(requestUrl);

    // console.log("accountAccessToken: ", accountAccessToken);
    // console.log("reqAccessToken: ", reqAccessToken);
    if (accountAccessToken !== reqAccessToken) {
        resObj.success = false;
        resObj.message = 'access token mismatch, check your deployment url';
        return resObj;
    }

    let ip = req.headers.get('x-forwarded-for');
    ip = ip.split(":").pop();

    const reqBody = await req.json()
    const reqExcludeList = reqBody.excludeList;
    const projectName = reqBody.projectName;
    const projectDetailsRes = await getProjectDetails(projectName);

    // return resObj;
    if (!projectDetailsRes.success) {
        resObj.success = false;
        resObj.message = 'Error fetching project details';
        return resObj;
    }
    proccessResObj.projectName = projectName;
    const projectDetails = projectDetailsRes.data;
    const whiteListedIps = projectDetails.whiteListedIps;
    const isIpAllowed = whiteListedIps.includes(ip) || ip === thisServerIP;
    if (!isIpAllowed) {
        resObj.success = false;
        console.log('req ip', ip);
        console.log('thisServerIP', thisServerIP);
        console.log('whiteListedIps', whiteListedIps);
        resObj.message = 'IP not allowed';
        return resObj;
    }
    const files = reqBody.files;
    const projectPath = path.join('/var/www', projectName).replaceAll('\\', '/');
    const processStorePath = `${_jsonStoreFolderPaths.proccesses}/${projectName}.json`


    if (files.length === 0) {
        resObj.success = true;
        resObj.message = 'No files to deploy';
        return resObj;
    }

    try {

        //first check if there is ecosystem.config.js file in project folder
        // and project name is included in apps 
        const pm2ConfigFile = files.find(file => file.name === 'ecosystem.config.js');
        if (!pm2ConfigFile) {
            resObj.success = false;
            resObj.message = 'ecosystem.config.js file is required';
            return resObj;
        }

        const isOk = isAppNameInEcosystemConfig(projectName, pm2ConfigFile);
        if (!isOk) {
            resObj.success = false;
            resObj.message = 'Project name is not included in ecosystem.config.js, please add it to apps in ecosystem.config.js file';
            return resObj;
        }


        //dummy timeout
        const timeout = new Promise((resolve, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);
                resolve('timeout');
            }, 60000); // 1 minute timeout
        });

        const fileCreationRes = await addAllFilesToProject(projectName, projectPath, files, reqBody)
            .then(result => {
                //check for npm and then delete proccess or set failed
                console.log('addAllFilesToProject', result);
                if (result.success) {
                    console.log('files deployed...');
                } else {
                    console.log('failed to deploy files...');
                    proccessResObj.status = 'failed';
                    proccessResObj.message = result.message || 'Error adding files';
                    proccessResObj.completed = true;
                    createProccessJson(processStorePath, projectName, proccessResObj);
                }
                return result;

            })
            .catch(err => {
                console.error('error deleteProccessJson', err);
                return err;
            });

        if (!fileCreationRes.success) {
            proccessResObj.status = 'failed';
            proccessResObj.message = 'Error adding files';
            proccessResObj.completed = true;
            createProccessJson(processStorePath, projectName, proccessResObj);
        }


        //check if node app
        const nodeAppCheckRes = checkIfNodeApp(projectName, projectPath, processStorePath, projectDetails, reqBody);


        const timeOutCheck = await Promise.race([nodeAppCheckRes, timeout]);
        console.log("timeOutCheck: ", timeOutCheck);

        if (timeOutCheck === 'timeout') {
            proccessResObj.status = 'inProgress';
            proccessResObj.message = 'Deployment is in progress...';
            createProccessJson(processStorePath, projectName, proccessResObj);
            resObj.success = true;
            resObj.message = "Deployment is in progress...";
            resObj.completed = false;
            resObj.status = 'inProgress';
        } else {
            resObj.completed = true;
            resObj.status = 'success';
            resObj = fileCreationRes;
        }

    } catch (err) {
        resObj.success = false;
        resObj.message = "Error creating files" + err;
        resObj.completed = false;
        console.error(err)
    }


    return resObj;

};


export const checkProjectStatus = async (req) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }



    const accessTokenRes = await getAccountAccessTokens(req);
    if (!accessTokenRes.success) {
        resObj.message = 'Error fetching access token';
        return resObj;
    }


    const requestUrl = req.url;
    const accountAccessToken = accessTokenRes.data;
    const reqAccessToken = getAccessTokenFromReqUrl(requestUrl);

    if (accountAccessToken !== reqAccessToken) {
        resObj.success = false;
        resObj.message = 'Forbidden';
        return resObj;
    }

    const thisServerIP = getServerIP();
    let ip = req.headers.get('x-forwarded-for');
    ip = ip.split(":").pop();

    const projectName = getProjectNameFromReqUrl(requestUrl);
    const projectDetailsRes = await getProjectDetails(projectName);

    if (!projectDetailsRes.success) {
        resObj.success = false;
        resObj.message = 'Error fetching project details';
        return resObj;
    }

    const projectDetails = projectDetailsRes.data;
    const whiteListedIps = projectDetails.whiteListedIps;
    const isIpAllowed = whiteListedIps.includes(ip) || ip === thisServerIP;
    if (!isIpAllowed) {
        resObj.success = false;
        resObj.message = 'Forbidden';
        return resObj;
    }

    const projectPath = '/var/www/' + projectName;
    const processStorePath = `${_jsonStoreFolderPaths.proccesses}/${projectName}.json`
    const processStatus = checkProjectProcessStatus(processStorePath, projectName);
    console.log('processStatus: ', processStatus);
    try {
        // console.log('processStatus: ', processStatus);
        resObj.success = true;
        resObj.message = "Project process status fetched successfully";
        resObj.data = processStatus;
        resObj.completed = processStatus.completed;
        resObj.status = processStatus.status === 'idle' ? 'success' : processStatus.status;
    } catch (err) {
        resObj.success = false;
        resObj.message = "Error fetching project process status";
        resObj.completed = false;
        resObj.status = 'error';
        console.error(err)
    }

    //respond with message

    const newResObj = {
        completed: processStatus.completed ? processStatus.completed : false,
        success: processStatus.status === 'idle' ? true : false,
        message: processStatus.message ? processStatus.message : 'idle',
    }
    // console.log('newResObj: ', newResObj);
    resObj.data = newResObj;

    return resObj;
};




const getIp = async (req) => {
    let ip = req.headers.get('x-real-ip')
    if (!ip) {
        ip = req.headers.get('x-forwarded-for');
    }
    if (!ip) {
        ip = req.headers.get('x-forwarded-host');
    }

    const isIpv6 = ip.includes(':');
    if (isIpv6) {
        let ipv4 = ipv6.split(":").pop();
        ip = ipv4;
    }

    return ip;
}

const getAccessTokenFromReqUrl = (url) => {
    // console.log("getAccessTokenFromReqUrl url: ", url);
    let accessToken = '';
    let a1 = url.split('?');
    if (a1.length > 2) {
        a1[1] = a1.slice(1).join('?');
    }

    const a2 = a1[1].split('&');
    const urlParts = a2.filter((part) => part && part.length > 0);
    urlParts.forEach((part) => {
        if (part.startsWith('at=')) {
            const partParts = part.split('=');
            accessToken = partParts[1];
        }
    });

    // console.log("getAccessTokenFromReqUrl accessToken: ", accessToken);
    return accessToken;
}

const getProjectNameFromReqUrl = (url) => {
    let accessToken = '';
    const a1 = url.split('?');
    const a2 = a1[1].split('&');
    const urlParts = a2.filter((part) => part && part.length > 0);
    urlParts.forEach((part) => {
        if (part.startsWith('pn=')) {
            const partParts = part.split('=');
            accessToken = partParts[1];
        }
    });
    return accessToken;
}


const getAccountAccessTokens = async (req) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: 0
    }

    let accountData = null;
    const filePath = _jsonStoreFolderPaths.account + '/main.json';
    try {
        const data = fs.readFileSync(filePath);
        accountData = JSON.parse(data);
        resObj.success = true;
        resObj.message = "Account data fetched successfully";
        resObj.data = accountData.accessToken;

    } catch (err) {
        console.error(err)
    }

    return resObj;
};




const getProjectDetails = async (projectName) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    const filePath = `${_jsonStoreFolderPaths.projects}/${projectName}.json`;
    try {
        const data = fs.readFileSync(filePath);
        const projectData = JSON.parse(data);
        resObj.success = true;
        resObj.message = "Project data fetched successfully";
        resObj.data = projectData;

    } catch (err) {
        console.error(err)
    }

    return resObj;
}


const addAllFilesToProject = async (projectName, projectPath, _files, reqBody) => {

    //dummy 10 seconds timeout
    // const timeout = new Promise((resolve, reject) => {
    //     const id = setTimeout(() => {
    //         clearTimeout(id);
    //         resolve('timeout');
    //     }, 10000); // 10 seconds timeout
    // });
    // await timeout


    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    const files = _files;
    const config = reqBody;
    const folderAbsolutePath = reqBody.folderAbsolutePath;
    const excludeList = reqBody.excludeList;
    const includeList = reqBody.includeList;

    // console.log("folderAbsolutePath: ", folderAbsolutePath);
    // console.log("files: ", files);
    const addedFiles = [];
    const skippedFiles = [];
    try {
        //if project folder does not exist create it
        if (!fs.existsSync(projectPath)) {
            fs.mkdirSync(projectPath, { recursive: true });
        };


        // const tempFolderParts = '/var/www/reactPanel/temp_folder';
        // //if does not exist create it
        // if (!fs.existsSync(tempFolderParts)) {
        //     fs.mkdirSync(tempFolderParts, { recursive: true });
        // }

        let isNodeApp = false;
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            isNodeApp = true;
        }


        if (isNodeApp) {
            console.log('isNodeApp: ', isNodeApp);

            // Get a list of all files and directories in the project folder
            const files = fs.readdirSync(projectPath);

            // Loop through each file/directory
            const excludeList = ['node_modules', '.next'];
            // const excludeList = [];
            for (const file of files) {
                // If the file/directory is not node_modules, delete it
                if (!excludeList.includes(file)) {
                    const filePath = path.join(projectPath, file);
                    fs.rmSync(filePath, { recursive: true, force: true });
                }
            }
            console.log('project folder emptied');

        } else {
            // Delete all files and directories in project folder
            fs.rmSync(projectPath, { recursive: true });

            //create project folder
            fs.mkdirSync(projectPath, { recursive: true });
        }

        // copy .env.prod or .env.production to .env
        console.log('config.copyEnvProdToEnv', config.copyEnvProdToEnv);
        if (config.copyEnvProdToEnv) {
            const envFile = files.find(file => file.name === '.env.prod' || file.name === '.env.production');
            const envAlreadyExists = files.find(file => file.name === '.env');
            console.log('envFile', envFile.name);
            console.log('envAlreadyExists', envAlreadyExists);
            if (envFile && !envAlreadyExists) {
                console.log('pussing .env.prod to .env');
                let newFile = { ...envFile };
                newFile.name = '.env';
                console.log('newFile .env.prod to .env', newFile.name);
                files.push(newFile);
            }
        }

        for (const file of files) {
            // let logFile = { ...file }
            // delete logFile.content;
            // console.log("file: ", logFile);
            if (excludeList.includes(file.name)) {
                skippedFiles.push(1);
                continue;
            }
            if (includeList.length > 0 && !includeList.includes(file.name)) {
                skippedFiles.push(1);
                continue;
            }
            const filePath = path.join(projectPath, file.relativePath).replaceAll('\\', '/');
            const fileContent = Buffer.from(file.content, 'base64');
            const fileDir = path.dirname(filePath).replaceAll('\\', '/');

            // console.log("filePath: ", filePath);
            // console.log("fileDir: ", fileDir);

            //create directory if it does not exist
            if (!fs.existsSync(fileDir)) {
                fs.mkdirSync(fileDir, { recursive: true });
            }

            //write file
            await fs.writeFileSync(filePath, fileContent);
            // console.log("File added at: ", filePath);
            addedFiles.push(1);
        }



        resObj.success = true;
        resObj.message = `Files added: ${addedFiles.length}, Files skipped: ${skippedFiles.length}`
    } catch (err) {
        resObj.success = false;
        resObj.message = "Error creating files" + err;
        console.error(err)
    }

    // console.log("resObj: ", resObj);

    return resObj;
};


const createProccessJson = (processStorePath, projectName, data) => {
    const processFilePath = processStorePath; //absolute path
    const processObj = {
        processType: data.processType || 'none',
        projectName: projectName,
        status: data.status || 'idle',
        message: data.message || ''
    }
    //check if dir exists, if not create it
    const dirPath = path.dirname(processFilePath);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    };

    fs.writeFileSync(processFilePath, JSON.stringify(processObj));
}

const checkProjectProcessStatus = (processStorePath, projectName) => {
    const processFilePath = processStorePath; //absolute path
    let response = {
        processType: 'none',
        projectName: projectName,
        status: 'idle',
        completed: true
    };

    try {
        //read if exists
        if (!fs.existsSync(processFilePath)) {
            //nothing to do
        } else {
            const data = fs.readFileSync(processFilePath);
            response = JSON.parse(data);
        }
    } catch (err) {
        console.error(err);
        return 'error';
    }

    if (response.status === 'idle' || response.status === 'faild') {
        response.completed = true;
        deleteProccessJson(processStorePath);
    }

    return response;
}

const deleteProccessJson = (processStorePath) => {
    try {
        if (fs.existsSync(processStorePath)) {
            fs.unlinkSync(processStorePath);
        } else {
            console.log('processStorePath does not exist: ', processStorePath);
        }
    } catch (err) {
        console.error(err);
    }
};

const checkIfNodeApp = async (projectName, projectPath, processStorePath, projectDetails, reqBody) => {

    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    let proccessResObj = {
        "processType": "deployment",
        "projectName": projectName,
        "status": "",
        "message": "",
        completed: false
    };

    const reqConfig = reqBody;

    try {

        //check if package.json exists if yes then it is a node app
        //run npm install, npm build, npm start
        console.log('checkIfNodeApp...', projectName, projectPath, processStorePath);
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            console.log('is not node app...');
            deleteProccessJson(processStorePath);
            return;
        };

        console.log('is node app...');
        console.log('running npm install, npm build, npm start...');

        //update nginx config====
        const nginxUpdateRes = await updateNginxConfig(projectName, projectDetails, null, true);
        console.log('nginxUpdateRes: ', nginxUpdateRes);

        //add pm2 config
        const pm2Config = `
        module.exports = {
            apps : [{
                name: '${projectName}',
                script: 'npm start',
                mode: 'cluster',
            }]
        }
    `
        const pm2ConfigPath = `/var/www/${projectName}/ecosystem.config.js`;
        //if does not exist create it
        if (!fs.existsSync(pm2ConfigPath)) {
            fs.writeFileSync(pm2ConfigPath, pm2Config);
        }

        //****************************
        //   environment variables
        //****************************
        let correctedEnv = JSON.parse(JSON.stringify({ ...process.env }));
        //check if nextjs app, if yes then devDependencies should be merged to dependencies
        const nextCheckRes = nextJsChecks(projectPath, correctedEnv);
        console.log('nextCheckRes: ', nextCheckRes);
        if (!nextCheckRes.success) {
            proccessResObj.status = 'failed';
            proccessResObj.message = nextCheckRes.message;
            proccessResObj.completed = true;
            createProccessJson(processStorePath, projectName, proccessResObj);
            return;
        }
        const projectDir = path.join('/var/www', projectName);
        const envVarsArr = getEnvFiles(projectDir);
        console.log('====test==== envVarsArr: ', envVarsArr);
        //add all project env vars to spawn session env
        envVarsArr.forEach((envObj) => {
            const keys = Object.keys(envObj);
            keys.forEach((key) => {
                const isTheSame = correctedEnv[key] === envObj[key];
                if (isTheSame) return;
                correctedEnv[key] = envObj[key];
            });
        });



        //stop pm2 for this project
        const pm2StopRes = await executeLinuexCommands([{
            command: 'npx',
            args: ['pm2', 'stop', projectName],
            env: correctedEnv,
            dir: projectPath
        }]);
        console.log('pm2StopRes: ', pm2StopRes);




        const lockPath = path.join(projectPath, 'package-lock.json');
        if (fs.existsSync(lockPath)) {
            fs.unlinkSync(lockPath);
        }
        console.log('package-lock.json deleted...');



        const npmInstallRes = await executeLinuexCommands([{
            command: 'npm',
            args: ['install'],
            dir: projectPath,
            env: correctedEnv,
        }]);
        console.log('npmInstallRes: ', npmInstallRes);


        //user DB update request 
        if (reqConfig.updateDB) {
            let d_env = { ...correctedEnv };
            const cmd = reqConfig.updateDBLinuxCmd;
            if (!cmd) return;
            const splitedCMD = cmd.split(' ').map((item) => item.trim());
            if (!splitedCMD) return;

            const alreadyExists = d_env.DATABASE_URL && d_env.DATABASE_URL === reqConfig.DBUrl;
            if (reqConfig.DBUrl && !alreadyExists) {
                d_env.DATABASE_URL = reqConfig.DBUrl;
            }

            const cmdRes = await executeLinuexCommands([{
                command: splitedCMD[0],
                args: splitedCMD.slice(1),
                dir: projectPath,
                env: d_env,
            }]);
            console.log('user DB update request : ', cmdRes);
        }



        //run npm build
        const npmBuildRes = await executeLinuexCommands([{
            command: 'npm',
            args: ['run', 'build'], // 'build'
            dir: projectPath,
            env: correctedEnv,
        }]);
        console.log('npmBuildRes: ', npmBuildRes);

        //run npm start
        const npmStartRes = await executeLinuexCommands([{
            command: 'npx',
            args: ['pm2', 'start', 'ecosystem.config.js'],
            dir: projectPath,
            env: correctedEnv,
        }]);
        console.log('npmStartRes: ', npmStartRes);


        //open project port pr close it if there are domains
        const domains = projectDetails.domains;
        if (domains.length === 0) {
            console.log('no domains added, opening project port...', projectName, projectDetails.port);
            const openPortRes = await executeLinuexCommands([{
                command: 'ufw',
                args: ['allow', projectDetails.port],
                env: correctedEnv,
            }]);
            console.log('openPortRes: ', openPortRes);
        } else {
            //check if port is open then close it 
            const openPortRes = await executeLinuexCommands([{
                command: 'ufw',
                args: ['status'],
                env: correctedEnv,
            }]);
            const isAllowed = openPortRes.data.includes(projectDetails.port);
            if (isAllowed) {
                console.log('port is open, closing it...', projectName, projectDetails.port);
                const closePortRes = await executeLinuexCommands([{
                    command: 'ufw',
                    args: ['delete', 'allow', projectDetails.port],
                    env: correctedEnv,
                }]);
                console.log('closePortRes: ', closePortRes);
            }
        }


        if (
            nginxUpdateRes.success &&
            npmInstallRes.success &&
            npmBuildRes.success &&
            npmStartRes.success
        ) {
            console.log('deleting proccess json...');
            deleteProccessJson(processStorePath);
            resObj.success = true;
            resObj.message = 'Deployment comepleted successfully';
            console.log('deployment comepleted successfully');
            return;
        } else {
            resObj.success = false;
            resObj.message = 'Deployment comepleted with issues';

            let message = '';
            message += 'nginx restart: ' + (nginxUpdateRes.message ? nginxUpdateRes.message : '');
            message += ', npm install: ' + (npmInstallRes.message ? npmInstallRes.message : '');
            message += ', npm build: ' + (npmBuildRes.message ? npmBuildRes.message : '');
            message += ', npm start: ' + (npmStartRes.message ? npmStartRes.message : '');


            proccessResObj.status = 'failed';
            proccessResObj.message = message;
            proccessResObj.completed = true;
            createProccessJson(processStorePath, projectName, proccessResObj);
        }

    } catch (err) {
        resObj.success = false;
        resObj.message = 'Error checking node app';
        console.error(err)
    }

    console.log('deployment comepleted with issues...');

    return resObj;
};



//pm2
const isAppNameInEcosystemConfig = (projectName, pm2ConfigFile) => {
    const fileContent = Buffer.from(pm2ConfigFile.content, 'base64');
    const newStr = fileContent.toString();

    // Escape projectName for use in a regular expression
    const escapedProjectName = projectName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // Define an array of patterns to check
    const patterns = [
        `"name":"${escapedProjectName}"`,
        `'name':'${escapedProjectName}'`,
        `'name':"${escapedProjectName}"`,
        `'${escapedProjectName}'`,
        `"${escapedProjectName}"`
    ];

    // Check each pattern until a match is found
    for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'g');
        if (regex.test(newStr)) {
            return true;
        }
    }

    // If no match was found, return false
    return false;
}

const nextJsChecks = (projectPath, correctedEnv) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: {}
    }

    try {
        //get project package.json
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            resObj.success = false;
            resObj.message = 'package.json does not exist';
            return resObj;
        }
        const packageJson = getFile(packageJsonPath);
        if (!packageJson.success) {
            resObj.success = false;
            resObj.message = 'Error fetching package.json';
            return resObj;
        }
        const packageJsonData = packageJson.data;

        //check if nextjs app
        const dependencies = packageJsonData.dependencies;
        const devDependencies = packageJsonData.devDependencies;
        const isNextJsApp = dependencies['next'] || devDependencies['next'];
        if (!isNextJsApp) {
            resObj.success = true;
            resObj.message = 'Not a nextjs app';
            return resObj;
        }

        //merge devDependencies to dependencies
        const devDepKeys = Object.keys(devDependencies);
        devDepKeys.forEach((key) => {
            const isAlreadyInDep = dependencies[key];
            if (!isAlreadyInDep) {
                dependencies[key] = devDependencies[key];
            }
        });
        let newPackageJson = { ...packageJsonData };
        newPackageJson.dependencies = dependencies;
        delete newPackageJson.devDependencies;

        //write new package.json
        const createRes = createFile(packageJsonPath, JSON.stringify(newPackageJson, null, 2));
        if (!createRes.success) {
            resObj.success = false;
            resObj.message = 'Error writing package.json';
            return resObj;
        }

        resObj.success = true;
        resObj.message = 'Nextjs app, devDependencies merged to dependencies';
        return resObj;

    } catch (err) {
        resObj.success = false;
        resObj.message = 'Error checking nextjs app';
        return resObj;
    }

    return resObj;

};