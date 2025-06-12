# Repository-Specific Prompt Generator Design

## 🎯 Vision
Generate custom AI prompt libraries by analyzing codebases, creating contextual prompts with real examples from the user's actual code.

## 🏗️ Architecture Overview

### Core Components

#### 1. **Codebase Analyzer**
```typescript
interface CodebaseAnalysis {
  // Technology Stack Detection
  technologies: {
    languages: string[];           // TypeScript, Python, Java
    frameworks: string[];          // React, Express, Django
    databases: string[];           // PostgreSQL, MongoDB
    tools: string[];              // Docker, Jest, Webpack
    patterns: string[];           // MVC, microservices, monolith
  };
  
  // Code Structure Analysis
  structure: {
    projectType: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop';
    architecture: 'monolith' | 'microservices' | 'serverless' | 'jamstack';
    testCoverage: number;
    documentation: 'poor' | 'moderate' | 'good' | 'excellent';
    codeQuality: CodeQualityMetrics;
  };
  
  // Real Code Examples
  examples: {
    components: CodeExample[];      // Actual components from their code
    functions: CodeExample[];       // Key functions they've written
    tests: CodeExample[];          // Their existing test patterns
    configs: CodeExample[];        // Configuration files
    apis: CodeExample[];           // API endpoints/calls
  };
  
  // Pain Points & Opportunities
  insights: {
    missingPatterns: string[];     // What they could improve
    inconsistencies: string[];     // Code style issues
    opportunities: string[];       // Where AI could help most
    complexity: ComplexityAnalysis;
  };
}
```

#### 2. **Prompt Template Generator**
```typescript
interface GeneratedPrompt {
  id: string;
  title: string;
  category: SDLCPhase;
  description: string;
  
  // Contextual to their codebase
  template: string;              // The actual prompt
  realExamples: CodeExample[];   // From their actual code
  usageGuidance: string;         // When to use this prompt
  expectedOutcome: string;       // What they'll get
  
  // SDLC Integration
  phase: 'planning' | 'design' | 'implementation' | 'testing' | 'deployment' | 'maintenance';
  triggers: string[];            // When this prompt is most useful
  relatedPrompts: string[];      // Other prompts to use together
}
```

#### 3. **SDLC-Aware Prompt Categories**

##### **Planning Phase**
```typescript
// Generated based on their project structure
const planningPrompts = [
  {
    title: "Analyze Requirements for [ProjectName] Feature",
    template: `Analyze these requirements for a new feature in our ${projectType} application:

Requirements: [YOUR REQUIREMENTS HERE]

Context from our codebase:
- We use ${techStack.join(', ')} 
- Our architecture follows ${architecture} pattern
- Example similar feature: ${realExample.path}

Please provide:
1. **Technical breakdown** - How this fits our current architecture
2. **Impact analysis** - What existing code will be affected
3. **Implementation approach** - Step-by-step plan using our patterns
4. **Testing strategy** - Based on our current test structure
5. **Potential risks** - Considering our specific setup`,
    
    realExamples: [/* actual code from their repo */],
    usageGuidance: "Use when starting any new feature development",
    triggers: ["New feature request", "Epic planning", "Sprint planning"]
  }
];
```

##### **Implementation Phase**
```typescript
const implementationPrompts = [
  {
    title: "Implement [Feature] Following Our Patterns",
    template: `Implement this feature following our established patterns:

Feature Requirements: [YOUR REQUIREMENTS]

Our Coding Patterns:
${extractedPatterns.map(p => `- ${p.description}: See ${p.example}`).join('\n')}

Our File Structure:
${fileStructure}

Our Naming Conventions:
${namingPatterns}

Please create:
1. **Component/Module structure** - Following our ${architecture} pattern
2. **Implementation code** - Using our established patterns
3. **Error handling** - Consistent with our approach in ${errorHandlingExample}
4. **Type definitions** - Following our TypeScript patterns
5. **Integration points** - How it connects to existing code`,
    
    realExamples: [/* their actual components */]
  }
];
```

