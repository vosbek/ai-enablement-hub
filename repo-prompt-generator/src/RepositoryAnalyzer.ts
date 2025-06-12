import * as fs from 'fs-extra';
import * as path from 'path';
import { CodebaseAnalysis, CodeQualityMetrics, AnalysisProgress, CLIOptions } from './types';
import { TechnologyDetector } from './analyzers/TechnologyDetector';
import { StructureAnalyzer } from './analyzers/StructureAnalyzer';
import { PatternDetector } from './analyzers/PatternDetector';
import { CodeExampleExtractor } from './analyzers/CodeExampleExtractor';
import { DocumentationAnalyzer } from './analyzers/DocumentationAnalyzer';
import { WorkflowAnalyzer } from './analyzers/WorkflowAnalyzer';
import { DependencyAnalyzer } from './analyzers/DependencyAnalyzer';
import { IncidentAnalyzer } from './analyzers/IncidentAnalyzer';
import { BusinessAnalyzer } from './analyzers/BusinessAnalyzer';
import { GovernanceAnalyzer } from './analyzers/GovernanceAnalyzer';

export class RepositoryAnalyzer {
  private repoPath: string;
  private options: CLIOptions;
  private progressCallback?: (progress: AnalysisProgress) => void;

  constructor(repoPath: string, options: CLIOptions, progressCallback?: (progress: AnalysisProgress) => void) {
    this.repoPath = repoPath;
    this.options = options;
    this.progressCallback = progressCallback;
  }

  async analyze(): Promise<CodebaseAnalysis> {
    this.reportProgress('Initializing analysis', 0, 6);

    // Validate repository path
    if (!await fs.pathExists(this.repoPath)) {
      throw new Error(`Repository path does not exist: ${this.repoPath}`);
    }

    const repoName = path.basename(this.repoPath);
    const analyzedAt = new Date();

    // Initialize analyzers
    const technologyDetector = new TechnologyDetector(this.repoPath);
    const structureAnalyzer = new StructureAnalyzer(this.repoPath, {
      maxDepth: 8,
      ignorePatterns: this.getIgnorePatterns()
    });
    const patternDetector = new PatternDetector(this.repoPath);
    const codeExampleExtractor = new CodeExampleExtractor(this.repoPath, {
      maxExamplesPerCategory: 5
    });

    // Step 1: Detect technologies
    this.reportProgress('Detecting technologies', 1, 6);
    const technologies = await technologyDetector.detect();

    // Step 2: Analyze structure
    this.reportProgress('Analyzing project structure', 2, 6);
    const {
      fileStructure,
      importantFiles,
      projectType,
      architecture,
      buildSystem,
      packageManager,
      testFrameworks,
      documentation
    } = await structureAnalyzer.analyze();

    // Step 3: Extract code examples
    this.reportProgress('Extracting code examples', 3, 6);
    const examples = await codeExampleExtractor.extractExamples();

    // Step 4: Detect patterns
    this.reportProgress('Detecting patterns', 4, 6);
    const patterns = await patternDetector.detectPatterns();

    // Step 5: Calculate quality metrics
    this.reportProgress('Calculating quality metrics', 5, 6);
    const quality = await this.calculateQualityMetrics();

    // Step 6: Enterprise analysis
    this.reportProgress('Performing enterprise analysis', 6, 8);
    const documentation = await new DocumentationAnalyzer(this.repoPath).analyze();
    const workflow = await new WorkflowAnalyzer(this.repoPath).analyze();
    const dependencies = await new DependencyAnalyzer(this.repoPath).analyze();
    const incident = await new IncidentAnalyzer(this.repoPath).analyze();
    const business = await new BusinessAnalyzer(this.repoPath).analyze();
    const governance = await new GovernanceAnalyzer(this.repoPath).analyze();

    // Step 7: Generate insights
    this.reportProgress('Generating insights', 7, 8);
    const insights = await this.generateInsights(technologies, patterns, quality);

    const analysis: CodebaseAnalysis = {
      repoName,
      repoPath: this.repoPath,
      analyzedAt,
      technologies,
      structure: {
        projectType: projectType as any,
        architecture: architecture as any,
        buildSystem,
        packageManager,
        testFrameworks,
        documentation
      },
      fileStructure,
      importantFiles,
      examples,
      patterns,
      quality,
      insights,
      documentation,
      workflow,
      dependencies,
      incident,
      business,
      governance
    };

    this.reportProgress('Analysis complete', 8, 8);
    return analysis;
  }

