---
title: "Code Review Assistant"
category: "quality"
difficulty: "beginner"
tags: ["review", "quality", "security", "best-practices"]
effectiveness: 4.8
usage_count: 2847
last_updated: "2024-12-06"
vscode_command: "enterprise.tryPrompt"
---

# Code Review Assistant

**Purpose**: Get comprehensive code review feedback with security, performance, and maintainability suggestions.

## Prompt Template

```
Please review this code for:

1. **Security vulnerabilities** - Check for common security issues
2. **Performance optimizations** - Identify bottlenecks and improvements  
3. **Code quality** - Assess readability, maintainability, and best practices
4. **Bug potential** - Spot logic errors or edge cases
5. **Documentation** - Suggest improvements to comments and naming

**Code to review:**
```
[PASTE YOUR CODE HERE]
```

**Context:** [Describe what this code does and any specific concerns]

Please provide:
- Priority level for each issue (High/Medium/Low)
- Specific line references
- Suggested fixes with code examples
- Explanation of why each change improves the code
```

## Example Usage

### Input Code:
```javascript
function getUserData(id) {
  const user = database.query("SELECT * FROM users WHERE id = " + id);
  if (user) {
    return {
      name: user.name,
      email: user.email,
      password: user.password
    };
  }
  return null;
}
```

### AI Response:
```
**🔴 HIGH PRIORITY ISSUES:**

1. **SQL Injection Vulnerability (Line 2)**
   - Issue: Direct string concatenation in SQL query
   - Risk: Attackers can inject malicious SQL
   - Fix: Use parameterized queries
   ```javascript
   const user = database.query("SELECT * FROM users WHERE id = ?", [id]);
   ```

2. **Password Exposure (Line 7)**
   - Issue: Returning password hash in response
   - Risk: Sensitive data leakage
   - Fix: Remove password from return object

**🟡 MEDIUM PRIORITY:**

3. **Error Handling (Lines 2-9)**
   - Issue: No error handling for database failures
   - Fix: Add try-catch and proper error responses

**Improved Code:**
```javascript
async function getUserData(id) {
  try {
    const user = await database.query(
      "SELECT id, name, email FROM users WHERE id = ?", 
      [id]
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      name: user.name,
      email: user.email
    };
  } catch (error) {
    logger.error('Database query failed:', error);
    throw new Error('Failed to retrieve user data');
  }
}
```
```

## Try This Prompt

<div class="prompt-actions">
  <button onclick="copyPrompt()" class="btn-copy">📋 Copy Prompt</button>
  <button onclick="openInVSCode('code-review')" class="btn-vscode">
    <img src="/assets/vscode-icon.svg" alt="VS Code" width="16"> Try in VS Code
  </button>
  <button onclick="openPlayground('code-review')" class="btn-playground">🧪 Open Playground</button>
</div>

## Variations

### For Different Languages:
- **Python**: Add checks for PEP 8 compliance, type hints
- **Java**: Include Spring Boot security patterns, performance annotations
- **TypeScript**: Focus on type safety, strict mode compliance
- **Go**: Emphasize error handling patterns, race condition detection

### For Different Contexts:
- **Legacy Code Review**: "Focus on modernization opportunities and technical debt"
- **Security-Critical Review**: "Prioritize OWASP Top 10 vulnerabilities and data protection"
- **Performance-Critical Review**: "Emphasize optimization, caching, and scalability"

## Team Customization

Add your team's specific requirements:

```
Additional company standards to check:
- Follow [Your Company] coding standards document
- Ensure compliance with [Your Industry] regulations
- Check against our security checklist: [link]
- Validate performance meets [Your SLA] requirements
```

## Success Metrics

- **Effectiveness Rating**: ⭐⭐⭐⭐⭐ (4.8/5)
- **Usage**: 2,847 times by 245 developers
- **Time Saved**: Average 15 minutes per review
- **Bugs Prevented**: 127 security issues caught

<script>
function copyPrompt() {
  const promptText = document.querySelector('pre code').textContent;
  navigator.clipboard.writeText(promptText).then(() => {
    alert('Prompt copied to clipboard!');
  });
}

function openInVSCode(promptId) {
  window.postMessage({
    command: 'openPromptInVSCode',
    promptId: promptId
  }, '*');
}

function openPlayground(promptId) {
  window.postMessage({
    command: 'openAIPlayground',
    promptId: promptId
  }, '*');
}
</script>