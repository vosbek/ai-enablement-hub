import * as fs from 'fs-extra';
import * as path from 'path';
import { WorkflowAnalysis } from '../types';

export class WorkflowAnalyzer {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async analyze(): Promise<WorkflowAnalysis> {
    const cicd = await this.analyzeCICD();
    const branching = await this.analyzeBranching();
    const automation = await this.analyzeAutomation();
    const collaboration = await this.analyzeCollaboration();

    return {
      cicd,
      branching,
      automation,
      collaboration
    };
  }

  private async analyzeCICD(): Promise<WorkflowAnalysis['cicd']> {
    const platforms: string[] = [];
    let hasCI = false;
    let hasCD = false;
    const gaps: string[] = [];

    // Check for GitHub Actions
    const githubWorkflowsPath = path.join(this.repoPath, '.github/workflows');
    if (await fs.pathExists(githubWorkflowsPath)) {
      platforms.push('GitHub Actions');
      const workflows = await fs.readdir(githubWorkflowsPath);
      
      for (const workflow of workflows) {
        if (workflow.endsWith('.yml') || workflow.endsWith('.yaml')) {
          const content = await fs.readFile(path.join(githubWorkflowsPath, workflow), 'utf-8');
          
          // Check for CI patterns
          if (content.match(/on:\s*\[?push|pull_request/)) {
            hasCI = true;
          }
          
          // Check for CD patterns
          if (content.match(/deploy|release|publish/i)) {
            hasCD = true;
          }
        }
      }
    }

    // Check for Jenkins
    if (await fs.pathExists(path.join(this.repoPath, 'Jenkinsfile'))) {
      platforms.push('Jenkins');
      hasCI = true;
      
      const jenkinsfile = await fs.readFile(path.join(this.repoPath, 'Jenkinsfile'), 'utf-8');
      if (jenkinsfile.match(/deploy|publish/i)) {
        hasCD = true;
      }
    }

    // Check for GitLab CI
    if (await fs.pathExists(path.join(this.repoPath, '.gitlab-ci.yml'))) {
      platforms.push('GitLab CI');
      hasCI = true;
      
      const gitlabCI = await fs.readFile(path.join(this.repoPath, '.gitlab-ci.yml'), 'utf-8');
      if (gitlabCI.match(/deploy|release/i)) {
        hasCD = true;
      }
    }

    // Check for CircleCI
    if (await fs.pathExists(path.join(this.repoPath, '.circleci/config.yml'))) {
      platforms.push('CircleCI');
      hasCI = true;
      
      const circleCI = await fs.readFile(path.join(this.repoPath, '.circleci/config.yml'), 'utf-8');
      if (circleCI.match(/deploy|release/i)) {
        hasCD = true;
      }
    }

    // Check for Travis CI
    if (await fs.pathExists(path.join(this.repoPath, '.travis.yml'))) {
      platforms.push('Travis CI');
      hasCI = true;
      
      const travisCI = await fs.readFile(path.join(this.repoPath, '.travis.yml'), 'utf-8');
      if (travisCI.match(/deploy|release/i)) {
        hasCD = true;
      }
    }

    // Check for Azure Pipelines
    const azurePipelinesFiles = ['azure-pipelines.yml', '.azure/pipelines.yml'];
    for (const file of azurePipelinesFiles) {
      if (await fs.pathExists(path.join(this.repoPath, file))) {
        platforms.push('Azure Pipelines');
        hasCI = true;
        
        const azureCI = await fs.readFile(path.join(this.repoPath, file), 'utf-8');
        if (azureCI.match(/deploy|release/i)) {
          hasCD = true;
        }
        break;
      }
    }

    // Identify gaps
    if (!hasCI) {
      gaps.push('No continuous integration pipeline detected');
    }
    if (!hasCD) {
      gaps.push('No continuous deployment pipeline detected');
    }
    if (platforms.length === 0) {
      gaps.push('No CI/CD platform configuration found');
    }

    // Determine quality
    let quality: 'basic' | 'intermediate' | 'advanced' = 'basic';
    if (hasCI && hasCD) {
      quality = 'intermediate';
      
      // Check for advanced features
      if (await this.hasAdvancedCICDFeatures()) {
        quality = 'advanced';
      }
    }

    return {
      hasCI,
      hasCD,
      platforms,
      quality,
      gaps
    };
  }

  private async analyzeBranching(): Promise<WorkflowAnalysis['branching']> {
    let strategy: WorkflowAnalysis['branching']['strategy'] = 'unknown';
    let protection = false;
    let reviewRequired = false;

    // Check for Git configuration that might indicate branching strategy
    const gitConfigPath = path.join(this.repoPath, '.git/config');
    if (await fs.pathExists(gitConfigPath)) {
      try {
        const gitConfig = await fs.readFile(gitConfigPath, 'utf-8');
        
        // Analyze branch patterns
        if (gitConfig.includes('develop') || gitConfig.includes('development')) {
          strategy = 'gitflow';
        } else if (gitConfig.includes('main') || gitConfig.includes('master')) {
          strategy = 'github-flow';
        }
      } catch (error) {
        // Ignore git config read errors
      }
    }

    // Check for GitHub branch protection (if .github exists)
    const githubPath = path.join(this.repoPath, '.github');
    if (await fs.pathExists(githubPath)) {
      // Look for branch protection indicators in workflow files
      const workflowsPath = path.join(githubPath, 'workflows');
      if (await fs.pathExists(workflowsPath)) {
        const workflows = await fs.readdir(workflowsPath);
        
        for (const workflow of workflows) {
          if (workflow.endsWith('.yml') || workflow.endsWith('.yaml')) {
            const content = await fs.readFile(path.join(workflowsPath, workflow), 'utf-8');
            
            if (content.includes('pull_request')) {
              reviewRequired = true;
            }
            
            if (content.match(/branches:\s*\[.*main|master.*\]/)) {
              protection = true;
            }
          }
        }
      }
    }

    // Look for branching strategy documentation
    const readmeFiles = ['README.md', 'CONTRIBUTING.md', 'docs/CONTRIBUTING.md'];
    for (const readmeFile of readmeFiles) {
      const readmePath = path.join(this.repoPath, readmeFile);
      if (await fs.pathExists(readmePath)) {
        const content = await fs.readFile(readmePath, 'utf-8');
        
        if (content.match(/git.?flow/i)) {
          strategy = 'gitflow';
        } else if (content.match(/github.?flow/i)) {
          strategy = 'github-flow';
        } else if (content.match(/trunk.?based/i)) {
          strategy = 'trunk';
        }
      }
    }

    return {
      strategy,
      protection,
      reviewRequired
    };
  }

  private async analyzeAutomation(): Promise<WorkflowAnalysis['automation']> {
    const automation = {
      testing: false,
      linting: false,
      formatting: false,
      security: false,
      deployment: false
    };

    // Check package.json scripts
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const scripts = packageJson.scripts || {};
      
      if (scripts.test || scripts['test:unit'] || scripts['test:integration']) {
        automation.testing = true;
      }
      
      if (scripts.lint || scripts['lint:check']) {
        automation.linting = true;
      }
      
      if (scripts.format || scripts['format:check'] || scripts.prettier) {
        automation.formatting = true;
      }
      
      if (scripts.security || scripts['security:check'] || scripts.audit) {
        automation.security = true;
      }
      
      if (scripts.deploy || scripts.build || scripts.release) {
        automation.deployment = true;
      }
    }

    // Check for pre-commit hooks
    const preCommitPath = path.join(this.repoPath, '.pre-commit-config.yaml');
    const huskyPath = path.join(this.repoPath, '.husky');
    
    if (await fs.pathExists(preCommitPath) || await fs.pathExists(huskyPath)) {
      automation.testing = true;
      automation.linting = true;
      automation.formatting = true;
    }

    // Check CI/CD files for automation
    await this.checkCICDForAutomation(automation);

    return automation;
  }

