import * as vscode from 'vscode';
import { BedrockClient } from './bedrockClient';
import { MetricsProvider } from './metricsProvider';

export class AIPlaygroundProvider {
    private bedrockClient: BedrockClient;
    private metricsProvider: MetricsProvider;
    
    constructor(private context: vscode.ExtensionContext) {
        this.bedrockClient = new BedrockClient();
        this.metricsProvider = new MetricsProvider(context);
    }

    openPlayground(): void {
        const panel = vscode.window.createWebviewPanel(
            'aiPlayground',
            'AI Playground',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
            }
        );

        panel.webview.html = this.getPlaygroundWebviewContent(panel.webview);

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'testPrompt':
                        await this.handleTestPrompt(panel, message.prompt, message.code);
                        break;
                    case 'savePrompt':
                        await this.handleSavePrompt(message.prompt, message.title);
                        break;
                    case 'loadTemplate':
                        await this.handleLoadTemplate(panel, message.templateId);
                        break;
                    case 'testConnection':
                        await this.handleTestConnection(panel);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    private async handleTestPrompt(panel: vscode.WebviewPanel, prompt: string, code: string): Promise<void> {
        try {
            panel.webview.postMessage({
                command: 'showLoading',
                message: 'Processing your prompt...'
            });

            // Replace placeholder in prompt with actual code
            const fullPrompt = prompt.replace('{CODE}', code);
            
            // Call AI service
            const response = await this.bedrockClient.generateResponse(fullPrompt);
            
            panel.webview.postMessage({
                command: 'showResult',
                result: response,
                success: true
            });
            
            // Track usage
            this.metricsProvider.trackPlaygroundUsage('test-prompt', true);
            
        } catch (error) {
            panel.webview.postMessage({
                command: 'showResult',
                result: `Error: ${error}`,
                success: false
            });
            
            this.metricsProvider.trackPlaygroundUsage('test-prompt', false);
        }
    }

    private async handleSavePrompt(prompt: string, title: string): Promise<void> {
        // In a real implementation, this would save to the prompt library
        vscode.window.showInformationMessage(`Prompt "${title}" saved to your personal library!`);
        this.metricsProvider.trackPlaygroundUsage('save-prompt', true);
    }

    private async handleLoadTemplate(panel: vscode.WebviewPanel, templateId: string): Promise<void> {
        const templates: { [key: string]: { prompt: string, sampleCode: string } } = {
            'code-review': {
                prompt: `Please review this code for:

1. **Security vulnerabilities** - Check for common security issues
2. **Performance optimizations** - Identify bottlenecks and improvements  
3. **Code quality** - Assess readability, maintainability, and best practices
4. **Bug potential** - Spot logic errors or edge cases
5. **Documentation** - Suggest improvements to comments and naming

**Code to review:**
\`\`\`
{CODE}
\`\`\`

Please provide:
- Priority level for each issue (High/Medium/Low)
- Specific line references
- Suggested fixes with code examples
- Explanation of why each change improves the code`,
                sampleCode: `function getUserData(id) {
  const user = database.query("SELECT * FROM users WHERE id = " + id);
  if (user) {
    return {
      name: user.name,
      email: user.email,
      password: user.password
    };
  }
  return null;
}`
            },
            'refactoring': {
                prompt: `I need help refactoring this code to improve:

1. **Code Structure** - Better organization and separation of concerns
2. **Readability** - Clearer variable names and function structure
3. **Maintainability** - Easier to modify and extend
4. **Performance** - More efficient algorithms or patterns
5. **Testability** - Easier to unit test

**Current Code:**
\`\`\`
{CODE}
\`\`\`

**Please provide:**
- Step-by-step refactoring plan
- Before/after comparisons
- Explanation of each improvement
- Potential risks and mitigation strategies
- Test cases to verify functionality is preserved`,
                sampleCode: `function processUserOrders(users) {
  let result = [];
  for (let i = 0; i < users.length; i++) {
    let user = users[i];
    if (user.orders && user.orders.length > 0) {
      let totalAmount = 0;
      let orderCount = 0;
      for (let j = 0; j < user.orders.length; j++) {
        let order = user.orders[j];
        if (order.status === 'completed') {
          totalAmount += order.amount;
          orderCount++;
        }
      }
      if (orderCount > 0) {
        result.push({
          userId: user.id,
          userName: user.name,
          completedOrders: orderCount,
          totalRevenue: totalAmount,
          averageOrderValue: totalAmount / orderCount
        });
      }
    }
  }
  return result;
}`
            }
        };

        const template = templates[templateId];
        if (template) {
            panel.webview.postMessage({
                command: 'loadTemplate',
                prompt: template.prompt,
                sampleCode: template.sampleCode
            });
        }
    }

    private async handleTestConnection(panel: vscode.WebviewPanel): Promise<void> {
        try {
            panel.webview.postMessage({
                command: 'showLoading',
                message: 'Testing AI connection...'
            });

            const isConnected = await this.bedrockClient.testConnection();
            const modelInfo = this.bedrockClient.getModelInfo();
            
            panel.webview.postMessage({
                command: 'connectionResult',
                success: isConnected,
                modelInfo: modelInfo,
                message: isConnected ? 'Connection successful!' : 'Connection failed. Please check your AWS configuration.'
            });
            
        } catch (error) {
            panel.webview.postMessage({
                command: 'connectionResult',
                success: false,
                message: `Connection failed: ${error}`
            });
        }
    }

    private getPlaygroundWebviewContent(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Playground</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        
        .playground-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            height: calc(100vh - 40px);
        }
        
        .panel {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 16px;
            display: flex;
            flex-direction: column;
        }
        
