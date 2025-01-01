const { getStyles } = require('./styles');
function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <style>${getStyles()}</style>
            </head>
            <body>
                <div class="container">
                    <!-- Home View -->
                    <div id="homeView" class="active">
                        <h2>LeetCode Test Cases</h2>
                        <p>Paste the LeetCode problem URL to fetch test cases.</p>
                        <div class="input-group">
                            <input type="text" 
                                id="leetcodeUrl" 
                                class="url-input" 
                                placeholder="https://leetcode.com/problems/...">
                            <button id="fetchButton" 
                                class="fetch-button">
                                Fetch Test Cases
                            </button>
                        </div>
                    </div>

                    <!-- Test Cases View -->
                    <div id="testCasesView">
                        <div class="header">
                            Local: extension
                            <button class="new-problem-button" onclick="showView('homeView')">
                                New Problem
                            </button>
                        </div>
                        
                        <div class="problem-section">
                            <div class="problem-header" onclick="toggleProblem()">
                                <div class="problem-title">
                                    <span class="arrow">▶</span>
                                    <span>Problem Description</span>
                                </div>
                            </div>
                            <div class="problem-content" id="problemContent">
                                <!-- Problem content will be inserted here -->
                            </div>
                        </div>

                        <button class="button run-all-button" id="runAllButton">
                            <span style="font-size: 10px;">▶</span> Run All Tests
                        </button>
                        <div id="testCasesContainer">
                            <!-- Test cases will be inserted here -->
                        </div>
                        <button class="button add-testcase-button" id="addTestCase">
                            <span style="font-size: 10px;">+</span> New Test Case
                        </button>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();

                    // Add this new function in the <script> section
                    function toggleProblem() {
                        const content = document.getElementById('problemContent');
                        const arrow = document.querySelector('.problem-header .arrow');
                        const isShowing = content.classList.contains('show');
                        
                        content.classList.toggle('show');
                        arrow.style.transform = isShowing ? 'rotate(0deg)' : 'rotate(90deg)';
                    }

                    function showView(viewId) {
                        document.querySelectorAll('.container > div').forEach(div => div.classList.remove('active'));
                        document.getElementById(viewId).classList.add('active');
                    }

                    function createTestCase(index, input = '', output = '') {
                        return \`
                            <div class="test-case" id="testcase-\${index}">
                                <div class="test-case-header" onclick="toggleTestCase(\${index})">
                                    <div class="test-case-summary">
                                        <span class="arrow">▼</span>
                                        <span>TC \${index + 1}</span>
                                        <span class="test-case-status" id="status-\${index}"></span>
                                    </div>
                                    <div class="test-case-actions" onclick="event.stopPropagation()">
                                        <button class="button run-button" onclick="runTestCase(\${index})">▶</button>
                                        <button class="button delete-button" onclick="deleteTestCase(\${index})">🗑</button>
                                    </div>
                                </div>
                                <div class="test-case-content">
                                    <div class="input-section">
                                        <div class="section-header">
                                            <span>Input:</span>
                                            <button class="copy-button" onclick="copyText(this)">Copy</button>
                                        </div>
                                        <textarea class="input-box" oninput="autoResize(this)">\${input}</textarea>
                                    </div>
                                    <div class="output-section">
                                        <div class="section-header">
                                            <span>Expected Output:</span>
                                            <button class="copy-button" onclick="copyText(this)">Copy</button>
                                        </div>
                                        <textarea class="output-box" oninput="autoResize(this)">\${output}</textarea>
                                    </div>
                                    <div class="actual-output-section" id="actual-output-\${index}">
                                        <div class="section-header">
                                            <span>Actual Output:</span>
                                            <button class="copy-button" onclick="copyText(this)">Copy</button>
                                        </div>
                                        <textarea class="output-box actual-output" readonly></textarea>
                                    </div>
                                </div>
                            </div>
                        \`;
                    }
                    
                    function toggleTestCase(index) {
                        const testCase = document.getElementById(\`testcase-\${index}\`);
                        testCase.classList.toggle('collapsed');
                    }

                    async function runAllTestCases() {
                        const runAllButton = document.getElementById('runAllButton');
                        runAllButton.disabled = true;
                        runAllButton.innerHTML = '⌛ Running...';

                        const testCases = document.querySelectorAll('.test-case');
                        for (let i = 0; i < testCases.length; i++) {
                            const testCase = testCases[i];
                            const index = parseInt(testCase.id.split('-')[1]);
                            await new Promise(resolve => {
                                runTestCase(index);
                                // Wait for the result before running the next test
                                const checkResult = (event) => {
                                    const message = event.data;
                                    if (message.command === 'testCaseResult' && message.index === index) {
                                        window.removeEventListener('message', checkResult);
                                        resolve();
                                    }
                                };
                                window.addEventListener('message', checkResult);
                            });
                        }

                        runAllButton.disabled = false;
                        runAllButton.innerHTML = '▶ Run All Tests';
                    }

                    function copyText(button) {
                        const textarea = button.parentElement.nextElementSibling;
                        navigator.clipboard.writeText(textarea.value);
                    }

                    function updateTestCaseStatus(index, passed, actualOutput) {
                        const testCase = document.getElementById(\`testcase-\${index}\`);
                        const statusElement = document.getElementById(\`status-\${index}\`);
                        const actualOutputSection = document.getElementById(\`actual-output-\${index}\`);
                        const actualOutputBox = actualOutputSection.querySelector('.actual-output');

                        statusElement.textContent = passed ? 'Accepted' : 'Wrong Answer';
                        statusElement.className = \`test-case-status \${passed ? 'status-accepted' : 'status-wrong'}\`;

                        actualOutputBox.value = actualOutput;
                        actualOutputSection.classList.add('show');
                        autoResize(actualOutputBox);

                        // Expand the test case if it failed
                        if (!passed && testCase.classList.contains('collapsed')) {
                            testCase.classList.remove('collapsed');
                        }
                    }

                    function autoResize(textarea) {
                        textarea.style.height = 'auto';
                        textarea.style.height = textarea.scrollHeight + 'px';
                    }

                    function runTestCase(index) {
                        const testCase = document.getElementById(\`testcase-\${index}\`);
                        const input = testCase.querySelector('.input-box').value;
                        const expectedOutput = testCase.querySelector('.output-box').value;
                        
                        // Show loading state
                        const runButton = testCase.querySelector('.run-button');
                        const originalText = runButton.innerHTML;
                        runButton.innerHTML = '⌛';
                        runButton.disabled = true;

                        vscode.postMessage({
                            command: 'runSingle',
                            testCase: { input, expectedOutput, index }
                        });
                    }

                    function deleteTestCase(index) {
                        const testCase = document.getElementById(\`testcase-\${index}\`);
                        testCase.remove();
                    }

                    document.getElementById('fetchButton').addEventListener('click', () => {
                        const url = document.getElementById('leetcodeUrl').value;
                        vscode.postMessage({
                            command: 'fetch',
                            url: url
                        });
                    });

                    document.getElementById('runAllButton').addEventListener('click', runAllTestCases);

                    document.getElementById('addTestCase').addEventListener('click', () => {
                        const container = document.getElementById('testCasesContainer');
                        const currentCount = container.children.length;
                        const newTestCase = createTestCase(currentCount);
                        container.insertAdjacentHTML('beforeend', newTestCase);
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'showTestCases':
                                const container = document.getElementById('testCasesContainer');
                                container.innerHTML = message.testCases.inputs.map((input, index) => 
                                    createTestCase(index, input, message.testCases.outputs[index])
                                ).join('');
                                
                                if (message.problemContent) {
                                    const problemContentDiv = document.getElementById('problemContent');
                                    problemContentDiv.innerHTML = message.problemContent;
                                }
                                
                                showView('testCasesView');
                                break;
                            case 'testCaseResult':
                                const runButton = document.querySelector(\`#testcase-\${message.index} .run-button\`);
                                runButton.innerHTML = '▶';
                                runButton.disabled = false;
                                
                                updateTestCaseStatus(
                                    message.index,
                                    message.passed,
                                    message.actualOutput
                                );
                                break;
                        }
                    });
                </script>
            </body>
        </html>
    `;
}

module.exports = { getWebviewContent };