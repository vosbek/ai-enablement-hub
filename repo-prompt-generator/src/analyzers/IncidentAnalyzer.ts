import * as fs from 'fs-extra';
import * as path from 'path';
import { IncidentAnalysis } from '../types';

export class IncidentAnalyzer {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async analyze(): Promise<IncidentAnalysis> {
    const preparedness = await this.analyzePreparedness();
    const responseCapability = await this.analyzeResponseCapability();
    const riskAreas = await this.identifyRiskAreas();
    const recommendations = this.generateRecommendations(preparedness, responseCapability, riskAreas);

    return {
      preparedness,
      responseCapability,
      riskAreas,
      recommendations
    };
  }

  private async analyzePreparedness(): Promise<IncidentAnalysis['preparedness']> {
    const preparedness = {
      hasRunbooks: false,
      hasMonitoring: false,
      hasAlerting: false,
      hasPlaybooks: false
    };

    // Check for runbooks
    const runbookPaths = [
      'runbooks',
      'docs/runbooks',
      'docs/operations',
      'ops',
      'playbooks',
      'procedures'
    ];

    for (const runbookPath of runbookPaths) {
      if (await fs.pathExists(path.join(this.repoPath, runbookPath))) {
        preparedness.hasRunbooks = true;
        break;
      }
    }

    // Check for runbook files
    const runbookFiles = [
      'RUNBOOK.md',
      'OPERATIONS.md',
      'INCIDENT_RESPONSE.md',
      'TROUBLESHOOTING.md'
    ];

    for (const runbookFile of runbookFiles) {
      if (await fs.pathExists(path.join(this.repoPath, runbookFile))) {
        preparedness.hasRunbooks = true;
        break;
      }
    }

    // Check for monitoring configuration
    const monitoringIndicators = [
      'prometheus.yml',
      'grafana',
      'datadog.yaml',
      'newrelic.yml',
      'monitoring',
      'metrics',
      'telemetry'
    ];

    for (const indicator of monitoringIndicators) {
      if (await fs.pathExists(path.join(this.repoPath, indicator))) {
        preparedness.hasMonitoring = true;
        break;
      }
    }

    // Check for monitoring in code
    if (await this.hasMonitoringCode()) {
      preparedness.hasMonitoring = true;
    }

    // Check for alerting configuration
    const alertingIndicators = [
      'alerts',
      'alerting',
      'notifications',
      'pagerduty',
      'opsgenie',
      'alert-manager'
    ];

    for (const indicator of alertingIndicators) {
      if (await fs.pathExists(path.join(this.repoPath, indicator))) {
        preparedness.hasAlerting = true;
        break;
      }
    }

    // Check for playbooks
    const playbookPaths = [
      'playbooks',
      'ansible',
      'chef',
      'puppet',
      'saltstack'
    ];

    for (const playbookPath of playbookPaths) {
      if (await fs.pathExists(path.join(this.repoPath, playbookPath))) {
        preparedness.hasPlaybooks = true;
        break;
      }
    }

    return preparedness;
  }

  private async analyzeResponseCapability(): Promise<IncidentAnalysis['responseCapability']> {
    const capability = {
      escalationPaths: false,
      communicationPlans: false,
      rollbackProcedures: false,
      postmortemProcess: false
    };

    // Check for escalation documentation
    const escalationIndicators = [
      'ESCALATION.md',
      'ONCALL.md',
      'CONTACTS.md',
      'docs/escalation',
      'docs/oncall'
    ];

    for (const indicator of escalationIndicators) {
      if (await fs.pathExists(path.join(this.repoPath, indicator))) {
        capability.escalationPaths = true;
        break;
      }
    }

    // Check for communication plans
    const communicationIndicators = [
      'COMMUNICATION.md',
      'INCIDENT_COMMUNICATION.md',
      'docs/communication',
      'docs/incident-response'
    ];

    for (const indicator of communicationIndicators) {
      if (await fs.pathExists(path.join(this.repoPath, indicator))) {
        capability.communicationPlans = true;
        break;
      }
    }

    // Check for rollback procedures
    const rollbackIndicators = [
      'ROLLBACK.md',
      'DEPLOYMENT.md',
      'docs/rollback',
      'docs/deployment'
    ];

    for (const indicator of rollbackIndicators) {
      if (await fs.pathExists(path.join(this.repoPath, indicator))) {
        capability.rollbackProcedures = true;
        break;
      }
    }

    // Check for rollback in CI/CD
    if (await this.hasRollbackInCICD()) {
      capability.rollbackProcedures = true;
    }

    // Check for postmortem process
    const postmortemIndicators = [
      'POSTMORTEM.md',
      'POST_MORTEM.md',
      'docs/postmortem',
      'docs/post-mortem',
      'postmortems',
      'incidents'
    ];

    for (const indicator of postmortemIndicators) {
      if (await fs.pathExists(path.join(this.repoPath, indicator))) {
        capability.postmortemProcess = true;
        break;
      }
    }

    return capability;
  }

