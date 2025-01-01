const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const LANGUAGE_COMMANDS = {
    'cpp': 'g++',
    'python': 'python3',
    'java': 'javac',
    'javascript': 'node'
};

async function executeCode(filePath, language, problemId, inputs) {
    console.log(`Starting code execution:
    File: ${filePath}
    Language: ${language}
    Problem ID: ${problemId}`);

    try {
        // Get file extension and base name
        const ext = path.extname(filePath);
        const baseName = path.basename(filePath, ext);
        console.log(`File details - Extension: ${ext}, Base name: ${baseName}`);
        
        // Create temporary directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        await fs.mkdir(tempDir, { recursive: true });
        console.log(`Created/verified temp directory at: ${tempDir}`);
        
        // Copy the file to temp directory
        const tempFilePath = path.join(tempDir, `${baseName}${ext}`);
        await fs.copyFile(filePath, tempFilePath);
        console.log(`Copied file to temp location: ${tempFilePath}`);
        
        const results = [];
        
        // Execute for each input
        const testCaseDir = path.join(__dirname, `../testcases/${problemId}`);
        console.log(`Looking for test cases in: ${testCaseDir}`);
        
        const files = await fs.readdir(testCaseDir);
        const inputFiles = files.filter(f => f.startsWith('input_'));
        console.log(`Found ${inputFiles.length} test cases`);
        
        // Execute for each input
        for (let i = 0; i < inputFiles.length; i++) {
            console.log(`\nExecuting test case ${i + 1}/${inputFiles.length}`);
            
            const inputFile = path.join(testCaseDir, `input_${i + 1}.txt`);
            const expectedOutputFile = path.join(testCaseDir, `output_${i + 1}.txt`);
            
            const input = await fs.readFile(inputFile, 'utf-8');
            const expectedOutput = await fs.readFile(expectedOutputFile, 'utf-8').then(out => out.trim());
            
            console.log(`Running code with input from: ${inputFile}`);
            const output = await runCode(tempFilePath, language, input);
            const actualOutput = output.trim();
            
            const passed = actualOutput === expectedOutput;
            console.log(`Test case ${i + 1} result: ${passed ? 'PASSED' : 'FAILED'}`);
            
            if (!passed) {
                console.log(`Expected: "${expectedOutput}"`);
                console.log(`Actual: "${actualOutput}"`);
            }
            
            results.push({
                testCase: i + 1,
                passed,
                input,
                expectedOutput,
                actualOutput
            });
        }
        
        // Cleanup
        await fs.unlink(tempFilePath);
        console.log(`\nCleaned up temporary file: ${tempFilePath}`);
        
        const summary = {
            total: results.length,
            passed: results.filter(r => r.passed).length
        };
        
        console.log(`\nExecution complete. Summary: ${summary.passed}/${summary.total} tests passed`);
        
        return {
            success: true,
            results,
            summary
        };
        
    } catch (error) {
        console.error('Execution failed with error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ... existing imports and code ...

async function runSingle(filePath, language, input, expectedOutput) {
    console.log(`Starting single test case execution:
    File: ${filePath}
    Language: ${language}
    Input: ${input}`);

    try {
        // Get file extension and base name
        const ext = path.extname(filePath);
        const baseName = path.basename(filePath, ext);
        
        // Create temporary directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        await fs.mkdir(tempDir, { recursive: true });
        
        // Copy the file to temp directory
        const tempFilePath = path.join(tempDir, `${baseName}${ext}`);
        await fs.copyFile(filePath, tempFilePath);
        
        // Run the code with input
        const output = await runCode(tempFilePath, language, input);
        const actualOutput = output.trim();
        const passed = actualOutput === expectedOutput.trim();
        
        // Cleanup
        await fs.unlink(tempFilePath);
        
        return {
            success: true,
            passed,
            actualOutput
        };
        
    } catch (error) {
        console.error('Single test case execution failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function runCode(filePath, language, input) {
    return new Promise((resolve, reject) => {
        let command;
        
        switch (language.toLowerCase()) {
            case 'cpp':
                const outputPath = filePath.replace('.cpp', '');
                command = `${LANGUAGE_COMMANDS.cpp} ${filePath} -o ${outputPath} && ${outputPath}`;
                break;
            case 'python':
                command = `${LANGUAGE_COMMANDS.python} ${filePath}`;
                break;
            case 'java':
                const className = path.basename(filePath, '.java');
                command = `${LANGUAGE_COMMANDS.java} ${filePath} && java -cp ${path.dirname(filePath)} ${className}`;
                break;
            case 'javascript':
                command = `${LANGUAGE_COMMANDS.javascript} ${filePath}`;
                break;
            default:
            reject(new Error(`Unsupported language: ${language}`));
            return;
        }
        
        console.log(`Executing command: ${command}`);
        
        const process = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Process execution failed:', error);
                console.error('stderr:', stderr);
                reject(new Error(stderr || error.message));
                return;
            }
            console.log('Process execution successful');
            resolve(stdout);
        });
        
        // Provide input to the process
        if (input) {
            console.log('Providing input to process');
            process.stdin.write(input);
            process.stdin.end();
        }
    });
}

module.exports = { executeCode, runSingle };