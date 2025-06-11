import * as vscode from 'vscode';
import { PromptLibraryProvider } from './promptLibraryProvider';
import { AIPlaygroundProvider } from './aiPlaygroundProvider';
import { MetricsProvider } from './metricsProvider';
import { BedrockClient } from './bedrockClient';

export function activate(context: vscode.ExtensionContext) {
    console.log('Enterprise Copilot Coach is now active!');
    
    // Initialize providers
    const promptLibraryProvider = new PromptLibraryProvider(context);
    const aiPlaygroundProvider = new AIPlaygroundProvider(context);
    const metricsProvider = new MetricsProvider(context);
    const bedrockClient = new BedrockClient();
    
    // Register tree data providers
    vscode.window.createTreeView('enterprise.promptLibrary', {
        treeDataProvider: promptLibraryProvider,
        showCollapseAll: true
    });
    
    vscode.window.createTreeView('enterprise.aiMetrics', {
        treeDataProvider: metricsProvider,
        showCollapseAll: true
    });
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('enterprise.openPromptLibrary', () => {
            const panel = vscode.window.createWebviewPanel(
                'promptLibrary',
                'AI Prompt Library',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            
            panel.webview.html = getPromptLibraryWebviewContent();
            
            // Handle messages from webview
            panel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'tryPrompt':
                            await tryPromptOnSelection(message.promptId, bedrockClient, metricsProvider);
                            break;
                        case 'copyPrompt':
                            await vscode.env.clipboard.writeText(message.promptText);
                            vscode.window.showInformationMessage('Prompt copied to clipboard!');
                            break;
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('enterprise.tryPrompt', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }
            
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);
            
            if (!selectedText) {
                vscode.window.showErrorMessage('Please select some code first');
                return;
            }
            
            // Show quick pick for prompt selection
            const prompts = await promptLibraryProvider.getPrompts();
            const items = prompts.map(prompt => ({
                label: prompt.title,
                description: prompt.category,
                detail: prompt.description,
                prompt: prompt
            }));
            
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a prompt to try on your code'
            });
            
            if (selected) {
                await tryPromptOnSelection(selected.prompt.id, bedrockClient, metricsProvider, selectedText);
            }
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('enterprise.openAIPlayground', () => {
            aiPlaygroundProvider.openPlayground();
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('enterprise.showMetrics', () => {
            metricsProvider.showMetricsDashboard();
        })
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('enterprise.configureSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'enterprise');
        })
    );
    
    // Status bar integration
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'enterprise.openPromptLibrary';
    statusBarItem.text = '$(robot) AI Assistant';
    statusBarItem.tooltip = 'Open Enterprise AI Prompt Library';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    
    // Initialize metrics tracking
    metricsProvider.trackActivation();
}

async function tryPromptOnSelection(promptId: string, bedrockClient: BedrockClient, metricsProvider: MetricsProvider, selectedText?: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor && !selectedText) {
        vscode.window.showErrorMessage('No active editor or selected text found');
        return;
    }
    
    const codeToAnalyze = selectedText || editor!.document.getText(editor!.selection);
    if (!codeToAnalyze.trim()) {
        vscode.window.showErrorMessage('Please select some code first');
        return;
    }
    
    // Show progress
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "AI Assistant",
        cancellable: true
    }, async (progress, token) => {
        progress.report({ increment: 0, message: "Processing your code..." });
        
        try {
            // Get the prompt template
            const promptTemplate = await getPromptTemplate(promptId);
            if (!promptTemplate) {
                throw new Error('Prompt template not found');
            }
            
            progress.report({ increment: 30, message: "Calling AI service..." });
            
            // Build the full prompt
            const fullPrompt = promptTemplate.replace('[PASTE YOUR CODE HERE]', codeToAnalyze);
            
            // Call Bedrock
            const response = await bedrockClient.generateResponse(fullPrompt);
            
            progress.report({ increment: 80, message: "Displaying results..." });
            
            // Show result in new document
            const doc = await vscode.workspace.openTextDocument({
                content: `# AI Analysis Results\n\n## Original Code:\n\`\`\`${getLanguageFromEditor()}\n${codeToAnalyze}\n\`\`\`\n\n## AI Response:\n${response}`,
                language: 'markdown'
            });
            
            await vscode.window.showTextDocument(doc);
            
            // Track usage
            metricsProvider.trackPromptUsage(promptId, true);
            
            progress.report({ increment: 100, message: "Complete!" });
            
        } catch (error) {
            vscode.window.showErrorMessage(`AI Assistant Error: ${error}`);
            metricsProvider.trackPromptUsage(promptId, false);
        }
    });
}

