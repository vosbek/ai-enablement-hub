import * as fs from 'fs-extra';
import * as path from 'path';
import { Technology } from '../types';

export class TechnologyDetector {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async detect(): Promise<{
    languages: Technology[];
    frameworks: Technology[];
    databases: Technology[];
    tools: Technology[];
    libraries: Technology[];
  }> {
    const [languages, frameworks, databases, tools, libraries] = await Promise.all([
      this.detectLanguages(),
      this.detectFrameworks(),
      this.detectDatabases(),
      this.detectTools(),
      this.detectLibraries(),
    ]);

    return { languages, frameworks, databases, tools, libraries };
  }

  private async detectLanguages(): Promise<Technology[]> {
    const languages: Technology[] = [];
    const fileExtensions = await this.getFileExtensions();

    // Language detection patterns
    const languagePatterns = {
      'TypeScript': { extensions: ['.ts', '.tsx'], confidence: 0.9 },
      'JavaScript': { extensions: ['.js', '.jsx', '.mjs'], confidence: 0.9 },
      'Python': { extensions: ['.py', '.pyx'], confidence: 0.9 },
      'Java': { extensions: ['.java'], confidence: 0.9 },
      'C#': { extensions: ['.cs'], confidence: 0.9 },
      'Go': { extensions: ['.go'], confidence: 0.9 },
      'Rust': { extensions: ['.rs'], confidence: 0.9 },
      'PHP': { extensions: ['.php'], confidence: 0.9 },
      'Ruby': { extensions: ['.rb'], confidence: 0.9 },
      'Swift': { extensions: ['.swift'], confidence: 0.9 },
      'Kotlin': { extensions: ['.kt', '.kts'], confidence: 0.9 },
      'Dart': { extensions: ['.dart'], confidence: 0.9 },
      'HTML': { extensions: ['.html', '.htm'], confidence: 0.8 },
      'CSS': { extensions: ['.css', '.scss', '.sass', '.less'], confidence: 0.8 },
      'SQL': { extensions: ['.sql'], confidence: 0.8 },
      'Shell': { extensions: ['.sh', '.bash'], confidence: 0.7 },
      'YAML': { extensions: ['.yml', '.yaml'], confidence: 0.6 },
      'JSON': { extensions: ['.json'], confidence: 0.6 },
    };

    for (const [language, config] of Object.entries(languagePatterns)) {
      const matchingExtensions = config.extensions.filter(ext => fileExtensions.has(ext));
      if (matchingExtensions.length > 0) {
        const fileCount = matchingExtensions.reduce((sum, ext) => sum + (fileExtensions.get(ext) || 0), 0);
        languages.push({
          name: language,
          confidence: Math.min(config.confidence, fileCount > 10 ? 0.9 : fileCount / 10),
          evidence: [`Found ${fileCount} ${matchingExtensions.join(', ')} files`]
        });
      }
    }

    return languages.sort((a, b) => b.confidence - a.confidence);
  }

