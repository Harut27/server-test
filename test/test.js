const fs = require('fs');
const path = require('path');
// const fetch = require('node-fetch'); // Assuming you're using node-fetch

async function makeTestFetch() {
    const directoryPath = __dirname; // Current directory
    const currentFile = path.basename(__filename); // Current file

    fs.readdir(directoryPath, async (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${err}`);
            return;
        }

        // Filter out the current file
        const otherFiles = files.filter(file => file !== currentFile);

        // Read each file and add it to the body
        const bodyFiles = await Promise.all(otherFiles.map(async (file) => {
            const filePath = path.join(directoryPath, file);
            const fileContent = await fs.promises.readFile(filePath, 'utf8');
            return { file, content: fileContent };
        }));

        const body = {
            action: 'test',
            itsFor: 'test',
            files: bodyFiles,
        };

        // Make the fetch request
        const response = await fetch('http://localhost:3000/api/v1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),

        });

        const data = await response.json();
        console.log(data);
    });
}

makeTestFetch();