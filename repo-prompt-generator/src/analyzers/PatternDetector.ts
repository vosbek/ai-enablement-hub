import * as fs from 'fs-extra';
import * as path from 'path';
import { CodeExample, PatternDetection } from '../types';

export class PatternDetector {
  private repoPath: string;
  private codeFiles: string[] = [];

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async detectPatterns(): Promise<PatternDetection[]> {
    // First, gather all code files
    await this.gatherCodeFiles();
    
    const patterns: PatternDetection[] = [];
    
    // Detect various patterns
    patterns.push(...await this.detectReactPatterns());
    patterns.push(...await this.detectVuePatterns());
    patterns.push(...await this.detectExpressPatterns());
    patterns.push(...await this.detectTestPatterns());
    patterns.push(...await this.detectDesignPatterns());
    patterns.push(...await this.detectArchitecturalPatterns());
    patterns.push(...await this.detectDatabasePatterns());
    patterns.push(...await this.detectSecurityPatterns());
    
    // Sort by frequency (most common patterns first)
    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private async gatherCodeFiles(): Promise<void> {
    const glob = require('glob');
    const extensions = ['js', 'ts', 'jsx', 'tsx', 'vue', 'py', 'java', 'cs', 'go', 'rs', 'php', 'rb'];
    
    for (const ext of extensions) {
      try {
        const files = await glob.glob(`**/*.${ext}`, {
          cwd: this.repoPath,
          ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', 'coverage/**'],
          nodir: true
        });
        this.codeFiles.push(...files.map(f => path.join(this.repoPath, f)));
      } catch (error) {
        // Ignore glob errors
      }
    }
  }

  private async detectReactPatterns(): Promise<PatternDetection[]> {
    const patterns: PatternDetection[] = [];
    
    // Custom Hooks Pattern
    const customHooks = await this.findPattern({
      name: 'Custom React Hooks',
      description: 'Reusable stateful logic using custom hooks',
      filePattern: /use[A-Z][a-zA-Z]*\.(js|ts|jsx|tsx)$/,
      codePattern: /export\s+(const|function)\s+use[A-Z][a-zA-Z]*\s*[=\(]/,
      recommendation: 'Custom hooks are a great way to share stateful logic between components'
    });
    if (customHooks) patterns.push(customHooks);

    // Higher-Order Components (HOC)
    const hocs = await this.findPattern({
      name: 'Higher-Order Components (HOC)',
      description: 'Components that wrap other components to enhance functionality',
      codePattern: /with[A-Z][a-zA-Z]*\s*=\s*\([^)]*\)\s*=>\s*\([^)]*\)\s*=>/,
      recommendation: 'HOCs are useful for cross-cutting concerns, but consider hooks for simpler cases'
    });
    if (hocs) patterns.push(hocs);

    // React Context Pattern
    const context = await this.findPattern({
      name: 'React Context Pattern',
      description: 'Global state management using React Context',
      codePattern: /createContext\s*\(|useContext\s*\(/,
      recommendation: 'Context is great for avoiding prop drilling, but be mindful of performance'
    });
    if (context) patterns.push(context);

    // Component Composition
    const composition = await this.findPattern({
      name: 'Component Composition',
      description: 'Building complex UIs by composing simpler components',
      codePattern: /children\s*[:\}]|React\.Children|cloneElement/,
      recommendation: 'Composition is preferred over inheritance in React'
    });
    if (composition) patterns.push(composition);

    return patterns;
  }

  private async detectVuePatterns(): Promise<PatternDetection[]> {
    const patterns: PatternDetection[] = [];
    
    // Vue Composition API
    const compositionAPI = await this.findPattern({
      name: 'Vue Composition API',
      description: 'Using setup() function and composition functions',
      codePattern: /setup\s*\(\s*\)|ref\s*\(|reactive\s*\(|computed\s*\(/,
      filePattern: /\.(vue|js|ts)$/,
      recommendation: 'Composition API provides better TypeScript support and code reusability'
    });
    if (compositionAPI) patterns.push(compositionAPI);

    // Vue Composables
    const composables = await this.findPattern({
      name: 'Vue Composables',
      description: 'Reusable composition functions',
      filePattern: /composables\/.*\.(js|ts)$|use[A-Z][a-zA-Z]*\.(js|ts)$/,
      codePattern: /export\s+(const|function)\s+use[A-Z][a-zA-Z]*/,
      recommendation: 'Composables are the Vue 3 equivalent of custom hooks'
    });
    if (composables) patterns.push(composables);

    return patterns;
  }

  private async detectExpressPatterns(): Promise<PatternDetection[]> {
    const patterns: PatternDetection[] = [];
    
    // Middleware Pattern
    const middleware = await this.findPattern({
      name: 'Express Middleware Pattern',
      description: 'Functions that execute during request-response cycle',
      codePattern: /\(req,\s*res,\s*next\)\s*=>/,
      recommendation: 'Middleware is essential for cross-cutting concerns in Express'
    });
    if (middleware) patterns.push(middleware);

    // Route Controllers
    const controllers = await this.findPattern({
      name: 'Route Controllers',
      description: 'Separating route logic into controller functions',
      filePattern: /controllers?\/.*\.(js|ts)$/,
      codePattern: /exports?\.[a-zA-Z]+\s*=|export\s+(const|function)\s+[a-zA-Z]+/,
      recommendation: 'Controllers help organize and test route logic'
    });
    if (controllers) patterns.push(controllers);

    // Error Handling Middleware
    const errorHandling = await this.findPattern({
      name: 'Error Handling Middleware',
      description: 'Centralized error handling in Express',
      codePattern: /\(err,\s*req,\s*res,\s*next\)\s*=>/,
      recommendation: 'Centralized error handling improves maintainability'
    });
    if (errorHandling) patterns.push(errorHandling);

    return patterns;
  }

  private async detectTestPatterns(): Promise<PatternDetection[]> {
    const patterns: PatternDetection[] = [];
    
    // Page Object Model (for E2E tests)
    const pageObjects = await this.findPattern({
      name: 'Page Object Model',
      description: 'Encapsulating page interactions in test objects',
      filePattern: /pages?\/.*\.(js|ts)$|.*\.page\.(js|ts)$/,
      codePattern: /class\s+[A-Z][a-zA-Z]*Page|export\s+(class|const)\s+[A-Z][a-zA-Z]*Page/,
      recommendation: 'Page Object Model improves test maintainability'
    });
    if (pageObjects) patterns.push(pageObjects);

    // Test Factory Pattern
    const testFactories = await this.findPattern({
      name: 'Test Factory Pattern',
      description: 'Functions that create test data objects',
      filePattern: /factories?\/.*\.(js|ts)$|.*\.factory\.(js|ts)$/,
      codePattern: /create[A-Z][a-zA-Z]*|build[A-Z][a-zA-Z]*|make[A-Z][a-zA-Z]*/,
      recommendation: 'Factories make tests more readable and maintainable'
    });
    if (testFactories) patterns.push(testFactories);

    // Test Utilities
    const testUtils = await this.findPattern({
      name: 'Test Utilities',
      description: 'Helper functions for testing',
      filePattern: /test-utils|testing-utils|spec-helpers/,
      codePattern: /render[A-Z][a-zA-Z]*|setup[A-Z][a-zA-Z]*|mock[A-Z][a-zA-Z]*/,
      recommendation: 'Test utilities reduce duplication in test code'
    });
    if (testUtils) patterns.push(testUtils);

    return patterns;
  }

  private async detectDesignPatterns(): Promise<PatternDetection[]> {
    const patterns: PatternDetection[] = [];
    
    // Singleton Pattern
    const singleton = await this.findPattern({
      name: 'Singleton Pattern',
      description: 'Ensuring only one instance of a class exists',
      codePattern: /class\s+[A-Z][a-zA-Z]*[\s\S]*?private\s+static\s+instance|getInstance\s*\(\s*\)/,
      recommendation: 'Be cautious with singletons as they can make testing difficult'
    });
    if (singleton) patterns.push(singleton);

    // Factory Pattern
    const factory = await this.findPattern({
      name: 'Factory Pattern',
      description: 'Creating objects without specifying exact classes',
      codePattern: /create[A-Z][a-zA-Z]*\s*\(|[A-Z][a-zA-Z]*Factory/,
      recommendation: 'Factories provide flexibility in object creation'
    });
    if (factory) patterns.push(factory);

    // Observer Pattern
    const observer = await this.findPattern({
      name: 'Observer Pattern',
      description: 'Objects watching and reacting to state changes',
      codePattern: /addEventListener|removeEventListener|subscribe|unsubscribe|emit|on\s*\(/,
      recommendation: 'Observer pattern is great for loose coupling between components'
    });
    if (observer) patterns.push(observer);

    // Strategy Pattern
    const strategy = await this.findPattern({
      name: 'Strategy Pattern',
      description: 'Encapsulating algorithms and making them interchangeable',
      codePattern: /Strategy\s*\{|implements\s+.*Strategy|extends\s+.*Strategy/,
      recommendation: 'Strategy pattern promotes code reusability and testing'
    });
    if (strategy) patterns.push(strategy);

    return patterns;
  }

  private async detectArchitecturalPatterns(): Promise<PatternDetection[]> {
    const patterns: PatternDetection[] = [];
    
    // MVC Pattern
    const mvc = await this.findPattern({
      name: 'Model-View-Controller (MVC)',
      description: 'Separating concerns into models, views, and controllers',
      filePattern: /(models?|views?|controllers?)\//,
      recommendation: 'MVC helps organize code and separate concerns'
    });
    if (mvc) patterns.push(mvc);

    // Repository Pattern
    const repository = await this.findPattern({
      name: 'Repository Pattern',
      description: 'Abstracting data access logic',
      filePattern: /repositories?\/.*\.(js|ts)$|.*Repository\.(js|ts)$/,
      codePattern: /class\s+[A-Z][a-zA-Z]*Repository|Repository\s*\{/,
      recommendation: 'Repository pattern makes data access testable and swappable'
    });
    if (repository) patterns.push(repository);

    // Service Layer Pattern
    const service = await this.findPattern({
      name: 'Service Layer Pattern',
      description: 'Encapsulating business logic in service classes',
      filePattern: /services?\/.*\.(js|ts)$|.*Service\.(js|ts)$/,
      codePattern: /class\s+[A-Z][a-zA-Z]*Service|Service\s*\{/,
      recommendation: 'Service layer helps organize business logic'
    });
    if (service) patterns.push(service);

    // Dependency Injection
    const di = await this.findPattern({
      name: 'Dependency Injection',
      description: 'Injecting dependencies rather than creating them internally',
      codePattern: /constructor\s*\([^)]*[A-Z][a-zA-Z]*[^)]*\)|@Inject|@Injectable/,
      recommendation: 'Dependency injection improves testability and flexibility'
    });
    if (di) patterns.push(di);

    return patterns;
  }

  private async detectDatabasePatterns(): Promise<PatternDetection[]> {
    const patterns: PatternDetection[] = [];
    
    // ORM/ODM Usage
    const orm = await this.findPattern({
      name: 'ORM/ODM Pattern',
      description: 'Object-relational mapping for database operations',
      codePattern: /\.findOne\(|\.findMany\(|\.create\(|\.update\(|\.delete\(|Model\./,
      recommendation: 'ORMs can simplify database operations but watch for N+1 queries'
    });
    if (orm) patterns.push(orm);

    // Migration Pattern
    const migrations = await this.findPattern({
      name: 'Database Migrations',
      description: 'Version-controlled database schema changes',
      filePattern: /migrations?\//,
      recommendation: 'Migrations help manage database schema changes across environments'
    });
    if (migrations) patterns.push(migrations);

    // Seeding Pattern
    const seeding = await this.findPattern({
      name: 'Database Seeding',
      description: 'Populating database with initial or test data',
      filePattern: /seeds?\/|seeders?\//,
      codePattern: /seed\s*\(|createMany\s*\(/,
      recommendation: 'Seeding helps maintain consistent test and development data'
    });
    if (seeding) patterns.push(seeding);

    return patterns;
  }

  private async detectSecurityPatterns(): Promise<PatternDetection[]> {
    const patterns: PatternDetection[] = [];
    
    // Authentication Middleware
    const auth = await this.findPattern({
      name: 'Authentication Middleware',
      description: 'Protecting routes with authentication checks',
      codePattern: /requireAuth|isAuthenticated|checkAuth|authenticate/,
      recommendation: 'Always validate authentication on protected routes'
    });
    if (auth) patterns.push(auth);

    // Input Validation
    const validation = await this.findPattern({
      name: 'Input Validation',
      description: 'Validating and sanitizing user input',
      codePattern: /validate|sanitize|Joi\.|yup\.|zod\./,
      recommendation: 'Always validate input to prevent security vulnerabilities'
    });
    if (validation) patterns.push(validation);

    // Rate Limiting
    const rateLimit = await this.findPattern({
      name: 'Rate Limiting',
      description: 'Limiting request frequency to prevent abuse',
      codePattern: /rateLimit|rateLimiter|express-rate-limit/,
      recommendation: 'Rate limiting helps prevent abuse and DDoS attacks'
    });
    if (rateLimit) patterns.push(rateLimit);

    return patterns;
  }

  private async findPattern(config: {
    name: string;
    description: string;
    codePattern?: RegExp;
    filePattern?: RegExp;
    recommendation: string;
  }): Promise<PatternDetection | null> {
    const examples: CodeExample[] = [];
    let frequency = 0;

    // Filter files by pattern if specified
    let relevantFiles = this.codeFiles;
    if (config.filePattern) {
      relevantFiles = this.codeFiles.filter(file => 
        config.filePattern!.test(path.relative(this.repoPath, file))
      );
    }

    // Search for code pattern
    for (const file of relevantFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // If we have a code pattern, search for it
        if (config.codePattern) {
          const matches = content.match(new RegExp(config.codePattern.source, 'gm'));
          if (matches) {
            frequency += matches.length;
            
            // Extract code examples
            if (examples.length < 3) { // Limit to 3 examples per pattern
              const lines = content.split('\n');
              const example = this.extractCodeExample(file, content, config.codePattern, lines);
              if (example) {
                examples.push(example);
              }
            }
          }
        } else {
          // File pattern only - count files
          frequency += 1;
          if (examples.length < 3) {
            const lines = content.split('\n');
            const example = this.extractFileExample(file, content, lines);
            if (example) {
              examples.push(example);
            }
          }
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    if (frequency === 0) return null;

    return {
      name: config.name,
      description: config.description,
      examples,
      frequency,
      recommendation: config.recommendation
    };
  }

  private extractCodeExample(
    filePath: string, 
    content: string, 
    pattern: RegExp, 
    lines: string[]
  ): CodeExample | null {
    const matches = [...content.matchAll(new RegExp(pattern.source, 'gm'))];
    if (matches.length === 0) return null;

    const match = matches[0];
    const matchIndex = match.index || 0;
    
    // Find the line number where the match occurs
    const beforeMatch = content.substring(0, matchIndex);
    const startLine = beforeMatch.split('\n').length - 1;
    
    // Extract a reasonable amount of context (up to 20 lines)
    const contextStart = Math.max(0, startLine - 5);
    const contextEnd = Math.min(lines.length, startLine + 15);
    const codeBlock = lines.slice(contextStart, contextEnd).join('\n');

    return {
      id: `${path.basename(filePath)}-${startLine}`,
      title: `${this.getPatternName(match[0])} in ${path.basename(filePath)}`,
      description: `Example of pattern usage`,
      filePath: path.relative(this.repoPath, filePath),
      startLine: contextStart + 1,
      endLine: contextEnd,
      code: codeBlock,
      language: this.getLanguageFromFile(filePath),
      category: this.getCategoryFromFile(filePath),
      complexity: this.assessComplexity(codeBlock),
      patterns: [this.getPatternName(match[0])]
    };
  }

  private extractFileExample(filePath: string, content: string, lines: string[]): CodeExample | null {
    // For file-based patterns, extract the main export or class
    const mainPattern = /export\s+(default\s+)?(class|function|const)\s+([A-Z][a-zA-Z]*)|class\s+([A-Z][a-zA-Z]*)/;
    const match = content.match(mainPattern);
    
    if (!match) {
      // Fallback: take first 20 lines
      const codeBlock = lines.slice(0, 20).join('\n');
      return {
        id: `${path.basename(filePath)}-file`,
        title: `${path.basename(filePath)}`,
        description: 'File following architectural pattern',
        filePath: path.relative(this.repoPath, filePath),
        startLine: 1,
        endLine: Math.min(20, lines.length),
        code: codeBlock,
        language: this.getLanguageFromFile(filePath),
        category: this.getCategoryFromFile(filePath),
        complexity: this.assessComplexity(codeBlock),
        patterns: ['file-structure']
      };
    }

    // Extract context around the main declaration
    const matchIndex = content.indexOf(match[0]);
    const beforeMatch = content.substring(0, matchIndex);
    const startLine = beforeMatch.split('\n').length - 1;
    
    const contextStart = Math.max(0, startLine - 2);
    const contextEnd = Math.min(lines.length, startLine + 25);
    const codeBlock = lines.slice(contextStart, contextEnd).join('\n');

    return {
      id: `${path.basename(filePath)}-${startLine}`,
      title: `${match[3] || match[4] || 'Main Export'} in ${path.basename(filePath)}`,
      description: 'Main component/class in file',
      filePath: path.relative(this.repoPath, filePath),
      startLine: contextStart + 1,
      endLine: contextEnd,
      code: codeBlock,
      language: this.getLanguageFromFile(filePath),
      category: this.getCategoryFromFile(filePath),
      complexity: this.assessComplexity(codeBlock),
      patterns: ['main-export']
    };
  }

  private getPatternName(matchedCode: string): string {
    // Extract meaningful names from matched code
    const functionMatch = matchedCode.match(/(?:function|const|export)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (functionMatch) return functionMatch[1];
    
    const classMatch = matchedCode.match(/class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    if (classMatch) return classMatch[1];
    
    return 'pattern-usage';
  }

  private getLanguageFromFile(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: { [key: string]: string } = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.vue': 'vue',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby'
    };
    return languageMap[ext] || 'text';
  }

  private getCategoryFromFile(filePath: string): CodeExample['category'] {
    const fileName = path.basename(filePath).toLowerCase();
    const dirName = path.dirname(filePath).toLowerCase();
    
    if (fileName.includes('test') || fileName.includes('spec') || dirName.includes('test')) {
      return 'test';
    }
    if (fileName.includes('config') || dirName.includes('config')) {
      return 'config';
    }
    if (dirName.includes('component') || fileName.includes('component')) {
      return 'component';
    }
    if (dirName.includes('api') || dirName.includes('route')) {
      return 'api';
    }
    if (dirName.includes('model') || dirName.includes('schema')) {
      return 'model';
    }
    if (dirName.includes('util') || dirName.includes('helper')) {
      return 'util';
    }
    
    return 'function';
  }

  private assessComplexity(code: string): 'simple' | 'moderate' | 'complex' {
    const lines = code.split('\n').length;
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
    
    if (lines > 50 || cyclomaticComplexity > 10) return 'complex';
    if (lines > 20 || cyclomaticComplexity > 5) return 'moderate';
    return 'simple';
  }

  private calculateCyclomaticComplexity(code: string): number {
    // Simple heuristic for cyclomatic complexity
    const complexityKeywords = /\b(if|else|for|while|switch|case|catch|&&|\|\||\?)\b/g;
    const matches = code.match(complexityKeywords);
    return (matches?.length || 0) + 1; // +1 for the base path
  }
}