  private async detectFrameworks(): Promise<Technology[]> {
    const frameworks: Technology[] = [];
    
    // Check package.json for Node.js frameworks
    const packageJson = await this.readPackageJson();
    if (packageJson) {
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const frameworkPatterns = {
        'React': { packages: ['react', '@types/react'], confidence: 0.9 },
        'Vue.js': { packages: ['vue', '@vue/cli'], confidence: 0.9 },
        'Angular': { packages: ['@angular/core', '@angular/cli'], confidence: 0.9 },
        'Svelte': { packages: ['svelte'], confidence: 0.9 },
        'Express.js': { packages: ['express'], confidence: 0.9 },
        'Fastify': { packages: ['fastify'], confidence: 0.9 },
        'Koa': { packages: ['koa'], confidence: 0.9 },
        'NestJS': { packages: ['@nestjs/core'], confidence: 0.9 },
        'Next.js': { packages: ['next'], confidence: 0.9 },
        'Nuxt.js': { packages: ['nuxt'], confidence: 0.9 },
        'Gatsby': { packages: ['gatsby'], confidence: 0.9 },
        'React Native': { packages: ['react-native', '@react-native/metro-config'], confidence: 0.9 },
        'Flutter': { packages: ['flutter'], confidence: 0.9 },
        'Electron': { packages: ['electron'], confidence: 0.8 },
      };

      for (const [framework, config] of Object.entries(frameworkPatterns)) {
        const foundPackages = config.packages.filter(pkg => dependencies[pkg]);
        if (foundPackages.length > 0) {
          frameworks.push({
            name: framework,
            version: dependencies[foundPackages[0]],
            confidence: config.confidence,
            evidence: [`Found packages: ${foundPackages.join(', ')}`]
          });
        }
      }
    }

    // Check for Python frameworks
    const requirementsTxt = await this.readFile('requirements.txt');
    const pipfile = await this.readFile('Pipfile');
    const pyprojectToml = await this.readFile('pyproject.toml');
    
    if (requirementsTxt || pipfile || pyprojectToml) {
      const pythonContent = [requirementsTxt, pipfile, pyprojectToml].join('\n').toLowerCase();
      
      const pythonFrameworks = {
        'Django': { patterns: ['django'], confidence: 0.9 },
        'Flask': { patterns: ['flask'], confidence: 0.9 },
        'FastAPI': { patterns: ['fastapi'], confidence: 0.9 },
        'Tornado': { patterns: ['tornado'], confidence: 0.8 },
        'Pyramid': { patterns: ['pyramid'], confidence: 0.8 },
      };

      for (const [framework, config] of Object.entries(pythonFrameworks)) {
        if (config.patterns.some(pattern => pythonContent.includes(pattern))) {
          frameworks.push({
            name: framework,
            confidence: config.confidence,
            evidence: ['Found in Python dependencies']
          });
        }
      }
    }

    // Check for file-based framework detection
    const fileIndicators = {
      'React': { files: ['src/App.jsx', 'src/App.tsx', 'public/index.html'], confidence: 0.8 },
      'Vue.js': { files: ['src/App.vue', 'vue.config.js'], confidence: 0.8 },
      'Angular': { files: ['angular.json', 'src/app/app.component.ts'], confidence: 0.9 },
      'Laravel': { files: ['artisan', 'app/Http/Controllers'], confidence: 0.9 },
      'Ruby on Rails': { files: ['Gemfile', 'config/routes.rb', 'app/controllers'], confidence: 0.9 },
      'Spring Boot': { files: ['pom.xml', 'src/main/java'], confidence: 0.8 },
    };

    for (const [framework, config] of Object.entries(fileIndicators)) {
      const foundFiles = [];
      for (const file of config.files) {
        if (await fs.pathExists(path.join(this.repoPath, file))) {
          foundFiles.push(file);
        }
      }
      
      if (foundFiles.length > 0) {
        frameworks.push({
          name: framework,
          confidence: config.confidence * (foundFiles.length / config.files.length),
          evidence: [`Found indicator files: ${foundFiles.join(', ')}`]
        });
      }
    }

    return frameworks.sort((a, b) => b.confidence - a.confidence);
  }

