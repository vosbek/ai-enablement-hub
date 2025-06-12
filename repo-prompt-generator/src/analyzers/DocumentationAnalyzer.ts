import * as fs from 'fs-extra';
import * as path from 'path';
import { DocumentationAnalysis } from '../types';

export class DocumentationAnalyzer {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async analyze(): Promise<DocumentationAnalysis> {
    const docTypes = await this.detectDocumentationTypes();
    const quality = await this.assessDocumentationQuality();
    const gaps = await this.identifyGaps();
    const recommendations = this.generateRecommendations(docTypes, quality, gaps);

    const coverage = this.calculateCoverage(docTypes, quality);

    return {
      coverage,
      types: docTypes,
      quality,
      gaps,
      recommendations
    };
  }

  private async detectDocumentationTypes(): Promise<DocumentationAnalysis['types']> {
    const types = {
      readme: false,
      apiDocs: false,
      codeComments: false,
      userGuides: false,
      architectureDocs: false,
      runbooks: false
    };

    // Check for README files
    const readmeFiles = ['README.md', 'README.txt', 'README.rst', 'readme.md'];
    for (const readme of readmeFiles) {
      if (await fs.pathExists(path.join(this.repoPath, readme))) {
        types.readme = true;
        break;
      }
    }

    // Check for API documentation
    const apiDocPaths = [
      'docs/api',
      'api-docs',
      'swagger.json',
      'openapi.yaml',
      'docs/swagger',
      'apidoc'
    ];
    for (const apiPath of apiDocPaths) {
      if (await fs.pathExists(path.join(this.repoPath, apiPath))) {
        types.apiDocs = true;
        break;
      }
    }

    // Check for user guides and documentation
    const docDirs = ['docs', 'documentation', 'wiki', 'guides'];
    for (const docDir of docDirs) {
      const docPath = path.join(this.repoPath, docDir);
      if (await fs.pathExists(docPath)) {
        const files = await fs.readdir(docPath);
        if (files.some(f => f.match(/guide|tutorial|manual/i))) {
          types.userGuides = true;
        }
        if (files.some(f => f.match(/architecture|design|adr/i))) {
          types.architectureDocs = true;
        }
        if (files.some(f => f.match(/runbook|playbook|ops|deployment/i))) {
          types.runbooks = true;
        }
      }
    }

    // Check for code comments
    types.codeComments = await this.hasGoodCodeComments();

    return types;
  }

  private async assessDocumentationQuality(): Promise<DocumentationAnalysis['quality']> {
    const completeness = await this.assessCompleteness();
    const accuracy = await this.assessAccuracy();
    const accessibility = await this.assessAccessibility();

    return {
      completeness,
      accuracy,
      accessibility
    };
  }

  private async assessCompleteness(): Promise<number> {
    let score = 0;
    let maxScore = 0;

    // Check README completeness
    maxScore += 20;
    const readmePath = await this.findReadme();
    if (readmePath) {
      const content = await fs.readFile(readmePath, 'utf-8');
      const sections = ['installation', 'usage', 'api', 'contributing', 'license'];
      const foundSections = sections.filter(section => 
        content.toLowerCase().includes(section)
      );
      score += (foundSections.length / sections.length) * 20;
    }

    // Check API documentation completeness
    maxScore += 25;
    if (await this.hasApiDocs()) {
      score += 25; // Basic presence
      // Could add more sophisticated API doc analysis here
    }

    // Check code documentation
    maxScore += 30;
    const commentRatio = await this.calculateCommentRatio();
    score += Math.min(30, commentRatio * 100);

    // Check architecture documentation
    maxScore += 15;
    if (await this.hasArchitectureDocs()) {
      score += 15;
    }

    // Check deployment/operational docs
    maxScore += 10;
    if (await this.hasOperationalDocs()) {
      score += 10;
    }

    return Math.round((score / maxScore) * 100);
  }

  private async assessAccuracy(): Promise<number> {
    // This is a simplified assessment - in practice would involve
    // checking if code matches documentation, links work, etc.
    let score = 70; // Base score assuming reasonable accuracy

    // Check for outdated dependencies mentioned in docs
    const packageJsonExists = await fs.pathExists(path.join(this.repoPath, 'package.json'));
    if (packageJsonExists) {
      const readmePath = await this.findReadme();
      if (readmePath) {
        const readmeContent = await fs.readFile(readmePath, 'utf-8');
        const packageJson = await fs.readJSON(path.join(this.repoPath, 'package.json'));
        
        // Check if README mentions dependencies that don't exist
        const deps = Object.keys(packageJson.dependencies || {});
        const devDeps = Object.keys(packageJson.devDependencies || {});
        const allDeps = [...deps, ...devDeps];
        
        // Simple heuristic: look for dependency names in README
        const mentionedDeps = allDeps.filter(dep => 
          readmeContent.toLowerCase().includes(dep.toLowerCase())
        );
        
        if (mentionedDeps.length > 0) {
          score += 10; // Bonus for mentioning actual dependencies
        }
      }
    }

    return Math.min(100, score);
  }

