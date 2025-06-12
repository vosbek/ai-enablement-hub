# Repository Prompt Generator - MVP Roadmap

## 🎯 Phase 1: Core Analysis Engine (Week 1-2)

### Core Features
- **Technology Detection**: Scan package.json, requirements.txt, etc.
- **File Structure Analysis**: Understand project organization
- **Pattern Recognition**: Identify common coding patterns
- **Code Example Extraction**: Pull representative code snippets

### Deliverable
```bash
npm install -g repo-prompt-generator
rpg analyze ./my-project --output custom-prompts.md
```

## 🔧 Phase 2: VS Code Extension (Week 3-4)

### Features
- **One-click Analysis**: Right-click folder → "Generate AI Prompts"
- **Prompt Library View**: Sidebar with generated prompts
- **Context-aware Suggestions**: Suggest prompts based on current file
- **Copy to Copilot**: One-click copy to GitHub Copilot Chat

### User Flow
```
1. Install extension
2. Open project in VS Code
3. Run "Analyze Repository" command
4. Browse generated prompts in sidebar
5. Click "Copy to Copilot" → Paste in Ctrl+Shift+I
```

## 📊 Phase 3: Enterprise Aggregation (Week 5-6)

### Features
- **Multi-repo Analysis**: Analyze entire GitHub organization
- **Pattern Discovery**: Find common patterns across repos
- **Enterprise Prompt Library**: Centralized, searchable prompts
- **Usage Analytics**: Track which prompts are most effective

### Architecture
```typescript
interface EnterpriseService {
  analyzeOrganization(githubOrg: string): Promise<OrgAnalysis>;
  generateEnterpriseLibrary(analyses: RepoAnalysis[]): PromptLibrary;
  trackUsage(promptId: string, feedback: UsageFeedback): void;
}
```

## 📋 Sample Generated Output

```markdown
# AI Prompts for `insurance-claims-api`

Generated on: December 6, 2024
Repository: https://github.com/company/insurance-claims-api

## 📊 Analysis Summary
- **Primary Language**: TypeScript (78%)
- **Framework**: Express.js with Prisma ORM
- **Architecture**: RESTful API with middleware pattern
- **Test Coverage**: 65% (Jest + Supertest)
- **Key Patterns**: Async/await, Error middleware, DTO validation

---

## 🎯 Custom Prompts for Your Codebase

### 1. 🏗️ Planning: Design New Claims Feature
**When to use**: Starting any new claims-related feature
**Context**: Based on your claims domain models and API patterns

```
Design a new feature for our insurance claims API:

Feature Requirements: [DESCRIBE YOUR FEATURE]

Our Current Claims Architecture:
- Claims Model: See src/models/Claim.ts - we use status workflow (submitted → under_review → approved/denied)
- API Pattern: RESTful endpoints in src/routes/claims.js following our middleware chain
- Business Rules: Complex validation in src/services/ClaimsService.ts
- Database: PostgreSQL with Prisma, using our audit trail pattern

Example Claim Flow (from your codebase):
POST /api/claims → ClaimValidationMiddleware → ClaimsController.create → ClaimsService.processNewClaim

Real Example from your code:
[Actual code snippet from src/controllers/ClaimsController.ts]

Please design:
1. **API endpoints** - Following our RESTful pattern
2. **Database schema** - Prisma migrations needed
3. **Business logic** - Service layer implementation
4. **Validation rules** - Using our Joi patterns
5. **Test scenarios** - Coverage for claims workflows
```

### 2. ⚡ Implementation: Add Claims API Endpoint
**When to use**: Creating new claims-related endpoints
**Context**: Follows your Express + Prisma patterns

```
Implement a new claims API endpoint following our established patterns:

Endpoint Requirements: [YOUR REQUIREMENTS]

Our Express.js Patterns (from your actual code):
- Route Structure: src/routes/[resource].js with express.Router()
- Middleware Chain: authMiddleware → validateSchema → controller → errorHandler
- Response Format: { success: boolean, data: ClaimDTO, metadata?: object }
- Error Handling: Custom AppError classes (see src/utils/errors/)

Your Typical Controller Pattern:
[Actual code from src/controllers/ClaimsController.ts showing your patterns]

Your Service Layer Pattern:
[Actual code from src/services/ClaimsService.ts showing business logic]

Your Database Pattern:
[Actual Prisma usage from your codebase]

Please implement:
1. **Route definition** - In src/routes/claims.js following our pattern
2. **Controller method** - Business logic orchestration
3. **Service layer** - Core business rules
4. **Validation schema** - Joi schema for request validation
5. **Error handling** - Using our AppError patterns
6. **Unit tests** - Following our Jest + Supertest patterns in tests/
```

### 3. 🧪 Testing: Test Claims Processing Logic
**When to use**: Adding tests for claims functionality
**Context**: Your Jest + Supertest testing patterns

```
Write comprehensive tests for claims processing logic:

