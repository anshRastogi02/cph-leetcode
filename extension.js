const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const { formatArrayToString, splitTestCases } = require('./src/utils/formatters');
const { executeCode, runSingle } = require('./src/utils/codeExec');

// GraphQL query for problem details
const QUESTION_QUERY = `
query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
        questionId
        title
        content
        exampleTestcases
        sampleTestCase
    }
}`;

function extractTestCases(content, exampleTestcases, sampleTestCase){
    if (!content) return { inputs: [], outputs: [] };
    
    const $ = cheerio.load(content);
    const outputs = [];
    
    // Number of lines per test case
    const linesPerCase = sampleTestCase ? 
        (sampleTestCase.match(/\n/g) || []).length + 1 : 1;
    
    const inputs = exampleTestcases ? 
        splitTestCases(exampleTestcases, linesPerCase) : [];
    
    // Extract outputs from HTML content
    $('strong.example').each((i, element) => {
        let output = '';
        let currentElement = $(element);
        
        while (currentElement.length) {
            if (currentElement.next().length) {
                currentElement = currentElement.next();
            } else if (currentElement.parent().next().length) {
                currentElement = currentElement.parent().next();
            } else {
                break;
            }
            
            const preElement = currentElement.is('pre') ? 
                currentElement : currentElement.find('pre');
            
            if (preElement.length) {
                const testCaseText = preElement.text();
                const outputMatch = testCaseText.match(/Output:\s*([^]*?)(?=\nExplanation:|$)/);
                if (outputMatch && outputMatch[1]) {
                    output = formatArrayToString(outputMatch[1].trim());
                    break;
                }
            }
        }
        outputs.push(output || '');
    });
    
    return {
        inputs: inputs.map(input => 
            input.split('\n')
                .map(line => formatArrayToString(line))
                .join('\n')
        ),
        outputs: outputs.map(output => 
            output.split('\n')
                .map(line => formatArrayToString(line))
                .join('\n')
        )
    };
}

async function saveTestCases(workspaceRoot, problemId, testcases) {
    const testCaseDir = path.join(workspaceRoot, '.leetcode', 'testcases', problemId);
    
    try {
        await fs.mkdir(testCaseDir, { recursive: true });
        
        // Save input test cases
        for (let i = 0; i < testcases.inputs.length; i++) {
            const inputPath = path.join(testCaseDir, `input_${i + 1}.txt`);
            const formattedInput = Array.isArray(testcases.inputs[i]) ? 
                testcases.inputs[i].join('\n') : 
                testcases.inputs[i];
            await fs.writeFile(inputPath, formattedInput);
        }
        
        // Save output test cases
        for (let i = 0; i < testcases.outputs.length; i++) {
            const outputPath = path.join(testCaseDir, `output_${i + 1}.txt`);
            await fs.writeFile(outputPath, testcases.outputs[i]);
        }
        
        return testCaseDir;
    } catch (error) {
        throw new Error(`Failed to save test cases: ${error.message}`);
    }
}

async function fetchTestCases(titleSlug) {
    try {
        const response = await axios.post(
            'https://leetcode.com/graphql',
            {
                query: QUESTION_QUERY,
                variables: { titleSlug }
            }
        );

        if (response.data.errors) {
            throw new Error(response.data.errors[0].message);
        }

        const problem = response.data.data.question;
        return {
            id: problem.questionId,
            content: problem.content,
            testcases: extractTestCases(
                problem.content,
                problem.exampleTestcases,
                problem.sampleTestCase
            )
        };
    } catch (error) {
        throw new Error(`LeetCode API Error: ${error.message}`);
    }
}

// Define the WebviewProvider class properly
class WebviewProvider {
    constructor() {
        this.webview = null;
        this.currentFile = null;
        this.currentLanguage = null;
    }

    setCurrentFile(filePath, language) {
        this.currentFile = filePath;
        this.currentLanguage = language;
    }

