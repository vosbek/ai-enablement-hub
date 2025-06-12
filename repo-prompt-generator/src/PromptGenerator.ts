import { CodebaseAnalysis, GeneratedPrompt, PromptLibrary, SDLCPhase } from './types';

export class PromptGenerator {
  private analysis: CodebaseAnalysis;

  constructor(analysis: CodebaseAnalysis) {
    this.analysis = analysis;
  }

  generatePromptLibrary(): PromptLibrary {
    const prompts = this.generateAllPrompts();
    
    // Organize prompts by category
    const categories = this.categorizePrompts(prompts);

    return {
      metadata: {
        repoName: this.analysis.repoName,
        generatedAt: new Date(),
        version: '1.0.0',
        totalPrompts: prompts.length,
        analysisId: `${this.analysis.repoName}-${Date.now()}`
      },
      analysis: this.analysis,
      prompts,
      categories,
      instructions: this.generateInstructions()
    };
  }

  private generateAllPrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // Generate prompts for each SDLC phase
    prompts.push(...this.generatePlanningPrompts());
    prompts.push(...this.generateDesignPrompts());
    prompts.push(...this.generateImplementationPrompts());
    prompts.push(...this.generateTestingPrompts());
    prompts.push(...this.generateReviewPrompts());
    prompts.push(...this.generateDeploymentPrompts());
    prompts.push(...this.generateMaintenancePrompts());
    prompts.push(...this.generateDocumentationPrompts());

    // Generate enterprise workflow prompts
    prompts.push(...this.generateWorkflowPrompts());
    prompts.push(...this.generateIncidentResponsePrompts());
    prompts.push(...this.generateAnalysisPrompts());
    prompts.push(...this.generateGovernancePrompts());
    prompts.push(...this.generateBusinessPrompts());

