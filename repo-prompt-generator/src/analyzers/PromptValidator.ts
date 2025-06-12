import { GeneratedPrompt, PromptValidation, CodebaseAnalysis } from '../types';

export class PromptValidator {
  private analysis: CodebaseAnalysis;

  constructor(analysis: CodebaseAnalysis) {
    this.analysis = analysis;
  }

  validatePrompt(prompt: GeneratedPrompt): PromptValidation {
    const issues = {
      clarity: [] as string[],
      completeness: [] as string[],
      specificity: [] as string[],
      actionability: [] as string[]
    };

    const suggestions: string[] = [];

    // Validate clarity
    this.validateClarity(prompt, issues.clarity, suggestions);
    
    // Validate completeness
    this.validateCompleteness(prompt, issues.completeness, suggestions);
    
    // Validate specificity
    this.validateSpecificity(prompt, issues.specificity, suggestions);
    
    // Validate actionability
    this.validateActionability(prompt, issues.actionability, suggestions);

    // Calculate overall score
    const score = this.calculateValidationScore(issues);

    // Generate optimized template if score is low
    const optimizedTemplate = score < 70 ? this.optimizePromptTemplate(prompt, issues, suggestions) : undefined;

    return {
      score,
      issues,
      suggestions,
      optimizedTemplate
    };
  }

