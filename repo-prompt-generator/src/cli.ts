#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';
import { RepositoryAnalyzer } from './RepositoryAnalyzer';
import { PromptGenerator } from './PromptGenerator';
import { OutputGenerator } from './OutputGenerator';
import { SubPromptGenerator } from './analyzers/SubPromptGenerator';
import { PromptValidator } from './analyzers/PromptValidator';
import { GovernanceAnalyzer } from './analyzers/GovernanceAnalyzer';
import { CLIOptions, AnalysisProgress } from './types';

const program = new Command();

program
  .name('repo-prompt-generator')
  .description('Generate custom AI prompts from your codebase')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze repository and generate custom prompts')
  .argument('<path>', 'Path to repository (local directory or GitHub URL)')
  .option('-o, --output <file>', 'Output file path', 'CUSTOM_PROMPTS.md')
  .option('-f, --format <type>', 'Output format (markdown, json, html)', 'markdown')
  .option('-v, --verbose', 'Show detailed analysis output', false)
  .option('--include-tests', 'Include test files in analysis', true)
  .option('--include-node-modules', 'Include node_modules in analysis', false)
  .option('--max-file-size <size>', 'Maximum file size to analyze (KB)', '1000')
  .option('--github-token <token>', 'GitHub personal access token for private repos')
  .action(async (repoPath: string, options: any) => {
    const spinner = ora('Initializing repository analysis...').start();
    
    try {
      // Validate inputs
      await validateInputs(repoPath, options);
      
      // Set up CLI options
      const cliOptions: CLIOptions = {
        path: repoPath,
        output: options.output,
        format: options.format,
        verbose: options.verbose,
        includeTests: options.includeTests,
        includeNodeModules: options.includeNodeModules,
        maxFileSize: parseInt(options.maxFileSize),
        accessToken: options.githubToken
      };

      // Progress callback for spinner updates
      const progressCallback = (progress: AnalysisProgress) => {
        spinner.text = `${progress.message} (${progress.current}/${progress.total})`;
      };

      // Analyze repository
      spinner.text = 'Analyzing repository structure and patterns...';
      const analyzer = new RepositoryAnalyzer(repoPath, cliOptions, progressCallback);
      const analysis = await analyzer.analyze();

      // Generate prompts
      spinner.text = 'Generating custom prompts from your codebase...';
      const generator = new PromptGenerator(analysis);
      let promptLibrary = generator.generatePromptLibrary();

      // Generate sub-prompts for complex workflows
      if (options.verbose) {
        spinner.text = 'Generating sub-prompts for complex workflows...';
        const subPromptGenerator = new SubPromptGenerator(analysis);
        
        promptLibrary.prompts = promptLibrary.prompts.map(prompt => {
          if (prompt.complexity === 'advanced' || prompt.phase === 'workflow' || prompt.phase === 'incident-response') {
            prompt.subPrompts = subPromptGenerator.generateSubPrompts(prompt);
          }
          return prompt;
        });
      }

      // Validate prompts and optimize if needed
      if (options.verbose) {
        spinner.text = 'Validating and optimizing prompts...';
        const validator = new PromptValidator(analysis);
        const validation = validator.validatePromptLibrary(promptLibrary.prompts);
        
        // Add validation results to prompts
        promptLibrary.prompts = promptLibrary.prompts.map(prompt => {
          prompt.validation = validation.promptValidations[prompt.id];
          return prompt;
        });

        // Add validation summary to metadata
        (promptLibrary.metadata as any).validationScore = Math.round(validation.overallScore);
        (promptLibrary.metadata as any).validationRecommendations = validation.recommendations;
      }

      // Generate output
      spinner.text = `Generating ${options.format} output...`;
      const outputGenerator = new OutputGenerator();
      
      switch (options.format.toLowerCase()) {
        case 'json':
          await outputGenerator.generateJSON(promptLibrary, options.output);
          break;
        case 'html':
          await outputGenerator.generateHTML(promptLibrary, options.output);
          break;
        case 'markdown':
        default:
          await outputGenerator.generateMarkdown(promptLibrary, options.output);
          break;
      }

      spinner.succeed('Analysis complete!');
      
      // Display results
      displayResults(analysis, promptLibrary, options);

    } catch (error) {
      spinner.fail(`Analysis failed: ${error.message}`);
      
      if (options.verbose) {
        console.error(chalk.red('\nDetailed error:'));
        console.error(error);
      }
      
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new project with AI prompt templates')
  .option('-t, --template <type>', 'Project template (react, express, fullstack)', 'react')
  .action(async (options: any) => {
    console.log(chalk.blue('🚀 Initializing project with AI prompt templates...'));
    console.log(chalk.yellow('This feature is coming soon! For now, use the analyze command on existing projects.'));
  });

program
  .command('validate')
  .description('Validate existing prompt library')
  .argument('<file>', 'Path to prompt library file')
  .action(async (filePath: string) => {
    const spinner = ora('Validating prompt library...').start();
    
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const content = await fs.readFile(filePath, 'utf-8');
      let library;
      
      if (filePath.endsWith('.json')) {
        library = JSON.parse(content);
      } else {
        throw new Error('Only JSON prompt libraries can be validated');
      }

      // Basic validation
      const requiredFields = ['metadata', 'analysis', 'prompts', 'categories'];
      for (const field of requiredFields) {
        if (!library[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      spinner.succeed('Prompt library is valid!');
      
      console.log(chalk.green('\n✅ Validation Results:'));
      console.log(`📚 Repository: ${library.metadata.repoName}`);
      console.log(`🎯 Total Prompts: ${library.metadata.totalPrompts}`);
      console.log(`📅 Generated: ${new Date(library.metadata.generatedAt).toLocaleDateString()}`);
      
    } catch (error) {
      spinner.fail(`Validation failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('generate-rules')
  .description('Generate governance rule files and configurations')
  .argument('<path>', 'Path to repository')
  .option('-t, --type <types>', 'Rule types to generate (comma-separated): eslint,security,accessibility,compliance', 'eslint,security,accessibility,compliance')
  .option('-o, --output-dir <dir>', 'Output directory for rule files', '.')
  .action(async (repoPath: string, options: any) => {
    const spinner = ora('Analyzing repository for rule generation...').start();
    
    try {
      if (!await fs.pathExists(repoPath)) {
        throw new Error(`Repository path does not exist: ${repoPath}`);
      }

      const governanceAnalyzer = new GovernanceAnalyzer(repoPath);
      const ruleFiles = await governanceAnalyzer.generateRuleFiles();
      
      const ruleTypes = options.type.split(',').map((t: string) => t.trim());
      const outputDir = path.resolve(options.outputDir);
      
      await fs.ensureDir(outputDir);
      
      let generatedCount = 0;
      
      for (const [filename, content] of Object.entries(ruleFiles)) {
        const ruleType = filename.includes('eslint') ? 'eslint' : 
                        filename.includes('security') ? 'security' :
                        filename.includes('a11y') ? 'accessibility' :
                        filename.includes('COMPLIANCE') ? 'compliance' : 'other';
        
        if (ruleTypes.includes(ruleType) || ruleTypes.includes('all')) {
          const outputPath = path.join(outputDir, filename);
          await fs.ensureDir(path.dirname(outputPath));
          await fs.writeFile(outputPath, content);
          generatedCount++;
          
          console.log(chalk.green(`✓ Generated: ${filename}`));
        }
      }
      
      spinner.succeed(`Generated ${generatedCount} rule files`);
      
      console.log(chalk.blue('\n📋 Generated Rule Files:'));
      console.log(`   Output Directory: ${chalk.white(outputDir)}`);
      console.log(`   Files Created: ${chalk.white(generatedCount)}`);
      console.log(chalk.green('\n💡 Next Steps:'));
      console.log('   1. Review and customize the generated rule files');
      console.log('   2. Install required dependencies (ESLint, security tools, etc.)');
      console.log('   3. Integrate rules into your CI/CD pipeline');
      console.log('   4. Train your team on the new standards');
      
    } catch (error) {
      spinner.fail(`Rule generation failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('examples')
  .description('Show example usage and templates')
  .action(() => {
    console.log(chalk.blue('🎯 Repository Prompt Generator Examples\n'));
    
    console.log(chalk.yellow('Basic Usage:'));
    console.log('  rpg analyze ./my-project');
    console.log('  rpg analyze . --output MY_PROMPTS.md');
    console.log('  rpg analyze https://github.com/user/repo --github-token YOUR_TOKEN\n');
    
    console.log(chalk.yellow('Output Formats:'));
    console.log('  rpg analyze . --format markdown    # Readable Markdown (default)');
    console.log('  rpg analyze . --format json        # Machine-readable JSON');
    console.log('  rpg analyze . --format html        # Interactive HTML\n');
    
    console.log(chalk.yellow('Advanced Options:'));
    console.log('  rpg analyze . --verbose                    # Show detailed output');
    console.log('  rpg analyze . --max-file-size 500         # Limit file size (KB)');
    console.log('  rpg analyze . --include-node-modules       # Include dependencies\n');
    
    console.log(chalk.yellow('Enterprise Features:'));
    console.log('  rpg analyze . --verbose                    # Include sub-prompts and validation');
    console.log('  rpg generate-rules ./my-project            # Generate governance rule files');
    console.log('  rpg generate-rules . --type eslint,security # Generate specific rule types\n');
    
    console.log(chalk.yellow('Example Generated Prompts:'));
    console.log('📝 Development:');
    console.log('  • Feature Planning for Your React App');
    console.log('  • Implement Component Following Your Patterns');
    console.log('  • Write Tests Following Your Testing Style');
    console.log('\n🏢 Enterprise Workflows:');
    console.log('  • CI/CD Pipeline Optimization Analysis');
    console.log('  • Incident Response Plan Development');
    console.log('  • Business Opportunity & Feature Analysis');
    console.log('  • Compliance Assessment & Gap Analysis');
    console.log('  • Dependency Security & Health Analysis\n');
    
    console.log(chalk.yellow('Sub-Prompts (Verbose Mode):'));
    console.log('  • Complex prompts broken into step-by-step workflows');
    console.log('  • Prerequisite tracking and output validation');
    console.log('  • Estimated time and resource requirements\n');
    
    console.log(chalk.yellow('Prompt Validation (Verbose Mode):'));
    console.log('  • Clarity, completeness, and actionability scoring');
    console.log('  • Automatic prompt optimization suggestions');
    console.log('  • Project-specific context validation\n');
    
    console.log(chalk.green('💡 Tip: The generated prompts include real examples from YOUR codebase!'));
    console.log(chalk.cyan('🚀 Use --verbose for advanced features like sub-prompts and validation!'));
  });

async function validateInputs(repoPath: string, options: any): Promise<void> {
  // Validate repository path
  if (repoPath.startsWith('https://github.com/')) {
    if (!options.githubToken) {
      throw new Error('GitHub token required for remote repositories. Use --github-token option.');
    }
    // TODO: Implement GitHub repository cloning/analysis
    throw new Error('GitHub repository analysis is not yet implemented. Please use a local directory.');
  }

  if (!await fs.pathExists(repoPath)) {
    throw new Error(`Repository path does not exist: ${repoPath}`);
  }

  const stat = await fs.stat(repoPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${repoPath}`);
  }

  // Validate output format
  const validFormats = ['markdown', 'json', 'html'];
  if (!validFormats.includes(options.format.toLowerCase())) {
    throw new Error(`Invalid format: ${options.format}. Valid formats: ${validFormats.join(', ')}`);
  }

  // Validate max file size
  const maxFileSize = parseInt(options.maxFileSize);
  if (isNaN(maxFileSize) || maxFileSize <= 0) {
    throw new Error('Max file size must be a positive number');
  }

  // Ensure output directory exists
  const outputDir = path.dirname(path.resolve(options.output));
  await fs.ensureDir(outputDir);
}

function displayResults(analysis: any, library: any, options: any): void {
  console.log(chalk.green('\n🎉 Analysis Complete!\n'));
  
  // Repository info
  console.log(chalk.blue('📊 Repository Analysis:'));
  console.log(`   Project: ${chalk.white(analysis.repoName)}`);
  console.log(`   Type: ${chalk.white(analysis.structure.projectType)}`);
  console.log(`   Architecture: ${chalk.white(analysis.structure.architecture)}`);
  console.log(`   Languages: ${chalk.white(analysis.technologies.languages.map((l: any) => l.name).join(', '))}`);
  if (analysis.technologies.frameworks.length > 0) {
    console.log(`   Frameworks: ${chalk.white(analysis.technologies.frameworks.map((f: any) => f.name).join(', '))}`);
  }
  console.log(`   Quality Score: ${chalk.white(Math.round(analysis.quality.maintainabilityIndex))}/100`);
  
  // Show enterprise analysis if available
  if (options.verbose && analysis.workflow) {
    console.log(`   CI/CD: ${chalk.white(analysis.workflow.cicd.platforms.join(', ') || 'None')}`);
    console.log(`   Dependencies: ${chalk.white(analysis.dependencies?.usage.direct || 0)} direct`);
    console.log(`   Security Risk: ${chalk.white(analysis.dependencies?.security.riskLevel || 'Unknown')}`);
    console.log(`   Documentation: ${chalk.white(analysis.documentation?.coverage || 'Unknown')}`);
  }
  
  console.log('');

  // Generated prompts
  console.log(chalk.blue('🎯 Generated Prompts:'));
  const categories = Object.entries(library.categories);
  categories.forEach(([phase, prompts]: [string, any]) => {
    if (prompts.length > 0) {
      console.log(`   ${getPhaseEmoji(phase)} ${phase}: ${chalk.white(prompts.length)} prompts`);
    }
  });
  console.log(`   ${chalk.green('Total:')} ${chalk.white(library.metadata.totalPrompts)} custom prompts`);
  console.log('');

  // Key insights
  if (analysis.insights.strengths.length > 0) {
    console.log(chalk.blue('✅ Key Strengths:'));
    analysis.insights.strengths.slice(0, 3).forEach((strength: string) => {
      console.log(`   • ${strength}`);
    });
    console.log('');
  }

  if (analysis.insights.opportunities.length > 0) {
    console.log(chalk.blue('💡 AI Opportunities:'));
    analysis.insights.opportunities.slice(0, 3).forEach((opportunity: string) => {
      console.log(`   • ${opportunity}`);
    });
    console.log('');
  }

  // Output info
  console.log(chalk.blue('📄 Output:'));
  console.log(`   File: ${chalk.white(path.resolve(options.output))}`);
  console.log(`   Format: ${chalk.white(options.format)}`);
  console.log('');

  // Next steps
  console.log(chalk.blue('🚀 Next Steps:'));
  console.log(`   1. Open ${chalk.white(options.output)} to view your custom prompts`);
  console.log(`   2. Try a prompt in GitHub Copilot Chat (${chalk.white('Ctrl+Shift+I')})`);
  console.log(`   3. Replace [PLACEHOLDERS] with your specific requirements`);
  console.log(`   4. Share with your team for consistent AI assistance`);
  console.log('');

  console.log(chalk.green('💡 Tip: These prompts are specifically designed for YOUR codebase patterns!'));
}

function getPhaseEmoji(phase: string): string {
  const emojis: { [key: string]: string } = {
    planning: '🎯',
    design: '🏗️',
    implementation: '⚡',
    testing: '🧪',
    review: '🔍',
    deployment: '🚀',
    maintenance: '🔧',
    documentation: '📚',
    workflow: '🔄',
    'incident-response': '🚨',
    analysis: '📊',
    governance: '⚖️',
    business: '💼'
  };
  return emojis[phase] || '📝';
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n💥 Unexpected error:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n💥 Unhandled promise rejection:'), reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}