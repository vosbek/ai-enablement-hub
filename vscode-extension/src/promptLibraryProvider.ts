import * as vscode from 'vscode';
import axios from 'axios';

export interface Prompt {
    id: string;
    title: string;
    category: string;
    difficulty: string;
    description: string;
    template: string;
    tags: string[];
    effectiveness: number;
    usageCount: number;
    lastUpdated: string;
}

export class PromptLibraryProvider implements vscode.TreeDataProvider<PromptItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PromptItem | undefined | null | void> = new vscode.EventEmitter<PromptItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PromptItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private prompts: Prompt[] = [];
    private categories: Set<string> = new Set();

    constructor(private context: vscode.ExtensionContext) {
        this.loadPrompts();
        
        // Refresh prompts every hour
        setInterval(() => {
            this.loadPrompts();
        }, 3600000);
    }

    async loadPrompts(): Promise<void> {
        try {
            // Try to load from remote first
            await this.loadPromptsFromRemote();
        } catch (error) {
            console.warn('Failed to load remote prompts, using local cache:', error);
            // Fallback to local cached prompts
            this.loadPromptsFromCache();
        }
        
        this.refresh();
    }

    private async loadPromptsFromRemote(): Promise<void> {
        const config = vscode.workspace.getConfiguration('enterprise');
        const promptLibraryUrl = config.get<string>('promptLibraryUrl');
        
        if (!promptLibraryUrl) {
            throw new Error('Prompt library URL not configured');
        }

        const response = await axios.get(promptLibraryUrl, { timeout: 10000 });
        this.prompts = response.data.prompts || [];
        
        // Cache the prompts locally
        await this.context.globalState.update('cachedPrompts', {
            prompts: this.prompts,
            lastUpdated: new Date().toISOString()
        });
        
        this.updateCategories();
    }

    private loadPromptsFromCache(): void {
        const cached = this.context.globalState.get<{ prompts: Prompt[], lastUpdated: string }>('cachedPrompts');
        
        if (cached && cached.prompts) {
            this.prompts = cached.prompts;
        } else {
            // Fallback to built-in prompts
            this.prompts = this.getBuiltInPrompts();
        }
        
        this.updateCategories();
    }

    private getBuiltInPrompts(): Prompt[] {
        return [
            {
                id: 'code-review',
                title: 'Code Review Assistant',
                category: 'quality',
                difficulty: 'beginner',
                description: 'Get comprehensive code review feedback with security, performance, and maintainability suggestions.',
                template: `Please review this code for:

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
                tags: ['review', 'quality', 'security', 'best-practices'],
                effectiveness: 4.8,
                usageCount: 2847,
                lastUpdated: '2024-12-06'
            },
            {
                id: 'refactoring',
                title: 'Intelligent Refactoring',
                category: 'optimization',
                difficulty: 'intermediate',
                description: 'Smart refactoring suggestions that improve code structure and maintainability.',
                template: `I need help refactoring this code to improve:

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
                tags: ['refactoring', 'clean-code', 'patterns', 'architecture'],
                effectiveness: 4.6,
                usageCount: 1923,
                lastUpdated: '2024-12-05'
            },
            {
                id: 'test-generation',
                title: 'Smart Test Generator',
                category: 'testing',
                difficulty: 'beginner',
                description: 'Generate comprehensive unit tests with edge cases and assertions.',
                template: `Generate comprehensive unit tests for this code:

\`\`\`
{CODE}
\`\`\`

Please include:
1. **Happy path tests** - Normal functionality
2. **Edge cases** - Boundary conditions and unusual inputs
3. **Error handling** - Exception scenarios
4. **Mocking** - External dependencies if needed
5. **Test data** - Realistic test fixtures

Generate tests using the appropriate testing framework for this language.
Include clear test names and good assertions.`,
                tags: ['testing', 'unit-tests', 'tdd', 'quality'],
                effectiveness: 4.7,
                usageCount: 3421,
                lastUpdated: '2024-12-04'
            }
        ];
    }

    private updateCategories(): void {
        this.categories.clear();
        this.prompts.forEach(prompt => {
            this.categories.add(prompt.category);
        });
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: PromptItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PromptItem): Thenable<PromptItem[]> {
        if (!element) {
            // Root level - show categories
            return Promise.resolve(
                Array.from(this.categories).map(category => new CategoryItem(category))
            );
        } else if (element instanceof CategoryItem) {
            // Show prompts for this category
            const categoryPrompts = this.prompts.filter(p => p.category === element.category);
            return Promise.resolve(
                categoryPrompts.map(prompt => new PromptItem(prompt))
            );
        }
        
        return Promise.resolve([]);
    }

    getPrompts(): Promise<Prompt[]> {
        return Promise.resolve(this.prompts);
    }

    getPromptById(id: string): Prompt | undefined {
        return this.prompts.find(p => p.id === id);
    }
}

class CategoryItem extends vscode.TreeItem {
    constructor(public readonly category: string) {
        super(category, vscode.TreeItemCollapsibleState.Collapsed);
        
        this.tooltip = `${category} prompts`;
        this.contextValue = 'category';
        
        // Set category-specific icons
        const iconMap: { [key: string]: string } = {
            'quality': 'checklist',
            'optimization': 'rocket',
            'testing': 'beaker',
            'security': 'shield',
            'documentation': 'book'
        };
        
        this.iconPath = new vscode.ThemeIcon(iconMap[category] || 'folder');
    }
}

class PromptItem extends vscode.TreeItem {
    constructor(public readonly prompt: Prompt) {
        super(prompt.title, vscode.TreeItemCollapsibleState.None);
        
        this.tooltip = `${prompt.title}\n${prompt.description}\nEffectiveness: ${prompt.effectiveness}/5\nUsed ${prompt.usageCount} times`;
        this.description = `${prompt.difficulty} • ⭐${prompt.effectiveness}`;
        this.contextValue = 'prompt';
        
        // Set difficulty-based icons
        const iconMap: { [key: string]: string } = {
            'beginner': 'person',
            'intermediate': 'mortar-board',
            'advanced': 'rocket'
        };
        
        this.iconPath = new vscode.ThemeIcon(iconMap[prompt.difficulty] || 'code');
        
        // Make it clickable
        this.command = {
            command: 'enterprise.tryPrompt',
            title: 'Try Prompt',
            arguments: [prompt.id]
        };
    }
}