  private async detectDatabases(): Promise<Technology[]> {
    const databases: Technology[] = [];
    
    // Check package.json for database drivers
    const packageJson = await this.readPackageJson();
    if (packageJson) {
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const databaseDrivers = {
        'PostgreSQL': { packages: ['pg', 'postgres', '@types/pg'], confidence: 0.9 },
        'MySQL': { packages: ['mysql', 'mysql2'], confidence: 0.9 },
        'MongoDB': { packages: ['mongodb', 'mongoose'], confidence: 0.9 },
        'Redis': { packages: ['redis', 'ioredis'], confidence: 0.8 },
        'SQLite': { packages: ['sqlite3', 'better-sqlite3'], confidence: 0.8 },
        'Elasticsearch': { packages: ['@elastic/elasticsearch'], confidence: 0.8 },
      };

      for (const [database, config] of Object.entries(databaseDrivers)) {
        const foundPackages = config.packages.filter(pkg => dependencies[pkg]);
        if (foundPackages.length > 0) {
          databases.push({
            name: database,
            confidence: config.confidence,
            evidence: [`Found drivers: ${foundPackages.join(', ')}`]
          });
        }
      }
    }

    // Check for database configuration files
    const dbConfigFiles = {
      'PostgreSQL': ['postgresql.conf', 'pg_hba.conf'],
      'MySQL': ['my.cnf', 'mysql.cnf'],
      'MongoDB': ['mongod.conf'],
      'Redis': ['redis.conf'],
    };

    for (const [database, configFiles] of Object.entries(dbConfigFiles)) {
      for (const configFile of configFiles) {
        if (await fs.pathExists(path.join(this.repoPath, configFile))) {
          databases.push({
            name: database,
            confidence: 0.7,
            evidence: [`Found config file: ${configFile}`]
          });
          break;
        }
      }
    }

    // Check for database schema files
    const schemaPatterns = await this.findFiles(['**/*.sql', '**/schema.rb', '**/migrations/**']);
    if (schemaPatterns.length > 0) {
      databases.push({
        name: 'SQL Database',
        confidence: 0.6,
        evidence: [`Found ${schemaPatterns.length} schema/migration files`]
      });
    }

    return databases.sort((a, b) => b.confidence - a.confidence);
  }

  private async detectTools(): Promise<Technology[]> {
    const tools: Technology[] = [];
    
    // Build tools and bundlers
    const buildTools = {
      'Webpack': { files: ['webpack.config.js', 'webpack.config.ts'], packages: ['webpack'] },
      'Vite': { files: ['vite.config.js', 'vite.config.ts'], packages: ['vite'] },
      'Rollup': { files: ['rollup.config.js'], packages: ['rollup'] },
      'Parcel': { files: ['.parcelrc'], packages: ['parcel'] },
      'ESBuild': { files: ['esbuild.config.js'], packages: ['esbuild'] },
      'Babel': { files: ['.babelrc', 'babel.config.js'], packages: ['@babel/core'] },
      'TypeScript': { files: ['tsconfig.json'], packages: ['typescript'] },
    };

    // Development tools
    const devTools = {
      'ESLint': { files: ['.eslintrc.js', '.eslintrc.json'], packages: ['eslint'] },
      'Prettier': { files: ['.prettierrc', 'prettier.config.js'], packages: ['prettier'] },
      'Jest': { files: ['jest.config.js'], packages: ['jest'] },
      'Vitest': { files: ['vitest.config.ts'], packages: ['vitest'] },
      'Cypress': { files: ['cypress.config.js'], packages: ['cypress'] },
      'Playwright': { files: ['playwright.config.ts'], packages: ['@playwright/test'] },
      'Storybook': { files: ['.storybook/main.js'], packages: ['@storybook/core'] },
    };

    // CI/CD tools
    const cicdTools = {
      'GitHub Actions': { files: ['.github/workflows'] },
      'GitLab CI': { files: ['.gitlab-ci.yml'] },
      'Jenkins': { files: ['Jenkinsfile'] },
      'CircleCI': { files: ['.circleci/config.yml'] },
      'Travis CI': { files: ['.travis.yml'] },
    };

    // Container tools
    const containerTools = {
      'Docker': { files: ['Dockerfile', 'docker-compose.yml'] },
      'Kubernetes': { files: ['k8s/', 'kubernetes/'] },
    };

    const packageJson = await this.readPackageJson();
    const allTools = { ...buildTools, ...devTools, ...containerTools };

    for (const [tool, config] of Object.entries(allTools)) {
      let confidence = 0;
      const evidence: string[] = [];

      // Check for files
      if (config.files) {
        for (const file of config.files) {
          if (await fs.pathExists(path.join(this.repoPath, file))) {
            confidence = Math.max(confidence, 0.8);
            evidence.push(`Found config file: ${file}`);
          }
        }
      }

      // Check for packages
      if (config.packages && packageJson) {
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const foundPackages = config.packages.filter(pkg => dependencies[pkg]);
        if (foundPackages.length > 0) {
          confidence = Math.max(confidence, 0.7);
          evidence.push(`Found packages: ${foundPackages.join(', ')}`);
        }
      }

      if (confidence > 0) {
        tools.push({
          name: tool,
          confidence,
          evidence
        });
      }
    }

    // Add CI/CD tools
    for (const [tool, config] of Object.entries(cicdTools)) {
      for (const file of config.files) {
        if (await fs.pathExists(path.join(this.repoPath, file))) {
          tools.push({
            name: tool,
            confidence: 0.9,
            evidence: [`Found CI/CD config: ${file}`]
          });
          break;
        }
      }
    }

    return tools.sort((a, b) => b.confidence - a.confidence);
  }

