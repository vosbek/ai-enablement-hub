import { GeneratedPrompt, SubPrompt, CodebaseAnalysis } from '../types';

export class SubPromptGenerator {
  private analysis: CodebaseAnalysis;

  constructor(analysis: CodebaseAnalysis) {
    this.analysis = analysis;
  }

  generateSubPrompts(prompt: GeneratedPrompt): SubPrompt[] {
    const subPrompts: SubPrompt[] = [];

    switch (prompt.complexity) {
      case 'advanced':
        subPrompts.push(...this.generateAdvancedSubPrompts(prompt));
        break;
      case 'intermediate':
        subPrompts.push(...this.generateIntermediateSubPrompts(prompt));
        break;
      case 'beginner':
        subPrompts.push(...this.generateBeginnerSubPrompts(prompt));
        break;
    }

    // Add phase-specific sub-prompts
    subPrompts.push(...this.generatePhaseSpecificSubPrompts(prompt));

    return subPrompts.map((subPrompt, index) => ({
      ...subPrompt,
      order: index + 1
    }));
  }

  private generateAdvancedSubPrompts(prompt: GeneratedPrompt): SubPrompt[] {
    const subPrompts: SubPrompt[] = [];

    // Advanced prompts get detailed breakdown
    subPrompts.push({
      id: `${prompt.id}-planning`,
      parentId: prompt.id,
      title: 'Planning & Architecture Review',
      description: 'Review existing architecture and plan the implementation approach',
      template: this.generatePlanningSubPrompt(prompt),
      order: 1,
      estimatedTime: '30-45 minutes',
      prerequisites: ['Understanding of current system architecture'],
      outputs: ['Implementation plan', 'Architecture decisions', 'Risk assessment']
    });

    subPrompts.push({
      id: `${prompt.id}-implementation`,
      parentId: prompt.id,
      title: 'Core Implementation',
      description: 'Implement the main functionality following the planned approach',
      template: this.generateImplementationSubPrompt(prompt),
      order: 2,
      estimatedTime: '60-90 minutes',
      prerequisites: ['Completed planning phase', 'Development environment setup'],
      outputs: ['Working implementation', 'Unit tests', 'Documentation']
    });

    subPrompts.push({
      id: `${prompt.id}-integration`,
      parentId: prompt.id,
      title: 'Integration & Testing',
      description: 'Integrate with existing systems and perform comprehensive testing',
      template: this.generateIntegrationSubPrompt(prompt),
      order: 3,
      estimatedTime: '45-60 minutes',
      prerequisites: ['Core implementation completed'],
      outputs: ['Integration tests', 'Performance validation', 'Error handling']
    });

    subPrompts.push({
      id: `${prompt.id}-review`,
      parentId: prompt.id,
      title: 'Code Review & Optimization',
      description: 'Review implementation for quality, security, and performance',
      template: this.generateReviewSubPrompt(prompt),
      order: 4,
      estimatedTime: '30-45 minutes',
      prerequisites: ['Implementation and testing completed'],
      outputs: ['Code review feedback', 'Performance optimizations', 'Security validation']
    });

    return subPrompts;
  }

  private generateIntermediateSubPrompts(prompt: GeneratedPrompt): SubPrompt[] {
    const subPrompts: SubPrompt[] = [];

    subPrompts.push({
      id: `${prompt.id}-setup`,
      parentId: prompt.id,
      title: 'Setup & Preparation',
      description: 'Prepare the development environment and gather requirements',
      template: this.generateSetupSubPrompt(prompt),
      order: 1,
      estimatedTime: '15-30 minutes',
      prerequisites: ['Access to codebase'],
      outputs: ['Environment setup', 'Requirements clarification']
    });

    subPrompts.push({
      id: `${prompt.id}-implementation`,
      parentId: prompt.id,
      title: 'Implementation',
      description: 'Implement the required functionality',
      template: this.generateImplementationSubPrompt(prompt),
      order: 2,
      estimatedTime: '45-75 minutes',
      prerequisites: ['Setup completed'],
      outputs: ['Working code', 'Basic tests']
    });

    subPrompts.push({
      id: `${prompt.id}-validation`,
      parentId: prompt.id,
      title: 'Validation & Testing',
      description: 'Test the implementation and validate it meets requirements',
      template: this.generateValidationSubPrompt(prompt),
      order: 3,
      estimatedTime: '20-30 minutes',
      prerequisites: ['Implementation completed'],
      outputs: ['Test results', 'Validation report']
    });

    return subPrompts;
  }

