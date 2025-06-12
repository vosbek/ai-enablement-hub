import * as fs from 'fs-extra';
import * as path from 'path';
import { CodeExample } from '../types';

export class CodeExampleExtractor {
  private repoPath: string;
  private maxExamplesPerCategory: number;

  constructor(repoPath: string, options: { maxExamplesPerCategory?: number } = {}) {
    this.repoPath = repoPath;
    this.maxExamplesPerCategory = options.maxExamplesPerCategory || 5;
  }

  async extractExamples(): Promise<{
    components: CodeExample[];
    functions: CodeExample[];
    tests: CodeExample[];
    configs: CodeExample[];
    apis: CodeExample[];
    models: CodeExample[];
    utils: CodeExample[];
  }> {
    const [components, functions, tests, configs, apis, models, utils] = await Promise.all([
      this.extractComponents(),
      this.extractFunctions(),
      this.extractTests(),
      this.extractConfigs(),
      this.extractAPIs(),
      this.extractModels(),
      this.extractUtils()
    ]);

    return { components, functions, tests, configs, apis, models, utils };
  }

  private async extractComponents(): Promise<CodeExample[]> {
    const componentFiles = await this.findFiles([
      '**/components/**/*.{js,ts,jsx,tsx,vue}',
      '**/src/components/**/*.{js,ts,jsx,tsx,vue}',
      '**/*.component.{js,ts,jsx,tsx}',
      '**/pages/**/*.{js,ts,jsx,tsx,vue}',
      '**/views/**/*.{js,ts,jsx,tsx,vue}'
    ]);

    const examples: CodeExample[] = [];

    for (const file of componentFiles.slice(0, this.maxExamplesPerCategory)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const example = await this.extractComponentFromFile(file, content);
        if (example) examples.push(example);
      } catch (error) {
        // Skip files we can't read
      }
    }

