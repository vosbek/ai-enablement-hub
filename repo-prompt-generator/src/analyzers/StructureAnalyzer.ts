import * as fs from 'fs-extra';
import * as path from 'path';
import { FileStructure } from '../types';

export class StructureAnalyzer {
  private repoPath: string;
  private maxDepth: number;
  private ignorePatterns: string[];

  constructor(repoPath: string, options: { maxDepth?: number; ignorePatterns?: string[] } = {}) {
    this.repoPath = repoPath;
    this.maxDepth = options.maxDepth || 10;
    this.ignorePatterns = options.ignorePatterns || [
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
      '*.log'
    ];
  }

  async analyze(): Promise<{
    fileStructure: FileStructure;
    importantFiles: string[];
    projectType: string;
    architecture: string;
    buildSystem: string[];
    packageManager: string;
    testFrameworks: string[];
    documentation: 'poor' | 'moderate' | 'good' | 'excellent';
  }> {
    const fileStructure = await this.buildFileStructure();
    const importantFiles = await this.identifyImportantFiles();
    const projectType = await this.determineProjectType();
    const architecture = await this.determineArchitecture();
    const buildSystem = await this.detectBuildSystem();
    const packageManager = await this.detectPackageManager();
    const testFrameworks = await this.detectTestFrameworks();
    const documentation = await this.assessDocumentation();

    return {
      fileStructure,
      importantFiles,
      projectType,
      architecture,
      buildSystem,
      packageManager,
      testFrameworks,
      documentation
    };
  }

  private async buildFileStructure(currentPath: string = this.repoPath, depth: number = 0): Promise<FileStructure> {
    const relativePath = path.relative(this.repoPath, currentPath);
    const name = path.basename(currentPath);
    
    if (depth > this.maxDepth || this.shouldIgnore(relativePath)) {
      return {
        type: 'directory',
        name,
        path: relativePath,
        importance: 'low',
        children: []
      };
    }

    const stats = await fs.stat(currentPath);
    
    if (stats.isFile()) {
      return {
        type: 'file',
        name,
        path: relativePath,
        size: stats.size,
        importance: this.getFileImportance(name, relativePath)
      };
    }

    const items = await fs.readdir(currentPath);
    const children: FileStructure[] = [];

    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      if (!this.shouldIgnore(path.relative(this.repoPath, itemPath))) {
        try {
          const child = await this.buildFileStructure(itemPath, depth + 1);
          children.push(child);
        } catch (error) {
          // Skip files we can't access
        }
      }
    }

