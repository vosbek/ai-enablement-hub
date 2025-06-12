# Repository Prompt Generator

> 🧠 Generate custom AI prompts from your codebase patterns

Transform any repository into a personalized AI assistant by analyzing your code patterns, architecture, and conventions to create contextual prompts for GitHub Copilot and other AI tools.

## 🎯 What It Does

The Repository Prompt Generator analyzes your codebase and creates **custom AI prompts** that:

- ✅ **Use your actual code examples** - Prompts include real code from your project
- ✅ **Follow your patterns** - Respects your naming conventions, architecture, and coding style  
- ✅ **Cover the full SDLC** - From planning to deployment, testing to documentation
- ✅ **Work with any AI tool** - GitHub Copilot, ChatGPT, Claude, etc.
- ✅ **Scale across teams** - Consistent AI assistance for entire organizations

## 🚀 Quick Start

### Installation

```bash
npm install -g repo-prompt-generator
```

### Generate Prompts for Your Project

```bash
# Analyze current directory
rpg analyze .

# Analyze specific project
rpg analyze ./my-project --output MY_PROMPTS.md

# Generate interactive HTML
rpg analyze . --format html --output prompts.html
```

### Use the Generated Prompts

1. **Open the generated file** (e.g., `CUSTOM_PROMPTS.md`)
2. **Copy a prompt** that matches your current task
3. **Open GitHub Copilot Chat** (`Ctrl+Shift+I` or `Cmd+Shift+I`)
4. **Paste and customize** the prompt with your specific code/requirements

## 📊 Example Output

For a React + Express project, you'll get prompts like:

### 🎯 Planning: Feature Planning for Your React App
```
Plan a new feature for our fullstack application:

Feature Requirements: [DESCRIBE YOUR FEATURE]

Our Current Architecture:
- Frontend: React with TypeScript, using custom hooks pattern (see src/hooks/useAuth.ts)
- Backend: Express with middleware pattern (see server/middleware/auth.js)  
- Database: PostgreSQL with Prisma ORM (see prisma/schema.prisma)
- State Management: Context + useReducer pattern (see src/context/AppContext.tsx)

Please provide:
1. Component breakdown - What React components need to be created/modified
2. API design - New endpoints following our RESTful pattern
3. Database changes - Prisma schema updates needed
4. Testing plan - Unit/integration tests following our Jest patterns
```

### ⚡ Implementation: Create React Component Following Your Patterns
```
Implement a React component following our established patterns:

Component Requirements: [YOUR COMPONENT REQUIREMENTS]

Our Component Patterns (from your codebase):
- TypeScript interfaces (see src/types/index.ts)
- Custom hooks for logic (pattern: src/hooks/useAuth.ts)
- Styled-components for styling (see src/components/Button.tsx)
- Error boundaries (see src/components/ErrorBoundary.tsx)

Please create:
1. TypeScript component - Following our patterns above
2. Custom hook - If logic is complex enough to extract
3. Styled components - Consistent with our design system
4. Unit tests - Following our Jest + RTL patterns
```

## 🛠️ Features

### **Comprehensive Analysis**
- **Technology Detection** - Languages, frameworks, databases, tools
- **Architecture Analysis** - Project type, patterns, file structure
- **Code Examples** - Real components, functions, tests from your codebase
- **Quality Metrics** - Maintainability index, complexity, documentation level

### **Smart Prompt Generation**
- **SDLC Coverage** - Planning, implementation, testing, review, deployment
- **Context-Aware** - Uses your actual file paths, naming conventions, patterns
- **Framework-Specific** - Tailored for React, Vue, Express, Django, etc.
- **Best Practices** - Incorporates security, performance, testing patterns

### **Multiple Output Formats**
- **Markdown** - Human-readable documentation format
- **JSON** - Machine-readable for integrations
- **HTML** - Interactive web interface with search and copy buttons

## 📋 Command Reference

### Basic Usage
```bash
# Analyze current directory
rpg analyze .

# Analyze specific path
rpg analyze /path/to/project

# Custom output file
rpg analyze . --output MY_PROMPTS.md
```

### Output Formats
```bash
# Markdown (default)
rpg analyze . --format markdown

# JSON for integrations
rpg analyze . --format json

# Interactive HTML
rpg analyze . --format html
```