        .panel h3 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
        }
        
        .textarea-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            margin-bottom: 12px;
        }
        
        textarea {
            flex: 1;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 12px;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            resize: none;
        }
        
        textarea:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .controls {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }
        
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .templates {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }
        
        .template-btn {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border: none;
            padding: 4px 8px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .template-btn:hover {
            opacity: 0.8;
        }
        
        .result-area {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
            white-space: pre-wrap;
            overflow-y: auto;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            line-height: 1.5;
        }
        
        .loading {
            color: var(--vscode-textPreformat-foreground);
            font-style: italic;
        }
        
        .error {
            color: var(--vscode-errorForeground);
        }
        
        .success {
            color: var(--vscode-foreground);
        }
        
        .connection-status {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding: 8px;
            background: var(--vscode-textCodeBlock-background);
            border-radius: 4px;
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        
        .status-connected {
            background: var(--vscode-testing-iconPassed);
        }
        
        .status-disconnected {
            background: var(--vscode-testing-iconFailed);
        }
        
        @media (max-width: 1000px) {
            .playground-container {
                grid-template-columns: 1fr;
                grid-template-rows: 1fr 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="playground-container">
        <div class="panel">
            <h3>🧪 AI Prompt Testing</h3>
            
            <div class="connection-status" id="connectionStatus">
                <div class="status-indicator status-disconnected" id="statusIndicator"></div>
                <span id="statusText">Not connected</span>
                <button class="btn btn-secondary" onclick="testConnection()" style="margin-left: auto;">Test Connection</button>
            </div>
            
            <div class="templates">
                <button class="template-btn" onclick="loadTemplate('code-review')">Code Review</button>
                <button class="template-btn" onclick="loadTemplate('refactoring')">Refactoring</button>
                <button class="template-btn" onclick="loadTemplate('custom')">Custom</button>
            </div>
            
            <div class="textarea-container">
                <label for="promptArea"><strong>Prompt Template:</strong></label>
                <textarea id="promptArea" placeholder="Enter your AI prompt here. Use {CODE} as a placeholder for the code you want to analyze.">Enter your prompt here. Use {CODE} as a placeholder for your code.</textarea>
            </div>
            
            <div class="textarea-container">
                <label for="codeArea"><strong>Test Code:</strong></label>
                <textarea id="codeArea" placeholder="Paste the code you want to test the prompt on...">// Paste your test code here
function example() {
    console.log("Hello, World!");
}</textarea>
            </div>
            
            <div class="controls">
                <button class="btn" onclick="testPrompt()">🚀 Test Prompt</button>
                <button class="btn btn-secondary" onclick="clearAll()">Clear All</button>
                <button class="btn btn-secondary" onclick="savePrompt()">💾 Save Prompt</button>
            </div>
        </div>
        
        <div class="panel">
            <h3>📋 AI Response</h3>
            <div class="result-area" id="resultArea">Click "Test Prompt" to see AI response here...</div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function testPrompt() {
            const prompt = document.getElementById('promptArea').value;
            const code = document.getElementById('codeArea').value;
            
            if (!prompt.trim() || !code.trim()) {
                showResult('Please enter both a prompt and test code.', false);
                return;
            }
            
            vscode.postMessage({
                command: 'testPrompt',
                prompt: prompt,
                code: code
            });
        }
        
        function loadTemplate(templateId) {
            vscode.postMessage({
                command: 'loadTemplate',
                templateId: templateId
            });
        }
        
        function clearAll() {
            document.getElementById('promptArea').value = '';
            document.getElementById('codeArea').value = '';
            document.getElementById('resultArea').textContent = 'Cleared. Enter a new prompt to test.';
            document.getElementById('resultArea').className = 'result-area';
        }
        
        function savePrompt() {
            const prompt = document.getElementById('promptArea').value;
            if (!prompt.trim()) {
                showResult('Please enter a prompt to save.', false);
                return;
            }
            
            const title = window.prompt('Enter a title for your prompt:');
            if (title) {
                vscode.postMessage({
                    command: 'savePrompt',
                    prompt: prompt,
                    title: title
                });
            }
        }
        
        function testConnection() {
            vscode.postMessage({
                command: 'testConnection'
            });
        }
        
        function showResult(result, success) {
            const resultArea = document.getElementById('resultArea');
            resultArea.textContent = result;
            resultArea.className = 'result-area ' + (success ? 'success' : 'error');
        }
        
        function showLoading(message) {
            const resultArea = document.getElementById('resultArea');
            resultArea.textContent = message;
            resultArea.className = 'result-area loading';
        }
        
        function updateConnectionStatus(connected, modelInfo, message) {
            const indicator = document.getElementById('statusIndicator');
            const statusText = document.getElementById('statusText');
            
            if (connected) {
                indicator.className = 'status-indicator status-connected';
                statusText.textContent = \`Connected (\${modelInfo.provider} - \${modelInfo.modelId})\`;
            } else {
                indicator.className = 'status-indicator status-disconnected';
                statusText.textContent = message || 'Not connected';
            }
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'showResult':
                    showResult(message.result, message.success);
                    break;
                case 'showLoading':
                    showLoading(message.message);
                    break;
                case 'loadTemplate':
                    document.getElementById('promptArea').value = message.prompt;
                    document.getElementById('codeArea').value = message.sampleCode;
                    break;
                case 'connectionResult':
                    updateConnectionStatus(message.success, message.modelInfo, message.message);
                    if (!message.success) {
                        showResult(message.message, false);
                    }
                    break;
            }
        });
        
        // Test connection on load
        setTimeout(() => {
            testConnection();
        }, 1000);
    </script>
</body>
</html>`;
    }
}