  private async identifyRiskAreas(): Promise<string[]> {
    const risks: string[] = [];

    // Check for single points of failure
    if (!await this.hasRedundancy()) {
      risks.push('Potential single points of failure in architecture');
    }

    // Check for database dependencies
    if (await this.hasDatabaseDependencies()) {
      risks.push('Database dependencies require special incident handling');
    }

    // Check for external service dependencies
    const externalDeps = await this.getExternalDependencies();
    if (externalDeps.length > 0) {
      risks.push(`External service dependencies: ${externalDeps.join(', ')}`);
    }

    // Check for authentication/authorization systems
    if (await this.hasAuthSystems()) {
      risks.push('Authentication/authorization systems are critical failure points');
    }

    // Check for data processing pipelines
    if (await this.hasDataPipelines()) {
      risks.push('Data processing pipelines may require specialized recovery procedures');
    }

    // Check for real-time/streaming systems
    if (await this.hasRealtimeSystems()) {
      risks.push('Real-time systems may have cascading failure effects');
    }

    // Check for payment/financial systems
    if (await this.hasPaymentSystems()) {
      risks.push('Payment systems require immediate incident response due to financial impact');
    }

    // Check for user-facing systems
    if (await this.hasUserFacingSystems()) {
      risks.push('User-facing systems directly impact customer experience');
    }

    return risks;
  }

  private generateRecommendations(
    preparedness: IncidentAnalysis['preparedness'],
    capability: IncidentAnalysis['responseCapability'],
    riskAreas: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Preparedness recommendations
    if (!preparedness.hasRunbooks) {
      recommendations.push('Create operational runbooks for common incident scenarios');
    }

    if (!preparedness.hasMonitoring) {
      recommendations.push('Implement comprehensive monitoring and observability');
    }

    if (!preparedness.hasAlerting) {
      recommendations.push('Set up automated alerting for critical system metrics');
    }

    if (!preparedness.hasPlaybooks) {
      recommendations.push('Develop automation playbooks for incident response');
    }

    // Response capability recommendations
    if (!capability.escalationPaths) {
      recommendations.push('Document clear escalation paths and on-call procedures');
    }

    if (!capability.communicationPlans) {
      recommendations.push('Create incident communication templates and procedures');
    }

    if (!capability.rollbackProcedures) {
      recommendations.push('Implement automated rollback procedures for deployments');
    }

    if (!capability.postmortemProcess) {
      recommendations.push('Establish postmortem processes for continuous improvement');
    }

    // Risk-based recommendations
    if (riskAreas.length > 3) {
      recommendations.push('Conduct risk assessment and create mitigation strategies');
    }

    if (riskAreas.some(risk => risk.includes('single point'))) {
      recommendations.push('Implement redundancy and failover mechanisms');
    }

    if (riskAreas.some(risk => risk.includes('External service'))) {
      recommendations.push('Create fallback strategies for external service failures');
    }

    return recommendations;
  }

  private async hasMonitoringCode(): Promise<boolean> {
    const monitoringPatterns = [
      'prometheus',
      'metrics',
      'gauge',
      'counter',
      'histogram',
      'datadog',
      'newrelic',
      'monitoring',
      'telemetry'
    ];

    const glob = require('glob');
    try {
      const codeFiles = await glob.glob('**/*.{js,ts,py,java,go}', {
        cwd: this.repoPath,
        ignore: ['node_modules/**', '.git/**']
      });

      for (const file of codeFiles.slice(0, 20)) { // Sample files
        try {
          const content = await fs.readFile(path.join(this.repoPath, file), 'utf-8');
          
          for (const pattern of monitoringPatterns) {
            if (content.toLowerCase().includes(pattern)) {
              return true;
            }
          }
        } catch (error) {
          // Skip files we can't read
        }
      }
    } catch (error) {
      // Ignore glob errors
    }

    return false;
  }

