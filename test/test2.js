const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');



// const databaseLocationDirs = {
//     mysql: "/var/lib/mysql",
//     postgresql: "/var/lib/postgresql",
//     mongodb: "/var/lib/mongodb"
// }


// function correctStatusLine(line) {
//     if (line) {
//         const title = Object.keys(line)[0];
//         const value = line[title];
//         if (title === 'active') {
//             if (title === 'active' && (value.includes('active') && (value.includes('running')))) {
//                 return { [title]: true };
//             } else {
//                 return { [title]: false };
//             }
//         }
//         else if (title === 'loaded') {
//             if (value.includes('loaded')) {
//                 return { [title]: true };
//             } else {
//                 return { [title]: false };
//             }
//         }
//         else if (title === 'process') {
//             let v = value.split(' ')[0] || 0;
//             if (value.includes(' ') && value.length > 1) {
//                 return { [title]: v };
//             } else {
//                 return { [title]: v };
//             }
//         }
//         else if (title === 'main_pid') {
//             let v = value.split(' ')[0] || 0;
//             if (value.includes(' ') && value.length > 1) {
//                 return { [title]: v };
//             } else {
//                 return { [title]: v };
//             }
//         }
//         else if (title === 'tasks') {
//             let v = value.split(' ')[0] || 0;
//             if (value.includes(' ') && value.length > 1) {
//                 return { [title]: v };
//             } else {
//                 return { [title]: v };
//             }
//         }
//         else if (title === 'memory') {
//             let v = value.replace('M', '')
//             //conver mb to bytes
//             v = parseInt(v);
//             v = v * 1024 * 1024;
//             v = v.toString();

//             if (value.includes(' ') && value.length > 1) {
//                 return { [title]: v };
//             } else {
//                 return { [title]: v };
//             }
//         }
//         else {
//             return line;
//         }
//     } else {
//         return line;
//     }
// }

// const servicePid = 159454;
// const linuxCommand = 'ps -p ' + servicePid + ' -o %cpu,%mem && du -sh /proc/' + servicePid;
// exec(linuxCommand, (error, stdout, stderr) => {
//     let response = {
//         active: false,
//     }
//     if (error) {
//         console.error(`==exec error==: ${error}`);
//         return response;
//     }
//     console.log(`==stdout=== : `, stdout);
//     return response;

//     const results = [];
//     //split the response into an array of lines
//     const arrayFromStr = stdout.split('\n');
//     // console.log(`==arrayFromStr=== : `, arrayFromStr);
//     arrayFromStr.forEach((line, index) => {
//         let newLine = line.trim();

//         if (newLine && newLine.length > 0) {
//             let lineObj = {};
//             let n_line = newLine.split(": "); // split the line into two parts
//             if (n_line[1]) {
//                 //add the rest of the line to the second part of the line
//                 n_line.forEach((l, i) => { i !== 0 && i !== 1 ? n_line[1] += `: ${l}` : null });
//             }
//             if (n_line.length > 1) {
//                 const title = n_line[0].toLowerCase()
//                 lineObj[title] = n_line[1];
//                 lineObj = correctStatusLine(lineObj);
//             } else {
//                 lineObj[`other-${index}`] = newLine;
//                 lineObj = correctStatusLine(lineObj);
//             }
//             results.push(lineObj);
//         }
//     });


//     console.log(`==results=== : `, results);
//     // return { success: true, message: "Databases fetched successfully", data: arrayFromDbs };
// });



// df -h /lib/systemd/system/mysql.service

// //log current path
// const folderPath = path.join(__dirname, '../../');

// // console.log("current path: ", process.cwd());
// console.log("folderPath: ", folderPath);


// const os = require('os');
// const getServerIP = () => {
//     const networkInterfaces = os.networkInterfaces();

//     for (let interfaceName in networkInterfaces) {
//         const netInterface = networkInterfaces[interfaceName];

//         for (let i = 0; i < netInterface.length; i++) {
//             const alias = netInterface[i];

//             if ('IPv4' === alias.family && alias.internal === false) {
//                 // Return the first external IPv4 address
//                 return alias.address;
//             }
//         }
//     }

//     return '0.0.0.0';
// };

// const ip = getServerIP();
// console.log("ip: ", ip);


// const net = require('net');


// const isPortFree = async (port) => {
//     const pr = new Promise((resolve) => {
//         const server = net.createServer()
//             .once('error', () => resolve(true)) // if error, port is in use
//             .once('listening', () => server.once('close', () => resolve(false)).close()) // if listening, port is not in use
//             .listen(port);
//     });