  private generateBeginnerSubPrompts(prompt: GeneratedPrompt): SubPrompt[] {
    const subPrompts: SubPrompt[] = [];

    subPrompts.push({
      id: `${prompt.id}-understand`,
      parentId: prompt.id,
      title: 'Understanding the Task',
      description: 'Break down the requirements and understand what needs to be done',
      template: this.generateUnderstandingSubPrompt(prompt),
      order: 1,
      estimatedTime: '10-15 minutes',
      prerequisites: ['Basic understanding of the project'],
      outputs: ['Clear task breakdown', 'Questions clarified']
    });

    subPrompts.push({
      id: `${prompt.id}-research`,
      parentId: prompt.id,
      title: 'Research & Examples',
      description: 'Look at existing examples and understand the patterns used',
      template: this.generateResearchSubPrompt(prompt),
      order: 2,
      estimatedTime: '15-20 minutes',
      prerequisites: ['Task understanding'],
      outputs: ['Example analysis', 'Pattern identification']
    });

    subPrompts.push({
      id: `${prompt.id}-implement`,
      parentId: prompt.id,
      title: 'Step-by-Step Implementation',
      description: 'Implement the solution following the identified patterns',
      template: this.generateStepByStepSubPrompt(prompt),
      order: 3,
      estimatedTime: '30-45 minutes',
      prerequisites: ['Research completed'],
      outputs: ['Working implementation']
    });

    return subPrompts;
  }

  private generatePhaseSpecificSubPrompts(prompt: GeneratedPrompt): SubPrompt[] {
    const subPrompts: SubPrompt[] = [];

    switch (prompt.phase) {
      case 'workflow':
        subPrompts.push(...this.generateWorkflowSubPrompts(prompt));
        break;
      case 'incident-response':
        subPrompts.push(...this.generateIncidentResponseSubPrompts(prompt));
        break;
      case 'business':
        subPrompts.push(...this.generateBusinessSubPrompts(prompt));
        break;
      case 'governance':
        subPrompts.push(...this.generateGovernanceSubPrompts(prompt));
        break;
      case 'analysis':
        subPrompts.push(...this.generateAnalysisSubPrompts(prompt));
        break;
    }

    return subPrompts;
  }

  private generateWorkflowSubPrompts(prompt: GeneratedPrompt): SubPrompt[] {
    return [
      {
        id: `${prompt.id}-audit`,
        parentId: prompt.id,
        title: 'Current Workflow Audit',
        description: 'Analyze existing workflow processes and identify bottlenecks',
        template: `Audit the current workflow setup in our project:

Current CI/CD Setup: ${this.analysis.workflow?.cicd.platforms.join(', ') || 'Not detected'}
Automation Level: ${this.getAutomationLevel()}

Please analyze:
1. Current workflow efficiency
2. Bottlenecks and pain points
3. Security gaps in the workflow
4. Opportunities for automation
5. Best practices not currently implemented`,
        order: 1,
        estimatedTime: '30 minutes',
        prerequisites: ['Access to CI/CD configurations'],
        outputs: ['Workflow assessment report', 'Improvement recommendations']
      },
      {
        id: `${prompt.id}-optimization`,
        parentId: prompt.id,
        title: 'Workflow Optimization',
        description: 'Implement improvements to the workflow based on audit findings',
        template: `Optimize our workflow based on the audit findings:

Focus Areas: [YOUR PRIORITY AREAS FROM AUDIT]

Our Current Workflow: ${this.getWorkflowSummary()}

Please implement:
1. Workflow optimizations for identified bottlenecks
2. Additional automation where beneficial
3. Security improvements in the pipeline
4. Performance enhancements
5. Monitoring and alerting improvements`,
        order: 2,
        estimatedTime: '60-90 minutes',
        prerequisites: ['Workflow audit completed'],
        outputs: ['Optimized workflow configuration', 'Implementation guide']
      }
    ];
  }