  private async analyzeCollaboration(): Promise<WorkflowAnalysis['collaboration']> {
    const collaboration = {
      issueTemplates: false,
      prTemplates: false,
      codeowners: false,
      discussions: false
    };

    // Check for GitHub issue templates
    const issueTemplatePaths = [
      '.github/ISSUE_TEMPLATE',
      '.github/issue_template.md',
      '.github/ISSUE_TEMPLATE.md'
    ];
    
    for (const templatePath of issueTemplatePaths) {
      if (await fs.pathExists(path.join(this.repoPath, templatePath))) {
        collaboration.issueTemplates = true;
        break;
      }
    }

    // Check for pull request templates
    const prTemplatePaths = [
      '.github/pull_request_template.md',
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/PULL_REQUEST_TEMPLATE',
      'docs/pull_request_template.md'
    ];
    
    for (const templatePath of prTemplatePaths) {
      if (await fs.pathExists(path.join(this.repoPath, templatePath))) {
        collaboration.prTemplates = true;
        break;
      }
    }

    // Check for CODEOWNERS
    const codeownersPaths = [
      '.github/CODEOWNERS',
      'CODEOWNERS',
      'docs/CODEOWNERS'
    ];
    
    for (const codeownersPath of codeownersPaths) {
      if (await fs.pathExists(path.join(this.repoPath, codeownersPath))) {
        collaboration.codeowners = true;
        break;
      }
    }

    // Check for discussions configuration
    const discussionConfigPath = path.join(this.repoPath, '.github/DISCUSSION_TEMPLATE');
    if (await fs.pathExists(discussionConfigPath)) {
      collaboration.discussions = true;
    }

    return collaboration;
  }

