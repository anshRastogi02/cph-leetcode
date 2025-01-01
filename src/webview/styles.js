function getStyles() {
    return `
         body {
            background-color: var(--vscode-editor-background, #1a1a1a);
            color: var(--vscode-editor-foreground, #cccccc);
            font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
            font-size: 13px;
            border: 1px solid var(--vscode-input-border);
            /* Remove these lines */
            /* overflow: hidden; */ 
        }
        .container {
            padding: 16px;
            height: 100vh;
            overflow-y: auto;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none;  /* IE and Edge */
        }
        .container::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
        }
            .input-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }
        .header {
            font-size: 24px;
            margin-bottom: 20px;
        }
        .test-case {
            background-color: #252526;
            border-radius: 4px;
            margin-bottom: 16px;
        }
        .url-input {
            width: 100%;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            color: var(--vscode-input-foreground);
            padding: 6px 8px;
            border-radius: 2px;
            height: 24px;
            font-size: 12px;
            box-sizing: border-box;
        }
        .test-case-header {
            padding: 8px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #333;
        }
        .test-case-title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #0098ff;
            cursor: pointer;
        }
        .test-case-actions {
            display: flex;
            gap: 8px;
        }
        .test-case-content {
            padding: 12px;
        }
        .input-section, .output-section {
            margin-bottom: 16px;
        }
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .input-box, .output-box {
            background-color: #1e1e1e;
            border: 1px solid #333;
            padding: 8px;
            border-radius: 4px;
            min-height: 60px;
            width: 100%;
            box-sizing: border-box;
            color: #ffffff;
            font-family: monospace;
        }
        .button {
            padding: 6px 12px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .run-button {
            background-color: #4CAF50;
            color: white;
        }
        .delete-button {
            background-color: #b71c1c;
            color: white;
        }
        .copy-button {
            background-color: transparent;
            color: #666;
            border: none;
            cursor: pointer;
        }
        .add-testcase-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            padding: 4px 12px;
            height: 24px;
            border-radius: 2px;
            margin-top: 12px;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }
        #homeView, #testCasesView {
            display: none;
        }
        .active {
            display: block !important;
        }
        .test-case-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-accepted {
            background-color: #2cba3f;
            color: white;
        }
        .status-wrong {
            background-color: #ff4444;
            color: white;
        }
        .actual-output-section {
            margin-bottom: 16px;
            display: none;
        }
        .actual-output-section.show {
            display: block;
        }
        .run-all-button {
            background-color: #4CAF50;
            color: white;
            padding: 8px 16px;
            margin-bottom: 16px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .collapsed .test-case-content {
            display: none;
        }
        .test-case-header .arrow {
            transition: transform 0.2s;
        }
        .collapsed .arrow {
            transform: rotate(-90deg);
        }
        .test-case-summary {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .fetch-button {
            align-self: flex-end;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border, transparent);
            padding: 4px 16px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 11px;
            height: 24px;
        }
        .fetch-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .problem-section {
            background-color: var(--vscode-sideBar-background, #252526);
            border: 1px solid var(--vscode-panel-border, #303031);
            border-radius: 3px;
            margin-bottom: 12px;
        }
        .problem-header {
            padding: 6px 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--vscode-panel-border, #303031);
            background-color: var(--vscode-sideBarSectionHeader-background, #2d2d2d);
            cursor: pointer;
        }
        .problem-title {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
        }
        .problem-content {
            padding: 12px;
            font-size: 12px;
            line-height: 1.5;
            display: none;
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
            max-height: 500px;
            overflow-y: auto;
        }
        .problem-content img {
            max-width: 100%;
            height: auto;
        }
        .problem-content pre {
            white-space: pre-wrap;
            background-color: var(--vscode-editor-background);
            padding: 8px;
            border-radius: 3px;
            overflow-x: auto;
        }
        .problem-content.show {
            display: block;
        }
            .problem-content code {
            font-family: var(--vscode-editor-font-family, monospace);
            font-size: 11px;
        }
        .new-problem-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border, transparent);
            padding: 4px 8px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 11px;
            position: absolute;
            right: 16px;
            top: 16px;
        }
        .new-problem-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .add-testcase-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: 1px solid var(--vscode-button-border, #454545);
            padding: 4px 12px;
            height: 24px;
            border-radius: 2px;
            margin-top: 12px;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            width: 100%;
            cursor: pointer;
        }
        .add-testcase-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        `;
}

module.exports = { getStyles };