#### 4. **Enterprise Aggregation System**
```typescript
interface EnterprisePromptLibrary {
  // Individual repo libraries
  repositories: {
    [repoName: string]: {
      analysis: CodebaseAnalysis;
      prompts: GeneratedPrompt[];
      metrics: UsageMetrics;
      lastUpdated: Date;
    };
  };
  
  // Aggregated insights
  patterns: {
    commonTechnologies: TechnologyUsage[];
    sharedPatterns: PatternUsage[];
    bestPractices: BestPractice[];
    opportunityAreas: string[];
  };
  
  // Enterprise-wide prompt suggestions
  enterprisePrompts: GeneratedPrompt[];
}
```

## 🛠️ Implementation Options

### Option A: VS Code Extension with GitHub Copilot API

```typescript
// package.json
{
  "name": "repo-prompt-generator",
  "displayName": "Repository Prompt Generator",
  "description": "Generate custom AI prompts from your codebase",
  "version": "1.0.0",
  "engines": { "vscode": "^1.74.0" },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "repoPromptGen.analyzeRepo",
        "title": "Analyze Repository & Generate Prompts"
      },
      {
        "command": "repoPromptGen.openPromptLibrary", 
        "title": "Open Prompt Library"
      },
      {
        "command": "repoPromptGen.suggestPrompt",
        "title": "Suggest Prompt for Current Context"
      }
    ],
    "views": {
      "explorer": [
        {
          "id": "repoPrompts",
          "name": "AI Prompts",
          "when": "repoPromptGen.hasAnalysis"
        }
      ]
    }
  }
}
```

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { GitHubCopilotAPI } from './copilot-api';
import { CodebaseAnalyzer } from './analyzer';
import { PromptGenerator } from './generator';

export async function activate(context: vscode.ExtensionContext) {
  const analyzer = new CodebaseAnalyzer();
  const generator = new PromptGenerator();
  const copilot = new GitHubCopilotAPI();

  // Register commands
  const analyzeCommand = vscode.commands.registerCommand(
    'repoPromptGen.analyzeRepo',
    async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) return;

      const progress = vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Analyzing repository...",
        cancellable: false
      }, async (progress) => {
        
        progress.report({ message: "Scanning codebase..." });
        const analysis = await analyzer.analyzeWorkspace(workspaceFolder.uri.fsPath);
        
        progress.report({ message: "Generating prompts..." });
        const prompts = await generator.generatePrompts(analysis);
        
        progress.report({ message: "Saving prompt library..." });
        await savePromptLibrary(prompts, workspaceFolder.uri.fsPath);
        
        // Show results
        const panel = vscode.window.createWebviewPanel(
          'promptLibrary',
          'Generated Prompt Library',
          vscode.ViewColumn.One,
          { enableScripts: true }
        );
        
        panel.webview.html = generateWebviewContent(prompts, analysis);
      });
    }
  );

  context.subscriptions.push(analyzeCommand);
}
```

### Option B: CLI Tool for One-Time Generation

```typescript
// cli/index.ts
#!/usr/bin/env node

import { Command } from 'commander';
import { CodebaseAnalyzer } from './analyzer';
import { PromptGenerator } from './generator';
import { FileWriter } from './writer';

const program = new Command();