### Advanced Options
```bash
# Verbose output
rpg analyze . --verbose

# Include large files
rpg analyze . --max-file-size 2000

# Include dependencies
rpg analyze . --include-node-modules
```

### Utility Commands
```bash
# Show examples and usage
rpg examples

# Validate prompt library
rpg validate prompts.json

# Show help
rpg --help
```

## 🎨 Example Generated Files

### Markdown Output
```markdown
# AI Prompts for `my-saas-app`

## 📊 Repository Analysis
- **Tech Stack**: React, TypeScript, Express, PostgreSQL
- **Architecture**: Monolithic with microservice patterns  
- **Key Patterns**: Custom hooks, HOCs, Express middleware

## 🎯 Planning Phase Prompts
### 1. Feature Planning for My SaaS App
**When to use**: Starting any new feature development...

## ⚡ Implementation Phase Prompts  
### 1. Implement React Component Following Our Patterns
**When to use**: Creating new UI components...
```

### Interactive HTML
- 🔍 **Search functionality** - Find prompts by keywords
- 📋 **One-click copy** - Copy prompts directly to clipboard
- 📱 **Mobile responsive** - Works on all devices
- 🎨 **Beautiful UI** - Professional design with syntax highlighting

## 🏢 Enterprise Usage

### Team Consistency
- **Standardized Prompts** - Everyone uses the same high-quality prompts
- **Pattern Enforcement** - AI suggestions follow your established conventions
- **Knowledge Sharing** - Capture and distribute architectural knowledge

### Multi-Repository Analysis
```bash
# Analyze multiple projects
rpg analyze ./frontend-app --output frontend-prompts.md
rpg analyze ./backend-api --output backend-prompts.md
rpg analyze ./mobile-app --output mobile-prompts.md
```

### CI/CD Integration
```yaml
# .github/workflows/update-prompts.yml
name: Update AI Prompts
on:
  push:
    branches: [main]
jobs:
  generate-prompts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npx repo-prompt-generator analyze . --output PROMPTS.md
      - uses: actions/upload-artifact@v2
        with:
          name: ai-prompts
          path: PROMPTS.md
```

## 🔧 Supported Technologies

### **Languages**
TypeScript, JavaScript, Python, Java, C#, Go, Rust, PHP, Ruby, Swift, Kotlin

### **Frontend Frameworks**  
React, Vue.js, Angular, Svelte, Next.js, Nuxt.js, Gatsby

### **Backend Frameworks**
Express.js, NestJS, Fastify, Django, Flask, Spring Boot, Laravel

### **Databases**
PostgreSQL, MySQL, MongoDB, Redis, SQLite, Prisma, TypeORM

### **Tools & Build Systems**
Webpack, Vite, Jest, Cypress, Docker, GitHub Actions, ESLint, Prettier

## 📈 Benefits

### **For Developers**
- ⚡ **Faster Development** - AI suggestions are immediately relevant
- 🎯 **Better Quality** - Prompts enforce your best practices  
- 📚 **Reduced Learning Curve** - New team members get contextual guidance
- 🔄 **Consistent Patterns** - Everyone follows the same architectural decisions

### **For Teams**
- 🏗️ **Architectural Consistency** - AI maintains your established patterns
- 📖 **Knowledge Capture** - Convert tribal knowledge into reusable prompts
- 🚀 **Faster Onboarding** - New developers immediately understand project conventions
- 📊 **Quality Improvement** - Consistent application of best practices

### **For Organizations**
- 🎯 **Standardization** - Consistent development patterns across projects
- 📈 **Productivity Gains** - Measurable improvements in development velocity
- 🛡️ **Risk Reduction** - Fewer bugs through consistent pattern application
- 💡 **Innovation** - Developers spend more time on business logic, less on boilerplate

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/your-org/repo-prompt-generator
cd repo-prompt-generator
npm install
npm run build
npm run dev
```

### Running Tests
```bash
npm test
npm run test:integration
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: [Full documentation](https://docs.example.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/repo-prompt-generator/issues)
- 💬 **Discussion**: [GitHub Discussions](https://github.com/your-org/repo-prompt-generator/discussions)
- 📧 **Enterprise Support**: enterprise@example.com

---

**Made with ❤️ by the AI Enablement Team**

*Transforming codebases into AI-powered development experiences*