async function getPromptTemplate(promptId: string): Promise<string | null> {
    // In a real implementation, this would fetch from the prompt library
    const templates: { [key: string]: string } = {
        'code-review': `Please review this code for:

1. **Security vulnerabilities** - Check for common security issues
2. **Performance optimizations** - Identify bottlenecks and improvements  
3. **Code quality** - Assess readability, maintainability, and best practices
4. **Bug potential** - Spot logic errors or edge cases
5. **Documentation** - Suggest improvements to comments and naming

**Code to review:**
\`\`\`
[PASTE YOUR CODE HERE]
\`\`\`

Please provide:
- Priority level for each issue (High/Medium/Low)
- Specific line references
- Suggested fixes with code examples
- Explanation of why each change improves the code`,
        
        'refactoring': `I need help refactoring this code to improve:

1. **Code Structure** - Better organization and separation of concerns
2. **Readability** - Clearer variable names and function structure
3. **Maintainability** - Easier to modify and extend
4. **Performance** - More efficient algorithms or patterns
5. **Testability** - Easier to unit test

**Current Code:**
\`\`\`
[PASTE YOUR CODE HERE]
\`\`\`

**Please provide:**
- Step-by-step refactoring plan
- Before/after comparisons
- Explanation of each improvement
- Potential risks and mitigation strategies
- Test cases to verify functionality is preserved`
    };
    
    return templates[promptId] || null;
}

function getLanguageFromEditor(): string {
    const editor = vscode.window.activeTextEditor;
    return editor ? editor.document.languageId : 'text';
}

function getPromptLibraryWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Prompt Library</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        
        .prompt-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            transition: border-color 0.2s;
        }
        
        .prompt-card:hover {
            border-color: var(--vscode-focusBorder);
        }
        
        .prompt-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 8px;
            color: var(--vscode-textLink-foreground);
        }
        
        .prompt-meta {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .tag {
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }
        
        .prompt-actions {
            display: flex;
            gap: 8px;
            margin-top: 12px;
        }
        
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
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
    </style>
</head>
<body>
    <h1>🧠 AI Prompt Library</h1>
    <p>Enterprise-curated prompts for development tasks</p>
    
    <div class="prompt-card">
        <div class="prompt-title">Code Review Assistant</div>
        <div class="prompt-meta">
            <span class="tag">Quality</span>
            <span class="tag">Beginner</span>
            <span class="tag">⭐ 4.8</span>
        </div>
        <p>Get comprehensive code review feedback with security, performance, and maintainability suggestions.</p>
        <div class="prompt-actions">
            <button class="btn" onclick="tryPrompt('code-review')">Try on Selection</button>
            <button class="btn btn-secondary" onclick="copyPrompt('code-review')">Copy Prompt</button>
        </div>
    </div>
    
    <div class="prompt-card">
        <div class="prompt-title">Intelligent Refactoring</div>
        <div class="prompt-meta">
            <span class="tag">Optimization</span>
            <span class="tag">Intermediate</span>
            <span class="tag">⭐ 4.6</span>
        </div>
        <p>Smart refactoring suggestions that improve code structure and maintainability.</p>
        <div class="prompt-actions">
            <button class="btn" onclick="tryPrompt('refactoring')">Try on Selection</button>
            <button class="btn btn-secondary" onclick="copyPrompt('refactoring')">Copy Prompt</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function tryPrompt(promptId) {
            vscode.postMessage({
                command: 'tryPrompt',
                promptId: promptId
            });
        }
        
        function copyPrompt(promptId) {
            // Get prompt text (in real implementation, fetch from library)
            const promptText = "Sample prompt text for " + promptId;
            vscode.postMessage({
                command: 'copyPrompt',
                promptText: promptText
            });
        }
    </script>
</body>
</html>`;
}

export function deactivate() {}