Code to Test: [YOUR CLAIMS CODE]

Our Testing Patterns (from your actual tests):
- Test Structure: describe/it blocks with clear test names
- Setup/Teardown: beforeEach for database seeding (see tests/setup.js)
- Mocking: Mock external services like payment gateway (see tests/mocks/)
- Assertions: Expect patterns for success/error cases

Your Actual Test Example:
[Real test from tests/claims/ClaimsController.test.js]

Your Database Test Pattern:
[How you handle test data in tests/fixtures/]

Your Mock Patterns:
[How you mock external services from tests/mocks/]

Please create:
1. **Unit tests** - Test individual functions in isolation
2. **Integration tests** - Test full request/response cycles
3. **Database tests** - Test Prisma operations and constraints
4. **Mock setup** - For external payment/notification services
5. **Edge cases** - Invalid claims, boundary conditions, error scenarios
```

### 4. 🔍 Code Review: Review Claims Implementation
**When to use**: Before merging claims-related code
**Context**: Your code quality standards and patterns

```
Review this claims-related code for our insurance API:

Code to Review:
```
[YOUR CODE HERE]
```

Our Code Quality Standards (based on your codebase):
- TypeScript: Strict typing, proper interfaces (see src/types/)
- Error Handling: Consistent AppError usage and proper async/await
- Database: Proper Prisma usage with transactions for critical operations
- Security: Input validation, SQL injection prevention, audit logging
- Performance: Efficient queries, proper indexing considerations

Patterns in Our Codebase:
- Claims Processing: Follow the state machine pattern (see ClaimsService.ts)
- Audit Trail: Every claim change must be logged (see AuditService.ts)
- Validation: Use Joi schemas consistently (see src/validation/)
- Documentation: JSDoc for public methods (see existing patterns)

Please review for:
1. **Code Quality** - TypeScript usage, error handling, async patterns
2. **Security** - Input validation, authorization, data sanitization
3. **Performance** - Query optimization, N+1 problems, caching opportunities
4. **Maintainability** - Code organization, naming, documentation
5. **Testing** - Adequate test coverage for critical paths
6. **Business Logic** - Follows our claims workflow requirements
```

### 5. 🚀 Deployment: Deploy Claims Feature
**When to use**: Deploying claims-related changes
**Context**: Your deployment pipeline and infrastructure

```
Deploy the new claims feature following our deployment process:

Changes to Deploy: [DESCRIBE YOUR CHANGES]

Our Deployment Context:
- Infrastructure: AWS ECS with Docker containers
- Database: RDS PostgreSQL with migration scripts
- CI/CD: GitHub Actions → staging → production
- Monitoring: CloudWatch + our custom health checks

Pre-deployment Checklist (based on your process):
- [ ] Database migrations tested in staging
- [ ] Environment variables updated
- [ ] Feature flags configured (if applicable)
- [ ] Monitoring alerts configured

Your Deployment Pipeline:
[Reference to actual .github/workflows/ or deployment scripts]

Please create:
1. **Migration script** - Prisma migration for database changes
2. **Environment config** - New variables needed
3. **Deployment plan** - Step-by-step rollout strategy
4. **Rollback plan** - How to quickly revert if issues occur
5. **Monitoring setup** - Health checks and alerting
6. **Documentation** - Update API docs and runbooks
```

---

## 🔧 Usage Instructions

### How to Use These Prompts:
1. **Copy the prompt** that matches your current task
2. **Replace placeholders** with your specific requirements/code
3. **Open GitHub Copilot Chat** (Ctrl+Shift+I in VS Code)
4. **Paste and execute** the customized prompt

### When to Use Each Prompt:
- **Planning prompts**: Start of new features or major changes
- **Implementation prompts**: During active coding
- **Testing prompts**: When writing tests or ensuring coverage
- **Review prompts**: Before code reviews or merges
- **Deployment prompts**: When preparing for production releases

### Pro Tips:
- 📝 **Be specific**: Replace placeholders with actual requirements
- 🔄 **Iterate**: Use multiple prompts for complex features
- 📚 **Reference examples**: The real code examples are your best guide
- 🤝 **Share with team**: These prompts work for all team members

---

Generated by Repository Prompt Generator v1.0
Need help? Contact your AI Enablement team
```

## 🎯 Next Steps for You

I recommend starting with:

1. **Build the CLI MVP** first (simplest to validate concept)
2. **Create the VS Code extension** (where the real value is)
3. **Add enterprise aggregation** (scale across your organization)

Would you like me to start building the CLI tool or VS Code extension? I can create the actual working code for either approach!