    return prompts;
  }

  private generatePlanningPrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];
    const { projectType, architecture } = this.analysis.structure;
    const mainTech = this.getMainTechnologies();

    // Feature Planning Prompt
    prompts.push({
      id: 'planning-feature-analysis',
      title: `Feature Planning for ${this.analysis.repoName}`,
      category: 'planning',
      subcategory: 'feature-planning',
      description: 'Analyze and plan new features based on existing codebase patterns',
      template: this.generateFeaturePlanningTemplate(),
      context: {
        realExamples: this.getBestExamples(['component', 'api', 'function']),
        patterns: this.getPatternNames(),
        technologies: mainTech,
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Starting any new feature development or major enhancement',
        triggers: ['New feature request', 'Epic planning', 'Sprint planning'],
        relatedPrompts: ['design-architecture', 'implementation-component'],
        expectedOutcome: 'Detailed technical breakdown with implementation approach'
      },
      phase: 'planning',
      complexity: 'intermediate',
      estimatedTimeToComplete: '30-60 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/*.{js,ts,jsx,tsx}', '**/components/**', '**/pages/**']
    });

    // Requirements Analysis Prompt
    prompts.push({
      id: 'planning-requirements-analysis',
      title: 'Requirements Analysis & Impact Assessment',
      category: 'planning',
      subcategory: 'requirements',
      description: 'Analyze requirements and assess impact on existing codebase',
      template: this.generateRequirementsAnalysisTemplate(),
      context: {
        realExamples: this.getBestExamples(['api', 'model']),
        patterns: this.getPatternNames(),
        technologies: mainTech,
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Analyzing new requirements or changes to existing features',
        triggers: ['Business requirements change', 'New user story', 'API changes'],
        relatedPrompts: ['planning-feature-analysis', 'testing-strategy'],
        expectedOutcome: 'Requirements breakdown with technical implications'
      },
      phase: 'planning',
      complexity: 'advanced',
      estimatedTimeToComplete: '45-90 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/*']
    });

    return prompts;
  }

  private generateDesignPrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];
    
    // Architecture Design Prompt
    prompts.push({
      id: 'design-architecture',
      title: 'Architecture Design Following Our Patterns',
      category: 'design',
      subcategory: 'architecture',
      description: 'Design system architecture following established patterns',
      template: this.generateArchitectureDesignTemplate(),
      context: {
        realExamples: this.getBestExamples(['component', 'api', 'config']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Designing new features or refactoring existing architecture',
        triggers: ['Complex feature design', 'Architecture review', 'Refactoring planning'],
        relatedPrompts: ['planning-feature-analysis', 'implementation-component'],
        expectedOutcome: 'Detailed architecture design with component relationships'
      },
      phase: 'design',
      complexity: 'advanced',
      estimatedTimeToComplete: '60-120 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/*.{js,ts,jsx,tsx}']
    });

    // Database Design Prompt (if applicable)
    if (this.hasDatabase()) {
      prompts.push({
        id: 'design-database-schema',
        title: 'Database Schema Design',
        category: 'design',
        subcategory: 'database',
        description: 'Design database schema following existing patterns',
        template: this.generateDatabaseDesignTemplate(),
        context: {
          realExamples: this.getBestExamples(['model']),
          patterns: this.getPatternNames().filter(p => p.includes('model') || p.includes('database')),
          technologies: this.getDatabaseTechnologies(),
          fileStructure: this.getFileStructureOverview(),
          conventions: this.getCodeConventions()
        },
        usage: {
          when: 'Adding new data models or modifying existing schema',
          triggers: ['New data requirements', 'Schema migration', 'Data model changes'],
          relatedPrompts: ['design-architecture', 'implementation-model'],
          expectedOutcome: 'Database schema with migration strategy'
        },
        phase: 'design',
        complexity: 'intermediate',
        estimatedTimeToComplete: '30-60 minutes',
        generatedAt: new Date(),
        applicableToFiles: ['**/models/**', '**/schemas/**', '**/*.prisma']
      });
    }

    return prompts;
  }

  private generateImplementationPrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // Component Implementation
    if (this.isFrontendProject()) {
      prompts.push({
        id: 'implementation-component',
        title: `Implement ${this.getFrameworkName()} Component Following Our Patterns`,
        category: 'implementation',
        subcategory: 'frontend',
        description: 'Create components following established patterns and conventions',
        template: this.generateComponentImplementationTemplate(),
        context: {
          realExamples: this.getBestExamples(['component']),
          patterns: this.getPatternNames().filter(p => p.includes('component') || p.includes('hook')),
          technologies: this.getFrontendTechnologies(),
          fileStructure: this.getFileStructureOverview(),
          conventions: this.getCodeConventions()
        },
        usage: {
          when: 'Creating new UI components or updating existing ones',
          triggers: ['New UI requirement', 'Component refactoring', 'Design system update'],
          relatedPrompts: ['design-architecture', 'testing-component'],
          expectedOutcome: 'Complete component implementation with proper typing and patterns'
        },
        phase: 'implementation',
        complexity: 'intermediate',
        estimatedTimeToComplete: '30-90 minutes',
        generatedAt: new Date(),
        applicableToFiles: ['**/components/**', '**/pages/**', '**/*.{jsx,tsx,vue}']
      });
    }

    // API Implementation
    if (this.isBackendProject() || this.isFullstackProject()) {
      prompts.push({
        id: 'implementation-api-endpoint',
        title: 'Implement API Endpoint Following Our Patterns',
        category: 'implementation',
        subcategory: 'backend',
        description: 'Create API endpoints following established patterns',
        template: this.generateAPIImplementationTemplate(),
        context: {
          realExamples: this.getBestExamples(['api']),
          patterns: this.getPatternNames().filter(p => p.includes('api') || p.includes('middleware')),
          technologies: this.getBackendTechnologies(),
          fileStructure: this.getFileStructureOverview(),
          conventions: this.getCodeConventions()
        },
        usage: {
          when: 'Creating new API endpoints or modifying existing ones',
          triggers: ['New API requirement', 'Endpoint refactoring', 'Integration needs'],
          relatedPrompts: ['design-architecture', 'testing-api'],
          expectedOutcome: 'Complete API endpoint with validation, error handling, and documentation'
        },
        phase: 'implementation',
        complexity: 'intermediate',
        estimatedTimeToComplete: '45-90 minutes',
        generatedAt: new Date(),
        applicableToFiles: ['**/api/**', '**/routes/**', '**/controllers/**']
      });
    }

    // Business Logic Implementation
    prompts.push({
      id: 'implementation-business-logic',
      title: 'Implement Business Logic Following Our Patterns',
      category: 'implementation',
      subcategory: 'logic',
      description: 'Implement business logic functions following established patterns',
      template: this.generateBusinessLogicTemplate(),
      context: {
        realExamples: this.getBestExamples(['function', 'util']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Implementing core business functionality or utility functions',
        triggers: ['New business rule', 'Logic refactoring', 'Utility function needed'],
        relatedPrompts: ['design-architecture', 'testing-unit'],
        expectedOutcome: 'Well-structured business logic with proper error handling'
      },
      phase: 'implementation',
      complexity: 'intermediate',
      estimatedTimeToComplete: '30-60 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/services/**', '**/utils/**', '**/lib/**']
    });

    return prompts;
  }

  private generateTestingPrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // Unit Testing
    prompts.push({
      id: 'testing-unit-tests',
      title: 'Write Unit Tests Following Our Patterns',
      category: 'testing',
      subcategory: 'unit',
      description: 'Create comprehensive unit tests following established testing patterns',
      template: this.generateUnitTestingTemplate(),
      context: {
        realExamples: this.getBestExamples(['test']),
        patterns: this.getPatternNames().filter(p => p.includes('test')),
        technologies: this.getTestingTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Writing tests for new functionality or existing code',
        triggers: ['New feature implementation', 'Bug fix', 'Code review requirement'],
        relatedPrompts: ['implementation-component', 'testing-integration'],
        expectedOutcome: 'Comprehensive test suite with good coverage and clear test cases'
      },
      phase: 'testing',
      complexity: 'intermediate',
      estimatedTimeToComplete: '30-60 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}', '**/__tests__/**']
    });

    // Integration Testing
    if (this.isBackendProject() || this.isFullstackProject()) {
      prompts.push({
        id: 'testing-integration-tests',
        title: 'Write Integration Tests for API Endpoints',
        category: 'testing',
        subcategory: 'integration',
        description: 'Create integration tests for API endpoints and database interactions',
        template: this.generateIntegrationTestingTemplate(),
        context: {
          realExamples: this.getBestExamples(['api', 'test']),
          patterns: this.getPatternNames().filter(p => p.includes('test') || p.includes('api')),
          technologies: this.getTestingTechnologies(),
          fileStructure: this.getFileStructureOverview(),
          conventions: this.getCodeConventions()
        },
        usage: {
          when: 'Testing API endpoints and database interactions',
          triggers: ['New API endpoints', 'Database changes', 'Integration issues'],
          relatedPrompts: ['implementation-api-endpoint', 'testing-unit-tests'],
          expectedOutcome: 'Complete integration test suite covering API behavior and data flow'
        },
        phase: 'testing',
        complexity: 'advanced',
        estimatedTimeToComplete: '60-120 minutes',
        generatedAt: new Date(),
        applicableToFiles: ['**/tests/**', '**/integration/**', '**/*.integration.{js,ts}']
      });
    }

    return prompts;
  }

  private generateReviewPrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // Code Review
    prompts.push({
      id: 'review-code-quality',
      title: 'Code Review Following Our Standards',
      category: 'review',
      subcategory: 'quality',
      description: 'Perform comprehensive code review based on project standards',
      template: this.generateCodeReviewTemplate(),
      context: {
        realExamples: this.getBestExamples(['component', 'function', 'api']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Reviewing code before merging or during development',
        triggers: ['Pull request review', 'Code quality assessment', 'Refactoring evaluation'],
        relatedPrompts: ['review-security', 'review-performance'],
        expectedOutcome: 'Detailed code review with specific recommendations and improvements'
      },
      phase: 'review',
      complexity: 'advanced',
      estimatedTimeToComplete: '30-90 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/*.{js,ts,jsx,tsx}']
    });

    // Security Review
    prompts.push({
      id: 'review-security',
      title: 'Security Review & Vulnerability Assessment',
      category: 'review',
      subcategory: 'security',
      description: 'Review code for security vulnerabilities and best practices',
      template: this.generateSecurityReviewTemplate(),
      context: {
        realExamples: this.getBestExamples(['api', 'function']),
        patterns: this.getPatternNames().filter(p => p.includes('auth') || p.includes('security')),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Reviewing code for security issues or before production deployment',
        triggers: ['Security audit', 'Production deployment', 'Sensitive data handling'],
        relatedPrompts: ['review-code-quality', 'deployment-checklist'],
        expectedOutcome: 'Security assessment with vulnerability identification and remediation steps'
      },
      phase: 'review',
      complexity: 'advanced',
      estimatedTimeToComplete: '45-90 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/api/**', '**/auth/**', '**/middleware/**']
    });

    return prompts;
  }

  private generateDeploymentPrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // Deployment Preparation
    prompts.push({
      id: 'deployment-preparation',
      title: 'Deployment Preparation & Checklist',
      category: 'deployment',
      subcategory: 'preparation',
      description: 'Prepare application for deployment following best practices',
      template: this.generateDeploymentPreparationTemplate(),
      context: {
        realExamples: this.getBestExamples(['config']),
        patterns: this.getPatternNames(),
        technologies: this.getDeploymentTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Preparing for production deployment or environment setup',
        triggers: ['Production release', 'Environment setup', 'CI/CD configuration'],
        relatedPrompts: ['review-security', 'deployment-monitoring'],
        expectedOutcome: 'Complete deployment checklist with configuration and monitoring setup'
      },
      phase: 'deployment',
      complexity: 'advanced',
      estimatedTimeToComplete: '60-120 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/config/**', 'Dockerfile', 'docker-compose.yml', '.github/**']
    });

    return prompts;
  }

  private generateMaintenancePrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // Performance Optimization
    prompts.push({
      id: 'maintenance-performance',
      title: 'Performance Optimization Analysis',
      category: 'maintenance',
      subcategory: 'performance',
      description: 'Analyze and optimize application performance',
      template: this.generatePerformanceOptimizationTemplate(),
      context: {
        realExamples: this.getBestExamples(['component', 'api', 'function']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Investigating performance issues or optimizing application',
        triggers: ['Performance problems', 'Optimization requirements', 'Scalability concerns'],
        relatedPrompts: ['review-code-quality', 'maintenance-refactoring'],
        expectedOutcome: 'Performance analysis with specific optimization recommendations'
      },
      phase: 'maintenance',
      complexity: 'advanced',
      estimatedTimeToComplete: '60-120 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/*.{js,ts,jsx,tsx}']
    });

    // Refactoring
    prompts.push({
      id: 'maintenance-refactoring',
      title: 'Code Refactoring Following Our Patterns',
      category: 'maintenance',
      subcategory: 'refactoring',
      description: 'Refactor code to improve structure and maintainability',
      template: this.generateRefactoringTemplate(),
      context: {
        realExamples: this.getBestExamples(['component', 'function']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Improving code structure, reducing technical debt, or enhancing maintainability',
        triggers: ['Technical debt reduction', 'Code smell elimination', 'Architecture improvement'],
        relatedPrompts: ['review-code-quality', 'testing-unit-tests'],
        expectedOutcome: 'Refactored code with improved structure and maintainability'
      },
      phase: 'maintenance',
      complexity: 'intermediate',
      estimatedTimeToComplete: '45-90 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/*.{js,ts,jsx,tsx}']
    });

    return prompts;
  }

  private generateDocumentationPrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // API Documentation
    if (this.isBackendProject() || this.isFullstackProject()) {
      prompts.push({
        id: 'documentation-api',
        title: 'Generate API Documentation',
        category: 'documentation',
        subcategory: 'api',
        description: 'Create comprehensive API documentation following OpenAPI standards',
        template: this.generateAPIDocumentationTemplate(),
        context: {
          realExamples: this.getBestExamples(['api']),
          patterns: this.getPatternNames().filter(p => p.includes('api')),
          technologies: this.getBackendTechnologies(),
          fileStructure: this.getFileStructureOverview(),
          conventions: this.getCodeConventions()
        },
        usage: {
          when: 'Creating or updating API documentation',
          triggers: ['New API endpoints', 'Documentation update', 'API versioning'],
          relatedPrompts: ['implementation-api-endpoint', 'documentation-code'],
          expectedOutcome: 'Complete API documentation with examples and schemas'
        },
        phase: 'documentation',
        complexity: 'intermediate',
        estimatedTimeToComplete: '30-60 minutes',
        generatedAt: new Date(),
        applicableToFiles: ['**/api/**', '**/routes/**', '**/docs/**']
      });
    }

    // Code Documentation
    prompts.push({
      id: 'documentation-code',
      title: 'Generate Code Documentation',
      category: 'documentation',
      subcategory: 'code',
      description: 'Create comprehensive code documentation and comments',
      template: this.generateCodeDocumentationTemplate(),
      context: {
        realExamples: this.getBestExamples(['component', 'function']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Adding documentation to existing code or new implementations',
        triggers: ['Documentation requirement', 'Code review feedback', 'Team onboarding'],
        relatedPrompts: ['documentation-api', 'maintenance-refactoring'],
        expectedOutcome: 'Well-documented code with clear comments and examples'
      },
      phase: 'documentation',
      complexity: 'beginner',
      estimatedTimeToComplete: '15-30 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/*.{js,ts,jsx,tsx}']
    });

    return prompts;
  }

  // Template generation methods...
  private generateFeaturePlanningTemplate(): string {
    const techStack = this.getMainTechnologies().slice(0, 5).join(', ');
    const architecture = this.analysis.structure.architecture;
    const examples = this.getBestExamples(['component', 'api']).slice(0, 2);
    
    return `Plan a new feature for our ${this.analysis.structure.projectType} application:

Feature Requirements: [DESCRIBE YOUR FEATURE]

Our Current Architecture:
- Tech Stack: ${techStack}
- Architecture: ${architecture} pattern
- Project Type: ${this.analysis.structure.projectType}
${examples.length > 0 ? `- Example Component: ${examples[0]?.filePath}` : ''}
${examples.length > 1 ? `- Example API: ${examples[1]?.filePath}` : ''}

Our File Structure:
${this.getFileStructureOverview()}

Our Coding Patterns:
${this.getPatternNames().slice(0, 5).map(p => `- ${p}`).join('\n')}

Please provide:
1. **Technical breakdown** - How this fits our current ${architecture} architecture
2. **Component design** - What ${this.getFrameworkName()} components need to be created/modified
3. **API design** - New endpoints following our RESTful patterns
4. **Database changes** - Schema updates needed (if applicable)
5. **Implementation approach** - Step-by-step plan using our established patterns
6. **Testing strategy** - Unit and integration tests following our ${this.getTestingFramework()} patterns
7. **Potential risks** - Technical challenges and mitigation strategies`;
  }

  private generateRequirementsAnalysisTemplate(): string {
    return `Analyze these requirements for our ${this.analysis.repoName} project:

Requirements: [YOUR REQUIREMENTS HERE]

Current System Context:
- Project: ${this.analysis.structure.projectType} ${this.analysis.structure.architecture}
- Technologies: ${this.getMainTechnologies().slice(0, 3).join(', ')}
- Key Components: ${this.getImportantFiles().slice(0, 3).join(', ')}

Please analyze:
1. **Functional Requirements** - What the system must do
2. **Non-functional Requirements** - Performance, security, usability constraints
3. **Technical Requirements** - Technology and architecture implications
4. **Impact Analysis** - What existing code will be affected
5. **Dependencies** - External services or libraries needed
6. **Acceptance Criteria** - How to verify the requirements are met
7. **Implementation Complexity** - Effort estimation and risk assessment`;
  }

  private generateArchitectureDesignTemplate(): string {
    const currentPatterns = this.getPatternNames().slice(0, 5);
    
    return `Design architecture for this feature following our established patterns:

Feature Description: [YOUR FEATURE DESCRIPTION]

Our Current Architecture Patterns:
${currentPatterns.map(p => `- ${p}`).join('\n')}

Our Technology Constraints:
- Framework: ${this.getFrameworkName()}
- Architecture: ${this.analysis.structure.architecture}
- Database: ${this.getDatabaseTechnologies().join(', ') || 'Not detected'}

Please design:
1. **Component Architecture** - How components interact and data flows
2. **API Design** - Endpoints, request/response formats, error handling
3. **Data Models** - Database schema and relationships
4. **State Management** - How application state is managed
5. **Security Considerations** - Authentication, authorization, data protection
6. **Performance Considerations** - Caching, optimization, scalability
7. **Integration Points** - External services and dependencies`;
  }

  private generateComponentImplementationTemplate(): string {
    const framework = this.getFrameworkName();
    const componentExamples = this.getBestExamples(['component']).slice(0, 2);
    
    return `Implement a ${framework} component following our established patterns:

Component Requirements: [YOUR COMPONENT REQUIREMENTS]

Our ${framework} Patterns (from your codebase):
${componentExamples.map(ex => `- ${ex.title}: See ${ex.filePath}`).join('\n')}

Our Component Conventions:
- File naming: ${this.getComponentNamingPattern()}
- Styling approach: ${this.getStylingApproach()}
- State management: ${this.getStateManagementPattern()}
- Type definitions: ${this.getTypeDefinitionPattern()}

Please create:
1. **Component structure** - Following our ${framework} patterns
2. **Props interface** - TypeScript definitions with proper typing
3. **State management** - Using our established patterns
4. **Event handlers** - Following our naming conventions
5. **Styling** - Consistent with our design system
6. **Error boundaries** - Proper error handling
7. **Accessibility** - ARIA labels and keyboard navigation
8. **Unit tests** - Following our testing patterns`;
  }

  private generateAPIImplementationTemplate(): string {
    const apiExamples = this.getBestExamples(['api']).slice(0, 2);
    
    return `Implement an API endpoint following our established patterns:

Endpoint Requirements: [YOUR ENDPOINT REQUIREMENTS]

Our API Patterns (from your codebase):
${apiExamples.map(ex => `- ${ex.title}: See ${ex.filePath}`).join('\n')}

Our Backend Architecture:
- Framework: ${this.getBackendFramework()}
- Database: ${this.getDatabaseTechnologies().join(', ')}
- Authentication: ${this.getAuthPattern()}
- Validation: ${this.getValidationPattern()}

Please implement:
1. **Route definition** - Following our routing patterns
2. **Request validation** - Input sanitization and validation
3. **Business logic** - Core functionality implementation
4. **Database operations** - Following our ORM/query patterns
5. **Response formatting** - Consistent API response structure
6. **Error handling** - Proper HTTP status codes and error messages
7. **Authentication/Authorization** - Security middleware integration
8. **Documentation** - API documentation with examples
9. **Unit tests** - Endpoint testing following our patterns`;
  }

  private generateBusinessLogicTemplate(): string {
    const functionExamples = this.getBestExamples(['function', 'util']).slice(0, 2);
    
    return `Implement business logic following our established patterns:

Logic Requirements: [YOUR BUSINESS LOGIC REQUIREMENTS]

Our Function Patterns (from your codebase):
${functionExamples.map(ex => `- ${ex.title}: See ${ex.filePath}`).join('\n')}

Our Coding Standards:
- Language: ${this.getMainLanguage()}
- Async patterns: ${this.getAsyncPattern()}
- Error handling: ${this.getErrorHandlingPattern()}
- Type safety: ${this.getTypeSafetyPattern()}

Please implement:
1. **Function signature** - Clear parameters and return types
2. **Input validation** - Parameter validation and sanitization
3. **Business rules** - Core logic implementation
4. **Error handling** - Proper exception handling and logging
5. **Performance optimization** - Efficient algorithms and operations
6. **Documentation** - Clear JSDoc comments and examples
7. **Unit tests** - Comprehensive test coverage
8. **Integration** - How this fits with existing code`;
  }

  private generateUnitTestingTemplate(): string {
    const testExamples = this.getBestExamples(['test']).slice(0, 2);
    const testFramework = this.getTestingFramework();
    
    return `Write comprehensive unit tests following our testing patterns:

Code to Test: [YOUR CODE HERE]

Our Testing Patterns (from your codebase):
${testExamples.map(ex => `- ${ex.title}: See ${ex.filePath}`).join('\n')}

Our Testing Setup:
- Framework: ${testFramework}
- Test Structure: ${this.getTestStructurePattern()}
- Mocking: ${this.getMockingPattern()}
- Assertions: ${this.getAssertionPattern()}

Please create:
1. **Test structure** - Describe blocks and test organization
2. **Setup and teardown** - Test data preparation and cleanup
3. **Happy path tests** - Normal functionality verification
4. **Edge cases** - Boundary conditions and unusual inputs
5. **Error scenarios** - Exception handling and failure cases
6. **Mock dependencies** - External service and API mocking
7. **Assertions** - Clear and comprehensive test assertions
8. **Test coverage** - Ensure all code paths are tested`;
  }

  private generateIntegrationTestingTemplate(): string {
    return `Write integration tests for this functionality:

Feature to Test: [YOUR FEATURE/API HERE]

Our Integration Testing Approach:
- Test Framework: ${this.getTestingFramework()}
- Database: ${this.getDatabaseTechnologies().join(', ')}
- API Testing: ${this.getAPITestingPattern()}

Please create:
1. **Test environment setup** - Database seeding and configuration
2. **API endpoint tests** - Full request/response cycle testing
3. **Database integration** - Data persistence and retrieval verification
4. **Authentication tests** - Security and authorization verification
5. **Error handling tests** - Invalid inputs and failure scenarios
6. **Performance tests** - Response time and load testing
7. **Data consistency** - Transaction and concurrency testing
8. **Cleanup procedures** - Test data removal and state reset`;
  }

  private generateCodeReviewTemplate(): string {
    return `Review this code following our project standards:

Code to Review:
\`\`\`
[YOUR CODE HERE]
\`\`\`

Our Quality Standards:
- Code Style: ${this.getCodeStyleStandards()}
- Architecture: ${this.analysis.structure.architecture}
- Performance: ${this.getPerformanceStandards()}
- Security: ${this.getSecurityStandards()}

Please review for:
1. **Code Quality** - Readability, maintainability, and best practices
2. **Architecture Compliance** - Follows our ${this.analysis.structure.architecture} patterns
3. **Performance** - Efficiency and optimization opportunities
4. **Security** - Vulnerability assessment and security best practices
5. **Testing** - Adequate test coverage and quality
6. **Documentation** - Code comments and documentation quality
7. **Error Handling** - Proper exception handling and logging
8. **Type Safety** - TypeScript usage and type definitions
9. **Consistency** - Follows project conventions and patterns`;
  }

  private generateSecurityReviewTemplate(): string {
    return `Perform a security review of this code:

Code to Review:
\`\`\`
[YOUR CODE HERE]
\`\`\`

Security Context:
- Application Type: ${this.analysis.structure.projectType}
- Authentication: ${this.getAuthPattern()}
- Data Sensitivity: [DESCRIBE DATA SENSITIVITY]

Please check for:
1. **Input Validation** - SQL injection, XSS, command injection prevention
2. **Authentication & Authorization** - Proper access control implementation
3. **Data Protection** - Sensitive data handling and encryption
4. **Session Management** - Secure session handling and storage
5. **API Security** - Rate limiting, CORS, and API protection
6. **Dependency Security** - Vulnerable package detection
7. **Error Handling** - Information disclosure prevention
8. **Logging & Monitoring** - Security event logging and audit trails
9. **Configuration Security** - Secure defaults and environment variables`;
  }

  private generateDeploymentPreparationTemplate(): string {
    return `Prepare this application for deployment:

Deployment Target: [PRODUCTION/STAGING/DEVELOPMENT]

Current Configuration:
- Build System: ${this.analysis.structure.buildSystem.join(', ')}
- Package Manager: ${this.analysis.structure.packageManager}
- Environment: ${this.getEnvironmentPattern()}

Please prepare:
1. **Environment Configuration** - Environment variables and secrets management
2. **Build Optimization** - Production build configuration and optimization
3. **Database Migration** - Schema changes and data migration scripts
4. **Security Hardening** - Production security configurations
5. **Monitoring Setup** - Logging, metrics, and health checks
6. **Backup Strategy** - Data backup and recovery procedures
7. **Rollback Plan** - Deployment rollback and disaster recovery
8. **Performance Validation** - Load testing and performance verification
9. **Documentation** - Deployment procedures and runbooks`;
  }

  private generatePerformanceOptimizationTemplate(): string {
    return `Analyze and optimize the performance of this code:

Code to Optimize:
\`\`\`
[YOUR CODE HERE]
\`\`\`

Performance Context:
- Application Type: ${this.analysis.structure.projectType}
- Framework: ${this.getFrameworkName()}
- Current Issues: [DESCRIBE PERFORMANCE ISSUES]

Please analyze and optimize:
1. **Algorithm Complexity** - Time and space complexity analysis
2. **Database Performance** - Query optimization and indexing
3. **Memory Usage** - Memory leaks and allocation optimization
4. **Network Performance** - API calls and data transfer optimization
5. **Rendering Performance** - UI rendering and re-rendering optimization
6. **Bundle Size** - Code splitting and lazy loading opportunities
7. **Caching Strategies** - Browser, CDN, and application-level caching
8. **Monitoring** - Performance metrics and monitoring setup`;
  }

  private generateRefactoringTemplate(): string {
    return `Refactor this code to improve structure and maintainability:

Code to Refactor:
\`\`\`
[YOUR CODE HERE]
\`\`\`

Our Refactoring Goals:
- Architecture: ${this.analysis.structure.architecture}
- Patterns: ${this.getPatternNames().slice(0, 3).join(', ')}
- Code Quality: Improve maintainability index (current: ${Math.round(this.analysis.quality.maintainabilityIndex)})

Please refactor for:
1. **Code Structure** - Better organization and separation of concerns
2. **Readability** - Clearer variable names and function structure
3. **Maintainability** - Easier to modify and extend
4. **Testability** - Easier to unit test and mock
5. **Performance** - More efficient implementation
6. **Consistency** - Follows project patterns and conventions
7. **Documentation** - Improved code comments and documentation
8. **Error Handling** - Better exception handling and recovery`;
  }

  private generateAPIDocumentationTemplate(): string {
    return `Generate comprehensive API documentation for this endpoint:

API Endpoint: [YOUR ENDPOINT HERE]

Documentation Standards:
- Format: OpenAPI 3.0 specification
- Examples: Real request/response examples
- Error Handling: All possible error scenarios

Please document:
1. **Endpoint Overview** - Purpose and functionality description
2. **Request Format** - Parameters, headers, and body schema
3. **Response Format** - Success and error response schemas
4. **Authentication** - Required authentication and authorization
5. **Status Codes** - All possible HTTP status codes and meanings
6. **Examples** - Real request/response examples
7. **Error Handling** - Error codes and troubleshooting guide
8. **Rate Limiting** - Usage limits and throttling information
9. **Changelog** - Version history and breaking changes`;
  }

  private generateCodeDocumentationTemplate(): string {
    return `Generate comprehensive documentation for this code:

Code to Document:
\`\`\`
[YOUR CODE HERE]
\`\`\`

Documentation Standards:
- Format: JSDoc for functions, inline comments for complex logic
- Examples: Usage examples and common patterns
- Integration: How it fits with the rest of the system

Please create:
1. **Function/Class Documentation** - Purpose, parameters, return values
2. **Usage Examples** - How to use this code in practice
3. **Integration Guide** - How it connects to other components
4. **Configuration** - Available options and defaults
5. **Error Handling** - What exceptions it throws and why
6. **Performance Notes** - Performance characteristics and considerations
7. **Dependencies** - Required packages and external dependencies
8. **Changelog** - Version history and breaking changes`;
  }

  // Helper methods for extracting information from analysis...
  private categorizePrompts(prompts: GeneratedPrompt[]): { [key in SDLCPhase]: GeneratedPrompt[] } {
    const categories = {
      planning: [],
      design: [],
      implementation: [],
      testing: [],
      deployment: [],
      maintenance: [],
      documentation: [],
      review: []
    } as { [key in SDLCPhase]: GeneratedPrompt[] };

    for (const prompt of prompts) {
      categories[prompt.phase].push(prompt);
    }

    return categories;
  }

  private generateInstructions() {
    return {
      setup: `These prompts are specifically designed for ${this.analysis.repoName} using ${this.getMainTechnologies().slice(0, 3).join(', ')}.`,
      usage: 'Copy any prompt, replace placeholders with your specific requirements, and paste into GitHub Copilot Chat (Ctrl+Shift+I).',
      examples: 'Each prompt includes real examples from your codebase and follows your established patterns.'
    };
  }

  private getBestExamples(categories: string[]): any[] {
    const allExamples = Object.values(this.analysis.examples).flat();
    return allExamples
      .filter(ex => categories.includes(ex.category))
      .sort((a, b) => this.scoreExample(b) - this.scoreExample(a))
      .slice(0, 5);
  }

  private scoreExample(example: any): number {
    let score = 0;
    const complexityScores = { simple: 1, moderate: 2, complex: 3 };
    score += complexityScores[example.complexity] || 1;
    score += example.patterns?.length || 0;
    score += Math.min(2, Math.floor(example.code.split('\n').length / 10));
    return score;
  }

  private getPatternNames(): string[] {
    return this.analysis.patterns.map(p => p.name);
  }

  private getMainTechnologies(): string[] {
    const allTech = [
      ...this.analysis.technologies.languages,
      ...this.analysis.technologies.frameworks,
      ...this.analysis.technologies.tools
    ];
    return allTech
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10)
      .map(t => t.name);
  }

  private getFileStructureOverview(): string {
    const importantDirs = this.analysis.fileStructure.children
      ?.filter(child => child.type === 'directory' && child.importance === 'high')
      .slice(0, 5)
      .map(dir => `- ${dir.name}/`)
      .join('\n') || '';
    
    return importantDirs || '- src/\n- components/\n- api/';
  }

  private getCodeConventions(): string[] {
    const conventions = [];
    
    if (this.analysis.technologies.languages.some(l => l.name === 'TypeScript')) {
      conventions.push('TypeScript with strict typing');
    }
    
    if (this.analysis.technologies.tools.some(t => t.name === 'ESLint')) {
      conventions.push('ESLint for code quality');
    }
    
    if (this.analysis.technologies.tools.some(t => t.name === 'Prettier')) {
      conventions.push('Prettier for code formatting');
    }
    
    conventions.push(`${this.analysis.structure.packageManager} for package management`);
    
    return conventions;
  }

  private getImportantFiles(): string[] {
    return this.analysis.importantFiles.slice(0, 5);
  }

  // Project type detection methods...
  private isFrontendProject(): boolean {
    return ['frontend', 'fullstack'].includes(this.analysis.structure.projectType);
  }

  private isBackendProject(): boolean {
    return ['backend', 'fullstack'].includes(this.analysis.structure.projectType);
  }

  private isFullstackProject(): boolean {
    return this.analysis.structure.projectType === 'fullstack';
  }

  private hasDatabase(): boolean {
    return this.analysis.technologies.databases.length > 0 || 
           this.analysis.examples.models.length > 0;
  }

  // Technology-specific getters...
  private getFrameworkName(): string {
    const frameworks = this.analysis.technologies.frameworks;
    if (frameworks.some(f => f.name === 'React')) return 'React';
    if (frameworks.some(f => f.name === 'Vue.js')) return 'Vue.js';
    if (frameworks.some(f => f.name === 'Angular')) return 'Angular';
    return 'JavaScript';
  }

  private getMainLanguage(): string {
    const languages = this.analysis.technologies.languages;
    if (languages.some(l => l.name === 'TypeScript')) return 'TypeScript';
    if (languages.some(l => l.name === 'JavaScript')) return 'JavaScript';
    return languages[0]?.name || 'JavaScript';
  }

  private getBackendFramework(): string {
    const frameworks = this.analysis.technologies.frameworks;
    if (frameworks.some(f => f.name === 'Express.js')) return 'Express.js';
    if (frameworks.some(f => f.name === 'NestJS')) return 'NestJS';
    if (frameworks.some(f => f.name === 'Fastify')) return 'Fastify';
    return 'Node.js';
  }

  private getTestingFramework(): string {
    if (this.analysis.structure.testFrameworks.includes('Jest')) return 'Jest';
    if (this.analysis.structure.testFrameworks.includes('Vitest')) return 'Vitest';
    if (this.analysis.structure.testFrameworks.includes('Mocha')) return 'Mocha';
    return 'Jest'; // Default assumption
  }

  private getFrontendTechnologies(): string[] {
    return this.analysis.technologies.frameworks
      .filter(f => ['React', 'Vue.js', 'Angular', 'Svelte'].includes(f.name))
      .map(f => f.name);
  }

  private getBackendTechnologies(): string[] {
    return this.analysis.technologies.frameworks
      .filter(f => ['Express.js', 'NestJS', 'Fastify', 'Koa'].includes(f.name))
      .map(f => f.name);
  }

  private getDatabaseTechnologies(): string[] {
    return this.analysis.technologies.databases.map(d => d.name);
  }

  private getTestingTechnologies(): string[] {
    return this.analysis.structure.testFrameworks;
  }

  private getDeploymentTechnologies(): string[] {
    return this.analysis.technologies.tools
      .filter(t => ['Docker', 'Kubernetes', 'GitHub Actions'].includes(t.name))
      .map(t => t.name);
  }

  // Pattern detection methods...
  private getComponentNamingPattern(): string {
    if (this.getMainLanguage() === 'TypeScript') return 'PascalCase.tsx';
    return 'PascalCase.jsx';
  }

  private getStylingApproach(): string {
    const tools = this.analysis.technologies.tools.map(t => t.name);
    if (tools.includes('styled-components')) return 'styled-components';
    if (tools.includes('Tailwind CSS')) return 'Tailwind CSS';
    return 'CSS modules';
  }

  private getStateManagementPattern(): string {
    const frameworks = this.analysis.technologies.frameworks.map(f => f.name);
    if (frameworks.includes('Redux')) return 'Redux';
    if (this.getFrameworkName() === 'React') return 'React hooks (useState, useReducer)';
    if (this.getFrameworkName() === 'Vue.js') return 'Vue Composition API';
    return 'Component state';
  }

  private getTypeDefinitionPattern(): string {
    if (this.getMainLanguage() === 'TypeScript') return 'TypeScript interfaces and types';
    return 'JSDoc type annotations';
  }

  private getAsyncPattern(): string {
    return 'async/await with try/catch error handling';
  }

  private getErrorHandlingPattern(): string {
    if (this.isBackendProject()) return 'Express error middleware with custom Error classes';
    return 'try/catch blocks with proper error boundaries';
  }

  private getTypeSafetyPattern(): string {
    if (this.getMainLanguage() === 'TypeScript') return 'Strict TypeScript with proper type definitions';
    return 'JSDoc type annotations with runtime validation';
  }

  private getAuthPattern(): string {
    const hasAuth = this.analysis.patterns.some(p => p.name.toLowerCase().includes('auth'));
    if (hasAuth) return 'JWT-based authentication with middleware';
    return 'Authentication middleware (implementation detected)';
  }

  private getValidationPattern(): string {
    const patterns = this.analysis.patterns.map(p => p.name.toLowerCase());
    if (patterns.some(p => p.includes('joi'))) return 'Joi schema validation';
    if (patterns.some(p => p.includes('yup'))) return 'Yup schema validation';
    if (patterns.some(p => p.includes('zod'))) return 'Zod schema validation';
    return 'Input validation (pattern detected)';
  }

  private getTestStructurePattern(): string {
    return 'describe/it blocks with clear test descriptions';
  }

  private getMockingPattern(): string {
    const testFramework = this.getTestingFramework();
    if (testFramework === 'Jest') return 'Jest mocking with jest.mock()';
    return 'Test mocking with appropriate tools';
  }

  private getAssertionPattern(): string {
    const testFramework = this.getTestingFramework();
    if (testFramework === 'Jest') return 'Jest expect() assertions';
    return 'Assertion library appropriate for test framework';
  }

  private getAPITestingPattern(): string {
    if (this.getTestingFramework() === 'Jest') return 'Supertest with Jest';
    return 'HTTP testing with appropriate library';
  }

  private getCodeStyleStandards(): string {
    const tools = this.analysis.technologies.tools.map(t => t.name);
    const standards = [];
    
    if (tools.includes('ESLint')) standards.push('ESLint rules');
    if (tools.includes('Prettier')) standards.push('Prettier formatting');
    if (this.getMainLanguage() === 'TypeScript') standards.push('TypeScript strict mode');
    
    return standards.join(', ') || 'Project coding standards';
  }

  private getPerformanceStandards(): string {
    if (this.isFrontendProject()) return 'Component optimization, bundle size, render performance';
    if (this.isBackendProject()) return 'API response times, database query optimization';
    return 'Application performance optimization';
  }

  private getSecurityStandards(): string {
    if (this.isBackendProject()) return 'Input validation, authentication, authorization, OWASP guidelines';
    return 'Security best practices, input sanitization, XSS prevention';
  }

  private getEnvironmentPattern(): string {
    const hasEnvFile = this.analysis.importantFiles.some(f => f.includes('.env'));
    if (hasEnvFile) return 'Environment variables with .env files';
    return 'Environment configuration (pattern detected)';
  }

  // New enterprise prompt generation methods
  private generateWorkflowPrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // CI/CD Optimization Prompt
    prompts.push({
      id: 'workflow-cicd-optimization',
      title: 'CI/CD Pipeline Optimization Analysis',
      category: 'workflow',
      subcategory: 'cicd',
      description: 'Analyze and optimize CI/CD pipeline for better performance and reliability',
      template: this.generateCICDOptimizationTemplate(),
      context: {
        realExamples: this.getBestExamples(['config']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Optimizing CI/CD pipelines or implementing new automation',
        triggers: ['Slow deployments', 'Pipeline failures', 'Process automation needs'],
        relatedPrompts: ['deployment-preparation', 'review-security'],
        expectedOutcome: 'Optimized CI/CD pipeline with improved performance and reliability'
      },
      phase: 'workflow',
      complexity: 'advanced',
      estimatedTimeToComplete: '90-120 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['.github/workflows/**', 'Jenkinsfile', '.gitlab-ci.yml']
    });

    // Workflow Automation Prompt
    prompts.push({
      id: 'workflow-automation',
      title: 'Development Workflow Automation',
      category: 'workflow',
      subcategory: 'automation',
      description: 'Automate repetitive development workflow tasks',
      template: this.generateWorkflowAutomationTemplate(),
      context: {
        realExamples: this.getBestExamples(['config']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Setting up automation for repetitive tasks',
        triggers: ['Manual processes', 'Repetitive tasks', 'Developer productivity concerns'],
        relatedPrompts: ['workflow-cicd-optimization', 'governance-compliance'],
        expectedOutcome: 'Automated workflow processes reducing manual effort'
      },
      phase: 'workflow',
      complexity: 'intermediate',
      estimatedTimeToComplete: '60-90 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['package.json', '.husky/**', '.pre-commit-config.yaml']
    });

    return prompts;
  }

  private generateIncidentResponsePrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // Incident Response Planning
    prompts.push({
      id: 'incident-response-planning',
      title: 'Incident Response Plan Development',
      category: 'incident-response',
      subcategory: 'planning',
      description: 'Create comprehensive incident response procedures and runbooks',
      template: this.generateIncidentPlanningTemplate(),
      context: {
        realExamples: this.getBestExamples(['api', 'config']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Preparing for production incidents or improving response capabilities',
        triggers: ['Production incidents', 'Compliance requirements', 'Team growth'],
        relatedPrompts: ['deployment-preparation', 'review-security'],
        expectedOutcome: 'Complete incident response plan with runbooks and procedures'
      },
      phase: 'incident-response',
      complexity: 'advanced',
      estimatedTimeToComplete: '120-180 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['docs/runbooks/**', 'INCIDENT_RESPONSE.md']
    });

    // Post-Incident Analysis
    prompts.push({
      id: 'incident-postmortem',
      title: 'Post-Incident Analysis & Learning',
      category: 'incident-response',
      subcategory: 'postmortem',
      description: 'Conduct thorough post-incident analysis to prevent future occurrences',
      template: this.generatePostmortemTemplate(),
      context: {
        realExamples: this.getBestExamples(['api', 'function']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'After resolving production incidents',
        triggers: ['Incident resolution', 'Learning requirements', 'Process improvement'],
        relatedPrompts: ['incident-response-planning', 'analysis-root-cause'],
        expectedOutcome: 'Detailed postmortem with actionable improvements'
      },
      phase: 'incident-response',
      complexity: 'intermediate',
      estimatedTimeToComplete: '60-90 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['docs/postmortems/**', 'POSTMORTEM_TEMPLATE.md']
    });

    return prompts;
  }

  private generateAnalysisPrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // Performance Analysis
    prompts.push({
      id: 'analysis-performance',
      title: 'System Performance Analysis',
      category: 'analysis',
      subcategory: 'performance',
      description: 'Comprehensive performance analysis and optimization recommendations',
      template: this.generatePerformanceAnalysisTemplate(),
      context: {
        realExamples: this.getBestExamples(['component', 'api', 'function']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Investigating performance issues or optimizing system performance',
        triggers: ['Performance degradation', 'Scaling requirements', 'User complaints'],
        relatedPrompts: ['maintenance-performance', 'analysis-root-cause'],
        expectedOutcome: 'Performance analysis report with optimization recommendations'
      },
      phase: 'analysis',
      complexity: 'advanced',
      estimatedTimeToComplete: '90-120 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['**/*.{js,ts,jsx,tsx,py}']
    });

    // Dependency Analysis
    prompts.push({
      id: 'analysis-dependencies',
      title: 'Dependency Security & Health Analysis',
      category: 'analysis',
      subcategory: 'dependencies',
      description: 'Analyze project dependencies for security, maintenance, and optimization',
      template: this.generateDependencyAnalysisTemplate(),
      context: {
        realExamples: this.getBestExamples(['config']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Auditing dependencies or preparing for updates',
        triggers: ['Security audits', 'Dependency updates', 'Bundle size optimization'],
        relatedPrompts: ['review-security', 'maintenance-performance'],
        expectedOutcome: 'Dependency analysis with update and optimization recommendations'
      },
      phase: 'analysis',
      complexity: 'intermediate',
      estimatedTimeToComplete: '45-60 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['package.json', 'yarn.lock', 'requirements.txt']
    });

    return prompts;
  }

  private generateGovernancePrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // Compliance Assessment
    prompts.push({
      id: 'governance-compliance',
      title: 'Compliance Assessment & Gap Analysis',
      category: 'governance',
      subcategory: 'compliance',
      description: 'Assess compliance requirements and identify gaps',
      template: this.generateComplianceAssessmentTemplate(),
      context: {
        realExamples: this.getBestExamples(['config', 'api']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Preparing for compliance audits or implementing governance policies',
        triggers: ['Compliance requirements', 'Audit preparation', 'Policy implementation'],
        relatedPrompts: ['review-security', 'governance-policies'],
        expectedOutcome: 'Compliance gap analysis with implementation roadmap'
      },
      phase: 'governance',
      complexity: 'advanced',
      estimatedTimeToComplete: '120-180 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['docs/compliance/**', 'COMPLIANCE.md']
    });

    // Policy Development
    prompts.push({
      id: 'governance-policies',
      title: 'Development Policy & Standards Creation',
      category: 'governance',
      subcategory: 'policies',
      description: 'Create development policies and coding standards',
      template: this.generatePolicyDevelopmentTemplate(),
      context: {
        realExamples: this.getBestExamples(['config']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Establishing development standards or updating policies',
        triggers: ['Team scaling', 'Quality issues', 'Compliance requirements'],
        relatedPrompts: ['governance-compliance', 'review-code-quality'],
        expectedOutcome: 'Development policies and enforceable standards'
      },
      phase: 'governance',
      complexity: 'intermediate',
      estimatedTimeToComplete: '75-90 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['docs/policies/**', '.eslintrc.*', 'CODING_STANDARDS.md']
    });

    return prompts;
  }

  private generateBusinessPrompts(): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];

    // Business Opportunity Analysis
    prompts.push({
      id: 'business-opportunity-analysis',
      title: 'Business Opportunity & Feature Analysis',
      category: 'business',
      subcategory: 'opportunity',
      description: 'Analyze business opportunities and prioritize feature development',
      template: this.generateBusinessOpportunityTemplate(),
      context: {
        realExamples: this.getBestExamples(['component', 'api']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Planning product roadmap or evaluating new features',
        triggers: ['Strategic planning', 'Market research', 'Product development'],
        relatedPrompts: ['planning-feature-analysis', 'business-competitive'],
        expectedOutcome: 'Prioritized business opportunities with technical feasibility assessment'
      },
      phase: 'business',
      complexity: 'intermediate',
      estimatedTimeToComplete: '90-120 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['docs/business/**', 'ROADMAP.md']
    });

    // Competitive Analysis
    prompts.push({
      id: 'business-competitive',
      title: 'Competitive Technical Analysis',
      category: 'business',
      subcategory: 'competitive',
      description: 'Analyze competitive landscape and technical differentiation opportunities',
      template: this.generateCompetitiveAnalysisTemplate(),
      context: {
        realExamples: this.getBestExamples(['component', 'api']),
        patterns: this.getPatternNames(),
        technologies: this.getMainTechnologies(),
        fileStructure: this.getFileStructureOverview(),
        conventions: this.getCodeConventions()
      },
      usage: {
        when: 'Evaluating competitive position or planning differentiation strategy',
        triggers: ['Competitive research', 'Product positioning', 'Technical strategy'],
        relatedPrompts: ['business-opportunity-analysis', 'planning-feature-analysis'],
        expectedOutcome: 'Competitive analysis with technical differentiation recommendations'
      },
      phase: 'business',
      complexity: 'advanced',
      estimatedTimeToComplete: '60-90 minutes',
      generatedAt: new Date(),
      applicableToFiles: ['docs/competitive/**', 'COMPETITIVE_ANALYSIS.md']
    });

    return prompts;
  }

  // Template generation methods for new prompt categories
  private generateCICDOptimizationTemplate(): string {
    const currentPlatforms = this.analysis.workflow?.cicd.platforms.join(', ') || 'Not detected';
    const hasCI = this.analysis.workflow?.cicd.hasCI || false;
    const hasCD = this.analysis.workflow?.cicd.hasCD || false;

    return `Analyze and optimize our CI/CD pipeline for better performance and reliability:

Current CI/CD Setup:
- Platforms: ${currentPlatforms}
- CI Pipeline: ${hasCI ? 'Yes' : 'No'}
- CD Pipeline: ${hasCD ? 'Yes' : 'No'}
- Project Type: ${this.analysis.structure.projectType}

Focus Areas: [SPECIFY YOUR OPTIMIZATION PRIORITIES]

Please analyze and optimize:
1. **Pipeline Performance** - Identify bottlenecks and optimization opportunities
2. **Security Integration** - Security scanning and vulnerability checks
3. **Test Automation** - Comprehensive testing strategy and parallel execution
4. **Deployment Strategy** - Blue-green, canary, or rolling deployment optimization
5. **Monitoring & Alerting** - Pipeline observability and failure notifications
6. **Dependency Management** - Caching and optimization strategies
7. **Branch Strategy** - Workflow optimization for different environments
8. **Cost Optimization** - Resource usage and execution time improvements

Provide specific recommendations for our ${this.analysis.structure.projectType} project using ${this.getMainTechnologies().slice(0, 3).join(', ')}.`;
  }

  private generateWorkflowAutomationTemplate(): string {
    const automation = this.analysis.workflow?.automation;
    const automatedAreas = automation ? Object.entries(automation).filter(([_, automated]) => automated).map(([area]) => area) : [];

    return `Automate development workflow processes to improve team productivity:

Current Automation:
- Automated Areas: ${automatedAreas.join(', ') || 'None detected'}
- Build System: ${this.analysis.structure.buildSystem.join(', ')}
- Package Manager: ${this.analysis.structure.packageManager}

Automation Goals: [DESCRIBE YOUR AUTOMATION OBJECTIVES]

Please implement automation for:
1. **Code Quality** - Linting, formatting, and code analysis automation
2. **Testing** - Automated test execution and coverage reporting
3. **Dependency Management** - Automated dependency updates and security scanning
4. **Documentation** - Automatic documentation generation and updates
5. **Release Management** - Automated versioning and changelog generation
6. **Environment Management** - Automated environment setup and configuration
7. **Notifications** - Team communication for important events
8. **Compliance** - Automated compliance checks and reporting

Focus on tools that integrate well with our ${this.getMainTechnologies().slice(0, 3).join(', ')} stack.`;
  }

  private generateIncidentPlanningTemplate(): string {
    const risks = this.analysis.incident?.riskAreas || [];
    const hasMonitoring = this.analysis.incident?.preparedness.hasMonitoring || false;

    return `Develop comprehensive incident response procedures for our application:

System Context:
- Application Type: ${this.analysis.structure.projectType}
- Architecture: ${this.analysis.structure.architecture}
- Risk Areas: ${risks.join(', ') || 'To be identified'}
- Monitoring: ${hasMonitoring ? 'In place' : 'Needs implementation'}

Incident Scope: [DEFINE YOUR INCIDENT RESPONSE SCOPE]

Create incident response procedures for:
1. **Incident Classification** - Severity levels (P0-P3) and criteria
2. **Response Team Structure** - Roles, responsibilities, and escalation paths
3. **Communication Protocols** - Internal and external communication procedures
4. **Runbooks** - Step-by-step response procedures for common scenarios
5. **Monitoring & Detection** - Alerting and monitoring setup for early detection
6. **Recovery Procedures** - Service restoration and rollback strategies
7. **Post-Incident Process** - Documentation, analysis, and improvement procedures
8. **Training & Drills** - Team preparedness and regular practice sessions

Consider our specific technology stack: ${this.getMainTechnologies().slice(0, 3).join(', ')} and architecture pattern: ${this.analysis.structure.architecture}.`;
  }

  private generatePostmortemTemplate(): string {
    return `Conduct thorough post-incident analysis for continuous improvement:

Incident Information:
- Incident ID: [INCIDENT_ID]
- Date/Time: [INCIDENT_DATETIME]
- Duration: [INCIDENT_DURATION]
- Severity: [P0/P1/P2/P3]

Our System Context:
- Architecture: ${this.analysis.structure.architecture}
- Technologies: ${this.getMainTechnologies().slice(0, 3).join(', ')}
- Monitoring: ${this.analysis.incident?.preparedness.hasMonitoring ? 'Available' : 'Limited'}

Conduct postmortem analysis:
1. **Timeline of Events** - Detailed chronological sequence of the incident
2. **Root Cause Analysis** - Primary and contributing factors using 5 Whys or fishbone
3. **Impact Assessment** - Business, technical, and user impact quantification
4. **Response Evaluation** - Effectiveness of detection, response, and communication
5. **System Analysis** - Architecture and process vulnerabilities exposed
6. **Action Items** - Specific, measurable improvements with owners and timelines
7. **Prevention Measures** - Long-term systemic improvements to prevent recurrence
8. **Knowledge Sharing** - Documentation and training updates for the team

Focus on actionable improvements that strengthen our ${this.analysis.structure.projectType} application's resilience.`;
  }

  private generatePerformanceAnalysisTemplate(): string {
    const qualityScore = Math.round(this.analysis.quality.maintainabilityIndex);
    const complexity = this.analysis.quality.complexity.cyclomatic;

    return `Conduct comprehensive performance analysis of our application:

Current Performance Context:
- Code Quality Score: ${qualityScore}/100
- Average Complexity: ${complexity}
- Project Type: ${this.analysis.structure.projectType}
- Technologies: ${this.getMainTechnologies().slice(0, 3).join(', ')}

Performance Focus: [SPECIFY YOUR PERFORMANCE CONCERNS]

Analyze performance across:
1. **Application Performance** - Response times, throughput, and resource utilization
2. **Database Performance** - Query optimization, indexing, and connection pooling
3. **Frontend Performance** - Bundle size, render performance, and user experience metrics
4. **API Performance** - Endpoint response times, rate limiting, and caching strategies
5. **Infrastructure Performance** - Server resources, scaling capabilities, and bottlenecks
6. **Third-party Dependencies** - External service performance impact
7. **Code Performance** - Algorithmic complexity and optimization opportunities
8. **Monitoring & Metrics** - Performance tracking and alerting setup

Provide specific optimization recommendations for our ${this.analysis.structure.architecture} architecture using ${this.getMainTechnologies().slice(0, 3).join(', ')}.`;
  }

  private generateDependencyAnalysisTemplate(): string {
    const directDeps = this.analysis.dependencies?.usage.direct || 0;
    const riskLevel = this.analysis.dependencies?.security.riskLevel || 'unknown';

    return `Analyze project dependencies for security, maintenance, and optimization:

Current Dependency Context:
- Direct Dependencies: ${directDeps}
- Security Risk Level: ${riskLevel}
- Technologies: ${this.getMainTechnologies().slice(0, 3).join(', ')}
- Package Manager: ${this.analysis.structure.packageManager}

Analysis Focus: [SPECIFY YOUR DEPENDENCY CONCERNS]

Analyze dependencies for:
1. **Security Vulnerabilities** - Known CVEs, security advisories, and risk assessment
2. **Maintenance Status** - Last updates, maintenance activity, and deprecated packages
3. **License Compliance** - License compatibility and legal obligations
4. **Bundle Impact** - Size contribution, tree-shaking potential, and alternatives
5. **Update Strategy** - Safe update paths, breaking changes, and testing requirements
6. **Performance Impact** - Load time, runtime performance, and optimization opportunities
7. **Alternative Solutions** - Lighter alternatives, native implementations, or removal opportunities
8. **Dependency Graph** - Transitive dependencies and potential conflicts

Provide actionable recommendations for improving our dependency health and security posture.`;
  }

  private generateComplianceAssessmentTemplate(): string {
    const standards = this.analysis.governance?.compliance.standards || [];
    const frameworks = this.analysis.governance?.compliance.frameworks || [];

    return `Assess compliance requirements and identify implementation gaps:

Current Compliance Status:
- Identified Standards: ${standards.join(', ') || 'None identified'}
- Frameworks: ${frameworks.join(', ') || 'None identified'}
- Project Type: ${this.analysis.structure.projectType}
- Data Handling: [DESCRIBE YOUR DATA TYPES]

Compliance Requirements: [SPECIFY YOUR COMPLIANCE NEEDS]

Assess compliance across:
1. **Data Protection & Privacy** - GDPR, CCPA, data handling, and user consent
2. **Security Standards** - ISO 27001, SOC 2, security controls, and audit trails
3. **Industry Regulations** - HIPAA, PCI-DSS, financial regulations, and sector-specific requirements
4. **Development Practices** - Secure coding, vulnerability management, and change control
5. **Documentation Requirements** - Policy documentation, procedures, and audit evidence
6. **Access Controls** - Authentication, authorization, and privilege management
7. **Monitoring & Logging** - Audit trails, incident logging, and compliance reporting
8. **Third-party Compliance** - Vendor assessments and supply chain security

Provide a detailed gap analysis with prioritized implementation roadmap for our ${this.analysis.structure.projectType} application.`;
  }

  private generatePolicyDevelopmentTemplate(): string {
    const hasLinting = this.analysis.governance?.rulesets.linting.length || 0;
    const hasSecurity = this.analysis.governance?.rulesets.security.length || 0;

    return `Create comprehensive development policies and enforceable standards:

Current Standards:
- Linting Rules: ${hasLinting > 0 ? 'Configured' : 'Not configured'}
- Security Rules: ${hasSecurity > 0 ? 'Configured' : 'Not configured'}
- Technologies: ${this.getMainTechnologies().slice(0, 3).join(', ')}
- Team Size: [SPECIFY YOUR TEAM SIZE]

Policy Scope: [DEFINE YOUR POLICY REQUIREMENTS]

Develop policies for:
1. **Coding Standards** - Style guides, naming conventions, and code organization
2. **Security Policies** - Secure coding practices, vulnerability handling, and security reviews
3. **Quality Gates** - Code review requirements, testing standards, and acceptance criteria
4. **Development Workflow** - Branching strategy, commit conventions, and release procedures
5. **Documentation Standards** - Code documentation, API documentation, and knowledge sharing
6. **Dependency Management** - Approved libraries, security scanning, and update procedures
7. **Performance Standards** - Performance requirements, monitoring, and optimization guidelines
8. **Compliance Procedures** - Regulatory compliance, audit preparation, and record keeping

Create enforceable standards with automated checks and clear escalation procedures for our ${this.analysis.structure.architecture} project.`;
  }

  private generateBusinessOpportunityTemplate(): string {
    const opportunities = this.analysis.business?.opportunities || {};
    const domain = this.analysis.business?.domain || {};

    return `Analyze business opportunities and prioritize feature development:

Current Business Context:
- Industry: ${domain.industry || 'To be identified'}
- Business Model: ${domain.businessModel || 'To be identified'}
- Target Market: ${domain.target || 'To be identified'}
- Technical Capabilities: ${this.getMainTechnologies().slice(0, 3).join(', ')}

Analysis Focus: [DESCRIBE YOUR BUSINESS OBJECTIVES]

Analyze opportunities in:
1. **Market Opportunities** - Market size, growth potential, and competitive landscape
2. **Feature Opportunities** - User needs, feature gaps, and development priorities
3. **Technical Opportunities** - Architecture improvements, technology adoption, and innovation
4. **Integration Opportunities** - Third-party integrations, partnerships, and ecosystem expansion
5. **Monetization Opportunities** - Revenue streams, pricing models, and business expansion
6. **Operational Opportunities** - Process improvements, automation, and efficiency gains
7. **User Experience Opportunities** - UX improvements, accessibility, and engagement
8. **Data Opportunities** - Analytics, insights, and data-driven features

Provide prioritized recommendations with technical feasibility assessment and resource requirements for our ${this.analysis.structure.projectType} project.`;
  }

  private generateCompetitiveAnalysisTemplate(): string {
    const advantages = this.analysis.business?.value.competitiveAdvantages || [];

    return `Analyze competitive landscape and identify technical differentiation opportunities:

Current Position:
- Our Advantages: ${advantages.join(', ') || 'To be identified'}
- Technology Stack: ${this.getMainTechnologies().slice(0, 3).join(', ')}
- Architecture: ${this.analysis.structure.architecture}
- Target Market: ${this.analysis.business?.domain.target || 'To be identified'}

Competitive Focus: [SPECIFY YOUR COMPETITIVE ANALYSIS SCOPE]

Analyze competitive aspects:
1. **Technical Differentiation** - Unique technical capabilities and architecture advantages
2. **Feature Comparison** - Feature gaps, unique offerings, and development priorities
3. **Performance Benchmarking** - Speed, scalability, and reliability comparisons
4. **User Experience Analysis** - UX advantages, accessibility, and design differentiation
5. **Integration Capabilities** - API quality, ecosystem integration, and partnership opportunities
6. **Security & Compliance** - Security posture, compliance certifications, and trust factors
7. **Innovation Opportunities** - Emerging technologies, AI/ML capabilities, and future positioning
8. **Go-to-Market Advantages** - Technical enablers for marketing, sales, and customer success

Provide actionable recommendations for strengthening our competitive position through technical innovation and strategic development priorities.`;
  }
}