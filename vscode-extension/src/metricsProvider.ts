import * as vscode from 'vscode';

export interface UsageMetrics {
    promptUsage: { [promptId: string]: { success: number; failure: number; lastUsed: string } };
    playgroundUsage: { [action: string]: { count: number; lastUsed: string } };
    totalSessions: number;
    totalPromptExecutions: number;
    averageResponseTime: number;
    topPrompts: Array<{ id: string; usage: number }>;
    dailyUsage: { [date: string]: number };
    weeklyStats: {
        promptsUsed: number;
        timesSaved: number;
        bugsFound: number;
        codeImproved: number;
    };
}

export class MetricsProvider implements vscode.TreeDataProvider<MetricItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MetricItem | undefined | null | void> = new vscode.EventEmitter<MetricItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MetricItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private metrics: UsageMetrics;

    constructor(private context: vscode.ExtensionContext) {
        this.metrics = this.loadMetrics();
        
        // Save metrics every 5 minutes
        setInterval(() => {
            this.saveMetrics();
        }, 300000);
    }

    private loadMetrics(): UsageMetrics {
        const stored = this.context.globalState.get<UsageMetrics>('aiMetrics');
        
        if (stored) {
            return stored;
        }
        
        return {
            promptUsage: {},
            playgroundUsage: {},
            totalSessions: 0,
            totalPromptExecutions: 0,
            averageResponseTime: 0,
            topPrompts: [],
            dailyUsage: {},
            weeklyStats: {
                promptsUsed: 0,
                timesSaved: 0,
                bugsFound: 0,
                codeImproved: 0
            }
        };
    }

    private saveMetrics(): void {
        this.context.globalState.update('aiMetrics', this.metrics);
    }

    trackActivation(): void {
        this.metrics.totalSessions++;
        this.updateDailyUsage();
        this.saveMetrics();
        this.refresh();
    }

    trackPromptUsage(promptId: string, success: boolean, responseTime?: number): void {
        if (!this.metrics.promptUsage[promptId]) {
            this.metrics.promptUsage[promptId] = { success: 0, failure: 0, lastUsed: new Date().toISOString() };
        }

        if (success) {
            this.metrics.promptUsage[promptId].success++;
            this.metrics.weeklyStats.promptsUsed++;
        } else {
            this.metrics.promptUsage[promptId].failure++;
        }

        this.metrics.promptUsage[promptId].lastUsed = new Date().toISOString();
        this.metrics.totalPromptExecutions++;

        if (responseTime) {
            this.updateAverageResponseTime(responseTime);
        }

        this.updateTopPrompts();
        this.updateDailyUsage();
        this.saveMetrics();
        this.refresh();
    }

    trackPlaygroundUsage(action: string, success: boolean): void {
        if (!this.metrics.playgroundUsage[action]) {
            this.metrics.playgroundUsage[action] = { count: 0, lastUsed: new Date().toISOString() };
        }

        this.metrics.playgroundUsage[action].count++;
        this.metrics.playgroundUsage[action].lastUsed = new Date().toISOString();

        this.updateDailyUsage();
        this.saveMetrics();
        this.refresh();
    }

    private updateAverageResponseTime(responseTime: number): void {
        const currentAvg = this.metrics.averageResponseTime;
        const totalCalls = this.metrics.totalPromptExecutions;
        
        this.metrics.averageResponseTime = ((currentAvg * (totalCalls - 1)) + responseTime) / totalCalls;
    }

    private updateTopPrompts(): void {
        const promptStats = Object.entries(this.metrics.promptUsage)
            .map(([id, stats]) => ({ id, usage: stats.success + stats.failure }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 5);

        this.metrics.topPrompts = promptStats;
    }

    private updateDailyUsage(): void {
        const today = new Date().toISOString().split('T')[0];
        this.metrics.dailyUsage[today] = (this.metrics.dailyUsage[today] || 0) + 1;
    }

    showMetricsDashboard(): void {
        const panel = vscode.window.createWebviewPanel(
            'aiMetrics',
            'AI Usage Metrics',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getMetricsWebviewContent();

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'exportMetrics':
                        await this.exportMetrics();
                        break;
                    case 'clearMetrics':
                        await this.clearMetrics();
                        panel.webview.html = this.getMetricsWebviewContent();
                        break;
                    case 'refreshMetrics':
                        panel.webview.postMessage({
                            command: 'updateMetrics',
                            metrics: this.metrics
                        });
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    private async exportMetrics(): Promise<void> {
        const exportData = {
            metrics: this.metrics,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const content = JSON.stringify(exportData, null, 2);
        
        const doc = await vscode.workspace.openTextDocument({
            content: content,
            language: 'json'
        });

        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage('Metrics exported successfully!');
    }

    private async clearMetrics(): Promise<void> {
        const confirm = await vscode.window.showWarningMessage(
            'Are you sure you want to clear all AI usage metrics?',
            'Yes, Clear All',
            'Cancel'
        );

        if (confirm === 'Yes, Clear All') {
            this.metrics = {
                promptUsage: {},
                playgroundUsage: {},
                totalSessions: 0,
                totalPromptExecutions: 0,
                averageResponseTime: 0,
                topPrompts: [],
                dailyUsage: {},
                weeklyStats: {
                    promptsUsed: 0,
                    timesSaved: 0,
                    bugsFound: 0,
                    codeImproved: 0
                }
            };
            
            this.saveMetrics();
            this.refresh();
            vscode.window.showInformationMessage('All metrics cleared successfully!');
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: MetricItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MetricItem): Thenable<MetricItem[]> {
        if (!element) {
            return Promise.resolve([
                new CategoryMetricItem('Overview', 'overview'),
                new CategoryMetricItem('Prompt Usage', 'prompts'),
                new CategoryMetricItem('Playground Activity', 'playground'),
                new CategoryMetricItem('Performance', 'performance')
            ]);
        }

        switch (element.contextValue) {
            case 'overview':
                return Promise.resolve([
                    new DataMetricItem('Total Sessions', this.metrics.totalSessions.toString()),
                    new DataMetricItem('Total Prompts Used', this.metrics.totalPromptExecutions.toString()),
                    new DataMetricItem('Success Rate', this.calculateSuccessRate()),
                    new DataMetricItem('Weekly Prompts', this.metrics.weeklyStats.promptsUsed.toString())
                ]);

            case 'prompts':
                return Promise.resolve(
                    this.metrics.topPrompts.map(prompt => 
                        new DataMetricItem(prompt.id, `${prompt.usage} uses`)
                    )
                );

            case 'playground':
                return Promise.resolve(
                    Object.entries(this.metrics.playgroundUsage).map(([action, stats]) =>
                        new DataMetricItem(action, `${stats.count} times`)
                    )
                );

            case 'performance':
                return Promise.resolve([
                    new DataMetricItem('Avg Response Time', `${this.metrics.averageResponseTime.toFixed(2)}ms`),
                    new DataMetricItem('Total API Calls', this.metrics.totalPromptExecutions.toString()),
                    new DataMetricItem('Today\'s Usage', (this.metrics.dailyUsage[new Date().toISOString().split('T')[0]] || 0).toString())
                ]);

            default:
                return Promise.resolve([]);
        }
    }

    private calculateSuccessRate(): string {
        const totalSuccess = Object.values(this.metrics.promptUsage)
            .reduce((sum, stats) => sum + stats.success, 0);
        const totalFailure = Object.values(this.metrics.promptUsage)
            .reduce((sum, stats) => sum + stats.failure, 0);
        
        const total = totalSuccess + totalFailure;
        if (total === 0) return '0%';
        
        return `${((totalSuccess / total) * 100).toFixed(1)}%`;
    }

    private getMetricsWebviewContent(): string {
        const successRate = this.calculateSuccessRate();
        const recentDays = this.getRecentDailyUsage(7);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Usage Metrics</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        
        .metrics-header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        
        .stat-label {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9rem;
        }
        
        .chart-container {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
        }
        
        .chart-title {
            text-align: center;
            margin-bottom: 1rem;
            color: var(--vscode-textLink-foreground);
        }
        
        .actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
        }
        
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
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
    <div class="metrics-header">
        <h1>📊 AI Usage Metrics Dashboard</h1>
        <p>Track your AI assistant usage and productivity gains</p>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-number">${this.metrics.totalSessions}</div>
            <div class="stat-label">Total Sessions</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-number">${this.metrics.totalPromptExecutions}</div>
            <div class="stat-label">Prompts Used</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-number">${successRate}</div>
            <div class="stat-label">Success Rate</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-number">${this.metrics.weeklyStats.promptsUsed}</div>
            <div class="stat-label">This Week</div>
        </div>
    </div>
    
    <div class="chart-container">
        <h3 class="chart-title">Daily Usage (Last 7 Days)</h3>
        <canvas id="dailyUsageChart" width="400" height="200"></canvas>
    </div>
    
    <div class="chart-container">
        <h3 class="chart-title">Top Prompts</h3>
        <canvas id="topPromptsChart" width="400" height="200"></canvas>
    </div>
    
    <div class="actions">
        <button class="btn" onclick="exportMetrics()">📤 Export Data</button>
        <button class="btn btn-secondary" onclick="refreshMetrics()">🔄 Refresh</button>
        <button class="btn btn-secondary" onclick="clearMetrics()">🗑️ Clear All</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Daily usage chart
        const dailyCtx = document.getElementById('dailyUsageChart').getContext('2d');
        const dailyData = ${JSON.stringify(recentDays)};
        
        new Chart(dailyCtx, {
            type: 'line',
            data: {
                labels: dailyData.map(d => d.date),
                datasets: [{
                    label: 'Daily Usage',
                    data: dailyData.map(d => d.count),
                    borderColor: '#007acc',
                    backgroundColor: 'rgba(0, 122, 204, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Top prompts chart
        const promptsCtx = document.getElementById('topPromptsChart').getContext('2d');
        const topPrompts = ${JSON.stringify(this.metrics.topPrompts)};
        
        new Chart(promptsCtx, {
            type: 'bar',
            data: {
                labels: topPrompts.map(p => p.id),
                datasets: [{
                    label: 'Usage Count',
                    data: topPrompts.map(p => p.usage),
                    backgroundColor: '#007acc'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        function exportMetrics() {
            vscode.postMessage({ command: 'exportMetrics' });
        }
        
        function refreshMetrics() {
            vscode.postMessage({ command: 'refreshMetrics' });
        }
        
        function clearMetrics() {
            vscode.postMessage({ command: 'clearMetrics' });
        }
    </script>
</body>
</html>`;
    }

    private getRecentDailyUsage(days: number): Array<{ date: string; count: number }> {
        const result = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            result.push({
                date: dateStr,
                count: this.metrics.dailyUsage[dateStr] || 0
            });
        }
        
        return result;
    }
}

class MetricItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string
    ) {
        super(label, collapsibleState);
    }
}

class CategoryMetricItem extends MetricItem {
    constructor(label: string, contextValue: string) {
        super(label, vscode.TreeItemCollapsibleState.Expanded, contextValue);
        
        const iconMap: { [key: string]: string } = {
            'overview': 'dashboard',
            'prompts': 'symbol-method',
            'playground': 'beaker',
            'performance': 'pulse'
        };
        
        this.iconPath = new vscode.ThemeIcon(iconMap[contextValue] || 'folder');
    }
}

class DataMetricItem extends MetricItem {
    constructor(label: string, value: string) {
        super(`${label}: ${value}`, vscode.TreeItemCollapsibleState.None, 'data');
        this.iconPath = new vscode.ThemeIcon('symbol-number');
    }
}