program
  .name('repo-prompt-generator')
  .description('Generate custom AI prompts from your codebase')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze repository and generate prompts')
  .argument('<path>', 'Path to repository')
  .option('-o, --output <file>', 'Output file', 'PROMPTS.md')
  .option('-f, --format <type>', 'Output format', 'markdown')
  .option('--github <repo>', 'Analyze GitHub repository')
  .action(async (path, options) => {
    console.log('🔍 Analyzing repository...');
    
    const analyzer = new CodebaseAnalyzer();
    const generator = new PromptGenerator();
    const writer = new FileWriter();
    
    try {
      // Analyze codebase
      const analysis = await analyzer.analyze(path);
      console.log(`📊 Found ${analysis.technologies.languages.length} languages, ${analysis.examples.components.length} components`);
      
      // Generate prompts
      const prompts = await generator.generate(analysis);
      console.log(`✨ Generated ${prompts.length} custom prompts`);
      
      // Write output
      await writer.write(prompts, analysis, options.output, options.format);
      console.log(`📝 Saved to ${options.output}`);
      
      // Summary
      console.log('\n🎯 Your custom prompt library includes:');
      prompts.forEach(prompt => {
        console.log(`  • ${prompt.title} (${prompt.category})`);
      });
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
```

### Option C: Web Service with GitHub Integration

```typescript
// web-service/api/analyze.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { GitHubService } from '../services/github';
import { CodebaseAnalyzer } from '../services/analyzer';
import { PromptGenerator } from '../services/generator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { githubUrl, accessToken } = req.body;

  try {
    // Clone or access repository
    const github = new GitHubService(accessToken);
    const repoData = await github.fetchRepository(githubUrl);
    
    // Analyze codebase
    const analyzer = new CodebaseAnalyzer();
    const analysis = await analyzer.analyzeGitHubRepo(repoData);
    
    // Generate prompts
    const generator = new PromptGenerator();
    const prompts = await generator.generateFromAnalysis(analysis);
    
    // Store in database for enterprise aggregation
    await storeRepoAnalysis(githubUrl, analysis, prompts);
    
    res.status(200).json({
      analysis,
      prompts,
      downloadUrl: `/download/${analysis.id}`
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## 📚 Example Generated Prompts

### Real Example: Analyzing a React/Express App

```markdown
# Custom AI Prompts for `my-saas-app`

## 📊 Repository Analysis
- **Tech Stack**: React, TypeScript, Express, PostgreSQL, Docker
- **Architecture**: Monolithic with microservice patterns
- **Key Patterns**: Custom hooks, HOCs, Express middleware
- **Test Coverage**: 67% (Jest + React Testing Library)

## 🎯 Generated Prompts

### Planning Phase

#### 1. Feature Planning for My SaaS App
**When to use**: Starting any new feature development
**Real context**: Based on your components in `src/components/` and API patterns in `server/routes/`

```
Plan a new feature for our SaaS application:

Feature Request: [YOUR FEATURE DESCRIPTION]

Our Current Architecture:
- Frontend: React with TypeScript, using custom hooks pattern (see src/hooks/useAuth.ts)
- Backend: Express with middleware pattern (see server/middleware/auth.js)  
- Database: PostgreSQL with Prisma ORM (see prisma/schema.prisma)
- State Management: Context + useReducer pattern (see src/context/AppContext.tsx)

Our File Structure:
src/
├── components/          # Reusable UI components
├── pages/              # Route components  
├── hooks/              # Custom React hooks
├── context/            # Global state management
├── services/           # API calls
└── utils/              # Helper functions

server/
├── routes/             # API endpoints
├── middleware/         # Express middleware
├── models/             # Database models
└── services/           # Business logic

Please provide:
1. **Component breakdown** - What React components need to be created/modified
2. **API design** - New endpoints following our RESTful pattern in server/routes/
3. **Database changes** - Prisma schema updates needed
4. **State management** - How this integrates with our Context pattern
5. **Testing plan** - Unit/integration tests following our Jest patterns
```

#### 2. Implement Component Following Our Patterns
**When to use**: Creating new React components
**Real context**: Based on your component patterns in `src/components/`

```
Create a React component following our established patterns:

Component Requirements: [YOUR REQUIREMENTS]

Our Component Patterns (from your codebase):
- TypeScript interfaces (see src/types/index.ts)
- Custom hooks for logic (pattern: src/hooks/useAuth.ts)
- Styled-components for styling (see src/components/Button.tsx)
- Error boundaries (see src/components/ErrorBoundary.tsx)
- Loading states (pattern from src/components/DataTable.tsx)

Example of our typical component structure:
${/* actual code from their Button.tsx */}

Our Naming Conventions:
- Components: PascalCase (UserProfile.tsx)
- Hooks: camelCase starting with 'use' (useUserData.ts)
- Types: PascalCase with descriptive names (UserProfile, ApiResponse)

Please create:
1. **TypeScript component** - Following our patterns above
2. **Custom hook** - If logic is complex enough to extract
3. **Type definitions** - In our established format
4. **Styled components** - Consistent with our design system
5. **Unit tests** - Following our Jest + RTL patterns in __tests__/
```

### Implementation Phase

#### 3. Add API Endpoint Following Our Express Patterns
**When to use**: Creating new backend endpoints
**Real context**: Based on your Express patterns in `server/routes/`

```
Create a new API endpoint following our Express.js patterns:

Endpoint Requirements: [YOUR REQUIREMENTS]

Our Express Patterns (from your codebase):
- Route structure: server/routes/[resource].js
- Middleware usage: auth, validation, errorHandler (see server/middleware/)
- Response format: { success: boolean, data: any, error?: string }
- Error handling: Custom AppError class (see server/utils/AppError.js)

Example of our typical route file:
${/* actual code from their server/routes/users.js */}

Our Database Patterns:
- Prisma ORM for all database operations
- Service layer for business logic (see server/services/)
- Transaction handling for complex operations

Please create:
1. **Route handler** - Following our patterns above
2. **Validation middleware** - Using Joi (see existing examples)
3. **Service layer function** - Business logic in server/services/
4. **Database operations** - Using Prisma following our patterns
5. **Error handling** - Consistent with our AppError pattern
6. **Unit tests** - Following our Jest patterns in server/__tests__/
```

### Testing Phase

#### 4. Write Tests Following Our Testing Patterns
**When to use**: Adding tests for new functionality
**Real context**: Based on your test patterns in `__tests__/` and `server/__tests__/`

```
Write comprehensive tests following our testing patterns:

Code to Test: [YOUR CODE HERE]

Our Testing Patterns (from your codebase):
- Frontend: Jest + React Testing Library (see src/__tests__/)
- Backend: Jest + Supertest (see server/__tests__/)
- Test structure: Arrange, Act, Assert
- Mock patterns: See __mocks__/ directory

Frontend Test Example (from your codebase):
${/* actual test from their components/__tests__/ */}

Backend Test Example (from your codebase):
${/* actual test from their server/__tests__/ */}

Our Test Conventions:
- File naming: [ComponentName].test.tsx or [filename].test.js
- Test descriptions: "should [expected behavior] when [condition]"
- Mock external dependencies (see our patterns in __mocks__/)
- Test both happy path and error cases

Please create:
1. **Unit tests** - Test individual functions/components
2. **Integration tests** - Test component interactions
3. **API tests** - Test endpoint behavior (if backend)
4. **Mock setup** - For external dependencies
5. **Edge cases** - Error conditions and boundary cases
```

## 🏢 Enterprise Aggregation

Once you have multiple repositories analyzed, the system would create an enterprise-wide library:

```typescript
interface EnterpriseInsights {
  // Cross-repo patterns
  commonTechnologies: [
    { name: "React", usage: 85, repos: ["app1", "app2", "dashboard"] },
    { name: "Express", usage: 60, repos: ["api", "backend"] }
  ];
  
  // Shared prompt opportunities
  enterprisePrompts: [
    {
      title: "Enterprise React Component Pattern",
      applicableRepos: ["frontend-app", "dashboard", "admin-panel"],
      description: "Based on common patterns across your React applications"
    }
  ];
  
  // Best practices identified
  recommendations: [
    "Standardize error handling patterns across Express APIs",
    "Implement consistent testing patterns in React components",
    "Create shared TypeScript types library"
  ];
}
```