    // Sort children: directories first, then by importance
    children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      const importanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    });

    return {
      type: 'directory',
      name,
      path: relativePath,
      importance: this.getDirectoryImportance(name, children),
      children
    };
  }

  private shouldIgnore(filePath: string): boolean {
    return this.ignorePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  private getFileImportance(fileName: string, filePath: string): 'high' | 'medium' | 'low' {
    // High importance files
    const highImportanceFiles = [
      'package.json',
      'tsconfig.json',
      'webpack.config.js',
      'vite.config.ts',
      'next.config.js',
      'nuxt.config.js',
      'vue.config.js',
      'angular.json',
      'Dockerfile',
      'docker-compose.yml',
      'README.md',
      'CHANGELOG.md',
      'LICENSE',
      '.gitignore',
      '.env',
      '.env.example',
      'schema.prisma',
      'schema.sql'
    ];

    const highImportancePatterns = [
      /^(index|main|app)\.(js|ts|jsx|tsx)$/,
      /^App\.(vue|jsx|tsx)$/,
      /^_app\.(js|ts|jsx|tsx)$/,
      /^_document\.(js|ts|jsx|tsx)$/,
      /\.config\.(js|ts)$/,
      /\.d\.ts$/
    ];

    if (highImportanceFiles.includes(fileName) || 
        highImportancePatterns.some(pattern => pattern.test(fileName))) {
      return 'high';
    }

    // Medium importance patterns
    const mediumImportancePatterns = [
      /\.(component|service|controller|model|util|helper)\.(js|ts|jsx|tsx)$/,
      /\.(test|spec)\.(js|ts|jsx|tsx)$/,
      /\.stories\.(js|ts|jsx|tsx)$/,
      /route(s)?\.(js|ts)$/,
      /api\/.*\.(js|ts)$/,
      /middleware\/.*\.(js|ts)$/,
      /\.md$/
    ];

    if (mediumImportancePatterns.some(pattern => pattern.test(fileName)) ||
        filePath.includes('/api/') ||
        filePath.includes('/components/') ||
        filePath.includes('/services/') ||
        filePath.includes('/utils/')) {
      return 'medium';
    }

    return 'low';
  }

  private getDirectoryImportance(dirName: string, children: FileStructure[]): 'high' | 'medium' | 'low' {
    // High importance directories
    const highImportanceDirs = [
      'src', 'app', 'lib', 'pages', 'components', 'api', 'server',
      'backend', 'frontend', 'services', 'controllers', 'models',
      'routes', 'middleware', 'config', 'database', 'schemas'
    ];

    if (highImportanceDirs.includes(dirName)) {
      return 'high';
    }

    // Medium importance based on children
    const hasImportantChildren = children.some(child => child.importance === 'high');
    if (hasImportantChildren) {
      return 'medium';
    }

    // Medium importance directories
    const mediumImportanceDirs = [
      'utils', 'helpers', 'hooks', 'context', 'store', 'types',
      'interfaces', 'constants', 'assets', 'public', 'static',
      'tests', '__tests__', 'test', 'spec', 'cypress', 'e2e'
    ];

    if (mediumImportanceDirs.includes(dirName)) {
      return 'medium';
    }

    return 'low';
  }

  private async identifyImportantFiles(): Promise<string[]> {
    const importantFiles: string[] = [];

    // Configuration files
    const configFiles = [
      'package.json', 'tsconfig.json', 'webpack.config.js', 'vite.config.ts',
      'next.config.js', 'nuxt.config.js', 'vue.config.js', 'angular.json',
      'jest.config.js', 'cypress.config.js', 'tailwind.config.js',
      'postcss.config.js', '.eslintrc.js', '.prettierrc',
      'Dockerfile', 'docker-compose.yml', '.dockerignore',
      'schema.prisma', 'prisma/schema.prisma',
      '.github/workflows', '.gitlab-ci.yml', 'Jenkinsfile'
    ];

    // Entry points
    const entryPoints = [
      'src/index.js', 'src/index.ts', 'src/main.js', 'src/main.ts',
      'src/App.js', 'src/App.ts', 'src/App.jsx', 'src/App.tsx',
      'src/App.vue', 'pages/_app.js', 'pages/_app.ts',
      'server.js', 'server.ts', 'app.js', 'app.ts',
      'index.js', 'index.ts', 'main.js', 'main.ts'
    ];

    // Documentation
    const docFiles = [
      'README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE',
      'docs/README.md', 'documentation/README.md'
    ];

    const allCandidates = [...configFiles, ...entryPoints, ...docFiles];

    for (const candidate of allCandidates) {
      if (await fs.pathExists(path.join(this.repoPath, candidate))) {
        importantFiles.push(candidate);
      }
    }

    return importantFiles;
  }

  private async determineProjectType(): Promise<string> {
    const indicators = {
      frontend: [
        'src/App.jsx', 'src/App.tsx', 'src/App.vue',
        'pages/_app.js', 'public/index.html',
        'src/components', 'components/'
      ],
      backend: [
        'server.js', 'app.js', 'src/server.js',
        'routes/', 'controllers/', 'middleware/',
        'api/', 'src/api/'
      ],
      mobile: [
        'react-native', 'flutter', 'ionic',
        'App.js', 'App.tsx', 'android/', 'ios/',
        'lib/main.dart'
      ],
      desktop: [
        'electron', 'tauri', 'nwjs',
        'src-tauri/', 'public/electron.js'
      ],
      library: [
        'lib/', 'src/index.ts', 'dist/',
        'rollup.config.js', 'lib/index.js'
      ]
    };

    const packageJson = await this.readPackageJson();
    let scores: { [key: string]: number } = {};

    // Check file/directory indicators
    for (const [type, typeIndicators] of Object.entries(indicators)) {
      scores[type] = 0;
      for (const indicator of typeIndicators) {
        if (await fs.pathExists(path.join(this.repoPath, indicator))) {
          scores[type] += 1;
        }
      }
    }

    // Check package.json dependencies
    if (packageJson) {
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const dependencyIndicators = {
        frontend: ['react', 'vue', 'angular', 'svelte', '@angular/core'],
        backend: ['express', 'fastify', 'koa', 'nestjs', 'hapi'],
        mobile: ['react-native', 'flutter', 'ionic', '@react-native/metro-config'],
        desktop: ['electron', 'tauri', 'nwjs'],
        library: ['rollup', 'microbundle', 'tsdx']
      };

      for (const [type, deps] of Object.entries(dependencyIndicators)) {
        const foundDeps = deps.filter(dep => dependencies[dep]);
        scores[type] += foundDeps.length * 2; // Weight dependencies higher
      }
    }

    // Determine project type
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'unknown';

    const projectType = Object.entries(scores).find(([, score]) => score === maxScore)?.[0] || 'unknown';

    // Check for fullstack (both frontend and backend)
    if (scores.frontend > 0 && scores.backend > 0) {
      return 'fullstack';
    }

    return projectType;
  }

  private async determineArchitecture(): Promise<string> {
    const packageJson = await this.readPackageJson();
    
    // Check for microservices indicators
    const microservicesIndicators = [
      'docker-compose.yml',
      'kubernetes/',
      'k8s/',
      'services/',
      'microservices/'
    ];

    let microservicesScore = 0;
    for (const indicator of microservicesIndicators) {
      if (await fs.pathExists(path.join(this.repoPath, indicator))) {
        microservicesScore += 1;
      }
    }

    // Check for serverless indicators
    const serverlessIndicators = [
      'serverless.yml',
      'netlify.toml',
      'vercel.json',
      'functions/',
      'lambda/',
      'api/'
    ];

    let serverlessScore = 0;
    for (const indicator of serverlessIndicators) {
      if (await fs.pathExists(path.join(this.repoPath, indicator))) {
        serverlessScore += 1;
      }
    }

    // Check for JAMstack indicators
    const jamstackIndicators = [
      'static/', 'public/', '_site/', 'dist/',
      'gatsby-config.js', 'next.config.js', 'nuxt.config.js'
    ];

    let jamstackScore = 0;
    for (const indicator of jamstackIndicators) {
      if (await fs.pathExists(path.join(this.repoPath, indicator))) {
        jamstackScore += 1;
      }
    }

    // Check dependencies for architecture clues
    if (packageJson) {
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (dependencies['next'] || dependencies['gatsby'] || dependencies['nuxt']) {
        jamstackScore += 2;
      }
      
      if (dependencies['serverless'] || dependencies['@serverless/compose']) {
        serverlessScore += 2;
      }
      
      if (dependencies['express'] && dependencies['react']) {
        // Likely monolith fullstack
        return 'monolith';
      }
    }

    // Determine architecture
    if (microservicesScore >= 2) return 'microservices';
    if (serverlessScore >= 2) return 'serverless';
    if (jamstackScore >= 2) return 'jamstack';

    // Check for MVC patterns
    const mvcDirectories = ['models/', 'views/', 'controllers/', 'app/models/', 'app/views/', 'app/controllers/'];
    const mvcScore = mvcDirectories.filter(dir => 
      fs.pathExistsSync(path.join(this.repoPath, dir))
    ).length;

    if (mvcScore >= 2) return 'mvc';

    return 'monolith'; // Default fallback
  }

  private async detectBuildSystem(): Promise<string[]> {
    const buildSystems: string[] = [];
    
    const buildSystemFiles = {
      'Webpack': ['webpack.config.js', 'webpack.config.ts'],
      'Vite': ['vite.config.js', 'vite.config.ts'],
      'Rollup': ['rollup.config.js', 'rollup.config.ts'],
      'Parcel': ['.parcelrc', 'parcel.config.js'],
      'ESBuild': ['esbuild.config.js'],
      'Gulp': ['gulpfile.js', 'gulpfile.ts'],
      'Grunt': ['Gruntfile.js'],
      'Make': ['Makefile'],
      'Bazel': ['BUILD', 'WORKSPACE'],
      'Rush': ['rush.json'],
      'Lerna': ['lerna.json'],
      'Nx': ['nx.json', 'workspace.json']
    };

    for (const [system, files] of Object.entries(buildSystemFiles)) {
      for (const file of files) {
        if (await fs.pathExists(path.join(this.repoPath, file))) {
          buildSystems.push(system);
          break;
        }
      }
    }

    // Check package.json scripts
    const packageJson = await this.readPackageJson();
    if (packageJson?.scripts) {
      const scripts = Object.keys(packageJson.scripts).join(' ');
      if (scripts.includes('webpack')) buildSystems.push('Webpack');
      if (scripts.includes('vite')) buildSystems.push('Vite');
      if (scripts.includes('rollup')) buildSystems.push('Rollup');
      if (scripts.includes('parcel')) buildSystems.push('Parcel');
    }

    return [...new Set(buildSystems)]; // Remove duplicates
  }

  private async detectPackageManager(): Promise<string> {
    const lockFiles = {
      'npm': 'package-lock.json',
      'yarn': 'yarn.lock',
      'pnpm': 'pnpm-lock.yaml',
      'bun': 'bun.lockb'
    };

    for (const [manager, lockFile] of Object.entries(lockFiles)) {
      if (await fs.pathExists(path.join(this.repoPath, lockFile))) {
        return manager;
      }
    }

    // Check for package.json (default to npm)
    if (await fs.pathExists(path.join(this.repoPath, 'package.json'))) {
      return 'npm';
    }

    // Check for other package managers
    const otherManagers = {
      'pip': ['requirements.txt', 'Pipfile'],
      'conda': ['environment.yml', 'conda.yml'],
      'maven': ['pom.xml'],
      'gradle': ['build.gradle', 'build.gradle.kts'],
      'composer': ['composer.json'],
      'cargo': ['Cargo.toml'],
      'go mod': ['go.mod']
    };

    for (const [manager, files] of Object.entries(otherManagers)) {
      for (const file of files) {
        if (await fs.pathExists(path.join(this.repoPath, file))) {
          return manager;
        }
      }
    }

    return 'unknown';
  }

  private async detectTestFrameworks(): Promise<string[]> {
    const frameworks: string[] = [];
    
    const packageJson = await this.readPackageJson();
    if (packageJson) {
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const testFrameworks = {
        'Jest': ['jest', '@types/jest'],
        'Vitest': ['vitest'],
        'Mocha': ['mocha'],
        'Jasmine': ['jasmine'],
        'Cypress': ['cypress'],
        'Playwright': ['@playwright/test'],
        'Puppeteer': ['puppeteer'],
        'Testing Library': ['@testing-library/react', '@testing-library/vue'],
        'Enzyme': ['enzyme'],
        'Karma': ['karma'],
        'Protractor': ['protractor']
      };

      for (const [framework, packages] of Object.entries(testFrameworks)) {
        if (packages.some(pkg => dependencies[pkg])) {
          frameworks.push(framework);
        }
      }
    }

    // Check for test configuration files
    const testConfigFiles = {
      'Jest': ['jest.config.js', 'jest.config.ts'],
      'Cypress': ['cypress.config.js', 'cypress.config.ts'],
      'Playwright': ['playwright.config.ts'],
      'Vitest': ['vitest.config.ts', 'vitest.config.js']
    };

    for (const [framework, files] of Object.entries(testConfigFiles)) {
      for (const file of files) {
        if (await fs.pathExists(path.join(this.repoPath, file))) {
          if (!frameworks.includes(framework)) {
            frameworks.push(framework);
          }
          break;
        }
      }
    }

    return frameworks;
  }

  private async assessDocumentation(): Promise<'poor' | 'moderate' | 'good' | 'excellent'> {
    let score = 0;

    // Essential documentation files
    const essentialDocs = ['README.md', 'readme.md', 'README.txt'];
    const hasReadme = essentialDocs.some(doc => 
      fs.pathExistsSync(path.join(this.repoPath, doc))
    );
    if (hasReadme) score += 2;

    // Additional documentation
    const additionalDocs = [
      'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE', 'CODE_OF_CONDUCT.md',
      'SECURITY.md', 'API.md', 'docs/', 'documentation/'
    ];

    for (const doc of additionalDocs) {
      if (await fs.pathExists(path.join(this.repoPath, doc))) {
        score += 1;
      }
    }

    // Code comments assessment (sample a few files)
    const codeFiles = await this.sampleCodeFiles();
    let commentRatio = 0;
    
    for (const file of codeFiles) {
      const content = await fs.readFile(file, 'utf-8').catch(() => '');
      const lines = content.split('\n');
      const commentLines = lines.filter(line => 
        line.trim().startsWith('//') || 
        line.trim().startsWith('/*') || 
        line.trim().startsWith('*') ||
        line.trim().startsWith('#')
      );
      commentRatio += commentLines.length / lines.length;
    }
    
    if (codeFiles.length > 0) {
      commentRatio /= codeFiles.length;
      if (commentRatio > 0.1) score += 1;
      if (commentRatio > 0.2) score += 1;
    }

    // Package.json description and keywords
    const packageJson = await this.readPackageJson();
    if (packageJson?.description) score += 1;
    if (packageJson?.keywords?.length > 0) score += 1;

    // JSDoc or similar documentation
    const hasJSDoc = codeFiles.some(async (file) => {
      const content = await fs.readFile(file, 'utf-8').catch(() => '');
      return content.includes('/**') || content.includes('@param') || content.includes('@returns');
    });
    if (hasJSDoc) score += 1;

    // Determine documentation quality
    if (score >= 8) return 'excellent';
    if (score >= 5) return 'good';
    if (score >= 2) return 'moderate';
    return 'poor';
  }

  private async sampleCodeFiles(): Promise<string[]> {
    const glob = require('glob');
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cs', 'go', 'rs', 'php', 'rb'];
    const files: string[] = [];
    
    for (const ext of codeExtensions) {
      try {
        const pattern = `**/*.${ext}`;
        const matches = await glob.glob(pattern, { 
          cwd: this.repoPath,
          ignore: this.ignorePatterns.map(p => `**/${p}/**`),
          nodir: true 
        });
        files.push(...matches.slice(0, 3)); // Sample 3 files per extension
      } catch (error) {
        // Ignore errors
      }
    }

    return files.slice(0, 10).map(file => path.join(this.repoPath, file)); // Sample max 10 files
  }

  private async readPackageJson(): Promise<any | null> {
    try {
      const packagePath = path.join(this.repoPath, 'package.json');
      if (await fs.pathExists(packagePath)) {
        return await fs.readJson(packagePath);
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  }
}