  private generateIncidentResponseSubPrompts(prompt: GeneratedPrompt): SubPrompt[] {
    return [
      {
        id: `${prompt.id}-preparation`,
        parentId: prompt.id,
        title: 'Incident Response Preparation',
        description: 'Set up incident response procedures and documentation',
        template: `Prepare incident response procedures for our application:

System Type: ${this.analysis.structure.projectType}
Critical Components: ${this.analysis.incident?.riskAreas?.join(', ') || 'To be identified'}

Create:
1. Incident classification system (P0-P3)
2. Response team contact information
3. Escalation procedures
4. Communication templates
5. Initial response checklist`,
        order: 1,
        estimatedTime: '45 minutes',
        prerequisites: ['Understanding of system architecture'],
        outputs: ['Incident response playbook', 'Contact procedures', 'Templates']
      },
      {
        id: `${prompt.id}-runbooks`,
        parentId: prompt.id,
        title: 'Create Operational Runbooks',
        description: 'Develop specific runbooks for common incident scenarios',
        template: `Create operational runbooks for common incident scenarios:

Common Issues in ${this.analysis.structure.projectType} applications:
- Database connectivity issues
- High memory/CPU usage
- API endpoint failures
- Authentication service disruptions

For each scenario, create:
1. Problem identification steps
2. Immediate response actions
3. Diagnostic procedures
4. Resolution steps
5. Post-incident tasks`,
        order: 2,
        estimatedTime: '90 minutes',
        prerequisites: ['Incident response procedures defined'],
        outputs: ['Scenario-specific runbooks', 'Diagnostic scripts', 'Recovery procedures']
      }
    ];
  }

  private generateBusinessSubPrompts(prompt: GeneratedPrompt): SubPrompt[] {
    return [
      {
        id: `${prompt.id}-opportunity-analysis`,
        parentId: prompt.id,
        title: 'Business Opportunity Analysis',
        description: 'Analyze and prioritize business opportunities',
        template: `Analyze business opportunities for our ${this.analysis.business?.domain.businessModel || 'application'}:

Current Focus: ${this.analysis.business?.domain.target || 'General users'}
Identified Opportunities: ${this.analysis.business?.opportunities.features?.join(', ') || 'To be identified'}

Analyze:
1. Market size and potential for each opportunity
2. Technical feasibility and effort required
3. Competitive landscape and differentiation
4. Revenue potential and business impact
5. Resource requirements and timeline`,
        order: 1,
        estimatedTime: '60 minutes',
        prerequisites: ['Business context understanding'],
        outputs: ['Opportunity assessment matrix', 'Prioritization framework']
      },
      {
        id: `${prompt.id}-strategy`,
        parentId: prompt.id,
        title: 'Business Strategy Development',
        description: 'Develop actionable business strategy based on analysis',
        template: `Develop business strategy based on opportunity analysis:

Top Opportunities: [FROM PREVIOUS ANALYSIS]
Key Constraints: ${this.analysis.business?.risks?.join(', ') || 'To be identified'}

Create:
1. 6-month roadmap with prioritized features
2. Go-to-market strategy for new opportunities
3. Resource allocation plan
4. Success metrics and KPIs
5. Risk mitigation strategies`,
        order: 2,
        estimatedTime: '75 minutes',
        prerequisites: ['Opportunity analysis completed'],
        outputs: ['Business roadmap', 'GTM strategy', 'Success metrics']
      }
    ];
  }

