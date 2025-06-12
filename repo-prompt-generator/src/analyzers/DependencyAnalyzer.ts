import * as fs from 'fs-extra';
import * as path from 'path';
import { DependencyAnalysis } from '../types';

export class DependencyAnalyzer {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async analyze(): Promise<DependencyAnalysis> {
    const security = await this.analyzeSecurity();
    const maintenance = await this.analyzeMaintenance();
    const licensing = await this.analyzeLicensing();
    const usage = await this.analyzeUsage();

    return {
      security,
      maintenance,
      licensing,
      usage
    };
  }

  private async analyzeSecurity(): Promise<DependencyAnalysis['security']> {
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    let vulnerabilities = 0;
    let outdated = 0;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Check for known vulnerable packages (simplified heuristic)
      const knownVulnerablePackages = [
        'lodash', 'moment', 'request', 'bower', 'grunt',
        'jquery', 'bootstrap', 'angular', 'react'
      ];

      // Count potentially vulnerable packages
      for (const [depName, version] of Object.entries(allDeps)) {
        if (knownVulnerablePackages.includes(depName)) {
          // Check if version looks old (simplified)
          if (typeof version === 'string' && this.isOldVersion(version)) {
            vulnerabilities++;
          }
        }
      }

      // Check for package-lock.json audit info
      const packageLockPath = path.join(this.repoPath, 'package-lock.json');
      if (await fs.pathExists(packageLockPath)) {
        try {
          const packageLock = await fs.readJSON(packageLockPath);
          // Look for audit information if available
          if (packageLock.vulnerabilities) {
            vulnerabilities += Object.keys(packageLock.vulnerabilities).length;
          }
        } catch (error) {
          // Ignore package-lock parsing errors
        }
      }

      // Count outdated packages (heuristic based on version patterns)
      outdated = Object.values(allDeps).filter(version => 
        typeof version === 'string' && this.isOldVersion(version)
      ).length;

      // Determine risk level
      if (vulnerabilities > 10 || outdated > 20) {
        riskLevel = 'critical';
      } else if (vulnerabilities > 5 || outdated > 10) {
        riskLevel = 'high';
      } else if (vulnerabilities > 0 || outdated > 5) {
        riskLevel = 'medium';
      }
    }

    // Check for Python dependencies
    const requirementsPath = path.join(this.repoPath, 'requirements.txt');
    const pipfilePath = path.join(this.repoPath, 'Pipfile');
    
    if (await fs.pathExists(requirementsPath) || await fs.pathExists(pipfilePath)) {
      // Python security analysis (simplified)
      const pythonVulnerable = ['django', 'flask', 'requests', 'urllib3'];
      
      if (await fs.pathExists(requirementsPath)) {
        const requirements = await fs.readFile(requirementsPath, 'utf-8');
        pythonVulnerable.forEach(pkg => {
          if (requirements.includes(pkg)) {
            vulnerabilities++;
          }
        });
      }
    }

