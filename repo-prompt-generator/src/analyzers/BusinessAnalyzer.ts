import * as fs from 'fs-extra';
import * as path from 'path';
import { BusinessAnalysis } from '../types';

export class BusinessAnalyzer {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async analyze(): Promise<BusinessAnalysis> {
    const domain = await this.analyzeDomain();
    const value = await this.analyzeValue();
    const opportunities = await this.identifyOpportunities();
    const risks = await this.identifyRisks();

    return {
      domain,
      value,
      opportunities,
      risks
    };
  }

  private async analyzeDomain(): Promise<BusinessAnalysis['domain']> {
    let industry = 'Unknown';
    let businessModel = 'Unknown';
    let target = 'Unknown';

    // Analyze project information from README and package.json
    const readmePath = await this.findReadme();
    const packageJsonPath = path.join(this.repoPath, 'package.json');

    let description = '';
    let keywords: string[] = [];

    // Extract information from package.json
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJSON(packageJsonPath);
        description += packageJson.description || '';
        keywords = packageJson.keywords || [];
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Extract information from README
    if (readmePath) {
      try {
        const readmeContent = await fs.readFile(readmePath, 'utf-8');
        description += ' ' + readmeContent.slice(0, 1000); // First 1000 chars
      } catch (error) {
        // Ignore read errors
      }
    }

    // Analyze industry based on keywords and description
    industry = this.inferIndustry(description, keywords);
    businessModel = this.inferBusinessModel(description, keywords);
    target = this.inferTarget(description, keywords);

    return {
      industry,
      businessModel,
      target
    };
  }

  private async analyzeValue(): Promise<BusinessAnalysis['value']> {
    const userProblems: string[] = [];
    const solutions: string[] = [];
    const competitiveAdvantages: string[] = [];

    const readmePath = await this.findReadme();
    let content = '';

    if (readmePath) {
      content = await fs.readFile(readmePath, 'utf-8');
    }

    // Extract problems from README sections
    const problemSections = this.extractSections(content, [
      'problem', 'challenge', 'pain point', 'issue', 'motivation'
    ]);
    
    for (const section of problemSections) {
      const problems = this.extractBulletPoints(section);
      userProblems.push(...problems);
    }

    // Extract solutions from README sections
    const solutionSections = this.extractSections(content, [
      'solution', 'features', 'benefits', 'capabilities', 'what it does'
    ]);
    
    for (const section of solutionSections) {
      const solutionPoints = this.extractBulletPoints(section);
      solutions.push(...solutionPoints);
    }

    // Infer competitive advantages from technology choices
    const techAdvantages = await this.inferTechAdvantages();
    competitiveAdvantages.push(...techAdvantages);

    // Extract advantages from README
    const advantageSections = this.extractSections(content, [
      'advantage', 'unique', 'differentiator', 'better', 'why choose'
    ]);
    
    for (const section of advantageSections) {
      const advantages = this.extractBulletPoints(section);
      competitiveAdvantages.push(...advantages);
    }

    return {
      userProblems: userProblems.slice(0, 5), // Limit to top 5
      solutions: solutions.slice(0, 5),
      competitiveAdvantages: competitiveAdvantages.slice(0, 5)
    };
  }

  private async identifyOpportunities(): Promise<BusinessAnalysis['opportunities']> {
    const features: string[] = [];
    const integrations: string[] = [];
    const optimizations: string[] = [];
    const markets: string[] = [];

    // Analyze TODO comments and issues for feature opportunities
    const todos = await this.extractTodos();
    features.push(...todos.filter(todo => 
      todo.match(/feature|add|implement|create/i)
    ).slice(0, 5));

    // Analyze dependencies for integration opportunities
    const integrationOpportunities = await this.analyzeIntegrationOpportunities();
    integrations.push(...integrationOpportunities);

    // Analyze code quality for optimization opportunities
    const optimizationOpportunities = await this.analyzeOptimizationOpportunities();
    optimizations.push(...optimizationOpportunities);

    // Infer market opportunities from domain analysis
    const marketOpportunities = this.inferMarketOpportunities();
    markets.push(...marketOpportunities);

    return {
      features,
      integrations,
      optimizations,
      markets
    };
  }

  private async identifyRisks(): Promise<string[]> {
    const risks: string[] = [];

    // Technical risks
    const techRisks = await this.analyzeTechnicalRisks();
    risks.push(...techRisks);

    // Market risks
    const marketRisks = this.analyzeMarketRisks();
    risks.push(...marketRisks);

    // Operational risks
    const operationalRisks = await this.analyzeOperationalRisks();
    risks.push(...operationalRisks);

    return risks.slice(0, 8); // Limit to top 8 risks
  }