//     const result = await pr;
//     const isFree = result ? false : true;
//     // console.log("isFree: ", port, isFree);
//     return isFree;
// };

// const getFreePort = async (port) => {
//     let newPort = port;
//     let isFree = await isPortFree(newPort);
//     while (!isFree) {
//         newPort++;
//         isFree = await isPortFree(newPort);
//     }
//     console.log("newPort: ", newPort);
//     return newPort;
// };

// getFreePort(3000);


// const getAccountAccessTokens = async (req) => {
//     let resObj = {
//         success: false,
//         message: "Forbidden",
//         data: 0
//     }

//     let accountData = null;
//     const filePath = '/var/www/reactPanel/reactPanelStore/main.json';
//     try {
//         const _data = fs.readFileSync(filePath);
//         const data = await _data; // Assign the result of the promise to data
//         accountData = JSON.parse(data); // Parse the data
//         resObj.success = true;
//         resObj.message = "Account data fetched successfully";
//         resObj.data = accountData.accessToken;

//     } catch (err) {
//         console.error(err)
//     }

//     console.log("resObj: ", resObj);
//     return resObj;
// };

// getAccountAccessTokens();



// async function getFilesInDirectory(directoryPath) {
//     const allFiles = [];

//     const filesInThisFolder = await fs.readdir(directoryPath);
//     const foldersInThisFolder = [];
//     const files = [];

//     for (const file of filesInThisFolder) {
//         const filePath = path.join(directoryPath, file);
//         const stat = await fs.stat(filePath);

//         if (stat.isDirectory()) {
//             foldersInThisFolder.push(file);
//         } else {
//             files.push(filePath);
//         }
//     }

//     allFiles.push(...files);

//     const filesInFolders = await Promise.all(foldersInThisFolder.map(async (folder) => {
//         const folderPath = path.join(directoryPath, folder);
//         return getFilesInDirectory(folderPath);
//     }));

//     allFiles.push(...filesInFolders.flat());

//     console.log("allFiles: ", allFiles);
//     return allFiles;
// };

// getFilesInDirectory(__dirname);


// const projectDir = '/var/www/next-test-1-1';




// const crypto = require('crypto');

// const getAlgConfig = () => {
//     const algorithm = 'aes-256-cbc';
//     const key = Buffer.from('021ebdf93adfc01a4df233454517ceceaf1e1fafd0c0e273ed2ce4816f3e9027', 'hex'); 
//     const iv = Buffer.from('58c2aafc72c1980136e3273f4a27344c', 'hex'); 
//     return { algorithm, key, iv };
// };
// // Encrypts text
// function encryptPass(text) {
//     const { algorithm, key, iv } = getAlgConfig();
//     let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
//     let encrypted = cipher.update(text);
//     encrypted = Buffer.concat([encrypted, cipher.final()]);
//     return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
// }

// // Decrypts text
// function decryptPass(text) {
//     const { algorithm, key } = getAlgConfig();
//     let iv = Buffer.from(text.iv, 'hex');
//     let encryptedText = Buffer.from(text.encryptedData, 'hex');
//     let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
//     let decrypted = decipher.update(encryptedText);
//     decrypted = Buffer.concat([decrypted, decipher.final()]);
//     return decrypted.toString();
// }

// const pass = 'password';

// const encrypted = encryptPass(pass);
// console.log("encrypted: ", encrypted);

// const decrypted = decryptPass(encrypted);
// console.log("decrypted: ", decrypted);


// const jwt = require('jsonwebtoken');

// const createJwtToken = async (expires, data) => {
//     console.log("process.env.JWT_SECRET: ", process.env.JWT_SECRET)
//     const payload = data || {};
//     const token = jwt.sign(payload, 'kfo2Krp_aorA7ertv57et@efeg7_f454345tg_Hjdfpr', { expiresIn: expires });
//     return token;
// };

// const verifyJwtToken =  (token) => {
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         return decoded;
//     } catch (err) {
//         console.error("Error verifying token: ", err);
//         return false;
//     }
// };

// (async ()=>{
//     const token = await createJwtToken(5, {name: 'sss ssss', email: 'aa@aa.com'});
//     console.log("token: ", token);
// })()


const dotenv = require('dotenv');

const getEnvFiles = (dir) => {
    try {
        const files = fs.readdirSync(dir);

        const envFiles = files.filter(file => file === '.env' || file.startsWith('.env.'));
        
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

const projectDir = path.join(__dirname, '../');
console.log("projectDir: ", projectDir);
const envFilesContent = getEnvFiles(projectDir);
console.log("envFilesContent: ", envFilesContent);