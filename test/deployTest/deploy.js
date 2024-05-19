
const fs = require('fs');
const path = require('path');

const deployUrl = 'http://172.20.75.234:7000/api/deploy?at=$2a$10$AFHjhnAUWVFTIfowB1lMuO7bQz6fdfkPAtY6rFlbbQUEbqdNznHQm&pn=next-test-1-1'
const config = {
    projectName: 'next-test-1-1',
    folderAbsolutePath: path.join(__dirname), // '/Users/oluwatobi/Documents/Projects/nextjs/test/deployTest
    includeList: [],
    excludeList: ['node_modules', 'package-lock.json','deploy.js','.next','.git','.gitignore'],
};

const fetchRequest = async () => {
    try {
        // Fetch all files and add them to the config
        const files = await getAllFiles(config);
        const fetchConfig = { ...config, files };

        // Send a POST request to the deploy URL
        const result = await fetch(deployUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fetchConfig)
        });

        // Parse the result as JSON
        const parsedResult = await result.json();
        console.log(parsedResult);

        // If the request was successful but not completed, start polling for status
        if (parsedResult.success && !parsedResult.completed) {
            const intervalId = setInterval(async () => {
                const res = await fetchProcessStatus();

                // If the process is completed, log the status and clear the interval
                if (res && res.data.completed) {
                    const status = res.data.status;
                    console.log(`Deployment completed ${status === 'idle' ? 'successfully' : 'with errors'}`);
                    clearInterval(intervalId);
                }
            }, 10000);

            // Stop polling after 2 minutes
            setTimeout(() => clearInterval(intervalId), 120000);
        }
    } catch (err) {
        console.error('An error occurred:', err);
    }
};

async function getFilePathsInDirectory(directoryPath, excludeList, includeList) {
    const allFilePaths = [];

    try {
        const pathsInThisFolder = fs.readdirSync(directoryPath);
        const foldersInThisFolder = [];

        for (const p of pathsInThisFolder) {
            const filePath = path.join(directoryPath, p);
            const stat = fs.statSync(filePath);

            if (includeList.length > 0) {
                isMatch = includeList.includes(p);
            };
            let isMatch = !excludeList.includes(p);

            if (isMatch) {
                if (stat.isDirectory()) {
                    foldersInThisFolder.push(p);
                } else {
                    allFilePaths.push(filePath);
                }
            }
        }

        for (const folder of foldersInThisFolder) {
            const folderPath = path.join(directoryPath, folder);
            const filesInFolder = await getFilePathsInDirectory(folderPath, excludeList, includeList);
            allFilePaths.push(...filesInFolder);
        }
    } catch (err) {
        console.log(err)
    }

    return allFilePaths;
}


async function getAllFiles(getAllFilesConfig) {

    const directoryPath = getAllFilesConfig.folderAbsolutePath;
    const excludeList = getAllFilesConfig.excludeList;
    const includeList = getAllFilesConfig.includeList;



    const filesInDirectory = await getFilePathsInDirectory(directoryPath, excludeList, includeList);
    const files = [];

    for (const file of filesInDirectory) {
        const relativePath = path.relative(directoryPath, file);
        const filePath = file;
        const fileName = path.basename(file);

        if (excludeList.includes(fileName) || fileName === 'deploy.js') {
            continue;
        };
        if (includeList.length > 0 && !includeList.includes(fileName)) {
            continue;
        }

        const fileContent = fs.readFileSync(filePath);
        const base64Content = fileContent.toString('base64');

        files.push({
            name: fileName,
            relativePath: relativePath,
            fullPath: filePath,
            content: base64Content
        });
    }

    // console.log('files', files.map(file => {
    //     return {
    //         name: file.name,
    //         relativePath: file.relativePath,
    //         fullPath: file.fullPath,
    //         content: file.content.slice(0, 100)
    //     }
    // }))


    return files;
}



//get request to fetch process status
const fetchProcessStatus = async () => {
    let resObj = null;
    try {
        const result = await fetch(deployUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        const parsedResult = await result.json();
        resObj = parsedResult;
    } catch (err) {
        console.log(err)
    }

    return resObj;
};

fetchRequest();
// fetchProcessStatus();

