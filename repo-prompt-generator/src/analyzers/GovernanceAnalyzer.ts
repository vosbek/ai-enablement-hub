import * as fs from 'fs-extra';
import * as path from 'path';
import { GovernanceAnalysis } from '../types';

export class GovernanceAnalyzer {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async analyze(): Promise<GovernanceAnalysis> {
    const compliance = await this.analyzeCompliance();
    const policies = await this.analyzePolicies();
    const rulesets = await this.analyzeRulesets();

    return {
      compliance,
      policies,
      rulesets
    };
  }

  private async analyzeCompliance(): Promise<GovernanceAnalysis['compliance']> {
    const standards: string[] = [];
    const frameworks: string[] = [];
    const gaps: string[] = [];

    // Check for compliance indicators in documentation
    const complianceFiles = await this.findComplianceFiles();
    
    for (const file of complianceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check for compliance standards
      const standardPatterns = {
        'GDPR': /gdpr|general data protection regulation/i,
        'HIPAA': /hipaa|health insurance portability/i,
        'SOX': /sox|sarbanes.?oxley/i,
        'PCI-DSS': /pci.?dss|payment card industry/i,
        'CCPA': /ccpa|california consumer privacy/i,
        'ISO 27001': /iso.?27001|information security management/i,
        'SOC 2': /soc.?2|service organization control/i,
        'NIST': /nist|national institute of standards/i,
        'OWASP': /owasp|open web application security/i
      };

      for (const [standard, pattern] of Object.entries(standardPatterns)) {
        if (pattern.test(content)) {
          standards.push(standard);
        }
      }

      // Check for framework mentions
      const frameworkPatterns = {
        'ISO 27001': /iso.?27001/i,
        'SOC 2': /soc.?2/i,
        'NIST Cybersecurity Framework': /nist.*cybersecurity.*framework/i,
        'COBIT': /cobit/i,
        'ITIL': /itil/i
      };

      for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
        if (pattern.test(content)) {
          frameworks.push(framework);
        }
      }
    }

    // Analyze gaps based on project type
    const projectType = await this.inferProjectType();
    gaps.push(...this.identifyComplianceGaps(projectType, standards, frameworks));