  private async hasAdvancedCICDFeatures(): Promise<boolean> {
    let advancedFeatures = 0;

    // Check for matrix builds
    if (await this.hasMatrixBuilds()) {
      advancedFeatures++;
    }

    // Check for caching
    if (await this.hasCaching()) {
      advancedFeatures++;
    }

    // Check for security scanning
    if (await this.hasSecurityScanning()) {
      advancedFeatures++;
    }

    // Check for environment-specific deployments
    if (await this.hasEnvironmentDeployments()) {
      advancedFeatures++;
    }

    // Check for parallel jobs
    if (await this.hasParallelJobs()) {
      advancedFeatures++;
    }

    return advancedFeatures >= 3;
  }

  private async hasMatrixBuilds(): Promise<boolean> {
    const workflowFiles = await this.getCICDFiles();
    
    for (const file of workflowFiles) {
      const content = await fs.readFile(file, 'utf-8');
      if (content.includes('matrix:') || content.includes('strategy:')) {
        return true;
      }
    }
    
    return false;
  }

  private async hasCaching(): Promise<boolean> {
    const workflowFiles = await this.getCICDFiles();
    
    for (const file of workflowFiles) {
      const content = await fs.readFile(file, 'utf-8');
      if (content.includes('cache') || content.includes('Cache')) {
        return true;
      }
    }
    
    return false;
  }

  private async hasSecurityScanning(): Promise<boolean> {
    const workflowFiles = await this.getCICDFiles();
    
    for (const file of workflowFiles) {
      const content = await fs.readFile(file, 'utf-8');
      if (content.match(/security|vulnerability|scan|audit|codeql/i)) {
        return true;
      }
    }
    
    return false;
  }

  private async hasEnvironmentDeployments(): Promise<boolean> {
    const workflowFiles = await this.getCICDFiles();
    
    for (const file of workflowFiles) {
      const content = await fs.readFile(file, 'utf-8');
      if (content.match(/environment:|staging|production|dev/)) {
        return true;
      }
    }
    
    return false;
  }

  private async hasParallelJobs(): Promise<boolean> {
    const workflowFiles = await this.getCICDFiles();
    
    for (const file of workflowFiles) {
      const content = await fs.readFile(file, 'utf-8');
      if (content.match(/jobs:\s*\n\s*\w+:\s*\n[\s\S]*\w+:/)) {
        return true;
      }
    }
    
    return false;
  }

  private async checkCICDForAutomation(automation: WorkflowAnalysis['automation']): Promise<void> {
    const workflowFiles = await this.getCICDFiles();
    
    for (const file of workflowFiles) {
      const content = await fs.readFile(file, 'utf-8');
      
      if (content.match(/test|jest|mocha|pytest/i)) {
        automation.testing = true;
      }
      
      if (content.match(/lint|eslint|flake8|rubocop/i)) {
        automation.linting = true;
      }
      
      if (content.match(/format|prettier|black|autopep8/i)) {
        automation.formatting = true;
      }
      
      if (content.match(/security|audit|snyk|sonar/i)) {
        automation.security = true;
      }
      
      if (content.match(/deploy|release|publish/i)) {
        automation.deployment = true;
      }
    }
  }

  private async getCICDFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const cicdPaths = [
      '.github/workflows',
      '.gitlab-ci.yml',
      'Jenkinsfile',
      '.circleci/config.yml',
      '.travis.yml',
      'azure-pipelines.yml',
      '.azure/pipelines.yml'
    ];
    
    for (const cicdPath of cicdPaths) {
      const fullPath = path.join(this.repoPath, cicdPath);
      
      if (await fs.pathExists(fullPath)) {
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          const dirFiles = await fs.readdir(fullPath);
          files.push(...dirFiles
            .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
            .map(f => path.join(fullPath, f))
          );
        } else {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }
}