  private reportProgress(message: string, current: number, total: number): void {
    if (this.progressCallback) {
      this.progressCallback({
        phase: message,
        current,
        total,
        message
      });
    }
  }

  private getIgnorePatterns(): string[] {
    const defaultPatterns = [
      'node_modules',
      '.git',
      '.vscode',
      '.idea',
      'coverage',
      'dist',
      'build',
      '.next',
      '.cache',
      'logs',
      '*.log',
      '.DS_Store',
      'thumbs.db'
    ];

    if (!this.options.includeNodeModules) {
      defaultPatterns.push('node_modules/**');
    }

    return defaultPatterns;
  }

  private async calculateQualityMetrics(): Promise<CodeQualityMetrics> {
    const codeFiles = await this.findCodeFiles();
    let totalLines = 0;
    let totalCommentLines = 0;
    let totalFileSize = 0;
    let totalComplexity = 0;
    let totalCognitiveComplexity = 0;
    const duplicateBlocks = new Map<string, number>();

    for (const file of codeFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const stats = await fs.stat(file);
        
        // Skip files that are too large
        if (stats.size > this.options.maxFileSize * 1024) continue;

        const lines = content.split('\n');
        totalLines += lines.length;
        totalFileSize += stats.size;

        // Count comment lines
        const commentLines = this.countCommentLines(content, this.getLanguageFromFile(file));
        totalCommentLines += commentLines;

        // Calculate complexity
        const complexity = this.calculateCyclomaticComplexity(content);
        const cognitive = this.calculateCognitiveComplexity(content);
        totalComplexity += complexity;
        totalCognitiveComplexity += cognitive;

        // Detect duplicate code blocks
        this.detectDuplicateBlocks(content, duplicateBlocks);

      } catch (error) {
        // Skip files we can't read
      }
    }

    const averageFileSize = codeFiles.length > 0 ? totalFileSize / codeFiles.length : 0;
    const commentRatio = totalLines > 0 ? totalCommentLines / totalLines : 0;
    const averageComplexity = codeFiles.length > 0 ? totalComplexity / codeFiles.length : 0;
    const averageCognitive = codeFiles.length > 0 ? totalCognitiveComplexity / codeFiles.length : 0;
    
    // Calculate maintainability index (simplified version)
    const maintainabilityIndex = Math.max(0, Math.min(100, 
      100 - (averageComplexity * 2) - (averageCognitive * 1.5) + (commentRatio * 10)
    ));

    // Calculate duplicate code percentage
    const duplicateLineCount = Array.from(duplicateBlocks.values()).reduce((sum, count) => sum + count, 0);
    const duplicateCodePercentage = totalLines > 0 ? (duplicateLineCount / totalLines) * 100 : 0;