  private async assessAccessibility(): Promise<number> {
    let score = 0;
    let maxScore = 0;

    // Check for multiple documentation formats
    maxScore += 20;
    const formats = ['md', 'rst', 'txt', 'html'];
    const foundFormats = [];
    
    for (const format of formats) {
      const glob = require('glob');
      try {
        const files = await glob.glob(`**/*.${format}`, {
          cwd: this.repoPath,
          ignore: ['node_modules/**', '.git/**']
        });
        if (files.length > 0) foundFormats.push(format);
      } catch (error) {
        // Ignore glob errors
      }
    }
    
    score += Math.min(20, (foundFormats.length / 2) * 20);

    // Check for table of contents
    maxScore += 15;
    const readmePath = await this.findReadme();
    if (readmePath) {
      const content = await fs.readFile(readmePath, 'utf-8');
      if (content.match(/table of contents|toc/i) || 
          content.match(/^#+.*contents/im)) {
        score += 15;
      }
    }

    // Check for code examples
    maxScore += 25;
    if (readmePath) {
      const content = await fs.readFile(readmePath, 'utf-8');
      const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
      const inlineCode = content.match(/`[^`]+`/g) || [];
      
      if (codeBlocks.length > 0 || inlineCode.length > 5) {
        score += 25;
      }
    }

    // Check for images/diagrams
    maxScore += 20;
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
    for (const ext of imageExtensions) {
      const glob = require('glob');
      try {
        const images = await glob.glob(`**/*.${ext}`, {
          cwd: this.repoPath,
          ignore: ['node_modules/**', '.git/**']
        });
        if (images.length > 0) {
          score += 20;
          break;
        }
      } catch (error) {
        // Ignore glob errors
      }
    }

    // Check for multilingual support
    maxScore += 20;
    const langDirs = ['docs/en', 'docs/es', 'docs/fr', 'i18n', 'locale'];
    for (const langDir of langDirs) {
      if (await fs.pathExists(path.join(this.repoPath, langDir))) {
        score += 20;
        break;
      }
    }

    return Math.round((score / maxScore) * 100);
  }

  private async identifyGaps(): Promise<string[]> {
    const gaps: string[] = [];

    // Check for missing README
    if (!await this.findReadme()) {
      gaps.push('Missing README file');
    }

    // Check for missing API documentation
    if (!await this.hasApiDocs()) {
      const hasApiCode = await this.hasApiEndpoints();
      if (hasApiCode) {
        gaps.push('API endpoints detected but no API documentation found');
      }
    }

    // Check for missing architecture documentation
    if (!await this.hasArchitectureDocs()) {
      gaps.push('Missing architecture documentation');
    }

    // Check for missing deployment documentation
    if (!await this.hasOperationalDocs()) {
      const hasDeploymentConfig = await this.hasDeploymentConfig();
      if (hasDeploymentConfig) {
        gaps.push('Deployment configuration found but no deployment documentation');
      }
    }

    // Check for missing contributing guidelines
    if (!await fs.pathExists(path.join(this.repoPath, 'CONTRIBUTING.md'))) {
      gaps.push('Missing contributing guidelines');
    }

    // Check for missing code of conduct
    if (!await fs.pathExists(path.join(this.repoPath, 'CODE_OF_CONDUCT.md'))) {
      gaps.push('Missing code of conduct');
    }

    // Check for missing changelog
    const changelogFiles = ['CHANGELOG.md', 'HISTORY.md', 'RELEASES.md'];
    const hasChangelog = await Promise.all(
      changelogFiles.map(file => fs.pathExists(path.join(this.repoPath, file)))
    );
    if (!hasChangelog.some(exists => exists)) {
      gaps.push('Missing changelog documentation');
    }

    return gaps;
  }

  private generateRecommendations(
    types: DocumentationAnalysis['types'],
    quality: DocumentationAnalysis['quality'],
    gaps: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Quality-based recommendations
    if (quality.completeness < 70) {
      recommendations.push('Improve documentation completeness by adding missing sections');
    }

    if (quality.accessibility < 60) {
      recommendations.push('Make documentation more accessible with better formatting and examples');
    }

    // Type-specific recommendations
    if (!types.readme) {
      recommendations.push('Create a comprehensive README with setup, usage, and contribution guidelines');
    }

    if (!types.apiDocs && await this.hasApiEndpoints()) {
      recommendations.push('Generate API documentation using OpenAPI/Swagger');
    }

    if (!types.architectureDocs) {
      recommendations.push('Create architecture documentation including system design and decision records');
    }

    if (!types.runbooks) {
      recommendations.push('Develop operational runbooks for deployment and troubleshooting');
    }

    // Gap-based recommendations
    if (gaps.length > 3) {
      recommendations.push('Prioritize filling documentation gaps to improve project maintainability');
    }

    return recommendations;
  }

  private calculateCoverage(
    types: DocumentationAnalysis['types'],
    quality: DocumentationAnalysis['quality']
  ): DocumentationAnalysis['coverage'] {
    const typeScore = Object.values(types).filter(Boolean).length / Object.keys(types).length;
    const qualityScore = (quality.completeness + quality.accuracy + quality.accessibility) / 300;
    
    const overallScore = (typeScore * 0.6 + qualityScore * 0.4) * 100;

    if (overallScore >= 80) return 'excellent';
    if (overallScore >= 60) return 'good';
    if (overallScore >= 40) return 'moderate';
    return 'poor';
  }

  // Helper methods
  private async findReadme(): Promise<string | null> {
    const readmeFiles = ['README.md', 'README.txt', 'README.rst', 'readme.md'];
    for (const readme of readmeFiles) {
      const readmePath = path.join(this.repoPath, readme);
      if (await fs.pathExists(readmePath)) {
        return readmePath;
      }
    }
    return null;
  }

  private async hasApiDocs(): Promise<boolean> {
    const apiDocPaths = [
      'docs/api',
      'api-docs',
      'swagger.json',
      'openapi.yaml',
      'docs/swagger'
    ];
    
    for (const apiPath of apiDocPaths) {
      if (await fs.pathExists(path.join(this.repoPath, apiPath))) {
        return true;
      }
    }
    
    return false;
  }

  private async hasArchitectureDocs(): Promise<boolean> {
    const archPaths = [
      'docs/architecture',
      'architecture.md',
      'ARCHITECTURE.md',
      'docs/design',
      'adr'
    ];
    
    for (const archPath of archPaths) {
      if (await fs.pathExists(path.join(this.repoPath, archPath))) {
        return true;
      }
    }
    
    return false;
  }

  private async hasOperationalDocs(): Promise<boolean> {
    const opsPaths = [
      'docs/deployment',
      'DEPLOYMENT.md',
      'docs/ops',
      'runbooks',
      'docs/runbooks'
    ];
    
    for (const opsPath of opsPaths) {
      if (await fs.pathExists(path.join(this.repoPath, opsPath))) {
        return true;
      }
    }
    
    return false;
  }

  private async hasApiEndpoints(): Promise<boolean> {
    const glob = require('glob');
    try {
      // Look for API-related files
      const apiFiles = await glob.glob('**/api/**/*.{js,ts,py}', {
        cwd: this.repoPath,
        ignore: ['node_modules/**', '.git/**']
      });
      
      const routeFiles = await glob.glob('**/routes/**/*.{js,ts,py}', {
        cwd: this.repoPath,
        ignore: ['node_modules/**', '.git/**']
      });
      
      return apiFiles.length > 0 || routeFiles.length > 0;
    } catch (error) {
      return false;
    }
  }

  private async hasDeploymentConfig(): Promise<boolean> {
    const deploymentFiles = [
      'Dockerfile',
      'docker-compose.yml',
      'k8s',
      'kubernetes',
      '.github/workflows',
      'deploy',
      'deployment'
    ];
    
    for (const deployFile of deploymentFiles) {
      if (await fs.pathExists(path.join(this.repoPath, deployFile))) {
        return true;
      }
    }
    
    return false;
  }

  private async hasGoodCodeComments(): Promise<boolean> {
    const commentRatio = await this.calculateCommentRatio();
    return commentRatio > 0.1; // 10% comment ratio threshold
  }

  private async calculateCommentRatio(): Promise<number> {
    const glob = require('glob');
    try {
      const codeFiles = await glob.glob('**/*.{js,ts,jsx,tsx,py,java}', {
        cwd: this.repoPath,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
      });
      
      let totalLines = 0;
      let commentLines = 0;
      
      for (const file of codeFiles.slice(0, 20)) { // Sample first 20 files
        try {
          const content = await fs.readFile(path.join(this.repoPath, file), 'utf-8');
          const lines = content.split('\n');
          totalLines += lines.length;
          
          commentLines += lines.filter(line => {
            const trimmed = line.trim();
            return trimmed.startsWith('//') || 
                   trimmed.startsWith('/*') || 
                   trimmed.startsWith('*') ||
                   trimmed.startsWith('#');
          }).length;
        } catch (error) {
          // Skip files we can't read
        }
      }
      
      return totalLines > 0 ? commentLines / totalLines : 0;
    } catch (error) {
      return 0;
    }
  }
}