  private generateGovernanceSubPrompts(prompt: GeneratedPrompt): SubPrompt[] {
    return [
      {
        id: `${prompt.id}-compliance-audit`,
        parentId: prompt.id,
        title: 'Compliance Gap Analysis',
        description: 'Identify compliance gaps and requirements',
        template: `Perform compliance gap analysis for our application:

Current Standards: ${this.analysis.governance?.compliance.standards?.join(', ') || 'None identified'}
Industry Requirements: [SPECIFY YOUR INDUSTRY REQUIREMENTS]

Analyze:
1. Required compliance standards for our industry
2. Current compliance status and gaps
3. Legal and regulatory requirements
4. Data protection and privacy obligations
5. Implementation priorities and timeline`,
        order: 1,
        estimatedTime: '45 minutes',
        prerequisites: ['Understanding of business domain'],
        outputs: ['Compliance gap report', 'Requirement matrix']
      },
      {
        id: `${prompt.id}-implementation`,
        parentId: prompt.id,
        title: 'Compliance Implementation Plan',
        description: 'Create detailed plan to address compliance gaps',
        template: `Create compliance implementation plan:

Priority Gaps: [FROM GAP ANALYSIS]
Existing Policies: ${Object.entries(this.analysis.governance?.policies || {}).filter(([_, exists]) => exists).map(([policy]) => policy).join(', ') || 'None'}

Develop:
1. Policy development roadmap
2. Technical implementation requirements
3. Training and documentation needs
4. Monitoring and audit procedures
5. Timeline and resource allocation`,
        order: 2,
        estimatedTime: '90 minutes',
        prerequisites: ['Gap analysis completed'],
        outputs: ['Implementation roadmap', 'Policy templates', 'Technical requirements']
      }
    ];
  }

  private generateAnalysisSubPrompts(prompt: GeneratedPrompt): SubPrompt[] {
    return [
      {
        id: `${prompt.id}-data-collection`,
        parentId: prompt.id,
        title: 'Data Collection & Metrics',
        description: 'Gather and organize data for analysis',
        template: `Collect and organize data for analysis:

Analysis Focus: [YOUR ANALYSIS OBJECTIVE]
Available Data Sources: ${this.getAvailableDataSources()}

Collect:
1. Quantitative metrics from monitoring/analytics
2. Qualitative feedback from users/stakeholders
3. Performance and usage statistics
4. Error logs and incident data
5. Business metrics and KPIs`,
        order: 1,
        estimatedTime: '30 minutes',
        prerequisites: ['Access to monitoring and analytics tools'],
        outputs: ['Data collection report', 'Metrics baseline']
      },
      {
        id: `${prompt.id}-insights`,
        parentId: prompt.id,
        title: 'Analysis & Insights Generation',
        description: 'Analyze collected data and generate actionable insights',
        template: `Analyze collected data and generate insights:

Data Set: [FROM COLLECTION PHASE]
Analysis Method: [SPECIFY YOUR APPROACH]

Perform:
1. Trend analysis and pattern identification
2. Root cause analysis for issues
3. Performance benchmarking
4. User behavior analysis
5. Business impact assessment

Generate:
1. Key findings and insights
2. Actionable recommendations
3. Priority matrix for improvements
4. Success metrics for tracking`,
        order: 2,
        estimatedTime: '60 minutes',
        prerequisites: ['Data collection completed'],
        outputs: ['Analysis report', 'Recommendations', 'Action plan']
      }
    ];
  }

  // Helper methods for template generation
  private generatePlanningSubPrompt(prompt: GeneratedPrompt): string {
    return `Planning phase for: ${prompt.title}

Current System Context:
${this.getSystemContext()}

Planning Focus: [YOUR SPECIFIC REQUIREMENTS]

Please plan:
1. Detailed implementation approach
2. Architecture decisions and rationale
3. Risk assessment and mitigation strategies
4. Resource requirements and timeline
5. Success criteria and validation methods`;
  }

  private generateImplementationSubPrompt(prompt: GeneratedPrompt): string {
    return `Implementation phase for: ${prompt.title}

Following the planned approach, implement:

Requirements: [FROM PLANNING PHASE]
Architecture: ${this.analysis.structure.architecture}
Patterns to Follow: ${this.analysis.patterns.map(p => p.name).slice(0, 3).join(', ')}

Implement:
1. Core functionality following our patterns
2. Error handling and edge cases
3. Unit tests for critical paths
4. Documentation for new code
5. Integration with existing systems`;
  }