  private inferIndustry(description: string, keywords: string[]): string {
    const industryPatterns = {
      'E-commerce': ['shop', 'store', 'cart', 'payment', 'product', 'checkout', 'ecommerce'],
      'FinTech': ['finance', 'bank', 'payment', 'crypto', 'blockchain', 'trading', 'fintech'],
      'HealthTech': ['health', 'medical', 'patient', 'doctor', 'healthcare', 'medicine'],
      'EdTech': ['education', 'learning', 'course', 'student', 'teacher', 'school', 'edtech'],
      'SaaS': ['software', 'service', 'platform', 'api', 'dashboard', 'saas', 'tool'],
      'Gaming': ['game', 'player', 'gaming', 'unity', 'gamedev', 'entertainment'],
      'Social Media': ['social', 'chat', 'messaging', 'community', 'network', 'feed'],
      'IoT': ['sensor', 'device', 'hardware', 'iot', 'embedded', 'arduino', 'raspberry'],
      'AI/ML': ['ai', 'machine learning', 'neural', 'model', 'prediction', 'algorithm'],
      'Media': ['video', 'audio', 'streaming', 'content', 'media', 'publishing'],
      'Real Estate': ['property', 'real estate', 'housing', 'rental', 'mortgage'],
      'Transportation': ['transport', 'delivery', 'logistics', 'shipping', 'travel'],
      'Manufacturing': ['manufacturing', 'production', 'factory', 'industrial', 'supply chain']
    };

    const allText = (description + ' ' + keywords.join(' ')).toLowerCase();

    for (const [industry, patterns] of Object.entries(industryPatterns)) {
      if (patterns.some(pattern => allText.includes(pattern))) {
        return industry;
      }
    }

    return 'Technology';
  }

  private inferBusinessModel(description: string, keywords: string[]): string {
    const modelPatterns = {
      'B2B SaaS': ['api', 'enterprise', 'business', 'dashboard', 'analytics', 'platform'],
      'B2C App': ['user', 'mobile', 'app', 'consumer', 'personal', 'individual'],
      'Marketplace': ['marketplace', 'seller', 'buyer', 'vendor', 'commission', 'listing'],
      'E-commerce': ['shop', 'store', 'product', 'cart', 'checkout', 'inventory'],
      'Freemium': ['free', 'premium', 'subscription', 'tier', 'upgrade', 'plan'],
      'Open Source': ['open source', 'community', 'contribution', 'license', 'github'],
      'API/Platform': ['api', 'sdk', 'developer', 'integration', 'webhook', 'platform'],
      'Subscription': ['subscription', 'recurring', 'monthly', 'annual', 'billing'],
      'On-Demand': ['on-demand', 'instant', 'realtime', 'immediate', 'now']
    };

    const allText = (description + ' ' + keywords.join(' ')).toLowerCase();

    for (const [model, patterns] of Object.entries(modelPatterns)) {
      if (patterns.some(pattern => allText.includes(pattern))) {
        return model;
      }
    }

    return 'Software Product';
  }

  private inferTarget(description: string, keywords: string[]): string {
    const targetPatterns = {
      'Developers': ['developer', 'programmer', 'coder', 'api', 'sdk', 'framework', 'library'],
      'Businesses': ['business', 'enterprise', 'company', 'organization', 'corporate'],
      'Consumers': ['consumer', 'user', 'personal', 'individual', 'family', 'home'],
      'Students': ['student', 'education', 'learning', 'course', 'university', 'school'],
      'Healthcare': ['patient', 'doctor', 'nurse', 'healthcare', 'medical', 'clinic'],
      'Designers': ['designer', 'design', 'creative', 'ui', 'ux', 'graphics'],
      'Marketers': ['marketing', 'advertiser', 'campaign', 'analytics', 'seo', 'social'],
      'Data Scientists': ['data', 'analytics', 'ml', 'ai', 'scientist', 'analysis'],
      'Small Business': ['small business', 'startup', 'entrepreneur', 'freelancer', 'solopreneur'],
      'Enterprises': ['enterprise', 'large', 'corporation', 'team', 'organization']
    };

    const allText = (description + ' ' + keywords.join(' ')).toLowerCase();

    for (const [target, patterns] of Object.entries(targetPatterns)) {
      if (patterns.some(pattern => allText.includes(pattern))) {
        return target;
      }
    }

    return 'General Users';
  }

