// Core types for repository analysis and prompt generation

export interface Technology {
  name: string;
  version?: string;
  confidence: number; // 0-1 confidence score
  evidence: string[]; // Files or patterns that detected this
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  filePath: string;
  startLine: number;
  endLine: number;
  code: string;
  language: string;
  category: 'component' | 'function' | 'test' | 'config' | 'api' | 'model' | 'util';
  complexity: 'simple' | 'moderate' | 'complex';
  patterns: string[]; // Design patterns used
}

export interface FileStructure {
  type: 'file' | 'directory';
  name: string;
  path: string;
  size?: number;
  children?: FileStructure[];
  importance: 'high' | 'medium' | 'low'; // Based on patterns and usage
}

export interface CodeQualityMetrics {
  averageFileSize: number;
  totalLines: number;
  commentRatio: number;
  testCoverage?: number;
  complexity: {
    cyclomatic: number;
    cognitive: number;
  };
  maintainabilityIndex: number;
  duplicateCodePercentage: number;
}

export interface PatternDetection {
  name: string;
  description: string;
  examples: CodeExample[];
  frequency: number; // How often this pattern appears
  recommendation: string;
}

export interface CodebaseAnalysis {
  // Repository metadata
  repoName: string;
  repoPath: string;
  analyzedAt: Date;
  
  // Technology stack
  technologies: {
    languages: Technology[];
    frameworks: Technology[];
    databases: Technology[];
    tools: Technology[];
    libraries: Technology[];
  };
  
  // Project characteristics
  structure: {
    projectType: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop' | 'library' | 'unknown';
    architecture: 'monolith' | 'microservices' | 'serverless' | 'jamstack' | 'mvc' | 'unknown';
    buildSystem: string[];
    packageManager: string;
    testFrameworks: string[];
    documentation: 'poor' | 'moderate' | 'good' | 'excellent';
  };
  
  // File organization
  fileStructure: FileStructure;
  importantFiles: string[];
  
  // Code examples and patterns
  examples: {
    components: CodeExample[];
    functions: CodeExample[];
    tests: CodeExample[];
    configs: CodeExample[];
    apis: CodeExample[];
    models: CodeExample[];
    utils: CodeExample[];
  };
  
  // Pattern analysis
  patterns: PatternDetection[];
  
  // Quality metrics
  quality: CodeQualityMetrics;
  
  // Insights and recommendations
  insights: {
    strengths: string[];
    improvements: string[];
    opportunities: string[];
    risks: string[];
  };

  // Extended enterprise analysis
  documentation?: DocumentationAnalysis;
  workflow?: WorkflowAnalysis;
  dependencies?: DependencyAnalysis;
  incident?: IncidentAnalysis;
  business?: BusinessAnalysis;
  governance?: GovernanceAnalysis;
}

export interface GeneratedPrompt {
  id: string;
  title: string;
  category: SDLCPhase;
  subcategory: string;
  description: string;
  
  // The actual prompt template
  template: string;
  
  // Context from the analyzed codebase
  context: {
    realExamples: CodeExample[];
    patterns: string[];
    technologies: string[];
    fileStructure: string;
    conventions: string[];
  };
  
  // Usage guidance
  usage: {
    when: string; // When to use this prompt
    triggers: string[]; // Specific scenarios that trigger this prompt
    relatedPrompts: string[]; // Other prompts to use together
    expectedOutcome: string; // What the user should expect
  };
  
  // SDLC integration
  phase: SDLCPhase;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTimeToComplete: string;
  
  // Metadata
  generatedAt: Date;
  applicableToFiles: string[]; // File patterns where this prompt applies
  
  // Sub-prompts for complex workflows
  subPrompts?: SubPrompt[];
  
  // Validation results
  validation?: PromptValidation;
}

export type SDLCPhase = 
  | 'planning' 
  | 'design' 
  | 'implementation' 
  | 'testing' 
  | 'deployment' 
  | 'maintenance' 
  | 'documentation' 
  | 'review'
  | 'workflow'
  | 'incident-response'
  | 'analysis'
  | 'governance'
  | 'business';

export interface PromptLibrary {
  metadata: {
    repoName: string;
    generatedAt: Date;
    version: string;
    totalPrompts: number;
    analysisId: string;
  };
  