    return {
      vulnerabilities,
      outdated,
      riskLevel
    };
  }

  private async analyzeMaintenance(): Promise<DependencyAnalysis['maintenance']> {
    const deprecated: string[] = [];
    const unmaintained: string[] = [];
    const alternatives: { [key: string]: string[] } = {};

    const packageJsonPath = path.join(this.repoPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      // Known deprecated packages
      const deprecatedPackages = {
        'request': ['axios', 'node-fetch'],
        'moment': ['dayjs', 'date-fns'],
        'bower': ['npm', 'yarn'],
        'grunt': ['webpack', 'rollup', 'vite'],
        'gulp': ['webpack', 'rollup', 'vite'],
        'node-sass': ['sass', 'dart-sass'],
        'istanbul': ['nyc', 'c8'],
        'tslint': ['eslint'],
        'protractor': ['cypress', 'playwright']
      };

      // Known unmaintained packages (packages that haven't been updated in years)
      const unmaintainedPackages = [
        'jquery-ui',
        'backbone',
        'underscore',
        'coffee-script',
        'grunt-contrib-jshint',
        'node-uuid',
        'colors'
      ];

      for (const depName of Object.keys(allDeps)) {
        if (deprecatedPackages[depName]) {
          deprecated.push(depName);
          alternatives[depName] = deprecatedPackages[depName];
        }
        
        if (unmaintainedPackages.includes(depName)) {
          unmaintained.push(depName);
        }
      }

      // Check for old major versions
      for (const [depName, version] of Object.entries(allDeps)) {
        if (typeof version === 'string' && this.isVeryOldMajorVersion(version)) {
          if (!deprecated.includes(depName) && !unmaintained.includes(depName)) {
            unmaintained.push(depName);
          }
        }
      }
    }

    return {
      deprecated,
      unmaintained,
      alternatives
    };
  }

  private async analyzeLicensing(): Promise<DependencyAnalysis['licensing']> {
    const types: string[] = [];
    const conflicts: string[] = [];
    let compliance: 'compliant' | 'issues' | 'unknown' = 'unknown';

    const packageJsonPath = path.join(this.repoPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      
      // Check project license
      if (packageJson.license) {
        types.push(packageJson.license);
      }

      // Infer licensing issues from common problematic licenses
      const problematicLicenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1'];
      const permissiveLicenses = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'];
      
      if (packageJson.license) {
        if (problematicLicenses.includes(packageJson.license)) {
          conflicts.push(`Project uses ${packageJson.license} which may have copyleft restrictions`);
          compliance = 'issues';
        } else if (permissiveLicenses.includes(packageJson.license)) {
          compliance = 'compliant';
        }
      }

      // Check for license file
      const licenseFiles = ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'COPYING'];
      let hasLicenseFile = false;
      
      for (const licenseFile of licenseFiles) {
        if (await fs.pathExists(path.join(this.repoPath, licenseFile))) {
          hasLicenseFile = true;
          break;
        }
      }
      
      if (!hasLicenseFile && packageJson.license) {
        conflicts.push('License specified in package.json but no LICENSE file found');
      }
    }

    // Check for third-party license files
    const thirdPartyLicenseFiles = [
      'THIRD-PARTY-NOTICES',
      'THIRD-PARTY-LICENSES',
      'ACKNOWLEDGMENTS',
      'licenses'
    ];
    
    let hasThirdPartyLicenses = false;
    for (const file of thirdPartyLicenseFiles) {
      if (await fs.pathExists(path.join(this.repoPath, file))) {
        hasThirdPartyLicenses = true;
        break;
      }
    }
    
    if (!hasThirdPartyLicenses) {
      conflicts.push('No third-party license attribution found');
    }

    return {
      types,
      conflicts,
      compliance
    };
  }

  private async analyzeUsage(): Promise<DependencyAnalysis['usage']> {
    let direct = 0;
    let transitive = 0;
    let bundleSize = 0;
    let treeshaking = false;

    const packageJsonPath = path.join(this.repoPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      
      direct = Object.keys(packageJson.dependencies || {}).length;
      
      // Check package-lock.json for transitive dependencies
      const packageLockPath = path.join(this.repoPath, 'package-lock.json');
      if (await fs.pathExists(packageLockPath)) {
        try {
          const packageLock = await fs.readJSON(packageLockPath);
          if (packageLock.dependencies) {
            transitive = Object.keys(packageLock.dependencies).length - direct;
          }
        } catch (error) {
          // Ignore package-lock parsing errors
        }
      }

      // Estimate bundle size based on dependencies
      const heavyPackages = {
        'react': 50,
        'react-dom': 120,
        'vue': 80,
        'angular': 200,
        'lodash': 70,
        'moment': 150,
        'jquery': 85,
        'bootstrap': 60,
        'webpack': 100,
        'typescript': 40
      };

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      for (const depName of Object.keys(allDeps)) {
        if (heavyPackages[depName]) {
          bundleSize += heavyPackages[depName];
        } else {
          bundleSize += 20; // Average package size estimate
        }
      }

      // Check for tree-shaking support
      const webpackConfigExists = await fs.pathExists(path.join(this.repoPath, 'webpack.config.js'));
      const rollupConfigExists = await fs.pathExists(path.join(this.repoPath, 'rollup.config.js'));
      const viteConfigExists = await fs.pathExists(path.join(this.repoPath, 'vite.config.js'));
      
      if (webpackConfigExists || rollupConfigExists || viteConfigExists) {
        treeshaking = true;
      }

      // Check package.json for ES modules support
      if (packageJson.type === 'module' || packageJson.module) {
        treeshaking = true;
      }
    }

    return {
      direct,
      transitive,
      bundleSize,
      treeshaking
    };
  }

  private isOldVersion(version: string): boolean {
    // Remove version prefixes like ^, ~, >=
    const cleanVersion = version.replace(/^[\^~>=<]+/, '');
    const parts = cleanVersion.split('.');
    
    if (parts.length >= 2) {
      const major = parseInt(parts[0]);
      const minor = parseInt(parts[1]);
      
      // Heuristic: consider versions with major < 2 or very low minor versions as old
      if (major === 0 || (major === 1 && minor < 5)) {
        return true;
      }
    }
    
    return false;
  }

  private isVeryOldMajorVersion(version: string): boolean {
    const cleanVersion = version.replace(/^[\^~>=<]+/, '');
    const parts = cleanVersion.split('.');
    
    if (parts.length >= 1) {
      const major = parseInt(parts[0]);
      return major === 0 || major === 1;
    }
    
    return false;
  }
}