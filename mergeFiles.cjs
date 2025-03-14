const fs = require('fs');
const path = require('path');

// Define the source folder and the output file name
const SRC_FOLDER = path.join(__dirname, 'src');
const OUTPUT_FILE = path.join(__dirname, 'combinedOutput.txt');

// File extensions to include
const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];

// Function to get all files from the src folder recursively
function getAllFiles(dirPath, filesArray) {
    filesArray = filesArray || [];

    // Read all files and directories in the current folder
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        // If it's a directory, go deeper
        if (stat.isDirectory()) {
            getAllFiles(filePath, filesArray);
        } else if (extensions.includes(path.extname(file))) {
            // If it's a file with one of the allowed extensions, add it to the array
            filesArray.push(filePath);
        }
    });

    return filesArray;
}

// Function to merge all file contents into a single output file
function mergeFiles() {
    const files = getAllFiles(SRC_FOLDER);
    let combinedContent = '';

    files.forEach((filePath) => {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        combinedContent += `\n// --- ${filePath} ---\n\n${fileContent}\n`;
    });

    fs.writeFileSync(OUTPUT_FILE, combinedContent);
    console.log(`All files have been merged into ${OUTPUT_FILE}`);
}

// Run the merge function
mergeFiles();