  analysis: CodebaseAnalysis;
  prompts: GeneratedPrompt[];
  
  // Organization
  categories: {
    [key in SDLCPhase]: GeneratedPrompt[];
  };
  
  // Usage instructions
  instructions: {
    setup: string;
    usage: string;
    examples: string;
  };
}

export interface CLIOptions {
  path: string;
  output: string;
  format: 'markdown' | 'json' | 'html';
  verbose: boolean;
  includeTests: boolean;
  includeNodeModules: boolean;
  maxFileSize: number; // in KB
  githubRepo?: string;
  accessToken?: string;
}

export interface AnalysisProgress {
  phase: string;
  current: number;
  total: number;
  message: string;
}

// Extended analysis types for enterprise workflows
export interface DocumentationAnalysis {
  coverage: 'poor' | 'moderate' | 'good' | 'excellent';
  types: {
    readme: boolean;
    apiDocs: boolean;
    codeComments: boolean;
    userGuides: boolean;
    architectureDocs: boolean;
    runbooks: boolean;
  };
  quality: {
    completeness: number; // 0-100
    accuracy: number; // 0-100
    accessibility: number; // 0-100
  };
  gaps: string[];
  recommendations: string[];
}

export interface WorkflowAnalysis {
  cicd: {
    hasCI: boolean;
    hasCD: boolean;
    platforms: string[]; // GitHub Actions, Jenkins, etc.
    quality: 'basic' | 'intermediate' | 'advanced';
    gaps: string[];
  };
  branching: {
    strategy: 'gitflow' | 'github-flow' | 'trunk' | 'custom' | 'unknown';
    protection: boolean;
    reviewRequired: boolean;
  };
  automation: {
    testing: boolean;
    linting: boolean;
    formatting: boolean;
    security: boolean;
    deployment: boolean;
  };
  collaboration: {
    issueTemplates: boolean;
    prTemplates: boolean;
    codeowners: boolean;
    discussions: boolean;
  };
}

export interface DependencyAnalysis {
  security: {
    vulnerabilities: number;
    outdated: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  maintenance: {
    deprecated: string[];
    unmaintained: string[];
    alternatives: { [key: string]: string[] };
  };
  licensing: {
    types: string[];
    conflicts: string[];
    compliance: 'compliant' | 'issues' | 'unknown';
  };
  usage: {
    direct: number;
    transitive: number;
    bundleSize: number; // KB
    treeshaking: boolean;
  };
}

export interface IncidentAnalysis {
  preparedness: {
    hasRunbooks: boolean;
    hasMonitoring: boolean;
    hasAlerting: boolean;
    hasPlaybooks: boolean;
  };
  responseCapability: {
    escalationPaths: boolean;
    communicationPlans: boolean;
    rollbackProcedures: boolean;
    postmortemProcess: boolean;
  };
  riskAreas: string[];
  recommendations: string[];
}

export interface BusinessAnalysis {
  domain: {
    industry: string;
    businessModel: string;
    target: string;
  };
  value: {
    userProblems: string[];
    solutions: string[];
    competitiveAdvantages: string[];
  };
  opportunities: {
    features: string[];
    integrations: string[];
    optimizations: string[];
    markets: string[];
  };
  risks: string[];
}

export interface GovernanceAnalysis {
  compliance: {
    standards: string[]; // GDPR, HIPAA, SOX, etc.
    frameworks: string[]; // ISO 27001, SOC 2, etc.
    gaps: string[];
  };
  policies: {
    security: boolean;
    privacy: boolean;
    retention: boolean;
    access: boolean;
  };
  rulesets: {
    linting: string[];
    security: string[];
    accessibility: string[];
    performance: string[];
  };
}

export interface SubPrompt {
  id: string;
  parentId: string;
  title: string;
  description: string;
  template: string;
  order: number;
  estimatedTime: string;
  prerequisites: string[];
  outputs: string[];
}

export interface PromptValidation {
  score: number; // 0-100
  issues: {
    clarity: string[];
    completeness: string[];
    specificity: string[];
    actionability: string[];
  };
  suggestions: string[];
  optimizedTemplate?: string;
}