  private generateIntegrationSubPrompt(prompt: GeneratedPrompt): string {
    return `Integration and testing phase for: ${prompt.title}

Integration Requirements: [SPECIFY YOUR INTEGRATION NEEDS]

Test and integrate:
1. Integration with existing APIs/services
2. End-to-end testing scenarios
3. Performance testing and optimization
4. Error handling and fallback mechanisms
5. Monitoring and observability`;
  }

  private generateReviewSubPrompt(prompt: GeneratedPrompt): string {
    return `Code review and optimization for: ${prompt.title}

Review Focus: [SPECIFY REVIEW PRIORITIES]

Review for:
1. Code quality and maintainability
2. Security vulnerabilities and best practices
3. Performance optimizations
4. Accessibility compliance
5. Documentation completeness`;
  }

  private generateSetupSubPrompt(prompt: GeneratedPrompt): string {
    return `Setup and preparation for: ${prompt.title}

Setup Requirements: [YOUR SPECIFIC SETUP NEEDS]

Prepare:
1. Development environment
2. Required dependencies and tools
3. Configuration files
4. Test data and fixtures
5. Documentation review`;
  }

  private generateValidationSubPrompt(prompt: GeneratedPrompt): string {
    return `Validation and testing for: ${prompt.title}

Validation Criteria: [YOUR ACCEPTANCE CRITERIA]

Validate:
1. Functional requirements met
2. Non-functional requirements (performance, security)
3. Integration points working correctly
4. Error scenarios handled properly
5. User experience and accessibility`;
  }

  private generateUnderstandingSubPrompt(prompt: GeneratedPrompt): string {
    return `Understanding the task: ${prompt.title}

Task Context: ${prompt.description}

Break down and understand:
1. What exactly needs to be accomplished
2. Why this task is important
3. How it fits into the larger system
4. What resources and tools are needed
5. What success looks like`;
  }

  private generateResearchSubPrompt(prompt: GeneratedPrompt): string {
    return `Research and examples for: ${prompt.title}

Research Focus: [YOUR LEARNING OBJECTIVES]

Research:
1. Similar implementations in our codebase
2. Best practices for this type of task
3. Common patterns and approaches
4. Potential pitfalls and how to avoid them
5. Tools and libraries that can help`;
  }

  private generateStepByStepSubPrompt(prompt: GeneratedPrompt): string {
    return `Step-by-step implementation: ${prompt.title}

Implementation Plan: [FROM RESEARCH PHASE]

Implement step by step:
1. Start with the simplest version that works
2. Add complexity gradually
3. Test each step before moving forward
4. Follow the patterns you researched
5. Ask for help when needed`;
  }

  // Helper methods
  private getAutomationLevel(): string {
    const automation = this.analysis.workflow?.automation;
    if (!automation) return 'Unknown';
    
    const automatedCount = Object.values(automation).filter(Boolean).length;
    const totalAreas = Object.keys(automation).length;
    const percentage = (automatedCount / totalAreas) * 100;
    
    if (percentage >= 80) return 'High';
    if (percentage >= 50) return 'Medium';
    return 'Low';
  }

  private getWorkflowSummary(): string {
    const workflow = this.analysis.workflow;
    if (!workflow) return 'No workflow analysis available';
    
    return `CI/CD: ${workflow.cicd.platforms.join(', ') || 'None'}, Automation: ${this.getAutomationLevel()}`;
  }

  private getAvailableDataSources(): string {
    const sources = [];
    
    if (this.analysis.workflow?.cicd.hasCI) sources.push('CI/CD metrics');
    if (this.analysis.quality) sources.push('Code quality metrics');
    if (this.analysis.dependencies) sources.push('Dependency analysis');
    
    return sources.join(', ') || 'Application logs and monitoring';
  }

  private getSystemContext(): string {
    return `
Project: ${this.analysis.repoName}
Type: ${this.analysis.structure.projectType}
Architecture: ${this.analysis.structure.architecture}
Technologies: ${this.analysis.technologies.languages.map(l => l.name).join(', ')}
Quality Score: ${Math.round(this.analysis.quality.maintainabilityIndex)}/100`;
  }
}