  private async detectLibraries(): Promise<Technology[]> {
    const libraries: Technology[] = [];
    
    const packageJson = await this.readPackageJson();
    if (!packageJson) return libraries;

    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Popular library categories
    const libraryCategories = {
      'UI Libraries': {
        packages: ['@mui/material', 'antd', 'react-bootstrap', 'semantic-ui-react', 'chakra-ui'],
        confidence: 0.8
      },
      'State Management': {
        packages: ['redux', 'zustand', 'recoil', 'mobx', 'vuex', 'pinia'],
        confidence: 0.8
      },
      'HTTP Client': {
        packages: ['axios', 'fetch', 'superagent', 'got', 'node-fetch'],
        confidence: 0.7
      },
      'Testing': {
        packages: ['testing-library', 'enzyme', 'sinon', 'mocha', 'chai'],
        confidence: 0.7
      },
      'Styling': {
        packages: ['styled-components', 'emotion', 'tailwindcss', 'sass'],
        confidence: 0.6
      },
      'Date/Time': {
        packages: ['moment', 'dayjs', 'date-fns', 'luxon'],
        confidence: 0.6
      },
      'Validation': {
        packages: ['joi', 'yup', 'zod', 'ajv'],
        confidence: 0.7
      },
      'ORM/ODM': {
        packages: ['prisma', 'typeorm', 'sequelize', 'mongoose', 'knex'],
        confidence: 0.8
      }
    };

    for (const [category, config] of Object.entries(libraryCategories)) {
      const foundPackages = config.packages.filter(pkg => dependencies[pkg]);
      if (foundPackages.length > 0) {
        libraries.push({
          name: category,
          confidence: config.confidence,
          evidence: [`Found libraries: ${foundPackages.join(', ')}`]
        });
      }
    }

    return libraries.sort((a, b) => b.confidence - a.confidence);
  }

  private async getFileExtensions(): Promise<Map<string, number>> {
    const extensions = new Map<string, number>();
    const files = await this.findFiles(['**/*'], { ignore: ['node_modules/**', '.git/**'] });
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext) {
        extensions.set(ext, (extensions.get(ext) || 0) + 1);
      }
    }

    return extensions;
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

  private async readFile(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(this.repoPath, filePath);
      if (await fs.pathExists(fullPath)) {
        return await fs.readFile(fullPath, 'utf-8');
      }
    } catch (error) {
      // Ignore errors
    }
    return null;
  }

  private async findFiles(patterns: string[], options: { ignore?: string[] } = {}): Promise<string[]> {
    const glob = require('glob');
    const ignore = require('ignore');
    
    const ig = ignore().add(options.ignore || []);
    const allFiles: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const files = await glob.glob(pattern, { 
          cwd: this.repoPath,
          nodir: true 
        });
        allFiles.push(...files.filter(file => !ig.ignores(file)));
      } catch (error) {
        // Ignore glob errors
      }
    }

    return [...new Set(allFiles)]; // Remove duplicates
  }
}