    return examples.sort((a, b) => this.scoreExample(b) - this.scoreExample(a));
  }

  private async extractFunctions(): Promise<CodeExample[]> {
    const functionFiles = await this.findFiles([
      '**/src/**/*.{js,ts}',
      '**/lib/**/*.{js,ts}',
      '**/utils/**/*.{js,ts}',
      '**/helpers/**/*.{js,ts}',
      '**/services/**/*.{js,ts}'
    ], {
      exclude: ['**/*.test.*', '**/*.spec.*', '**/components/**', '**/pages/**']
    });

    const examples: CodeExample[] = [];

    for (const file of functionFiles.slice(0, this.maxExamplesPerCategory * 2)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const fileExamples = await this.extractFunctionsFromFile(file, content);
        examples.push(...fileExamples);
        
        if (examples.length >= this.maxExamplesPerCategory) break;
      } catch (error) {
        // Skip files we can't read
      }
    }

    return examples
      .sort((a, b) => this.scoreExample(b) - this.scoreExample(a))
      .slice(0, this.maxExamplesPerCategory);
  }

  private async extractTests(): Promise<CodeExample[]> {
    const testFiles = await this.findFiles([
      '**/*.test.{js,ts,jsx,tsx}',
      '**/*.spec.{js,ts,jsx,tsx}',
      '**/tests/**/*.{js,ts,jsx,tsx}',
      '**/__tests__/**/*.{js,ts,jsx,tsx}',
      '**/cypress/**/*.{js,ts}',
      '**/e2e/**/*.{js,ts}'
    ]);

    const examples: CodeExample[] = [];

    for (const file of testFiles.slice(0, this.maxExamplesPerCategory)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const example = await this.extractTestFromFile(file, content);
        if (example) examples.push(example);
      } catch (error) {
        // Skip files we can't read
      }
    }

    return examples.sort((a, b) => this.scoreExample(b) - this.scoreExample(a));
  }

  private async extractConfigs(): Promise<CodeExample[]> {
    const configFiles = await this.findFiles([
      '**/webpack.config.{js,ts}',
      '**/vite.config.{js,ts}',
      '**/next.config.{js,ts}',
      '**/nuxt.config.{js,ts}',
      '**/vue.config.{js,ts}',
      '**/jest.config.{js,ts}',
      '**/cypress.config.{js,ts}',
      '**/tailwind.config.{js,ts}',
      '**/rollup.config.{js,ts}',
      '**/.eslintrc.{js,ts}',
      '**/babel.config.{js,ts}',
      '**/prettier.config.{js,ts}'
    ]);

    const examples: CodeExample[] = [];

    for (const file of configFiles.slice(0, this.maxExamplesPerCategory)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const example = await this.extractConfigFromFile(file, content);
        if (example) examples.push(example);
      } catch (error) {
        // Skip files we can't read
      }
    }

    return examples;
  }

  private async extractAPIs(): Promise<CodeExample[]> {
    const apiFiles = await this.findFiles([
      '**/api/**/*.{js,ts}',
      '**/routes/**/*.{js,ts}',
      '**/controllers/**/*.{js,ts}',
      '**/endpoints/**/*.{js,ts}',
      '**/server/**/*.{js,ts}',
      '**/backend/**/*.{js,ts}'
    ], {
      exclude: ['**/*.test.*', '**/*.spec.*']
    });

    const examples: CodeExample[] = [];

    for (const file of apiFiles.slice(0, this.maxExamplesPerCategory)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const example = await this.extractAPIFromFile(file, content);
        if (example) examples.push(example);
      } catch (error) {
        // Skip files we can't read
      }
    }

    return examples.sort((a, b) => this.scoreExample(b) - this.scoreExample(a));
  }

  private async extractModels(): Promise<CodeExample[]> {
    const modelFiles = await this.findFiles([
      '**/models/**/*.{js,ts}',
      '**/schemas/**/*.{js,ts}',
      '**/entities/**/*.{js,ts}',
      '**/types/**/*.{js,ts}',
      '**/interfaces/**/*.{js,ts}',
      '**/*.model.{js,ts}',
      '**/*.schema.{js,ts}',
      '**/prisma/schema.prisma'
    ]);

    const examples: CodeExample[] = [];

    for (const file of modelFiles.slice(0, this.maxExamplesPerCategory)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const example = await this.extractModelFromFile(file, content);
        if (example) examples.push(example);
      } catch (error) {
        // Skip files we can't read
      }
    }

    return examples.sort((a, b) => this.scoreExample(b) - this.scoreExample(a));
  }

  private async extractUtils(): Promise<CodeExample[]> {
    const utilFiles = await this.findFiles([
      '**/utils/**/*.{js,ts}',
      '**/helpers/**/*.{js,ts}',
      '**/lib/**/*.{js,ts}',
      '**/common/**/*.{js,ts}',
      '**/shared/**/*.{js,ts}'
    ], {
      exclude: ['**/*.test.*', '**/*.spec.*', '**/components/**']
    });

    const examples: CodeExample[] = [];

    for (const file of utilFiles.slice(0, this.maxExamplesPerCategory)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const example = await this.extractUtilFromFile(file, content);
        if (example) examples.push(example);
      } catch (error) {
        // Skip files we can't read
      }
    }

    return examples.sort((a, b) => this.scoreExample(b) - this.scoreExample(a));
  }

  private async extractComponentFromFile(filePath: string, content: string): Promise<CodeExample | null> {
    const fileName = path.basename(filePath);
    const language = this.getLanguageFromFile(filePath);
    
    // Patterns for different component types
    const reactComponentPattern = /(?:export\s+(?:default\s+)?(?:function|const)\s+([A-Z][a-zA-Z]*)|function\s+([A-Z][a-zA-Z]*)\s*\(|class\s+([A-Z][a-zA-Z]*)\s+extends)/;
    const vueComponentPattern = /<script[^>]*>[\s\S]*?<\/script>|export\s+default\s*\{/;
    
    let match: RegExpMatchArray | null = null;
    let componentName = '';
    
    if (language === 'vue') {
      match = content.match(vueComponentPattern);
      componentName = path.basename(fileName, path.extname(fileName));
    } else {
      match = content.match(reactComponentPattern);
      componentName = match?.[1] || match?.[2] || match?.[3] || path.basename(fileName, path.extname(fileName));
    }

    if (!match) return null;

    const lines = content.split('\n');
    const startIndex = content.indexOf(match[0]);
    const startLine = content.substring(0, startIndex).split('\n').length - 1;
    
    // Extract component with context (import statements + component)
    const endLine = Math.min(lines.length, startLine + 50);
    const codeBlock = lines.slice(0, endLine).join('\n');

    return {
      id: `component-${componentName}`,
      title: `${componentName} Component`,
      description: `React/Vue component demonstrating UI patterns`,
      filePath: path.relative(this.repoPath, filePath),
      startLine: 1,
      endLine,
      code: codeBlock,
      language,
      category: 'component',
      complexity: this.assessComplexity(codeBlock),
      patterns: this.identifyPatterns(codeBlock, 'component')
    };
  }

  private async extractFunctionsFromFile(filePath: string, content: string): Promise<CodeExample[]> {
    const functions: CodeExample[] = [];
    const language = this.getLanguageFromFile(filePath);
    
    // Pattern to find function declarations and exports
    const functionPatterns = [
      /export\s+(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
      /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\(/g,
      /(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
      /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\(/g
    ];

    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null && functions.length < 3) {
        const functionName = match[1];
        if (this.isInterestingFunction(functionName, content, match.index!)) {
          const example = this.extractFunctionCode(filePath, content, match, functionName, language);
          if (example) functions.push(example);
        }
      }
    }

    return functions;
  }

  private async extractTestFromFile(filePath: string, content: string): Promise<CodeExample | null> {
    const fileName = path.basename(filePath);
    const language = this.getLanguageFromFile(filePath);
    
    // Look for test suites (describe blocks or test files)
    const testPattern = /(?:describe|test|it)\s*\(\s*['"`]([^'"`]*?)['"`]/;
    const match = content.match(testPattern);
    
    if (!match) return null;

    const lines = content.split('\n');
    // Take first 40 lines to show test structure
    const codeBlock = lines.slice(0, 40).join('\n');

    return {
      id: `test-${fileName}`,
      title: `${match[1] || fileName} Tests`,
      description: `Test suite demonstrating testing patterns`,
      filePath: path.relative(this.repoPath, filePath),
      startLine: 1,
      endLine: Math.min(40, lines.length),
      code: codeBlock,
      language,
      category: 'test',
      complexity: this.assessComplexity(codeBlock),
      patterns: this.identifyPatterns(codeBlock, 'test')
    };
  }

  private async extractConfigFromFile(filePath: string, content: string): Promise<CodeExample | null> {
    const fileName = path.basename(filePath);
    const language = this.getLanguageFromFile(filePath);
    
    const lines = content.split('\n');
    // Show entire config file (up to 50 lines)
    const codeBlock = lines.slice(0, Math.min(50, lines.length)).join('\n');

    return {
      id: `config-${fileName}`,
      title: `${fileName} Configuration`,
      description: `Configuration file showing project setup patterns`,
      filePath: path.relative(this.repoPath, filePath),
      startLine: 1,
      endLine: Math.min(50, lines.length),
      code: codeBlock,
      language,
      category: 'config',
      complexity: this.assessComplexity(codeBlock),
      patterns: this.identifyPatterns(codeBlock, 'config')
    };
  }

  private async extractAPIFromFile(filePath: string, content: string): Promise<CodeExample | null> {
    const fileName = path.basename(filePath);
    const language = this.getLanguageFromFile(filePath);
    
    // Look for API patterns (routes, controllers, handlers)
    const apiPatterns = [
      /app\.(get|post|put|delete|patch)\s*\(/,
      /router\.(get|post|put|delete|patch)\s*\(/,
      /export\s+(?:async\s+)?function\s+([a-zA-Z]*(?:Controller|Handler|Route))/,
      /@(?:Get|Post|Put|Delete|Patch)\s*\(/
    ];

    let bestMatch = null;
    let bestIndex = -1;

    for (const pattern of apiPatterns) {
      const match = content.match(pattern);
      if (match && (bestIndex === -1 || content.indexOf(match[0]) < bestIndex)) {
        bestMatch = match;
        bestIndex = content.indexOf(match[0]);
      }
    }

    if (!bestMatch) return null;

    const lines = content.split('\n');
    const startLine = content.substring(0, bestIndex).split('\n').length - 1;
    const endLine = Math.min(lines.length, startLine + 30);
    
    const codeBlock = lines.slice(Math.max(0, startLine - 5), endLine).join('\n');

    return {
      id: `api-${fileName}`,
      title: `${fileName} API Endpoint`,
      description: `API endpoint demonstrating backend patterns`,
      filePath: path.relative(this.repoPath, filePath),
      startLine: Math.max(1, startLine - 4),
      endLine,
      code: codeBlock,
      language,
      category: 'api',
      complexity: this.assessComplexity(codeBlock),
      patterns: this.identifyPatterns(codeBlock, 'api')
    };
  }

  private async extractModelFromFile(filePath: string, content: string): Promise<CodeExample | null> {
    const fileName = path.basename(filePath);
    const language = path.extname(filePath) === '.prisma' ? 'prisma' : this.getLanguageFromFile(filePath);
    
    // Different patterns for different model types
    if (language === 'prisma') {
      const modelPattern = /model\s+([A-Z][a-zA-Z]*)\s*\{/;
      const match = content.match(modelPattern);
      if (match) {
        const modelName = match[1];
        const lines = content.split('\n');
        const startIndex = content.indexOf(match[0]);
        const startLine = content.substring(0, startIndex).split('\n').length - 1;
        
        // Find the end of the model block
        let endLine = startLine;
        let braceCount = 0;
        for (let i = startLine; i < lines.length; i++) {
          if (lines[i].includes('{')) braceCount++;
          if (lines[i].includes('}')) braceCount--;
          if (braceCount === 0 && i > startLine) {
            endLine = i + 1;
            break;
          }
        }
        
        const codeBlock = lines.slice(startLine, endLine).join('\n');
        
        return {
          id: `model-${modelName}`,
          title: `${modelName} Model`,
          description: `Prisma model defining data structure`,
          filePath: path.relative(this.repoPath, filePath),
          startLine: startLine + 1,
          endLine,
          code: codeBlock,
          language,
          category: 'model',
          complexity: this.assessComplexity(codeBlock),
          patterns: ['prisma-model']
        };
      }
    } else {
      // TypeScript interfaces, types, or classes
      const patterns = [
        /(?:export\s+)?interface\s+([A-Z][a-zA-Z]*)/,
        /(?:export\s+)?type\s+([A-Z][a-zA-Z]*)/,
        /(?:export\s+)?class\s+([A-Z][a-zA-Z]*)/
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          const name = match[1];
          const lines = content.split('\n');
          const startIndex = content.indexOf(match[0]);
          const startLine = content.substring(0, startIndex).split('\n').length - 1;
          const endLine = Math.min(lines.length, startLine + 20);
          
          const codeBlock = lines.slice(startLine, endLine).join('\n');
          
          return {
            id: `model-${name}`,
            title: `${name} ${pattern.source.includes('interface') ? 'Interface' : 'Type'}`,
            description: `Data structure definition`,
            filePath: path.relative(this.repoPath, filePath),
            startLine: startLine + 1,
            endLine,
            code: codeBlock,
            language,
            category: 'model',
            complexity: this.assessComplexity(codeBlock),
            patterns: ['typescript-types']
          };
        }
      }
    }

    return null;
  }

  private async extractUtilFromFile(filePath: string, content: string): Promise<CodeExample | null> {
    const fileName = path.basename(filePath);
    const language = this.getLanguageFromFile(filePath);
    
    // Look for utility functions
    const utilPattern = /export\s+(?:const|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/;
    const match = content.match(utilPattern);
    
    if (!match) return null;

    const functionName = match[1];
    const lines = content.split('\n');
    const startIndex = content.indexOf(match[0]);
    const startLine = content.substring(0, startIndex).split('\n').length - 1;
    
    // Extract the function with some context
    const endLine = Math.min(lines.length, startLine + 25);
    const codeBlock = lines.slice(Math.max(0, startLine - 2), endLine).join('\n');

    return {
      id: `util-${functionName}`,
      title: `${functionName} Utility`,
      description: `Utility function for common operations`,
      filePath: path.relative(this.repoPath, filePath),
      startLine: Math.max(1, startLine - 1),
      endLine,
      code: codeBlock,
      language,
      category: 'util',
      complexity: this.assessComplexity(codeBlock),
      patterns: this.identifyPatterns(codeBlock, 'util')
    };
  }

  private extractFunctionCode(
    filePath: string,
    content: string,
    match: RegExpMatchArray,
    functionName: string,
    language: string
  ): CodeExample | null {
    const lines = content.split('\n');
    const startIndex = match.index!;
    const startLine = content.substring(0, startIndex).split('\n').length - 1;
    
    // Find the end of the function
    let endLine = startLine + 1;
    let braceCount = 0;
    let inFunction = false;
    
    for (let i = startLine; i < lines.length && endLine - startLine < 30; i++) {
      const line = lines[i];
      
      if (line.includes('{')) {
        braceCount += (line.match(/\{/g) || []).length;
        inFunction = true;
      }
      if (line.includes('}')) {
        braceCount -= (line.match(/\}/g) || []).length;
      }
      
      if (inFunction && braceCount === 0) {
        endLine = i + 1;
        break;
      }
      endLine = i + 1;
    }
    
    const codeBlock = lines.slice(startLine, endLine).join('\n');

    return {
      id: `function-${functionName}`,
      title: `${functionName} Function`,
      description: `Function demonstrating business logic patterns`,
      filePath: path.relative(this.repoPath, filePath),
      startLine: startLine + 1,
      endLine,
      code: codeBlock,
      language,
      category: 'function',
      complexity: this.assessComplexity(codeBlock),
      patterns: this.identifyPatterns(codeBlock, 'function')
    };
  }

  private isInterestingFunction(functionName: string, content: string, index: number): boolean {
    // Skip very simple or generic functions
    if (functionName.length < 3) return false;
    if (['get', 'set', 'is', 'has', 'can'].includes(functionName)) return false;
    
    // Look for functions with meaningful logic
    const functionContent = content.substring(index, index + 500);
    const lineCount = functionContent.split('\n').length;
    
    // Must have some substance
    if (lineCount < 3) return false;
    
    // Prefer functions with interesting patterns
    const interestingPatterns = [
      'async', 'await', 'try', 'catch', 'if', 'for', 'while',
      'return', 'throw', 'Promise', 'map', 'filter', 'reduce'
    ];
    
    const patternCount = interestingPatterns.filter(pattern => 
      functionContent.includes(pattern)
    ).length;
    
    return patternCount >= 2;
  }

  private scoreExample(example: CodeExample): number {
    let score = 0;
    
    // Prefer more complex examples
    const complexityScores = { simple: 1, moderate: 2, complex: 3 };
    score += complexityScores[example.complexity];
    
    // Prefer examples with more patterns
    score += example.patterns.length;
    
    // Prefer longer examples (more context)
    score += Math.min(2, Math.floor(example.code.split('\n').length / 10));
    
    // Prefer certain categories
    const categoryScores = { 
      component: 3, api: 3, function: 2, test: 2, 
      model: 2, config: 1, util: 1 
    };
    score += categoryScores[example.category] || 1;
    
    return score;
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
      '.rb': 'ruby',
      '.prisma': 'prisma'
    };
    return languageMap[ext] || 'text';
  }

  private assessComplexity(code: string): 'simple' | 'moderate' | 'complex' {
    const lines = code.split('\n').length;
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
    
    if (lines > 40 || cyclomaticComplexity > 8) return 'complex';
    if (lines > 15 || cyclomaticComplexity > 4) return 'moderate';
    return 'simple';
  }

  private calculateCyclomaticComplexity(code: string): number {
    const complexityKeywords = /\b(if|else|for|while|switch|case|catch|&&|\|\||\?|async|await)\b/g;
    const matches = code.match(complexityKeywords);
    return (matches?.length || 0) + 1;
  }

  private identifyPatterns(code: string, category: string): string[] {
    const patterns: string[] = [];
    
    // Common patterns across categories
    if (code.includes('async') && code.includes('await')) patterns.push('async-await');
    if (code.includes('try') && code.includes('catch')) patterns.push('error-handling');
    if (code.includes('interface') || code.includes('type')) patterns.push('typescript');
    
    // Category-specific patterns
    switch (category) {
      case 'component':
        if (code.includes('useState')) patterns.push('react-hooks');
        if (code.includes('useEffect')) patterns.push('lifecycle');
        if (code.includes('props')) patterns.push('component-props');
        if (code.includes('children')) patterns.push('composition');
        break;
        
      case 'api':
        if (code.includes('router.')) patterns.push('express-router');
        if (code.includes('middleware')) patterns.push('middleware');
        if (code.includes('req') && code.includes('res')) patterns.push('request-response');
        break;
        
      case 'test':
        if (code.includes('describe') || code.includes('it')) patterns.push('test-structure');
        if (code.includes('expect')) patterns.push('assertions');
        if (code.includes('mock')) patterns.push('mocking');
        break;
        
      case 'function':
        if (code.includes('map') || code.includes('filter') || code.includes('reduce')) {
          patterns.push('functional-programming');
        }
        if (code.includes('Promise') || code.includes('.then')) patterns.push('promises');
        break;
    }
    
    return patterns;
  }

  private async findFiles(patterns: string[], options: { exclude?: string[] } = {}): Promise<string[]> {
    const glob = require('glob');
    const allFiles: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const files = await glob.glob(pattern, {
          cwd: this.repoPath,
          ignore: [
            'node_modules/**',
            '.git/**',
            'dist/**',
            'build/**',
            'coverage/**',
            '.next/**',
            '.cache/**',
            ...(options.exclude || [])
          ],
          nodir: true
        });
        allFiles.push(...files.map(f => path.join(this.repoPath, f)));
      } catch (error) {
        // Ignore glob errors
      }
    }

    return [...new Set(allFiles)]; // Remove duplicates
  }
}