    resolveWebviewView(webviewView) {
        this.webview = webviewView.webview;
        const { getWebviewContent } = require('./src/webview/home');
        
        webviewView.webview.options = {
            enableScripts: true
        };

        webviewView.webview.html = getWebviewContent();

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'fetch':
                    vscode.commands.executeCommand('leetcode-testcases.fetch', message.url);
                    break;
                case 'runSingle':
                    try {
                        if (!this.currentFile || !this.currentLanguage) {
                            throw new Error('No active file selected');
                        }

                        const result = await runSingle(
                            this.currentFile,
                            this.currentLanguage,
                            message.testCase.input,
                            message.testCase.expectedOutput
                        );

                        if (!result.success) {
                            throw new Error(result.error);
                        }

                        webviewView.webview.postMessage({
                            command: 'testCaseResult',
                            index: message.testCase.index,
                            passed: result.passed,
                            actualOutput: result.actualOutput
                        });
                    } catch (error) {
                        webviewView.webview.postMessage({
                            command: 'testCaseResult',
                            index: message.testCase.index,
                            passed: false,
                            actualOutput: error.message
                        });
                    }
                    break;
            }
        });
    }
}

// Extract titleSlug from URL
const getTitleSlug = (url) => {
    try {
        const cleanUrl = url.replace(/\/$/, '');
        const match = cleanUrl.match(/\/problems\/([^/]+)/); 
        if (!match || !match[1]) throw new Error('Invalid LeetCode URL');
        return match[1];
    } catch (error) {
        throw new Error('Invalid LeetCode URL format');
    }
};

function activate(context) {

	const provider = new WebviewProvider();
	// Register the WebView Provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'leetcode-testcases.webview',
            provider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );
    // Update provider when active editor changes
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            const document = editor.document;
            const language = document.languageId;
            provider.setCurrentFile(document.uri.fsPath, language);
        }
    });

    // Set initial file if there's an active editor
    if (vscode.window.activeTextEditor) {
        const document = vscode.window.activeTextEditor.document;
        const language = document.languageId;
        provider.setCurrentFile(document.uri.fsPath, language);
    }
    // Register fetch command
    let fetchCommand = vscode.commands.registerCommand('leetcode-testcases.fetch', async (problemUrl) => {
        try {
            
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder found');
            }

            if (!problemUrl) {
                problemUrl = await vscode.window.showInputBox({
                    prompt: 'Enter LeetCode problem URL',
                    placeHolder: 'https://leetcode.com/problems/...'
                });
            }

            if (!problemUrl) {
                return;
            }

            const titleSlug = getTitleSlug(problemUrl);

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Fetching LeetCode test cases...",
                cancellable: false
            }, async (progress) => {
                // Fetch test cases
                const { id, content, testcases } = await fetchTestCases(titleSlug);
                
                // Save test cases
                const testCasePath = await saveTestCases(workspaceRoot, id, testcases);
                
                if (provider.webview) {
                    provider.webview.postMessage({
                        command: 'showTestCases',
                        testCases: testcases,
                        problemContent: content
                    });
                }

                // Store problem ID in workspace state
                await context.workspaceState.update('currentProblemId', id);
                vscode.window.showInformationMessage(
                    `Test cases saved to ${testCasePath}`
                );
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });
    // Register run command
    let runCommand = vscode.commands.registerCommand('leetcode-testcases.run', async () => {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                throw new Error('No active editor');
            }
            
            const filePath = editor.document.uri.fsPath;
            const ext = path.extname(filePath);
            const language = ext.substring(1);
            
            await editor.document.save();
            
            const problemId = context.workspaceState.get('currentProblemId');
            if (!problemId) {
                throw new Error('No problem ID found. Please fetch test cases first.');
            }
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Running test cases...",
                cancellable: false
            }, async (progress) => {
                const result = await executeCode(filePath, language, problemId);
                
                if (!result.success) {
                    throw new Error(result.error);
                }
    
                if (provider.webview) {
                    provider.webview.postMessage({
                        command: 'testResults',
                        results: result.results,
                        summary: result.summary
                    });
                }
            });
            
        } catch (error) {
            vscode.window.showErrorMessage(`Error: ${error.message}`);
        }
    });

    context.subscriptions.push(fetchCommand, runCommand);
    console.log('Extension: Registered run command');

    console.log('CPH LeetCode Extension: Activation complete');
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};