  private extractSections(content: string, keywords: string[]): string[] {
    const sections: string[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      if (keywords.some(keyword => line.includes(keyword))) {
        // Extract the section content
        let sectionContent = '';
        let j = i + 1;
        
        while (j < lines.length && !lines[j].match(/^#+/)) {
          sectionContent += lines[j] + '\n';
          j++;
        }
        
        if (sectionContent.trim()) {
          sections.push(sectionContent.trim());
        }
      }
    }
    
    return sections;
  }

  private extractBulletPoints(text: string): string[] {
    const points: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[-*+]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        const point = trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '').trim();
        if (point.length > 10) { // Filter out very short points
          points.push(point);
        }
      }
    }
    
    return points;
  }

  private async inferTechAdvantages(): Promise<string[]> {
    const advantages: string[] = [];
    
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const deps = Object.keys(packageJson.dependencies || {});
      
      // Modern tech stack advantages
      if (deps.includes('typescript')) {
        advantages.push('Type-safe development with TypeScript reduces bugs');
      }
      
      if (deps.includes('next') || deps.includes('nuxt')) {
        advantages.push('Server-side rendering for better performance and SEO');
      }
      
      if (deps.some(dep => dep.includes('test'))) {
        advantages.push('Comprehensive testing ensures reliability');
      }
      
      if (deps.includes('graphql')) {
        advantages.push('GraphQL API provides flexible and efficient data fetching');
      }
      
      if (deps.includes('redis')) {
        advantages.push('Redis caching improves application performance');
      }
    }
    
    return advantages;
  }

  private async extractTodos(): Promise<string[]> {
    const todos: string[] = [];
    const glob = require('glob');
    
    try {
      const files = await glob.glob('**/*.{js,ts,jsx,tsx,py,md}', {
        cwd: this.repoPath,
        ignore: ['node_modules/**', '.git/**']
      });
      
      for (const file of files.slice(0, 20)) { // Sample files
        try {
          const content = await fs.readFile(path.join(this.repoPath, file), 'utf-8');
          const todoMatches = content.match(/TODO:?\s*(.+)/gi);
          
          if (todoMatches) {
            todos.push(...todoMatches.map(match => 
              match.replace(/TODO:?\s*/i, '').trim()
            ));
          }
        } catch (error) {
          // Skip files we can't read
        }
      }
    } catch (error) {
      // Ignore glob errors
    }
    
    return todos;
  }

  private async analyzeIntegrationOpportunities(): Promise<string[]> {
    const opportunities: string[] = [];
    
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const deps = Object.keys(packageJson.dependencies || {});
      
      // Suggest complementary integrations
      if (deps.includes('stripe')) {
        opportunities.push('Payment processing with additional providers (PayPal, Square)');
      }
      
      if (deps.includes('sendgrid') || deps.includes('nodemailer')) {
        opportunities.push('Multi-channel communication (SMS, push notifications)');
      }
      
      if (deps.includes('aws-sdk')) {
        opportunities.push('Multi-cloud strategy with Azure or GCP services');
      }
      
      if (deps.some(dep => dep.includes('db') || dep.includes('database'))) {
        opportunities.push('Analytics and business intelligence integrations');
      }
      
      // General integration opportunities
      opportunities.push('API marketplace listings for wider reach');
      opportunities.push('Webhook integration for real-time data sync');
    }
    
    return opportunities;
  }

  private async analyzeOptimizationOpportunities(): Promise<string[]> {
    const opportunities: string[] = [];
    
    // Performance optimizations
    opportunities.push('Implement caching layer for improved response times');
    opportunities.push('Add CDN for global content delivery');
    opportunities.push('Database query optimization for better scalability');
    
    // User experience optimizations
    opportunities.push('Mobile app development for better user engagement');
    opportunities.push('Progressive web app features for offline functionality');
    opportunities.push('A/B testing framework for data-driven improvements');
    
    // Business optimizations
    opportunities.push('Analytics dashboard for business insights');
    opportunities.push('Automated customer onboarding process');
    opportunities.push('Self-service support portal to reduce support load');
    
    return opportunities;
  }

  private inferMarketOpportunities(): string[] {
    const opportunities = [
      'International expansion to emerging markets',
      'Vertical-specific solutions for niche industries',
      'API-first approach to enable partner ecosystem',
      'White-label solutions for B2B2C opportunities',
      'Enterprise features for upmarket expansion',
      'Mobile-first markets with smartphone penetration',
      'Compliance solutions for regulated industries',
      'AI-powered features for competitive differentiation'
    ];
    
    return opportunities.slice(0, 4); // Return subset
  }

  private async analyzeTechnicalRisks(): Promise<string[]> {
    const risks: string[] = [];
    
    // Dependency risks
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const depCount = Object.keys(packageJson.dependencies || {}).length;
      
      if (depCount > 50) {
        risks.push('High dependency count increases security and maintenance risks');
      }
    }
    
    // Architecture risks
    risks.push('Monolithic architecture may limit scalability');
    risks.push('Single point of failure in critical system components');
    risks.push('Lack of automated testing increases bug risk in production');
    
    return risks;
  }

  private analyzeMarketRisks(): string[] {
    return [
      'Competitive pressure from established players',
      'Market saturation in target segment',
      'Technology disruption changing user expectations',
      'Economic downturn affecting customer spending',
      'Regulatory changes impacting business model'
    ];
  }

  private async analyzeOperationalRisks(): string[] {
    const risks: string[] = [];
    
    // Check for operational documentation
    const hasRunbooks = await fs.pathExists(path.join(this.repoPath, 'runbooks')) ||
                        await fs.pathExists(path.join(this.repoPath, 'docs/ops'));
    
    if (!hasRunbooks) {
      risks.push('Lack of operational documentation increases incident response time');
    }
    
    risks.push('Key person dependency for critical system knowledge');
    risks.push('Insufficient monitoring may delay issue detection');
    
    return risks;
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
}