    return {
      standards: [...new Set(standards)],
      frameworks: [...new Set(frameworks)],
      gaps
    };
  }

  private async analyzePolicies(): Promise<GovernanceAnalysis['policies']> {
    const policies = {
      security: false,
      privacy: false,
      retention: false,
      access: false
    };

    // Check for policy files
    const policyFiles = [
      'SECURITY.md',
      'PRIVACY.md',
      'DATA_RETENTION.md',
      'ACCESS_CONTROL.md',
      'policies',
      'docs/policies'
    ];

    for (const policyFile of policyFiles) {
      const policyPath = path.join(this.repoPath, policyFile);
      if (await fs.pathExists(policyPath)) {
        if (policyFile.toLowerCase().includes('security')) {
          policies.security = true;
        }
        if (policyFile.toLowerCase().includes('privacy')) {
          policies.privacy = true;
        }
        if (policyFile.toLowerCase().includes('retention')) {
          policies.retention = true;
        }
        if (policyFile.toLowerCase().includes('access')) {
          policies.access = true;
        }
      }
    }

    // Check README and documentation for policy mentions
    const readmePath = await this.findReadme();
    if (readmePath) {
      const content = await fs.readFile(readmePath, 'utf-8');
      
      if (content.match(/security.*policy|policy.*security/i)) {
        policies.security = true;
      }
      if (content.match(/privacy.*policy|policy.*privacy/i)) {
        policies.privacy = true;
      }
      if (content.match(/data.*retention|retention.*policy/i)) {
        policies.retention = true;
      }
      if (content.match(/access.*control|access.*policy/i)) {
        policies.access = true;
      }
    }

    return policies;
  }

  private async analyzeRulesets(): Promise<GovernanceAnalysis['rulesets']> {
    const rulesets = {
      linting: [] as string[],
      security: [] as string[],
      accessibility: [] as string[],
      performance: [] as string[]
    };

    // Check for linting configuration
    const lintingConfigs = [
      '.eslintrc.js',
      '.eslintrc.json',
      '.eslintrc.yml',
      'eslint.config.js',
      'tslint.json',
      '.jshintrc',
      'pyproject.toml',
      'setup.cfg',
      '.flake8'
    ];

    for (const config of lintingConfigs) {
      if (await fs.pathExists(path.join(this.repoPath, config))) {
        rulesets.linting.push(config);
      }
    }

    // Check for security rules
    const securityConfigs = [
      '.snyk',
      'security.yml',
      '.github/workflows/security.yml',
      'bandit.yml',
      'safety.json'
    ];

    for (const config of securityConfigs) {
      if (await fs.pathExists(path.join(this.repoPath, config))) {
        rulesets.security.push(config);
      }
    }

    // Check for accessibility rules
    const a11yConfigs = [
      '.a11yrc',
      'accessibility.json',
      'axe.config.js'
    ];

    for (const config of a11yConfigs) {
      if (await fs.pathExists(path.join(this.repoPath, config))) {
        rulesets.accessibility.push(config);
      }
    }

    // Check package.json for accessibility dependencies
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const a11yPackages = Object.keys(allDeps).filter(dep => 
        dep.includes('a11y') || dep.includes('accessibility') || dep.includes('axe')
      );

      if (a11yPackages.length > 0) {
        rulesets.accessibility.push('package.json (dependencies)');
      }
    }

    // Check for performance rules
    const performanceConfigs = [
      'lighthouse.config.js',
      'performance.json',
      'web-vitals.config.js'
    ];

    for (const config of performanceConfigs) {
      if (await fs.pathExists(path.join(this.repoPath, config))) {
        rulesets.performance.push(config);
      }
    }

    return rulesets;
  }

  private async findComplianceFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const compliancePatterns = [
      'COMPLIANCE*',
      'SECURITY*',
      'PRIVACY*',
      'GDPR*',
      'HIPAA*',
      'docs/compliance*',
      'docs/security*',
      'docs/privacy*'
    ];

    for (const pattern of compliancePatterns) {
      try {
        const glob = require('glob');
        const matches = await glob.glob(pattern, {
          cwd: this.repoPath,
          ignore: ['node_modules/**', '.git/**']
        });
        
        files.push(...matches.map(f => path.join(this.repoPath, f)));
      } catch (error) {
        // Ignore glob errors
      }
    }

    return files;
  }

  private async inferProjectType(): Promise<string> {
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const deps = Object.keys(packageJson.dependencies || {});
      
      // Check for healthcare-related dependencies
      if (deps.some(dep => dep.includes('health') || dep.includes('medical'))) {
        return 'healthcare';
      }
      
      // Check for financial dependencies
      if (deps.some(dep => dep.includes('stripe') || dep.includes('payment') || dep.includes('finance'))) {
        return 'financial';
      }
      
      // Check for e-commerce
      if (deps.some(dep => dep.includes('shop') || dep.includes('commerce') || dep.includes('cart'))) {
        return 'ecommerce';
      }
      
      // Check for data processing
      if (deps.some(dep => dep.includes('data') || dep.includes('analytics') || dep.includes('ml'))) {
        return 'data';
      }
    }
    
    return 'general';
  }

  private identifyComplianceGaps(
    projectType: string,
    standards: string[],
    frameworks: string[]
  ): string[] {
    const gaps: string[] = [];
    
    switch (projectType) {
      case 'healthcare':
        if (!standards.includes('HIPAA')) {
          gaps.push('HIPAA compliance documentation missing for healthcare application');
        }
        if (!frameworks.includes('ISO 27001')) {
          gaps.push('ISO 27001 framework implementation recommended for healthcare data');
        }
        break;
        
      case 'financial':
        if (!standards.includes('SOX')) {
          gaps.push('SOX compliance considerations needed for financial application');
        }
        if (!standards.includes('PCI-DSS')) {
          gaps.push('PCI-DSS compliance required for payment processing');
        }
        break;
        
      case 'ecommerce':
        if (!standards.includes('GDPR')) {
          gaps.push('GDPR compliance needed for customer data protection');
        }
        if (!standards.includes('PCI-DSS')) {
          gaps.push('PCI-DSS compliance required for payment processing');
        }
        break;
        
      case 'data':
        if (!standards.includes('GDPR')) {
          gaps.push('GDPR compliance essential for data processing applications');
        }
        if (!frameworks.includes('NIST Cybersecurity Framework')) {
          gaps.push('NIST Cybersecurity Framework recommended for data applications');
        }
        break;
        
      default:
        if (standards.length === 0) {
          gaps.push('No compliance standards identified - consider GDPR for data protection');
        }
        if (frameworks.length === 0) {
          gaps.push('No security frameworks identified - consider ISO 27001 or SOC 2');
        }
    }
    
    return gaps;
  }

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

  // Method to generate rule files based on analysis
  async generateRuleFiles(): Promise<{ [filename: string]: string }> {
    const ruleFiles: { [filename: string]: string } = {};
    
    // Generate ESLint config if not present
    if (!await this.hasESLintConfig()) {
      ruleFiles['.eslintrc.json'] = this.generateESLintConfig();
    }
    
    // Generate security config
    ruleFiles['.github/workflows/security.yml'] = this.generateSecurityWorkflow();
    
    // Generate accessibility config
    ruleFiles['.a11yrc.json'] = this.generateAccessibilityConfig();
    
    // Generate compliance checklist
    ruleFiles['COMPLIANCE_CHECKLIST.md'] = await this.generateComplianceChecklist();
    
    return ruleFiles;
  }

  private async hasESLintConfig(): Promise<boolean> {
    const eslintConfigs = [
      '.eslintrc.js',
      '.eslintrc.json',
      '.eslintrc.yml',
      'eslint.config.js'
    ];
    
    for (const config of eslintConfigs) {
      if (await fs.pathExists(path.join(this.repoPath, config))) {
        return true;
      }
    }
    
    return false;
  }

  private generateESLintConfig(): string {
    return JSON.stringify({
      "env": {
        "browser": true,
        "es2021": true,
        "node": true
      },
      "extends": [
        "eslint:recommended",
        "@typescript-eslint/recommended"
      ],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
      },
      "plugins": [
        "@typescript-eslint",
        "security",
        "jsx-a11y"
      ],
      "rules": {
        "no-console": "warn",
        "no-unused-vars": "error",
        "security/detect-object-injection": "error",
        "jsx-a11y/alt-text": "error",
        "jsx-a11y/anchor-has-content": "error"
      }
    }, null, 2);
  }

  private generateSecurityWorkflow(): string {
    return `name: Security Scan

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run npm audit
      run: npm audit --audit-level high
      
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
        
    - name: Run CodeQL Analysis
      uses: github/codeql-action/analyze@v2
      with:
        languages: javascript, typescript
`;
  }

  private generateAccessibilityConfig(): string {
    return JSON.stringify({
      "rules": {
        "color-contrast": "error",
        "keyboard-navigation": "error",
        "alt-text": "error",
        "focus-management": "error",
        "semantic-markup": "error"
      },
      "tags": ["wcag2a", "wcag2aa"],
      "exclude": ["node_modules/**"]
    }, null, 2);
  }

  private async generateComplianceChecklist(): Promise<string> {
    const projectType = await this.inferProjectType();
    
    let checklist = `# Compliance Checklist

## Data Protection & Privacy
- [ ] Data inventory and classification completed
- [ ] Privacy policy implemented and accessible
- [ ] User consent mechanisms in place
- [ ] Data retention policies defined
- [ ] Right to deletion (right to be forgotten) implemented
- [ ] Data breach notification procedures established

## Security
- [ ] Security policy documented
- [ ] Access control mechanisms implemented
- [ ] Authentication and authorization systems in place
- [ ] Encryption for data in transit and at rest
- [ ] Security monitoring and logging enabled
- [ ] Incident response procedures documented
- [ ] Regular security assessments conducted

## Technical Compliance
- [ ] Code quality standards enforced
- [ ] Automated security scanning in CI/CD
- [ ] Dependency vulnerability scanning
- [ ] Accessibility standards compliance (WCAG 2.1 AA)
- [ ] Performance monitoring and optimization

`;

    // Add project-specific requirements
    switch (projectType) {
      case 'healthcare':
        checklist += `## HIPAA Compliance (Healthcare)
- [ ] Business Associate Agreements (BAAs) in place
- [ ] PHI encryption and access controls
- [ ] Audit trails for PHI access
- [ ] Staff training on HIPAA requirements
- [ ] Risk assessments completed

`;
        break;
        
      case 'financial':
        checklist += `## Financial Compliance
- [ ] SOX controls for financial reporting
- [ ] PCI-DSS compliance for payment data
- [ ] Anti-money laundering (AML) procedures
- [ ] Know Your Customer (KYC) processes
- [ ] Financial data encryption and audit trails

`;
        break;
        
      case 'ecommerce':
        checklist += `## E-commerce Compliance
- [ ] PCI-DSS Level 1 compliance for payment processing
- [ ] GDPR compliance for EU customers
- [ ] Cookie consent and tracking disclosures
- [ ] Terms of service and return policies
- [ ] Consumer protection law compliance

`;
        break;
    }

    checklist += `## Documentation & Training
- [ ] Compliance policies documented and accessible
- [ ] Staff training programs implemented
- [ ] Regular compliance audits scheduled
- [ ] Third-party vendor assessments completed
- [ ] Compliance monitoring and reporting systems in place

## Continuous Monitoring
- [ ] Compliance dashboard and metrics
- [ ] Regular policy reviews and updates
- [ ] Automated compliance checks in development
- [ ] Incident tracking and resolution
- [ ] Regulatory change monitoring and adaptation
`;

    return checklist;
  }
}