    return {
      averageFileSize,
      totalLines,
      commentRatio,
      complexity: {
        cyclomatic: averageComplexity,
        cognitive: averageCognitive
      },
      maintainabilityIndex,
      duplicateCodePercentage
    };
  }

  private async findCodeFiles(): Promise<string[]> {
    const glob = require('glob');
    const extensions = ['js', 'ts', 'jsx', 'tsx', 'vue', 'py', 'java', 'cs', 'go', 'rs', 'php', 'rb'];
    const files: string[] = [];

    for (const ext of extensions) {
      try {
        const pattern = `**/*.${ext}`;
        const matches = await glob.glob(pattern, {
          cwd: this.repoPath,
          ignore: this.getIgnorePatterns().map(p => `**/${p}/**`),
          nodir: true
        });
        files.push(...matches.map(f => path.join(this.repoPath, f)));
      } catch (error) {
        // Ignore glob errors
      }
    }

    return files;
  }

  private countCommentLines(content: string, language: string): number {
    const lines = content.split('\n');
    let commentLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Language-specific comment patterns
      switch (language) {
        case 'javascript':
        case 'typescript':
        case 'java':
        case 'cs':
        case 'go':
        case 'rs':
        case 'php':
          if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            commentLines++;
          }
          break;
        case 'python':
        case 'ruby':
          if (trimmed.startsWith('#')) {
            commentLines++;
          }
          break;
        default:
          if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
            commentLines++;
          }
      }
    }

    return commentLines;
  }

  private calculateCyclomaticComplexity(content: string): number {
    // Count decision points
    const complexityKeywords = /\b(if|else|for|while|switch|case|catch|&&|\|\||do|try|finally)\b/g;
    const matches = content.match(complexityKeywords);
    return (matches?.length || 0) + 1; // +1 for the base path
  }

  private calculateCognitiveComplexity(content: string): number {
    // Simplified cognitive complexity calculation
    let complexity = 0;
    let nestingLevel = 0;
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Increase nesting level
      if (trimmed.includes('{') || trimmed.match(/\b(if|for|while|try)\b/)) {
        nestingLevel++;
      }
      
      // Decrease nesting level
      if (trimmed.includes('}')) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }
      
      // Add complexity based on control structures
      if (trimmed.match(/\b(if|else|for|while|switch|case|catch)\b/)) {
        complexity += 1 + nestingLevel; // Base complexity + nesting penalty
      }
      
      // Logical operators add complexity
      const logicalOps = (trimmed.match(/&&|\|\|/g) || []).length;
      complexity += logicalOps;
    }

    return complexity;
  }

  private detectDuplicateBlocks(content: string, duplicateBlocks: Map<string, number>): void {
    const lines = content.split('\n');
    const minBlockSize = 5; // Minimum lines to consider as duplicate
    
    for (let i = 0; i <= lines.length - minBlockSize; i++) {
      const block = lines.slice(i, i + minBlockSize).join('\n').trim();
      
      // Skip blocks that are mostly empty or comments
      if (block.length < 50 || block.match(/^\s*\/\/|^\s*\*|^\s*#/)) continue;
      
      const normalizedBlock = this.normalizeCodeBlock(block);
      const count = duplicateBlocks.get(normalizedBlock) || 0;
      duplicateBlocks.set(normalizedBlock, count + 1);
    }
  }

  private normalizeCodeBlock(block: string): string {
    // Normalize whitespace and variable names to detect structural duplicates
    return block
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g, 'VAR') // Replace variable names
      .replace(/\d+/g, 'NUM') // Replace numbers
      .replace(/['"`][^'"`]*['"`]/g, 'STR') // Replace strings
      .trim();
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
      '.cs': 'cs',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby'
    };
    return languageMap[ext] || 'text';
  }

  private async generateInsights(
    technologies: any,
    patterns: any[],
    quality: CodeQualityMetrics
  ): Promise<{
    strengths: string[];
    improvements: string[];
    opportunities: string[];
    risks: string[];
  }> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const opportunities: string[] = [];
    const risks: string[] = [];

    // Analyze strengths
    if (quality.commentRatio > 0.15) {
      strengths.push('Good code documentation with adequate comments');
    }
    
    if (quality.maintainabilityIndex > 75) {
      strengths.push('High maintainability index indicates well-structured code');
    }
    
    if (technologies.tools.some((t: any) => t.name.includes('TypeScript'))) {
      strengths.push('TypeScript usage provides type safety and better tooling');
    }
    
    if (patterns.some(p => p.name.includes('Test'))) {
      strengths.push('Comprehensive testing patterns indicate good software practices');
    }

    // Analyze improvements
    if (quality.commentRatio < 0.1) {
      improvements.push('Add more code comments to improve maintainability');
    }
    
    if (quality.complexity.cyclomatic > 10) {
      improvements.push('Reduce cyclomatic complexity by breaking down large functions');
    }
    
    if (quality.duplicateCodePercentage > 15) {
      improvements.push('Reduce code duplication by extracting common functionality');
    }
    
    if (!patterns.some(p => p.name.includes('Error'))) {
      improvements.push('Implement consistent error handling patterns');
    }

    // Analyze opportunities
    if (!technologies.tools.some((t: any) => t.name.includes('ESLint'))) {
      opportunities.push('Add ESLint for code quality and consistency');
    }
    
    if (!technologies.tools.some((t: any) => t.name.includes('Prettier'))) {
      opportunities.push('Add Prettier for consistent code formatting');
    }
    
    if (!patterns.some(p => p.name.includes('Hook'))) {
      opportunities.push('Consider using custom hooks for reusable stateful logic');
    }
    
    opportunities.push('Implement CI/CD pipeline for automated testing and deployment');

    // Analyze risks
    if (quality.maintainabilityIndex < 50) {
      risks.push('Low maintainability index may lead to technical debt');
    }
    
    if (quality.complexity.cognitive > 15) {
      risks.push('High cognitive complexity makes code difficult to understand');
    }
    
    if (!technologies.tools.some((t: any) => t.name.includes('Test'))) {
      risks.push('Lack of testing framework increases risk of bugs');
    }
    
    if (technologies.technologies.length > 10) {
      risks.push('Large number of technologies may indicate over-engineering');
    }

    return { strengths, improvements, opportunities, risks };
  }
}