  private validateClarity(prompt: GeneratedPrompt, clarityIssues: string[], suggestions: string[]): void {
    const template = prompt.template;

    // Check for unclear language
    const unclearPhrases = [
      'somehow', 'maybe', 'perhaps', 'might want to', 'could be', 'sort of',
      'kind of', 'basically', 'just', 'simply', 'easily'
    ];

    for (const phrase of unclearPhrases) {
      if (template.toLowerCase().includes(phrase)) {
        clarityIssues.push(`Contains unclear language: "${phrase}"`);
        suggestions.push(`Replace vague terms like "${phrase}" with specific instructions`);
      }
    }

    // Check for overly complex sentences
    const sentences = template.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.split(' ').length > 30) {
        clarityIssues.push('Contains overly long sentences that may be hard to follow');
        suggestions.push('Break long sentences into shorter, clearer instructions');
        break;
      }
    }

    // Check for technical jargon without explanation
    const jargonTerms = [
      'microservices', 'containerization', 'orchestration', 'middleware',
      'polymorphism', 'encapsulation', 'dependency injection'
    ];

    for (const term of jargonTerms) {
      if (template.toLowerCase().includes(term.toLowerCase()) && 
          !template.toLowerCase().includes(`${term.toLowerCase()} (`)) {
        clarityIssues.push(`Uses technical jargon "${term}" without explanation`);
        suggestions.push(`Provide brief explanation or context for technical terms like "${term}"`);
      }
    }

    // Check for clear structure
    if (!template.includes('\n1.') && !template.includes('- ') && 
        !template.includes('```') && template.length > 200) {
      clarityIssues.push('Lacks clear structure with numbered lists or bullet points');
      suggestions.push('Use numbered lists or bullet points to structure instructions clearly');
    }
  }

  private validateCompleteness(prompt: GeneratedPrompt, completenessIssues: string[], suggestions: string[]): void {
    const template = prompt.template;

    // Check for essential elements
    const essentialElements = {
      'context': ['current', 'existing', 'our project', 'our codebase'],
      'objective': ['implement', 'create', 'build', 'develop', 'analyze'],
      'requirements': ['requirements', 'needs', 'must', 'should'],
      'constraints': ['consider', 'ensure', 'following', 'based on'],
      'output': ['provide', 'generate', 'create', 'output', 'deliver']
    };

    for (const [element, keywords] of Object.entries(essentialElements)) {
      const hasElement = keywords.some(keyword => 
        template.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (!hasElement) {
        completenessIssues.push(`Missing ${element} information`);
        suggestions.push(`Add clear ${element} to help AI understand what's needed`);
      }
    }

    // Check for placeholders
    const placeholderPattern = /\[([^\]]+)\]/g;
    const placeholders = template.match(placeholderPattern);
    
    if (!placeholders || placeholders.length === 0) {
      completenessIssues.push('No placeholders for user customization');
      suggestions.push('Add placeholders like [YOUR REQUIREMENTS] for user customization');
    }

    // Check for examples or references
    if (!template.includes('example') && !template.includes('see ') && 
        !template.includes('like ') && prompt.context.realExamples.length === 0) {
      completenessIssues.push('Lacks examples or references to existing code');
      suggestions.push('Include examples or references to existing code patterns');
    }

    // Check for success criteria
    const successIndicators = ['result', 'outcome', 'success', 'completion', 'done', 'finished'];
    const hasSuccessCriteria = successIndicators.some(indicator => 
      template.toLowerCase().includes(indicator)
    );
    
    if (!hasSuccessCriteria) {
      completenessIssues.push('Missing success criteria or expected outcomes');
      suggestions.push('Add clear success criteria or expected outcomes');
    }
  }

  private validateSpecificity(prompt: GeneratedPrompt, specificityIssues: string[], suggestions: string[]): void {
    const template = prompt.template;

    // Check for generic terms
    const genericTerms = [
      'something', 'anything', 'everything', 'stuff', 'things', 'whatever',
      'somehow', 'somewhere', 'appropriate', 'relevant', 'suitable'
    ];

    for (const term of genericTerms) {
      if (template.toLowerCase().includes(term)) {
        specificityIssues.push(`Contains generic term: "${term}"`);
        suggestions.push(`Replace generic terms like "${term}" with specific details`);
      }
    }

    // Check for project-specific context
    const hasProjectContext = template.includes(this.analysis.repoName) ||
                             template.includes(this.analysis.structure.projectType) ||
                             this.analysis.technologies.languages.some(lang => 
                               template.includes(lang.name));

    if (!hasProjectContext) {
      specificityIssues.push('Lacks project-specific context');
      suggestions.push('Include specific project technologies, patterns, or architecture details');
    }

    // Check for file/path references
    const hasFileReferences = template.includes('.js') || template.includes('.ts') ||
                             template.includes('/') || template.includes('src/') ||
                             prompt.context.realExamples.length > 0;

    if (!hasFileReferences && prompt.applicableToFiles.length === 0) {
      specificityIssues.push('Lacks specific file or path references');
      suggestions.push('Include specific file paths or patterns from the codebase');
    }

    // Check for technology-specific instructions
    const mainTechs = this.analysis.technologies.languages.map(l => l.name).slice(0, 3);
    const hasTechSpecifics = mainTechs.some(tech => 
      template.toLowerCase().includes(tech.toLowerCase())
    );

    if (!hasTechSpecifics && mainTechs.length > 0) {
      specificityIssues.push('Not tailored to project technologies');
      suggestions.push(`Include specific instructions for ${mainTechs.join(', ')}`);
    }
  }

  private validateActionability(prompt: GeneratedPrompt, actionabilityIssues: string[], suggestions: string[]): void {
    const template = prompt.template;

    // Check for action verbs
    const actionVerbs = [
      'create', 'implement', 'build', 'develop', 'write', 'add', 'update',
      'modify', 'test', 'analyze', 'review', 'optimize', 'refactor'
    ];

    const hasActionVerbs = actionVerbs.some(verb => 
      template.toLowerCase().includes(verb)
    );

    if (!hasActionVerbs) {
      actionabilityIssues.push('Lacks clear action verbs');
      suggestions.push('Use clear action verbs like "implement", "create", "analyze"');
    }

    // Check for step-by-step instructions
    const hasNumberedSteps = template.includes('1.') || template.includes('2.');
    const hasBulletPoints = template.includes('- ') || template.includes('* ');

    if (!hasNumberedSteps && !hasBulletPoints && template.length > 300) {
      actionabilityIssues.push('Lacks step-by-step breakdown');
      suggestions.push('Break down complex tasks into numbered steps or bullet points');
    }

    // Check for conditional language that makes action unclear
    const conditionalPhrases = [
      'if possible', 'when appropriate', 'as needed', 'if necessary',
      'might need', 'could consider', 'potentially'
    ];

    for (const phrase of conditionalPhrases) {
      if (template.toLowerCase().includes(phrase)) {
        actionabilityIssues.push(`Contains conditional language: "${phrase}"`);
        suggestions.push(`Replace conditional phrases like "${phrase}" with definitive instructions`);
      }
    }

    // Check for resource requirements
    const resourceIndicators = ['tool', 'library', 'dependency', 'install', 'setup'];
    const mentionsResources = resourceIndicators.some(indicator => 
      template.toLowerCase().includes(indicator)
    );

    if (prompt.complexity === 'advanced' && !mentionsResources) {
      actionabilityIssues.push('Advanced task lacks resource or tool requirements');
      suggestions.push('Specify required tools, libraries, or setup steps');
    }

    // Check for validation steps
    const validationIndicators = ['test', 'verify', 'check', 'validate', 'ensure'];
    const hasValidation = validationIndicators.some(indicator => 
      template.toLowerCase().includes(indicator)
    );

    if (!hasValidation) {
      actionabilityIssues.push('Missing validation or testing steps');
      suggestions.push('Include steps to test or validate the implementation');
    }
  }

  private calculateValidationScore(issues: PromptValidation['issues']): number {
    const totalIssues = Object.values(issues).reduce((sum, issueList) => sum + issueList.length, 0);
    
    // Start with perfect score and deduct points for issues
    let score = 100;
    
    // Clarity issues are critical
    score -= issues.clarity.length * 15;
    
    // Completeness issues are very important
    score -= issues.completeness.length * 12;
    
    // Specificity issues are important
    score -= issues.specificity.length * 10;
    
    // Actionability issues are important
    score -= issues.actionability.length * 8;

    // Ensure score doesn't go below 0
    return Math.max(0, score);
  }

  private optimizePromptTemplate(
    prompt: GeneratedPrompt, 
    issues: PromptValidation['issues'], 
    suggestions: string[]
  ): string {
    let optimizedTemplate = prompt.template;

    // Add project context if missing
    if (issues.specificity.some(issue => issue.includes('project-specific context'))) {
      const projectContext = `Working on ${this.analysis.repoName} (${this.analysis.structure.projectType} project):
- Technologies: ${this.analysis.technologies.languages.map(l => l.name).join(', ')}
- Architecture: ${this.analysis.structure.architecture}

`;
      optimizedTemplate = projectContext + optimizedTemplate;
    }

    // Add structure if missing
    if (issues.clarity.some(issue => issue.includes('structure'))) {
      optimizedTemplate = this.addStructureToPrompt(optimizedTemplate);
    }

    // Add placeholders if missing
    if (issues.completeness.some(issue => issue.includes('placeholders'))) {
      optimizedTemplate = this.addPlaceholdersToPrompt(optimizedTemplate);
    }

    // Add validation steps if missing
    if (issues.actionability.some(issue => issue.includes('validation'))) {
      optimizedTemplate += '\n\nValidation Steps:\n1. Test the implementation\n2. Verify it meets requirements\n3. Check for any errors or edge cases';
    }

    // Add examples if available and missing
    if (issues.completeness.some(issue => issue.includes('examples')) && 
        prompt.context.realExamples.length > 0) {
      const exampleText = '\n\nExisting Examples:\n' + 
        prompt.context.realExamples.slice(0, 2).map(ex => 
          `- ${ex.title}: ${ex.filePath}`
        ).join('\n');
      optimizedTemplate += exampleText;
    }

    return optimizedTemplate;
  }

  private addStructureToPrompt(template: string): string {
    // If template is unstructured, try to add basic structure
    if (!template.includes('\n1.') && !template.includes('- ')) {
      const sentences = template.split(/[.!?]+/).filter(s => s.trim());
      if (sentences.length > 3) {
        // Convert to numbered list
        const structuredTemplate = sentences.slice(0, -1).map((sentence, index) => 
          `${index + 1}. ${sentence.trim()}`
        ).join('\n') + sentences[sentences.length - 1];
        
        return structuredTemplate;
      }
    }
    return template;
  }

  private addPlaceholdersToPrompt(template: string): string {
    // Add common placeholders if none exist
    if (!template.includes('[') && !template.includes(']')) {
      // Add a requirements placeholder at the beginning
      const lines = template.split('\n');
      lines.splice(1, 0, '', 'Requirements: [DESCRIBE YOUR SPECIFIC REQUIREMENTS]', '');
      return lines.join('\n');
    }
    return template;
  }

  // Method to validate all prompts in a library
  validatePromptLibrary(prompts: GeneratedPrompt[]): {
    overallScore: number;
    promptValidations: { [promptId: string]: PromptValidation };
    recommendations: string[];
  } {
    const promptValidations: { [promptId: string]: PromptValidation } = {};
    let totalScore = 0;

    for (const prompt of prompts) {
      const validation = this.validatePrompt(prompt);
      promptValidations[prompt.id] = validation;
      totalScore += validation.score;
    }

    const overallScore = prompts.length > 0 ? totalScore / prompts.length : 0;
    const recommendations = this.generateLibraryRecommendations(promptValidations, overallScore);

    return {
      overallScore,
      promptValidations,
      recommendations
    };
  }

  private generateLibraryRecommendations(
    validations: { [promptId: string]: PromptValidation },
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];

    // Analyze common issues across prompts
    const allIssues = Object.values(validations).reduce((acc, validation) => {
      acc.clarity.push(...validation.issues.clarity);
      acc.completeness.push(...validation.issues.completeness);
      acc.specificity.push(...validation.issues.specificity);
      acc.actionability.push(...validation.issues.actionability);
      return acc;
    }, { clarity: [], completeness: [], specificity: [], actionability: [] } as any);

    // Generate recommendations based on common patterns
    if (allIssues.clarity.length > allIssues.completeness.length) {
      recommendations.push('Focus on improving prompt clarity - use simpler language and better structure');
    }

    if (allIssues.specificity.length > 5) {
      recommendations.push('Add more project-specific context to prompts');
    }

    if (allIssues.actionability.length > 3) {
      recommendations.push('Include more step-by-step instructions and validation steps');
    }

    if (overallScore < 70) {
      recommendations.push('Consider using the optimized templates provided for low-scoring prompts');
    } else if (overallScore < 85) {
      recommendations.push('Good prompt quality - focus on addressing specific issues identified');
    } else {
      recommendations.push('Excellent prompt quality - consider these prompts as templates for future ones');
    }

    return recommendations;
  }
}