  private async hasRollbackInCICD(): Promise<boolean> {
    const cicdFiles = [
      '.github/workflows',
      '.gitlab-ci.yml',
      'Jenkinsfile',
      '.circleci/config.yml'
    ];

    for (const cicdPath of cicdFiles) {
      const fullPath = path.join(this.repoPath, cicdPath);
      
      if (await fs.pathExists(fullPath)) {
        try {
          const stat = await fs.stat(fullPath);
          
          if (stat.isDirectory()) {
            const files = await fs.readdir(fullPath);
            for (const file of files) {
              if (file.endsWith('.yml') || file.endsWith('.yaml')) {
                const content = await fs.readFile(path.join(fullPath, file), 'utf-8');
                if (content.match(/rollback|revert|canary|blue.?green/i)) {
                  return true;
                }
              }
            }
          } else {
            const content = await fs.readFile(fullPath, 'utf-8');
            if (content.match(/rollback|revert|canary|blue.?green/i)) {
              return true;
            }
          }
        } catch (error) {
          // Skip files we can't read
        }
      }
    }

    return false;
  }

  private async hasRedundancy(): Promise<boolean> {
    // Check for load balancer configuration
    const redundancyIndicators = [
      'load-balancer',
      'nginx.conf',
      'haproxy',
      'docker-compose.yml',
      'kubernetes',
      'k8s'
    ];

    for (const indicator of redundancyIndicators) {
      if (await fs.pathExists(path.join(this.repoPath, indicator))) {
        return true;
      }
    }

    // Check Docker Compose for multiple instances
    const dockerComposePath = path.join(this.repoPath, 'docker-compose.yml');
    if (await fs.pathExists(dockerComposePath)) {
      const content = await fs.readFile(dockerComposePath, 'utf-8');
      if (content.includes('replicas:') || content.includes('scale:')) {
        return true;
      }
    }

    return false;
  }

  private async hasDatabaseDependencies(): Promise<boolean> {
    const dbIndicators = [
      'database',
      'postgres',
      'mysql',
      'mongodb',
      'redis',
      'elasticsearch'
    ];

    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      for (const dep of Object.keys(allDeps)) {
        if (dbIndicators.some(indicator => dep.includes(indicator))) {
          return true;
        }
      }
    }

    return false;
  }

  private async getExternalDependencies(): Promise<string[]> {
    const externalServices: string[] = [];
    
    // Common external service patterns
    const servicePatterns = [
      'aws',
      'azure',
      'gcp',
      'stripe',
      'paypal',
      'twilio',
      'sendgrid',
      'mailgun',
      'cloudinary',
      'auth0',
      'okta'
    ];

    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      for (const dep of Object.keys(allDeps)) {
        for (const pattern of servicePatterns) {
          if (dep.includes(pattern)) {
            externalServices.push(pattern.toUpperCase());
            break;
          }
        }
      }
    }

    return [...new Set(externalServices)]; // Remove duplicates
  }

  private async hasAuthSystems(): Promise<boolean> {
    const authPatterns = ['auth', 'passport', 'jwt', 'oauth', 'saml', 'ldap'];
    
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      return Object.keys(allDeps).some(dep => 
        authPatterns.some(pattern => dep.includes(pattern))
      );
    }

    return false;
  }

  private async hasDataPipelines(): Promise<boolean> {
    const pipelinePatterns = ['etl', 'pipeline', 'stream', 'kafka', 'rabbit', 'celery'];
    
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      return Object.keys(allDeps).some(dep => 
        pipelinePatterns.some(pattern => dep.includes(pattern))
      );
    }

    return false;
  }

  private async hasRealtimeSystems(): Promise<boolean> {
    const realtimePatterns = ['socket', 'websocket', 'sse', 'realtime', 'pusher'];
    
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      return Object.keys(allDeps).some(dep => 
        realtimePatterns.some(pattern => dep.includes(pattern))
      );
    }

    return false;
  }

  private async hasPaymentSystems(): Promise<boolean> {
    const paymentPatterns = ['stripe', 'paypal', 'payment', 'billing', 'checkout'];
    
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      return Object.keys(allDeps).some(dep => 
        paymentPatterns.some(pattern => dep.includes(pattern))
      );
    }

    return false;
  }

  private async hasUserFacingSystems(): Promise<boolean> {
    const uiPatterns = ['react', 'vue', 'angular', 'frontend', 'ui', 'web'];
    
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      return Object.keys(allDeps).some(dep => 
        uiPatterns.some(pattern => dep.includes(pattern))
      );
    }

    return false;
  }
}