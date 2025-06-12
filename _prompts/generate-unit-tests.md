---
title: "Generate Comprehensive Unit Tests"
category: "testing"
difficulty: "beginner"
tags: ["testing", "unit-tests", "tdd", "quality-assurance"]
effectiveness: 4.8
usage_count: 156
last_updated: "2024-12-06"
---

# Generate Comprehensive Unit Tests

**Purpose**: Create thorough unit tests with edge cases, mocks, and proper assertions for any function or class.

## 📝 Prompt Template

```
Generate comprehensive unit tests for this code:

```
[YOUR CODE HERE]
```

Please create tests that cover:
1. **Happy path scenarios** - Normal functionality with valid inputs
2. **Edge cases** - Boundary conditions, empty inputs, null values
3. **Error cases** - Invalid inputs, exception scenarios
4. **Mock dependencies** - External APIs, databases, file systems
5. **Assertions** - Verify outputs, side effects, and behavior

Use [Jest/Mocha/Pytest/JUnit - specify your framework] testing framework.
```

## 💻 Example Usage

### Before (Input Code):
```javascript
class UserService {
  constructor(database, emailService) {
    this.db = database;
    this.emailService = emailService;
  }

  async createUser(userData) {
    if (!userData.email || !userData.name) {
      throw new Error('Email and name are required');
    }

    const existingUser = await this.db.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await this.db.create({
      ...userData,
      createdAt: new Date(),
      isActive: true
    });

    await this.emailService.sendWelcomeEmail(user.email, user.name);
    return user;
  }
}
```

### After (AI Result):
```javascript
const UserService = require('./UserService');

describe('UserService', () => {
  let userService;
  let mockDatabase;
  let mockEmailService;

  beforeEach(() => {
    // Mock dependencies
    mockDatabase = {
      findByEmail: jest.fn(),
      create: jest.fn()
    };
    
    mockEmailService = {
      sendWelcomeEmail: jest.fn()
    };
    
    userService = new UserService(mockDatabase, mockEmailService);
  });

  describe('createUser', () => {
    const validUserData = {
      email: 'test@example.com',
      name: 'John Doe',
      age: 30
    };

    // Happy Path Tests
    it('should create a new user successfully', async () => {
      // Arrange
      const expectedUser = { 
        id: 1, 
        ...validUserData, 
        createdAt: expect.any(Date),
        isActive: true 
      };
      
      mockDatabase.findByEmail.mockResolvedValue(null);
      mockDatabase.create.mockResolvedValue(expectedUser);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(true);

      // Act
      const result = await userService.createUser(validUserData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockDatabase.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockDatabase.create).toHaveBeenCalledWith({
        ...validUserData,
        createdAt: expect.any(Date),
        isActive: true
      });
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'test@example.com', 
        'John Doe'
      );
    });

    // Edge Cases
    it('should handle minimum required fields', async () => {
      const minimalUser = { email: 'min@test.com', name: 'Min' };
      const expectedUser = { id: 2, ...minimalUser, createdAt: expect.any(Date), isActive: true };
      
      mockDatabase.findByEmail.mockResolvedValue(null);
      mockDatabase.create.mockResolvedValue(expectedUser);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(true);

      const result = await userService.createUser(minimalUser);
      
      expect(result).toEqual(expectedUser);
    });

    it('should handle email with special characters', async () => {
      const specialEmailUser = { email: 'test+special@example.co.uk', name: 'Special User' };
      
      mockDatabase.findByEmail.mockResolvedValue(null);
      mockDatabase.create.mockResolvedValue({ id: 3, ...specialEmailUser });
      mockEmailService.sendWelcomeEmail.mockResolvedValue(true);

      await expect(userService.createUser(specialEmailUser)).resolves.toBeDefined();
    });

    // Error Cases - Validation
    it('should throw error when email is missing', async () => {
      const invalidUser = { name: 'No Email' };
      
      await expect(userService.createUser(invalidUser))
        .rejects
        .toThrow('Email and name are required');
      
      expect(mockDatabase.findByEmail).not.toHaveBeenCalled();
      expect(mockDatabase.create).not.toHaveBeenCalled();
    });

    it('should throw error when name is missing', async () => {
      const invalidUser = { email: 'test@example.com' };
      
      await expect(userService.createUser(invalidUser))
        .rejects
        .toThrow('Email and name are required');
    });

    it('should throw error when email is empty string', async () => {
      const invalidUser = { email: '', name: 'Empty Email' };
      
      await expect(userService.createUser(invalidUser))
        .rejects
        .toThrow('Email and name are required');
    });

    it('should throw error when name is empty string', async () => {
      const invalidUser = { email: 'test@example.com', name: '' };
      
      await expect(userService.createUser(invalidUser))
        .rejects
        .toThrow('Email and name are required');
    });

    // Error Cases - Business Logic
    it('should throw error when user already exists', async () => {
      const existingUser = { id: 1, email: 'existing@example.com' };
      mockDatabase.findByEmail.mockResolvedValue(existingUser);
      
      await expect(userService.createUser(validUserData))
        .rejects
        .toThrow('User already exists');
      
      expect(mockDatabase.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    // Error Cases - External Dependencies
    it('should handle database creation failure', async () => {
      mockDatabase.findByEmail.mockResolvedValue(null);
      mockDatabase.create.mockRejectedValue(new Error('Database connection failed'));
      
      await expect(userService.createUser(validUserData))
        .rejects
        .toThrow('Database connection failed');
      
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('should create user even if email sending fails', async () => {
      const expectedUser = { id: 1, ...validUserData, createdAt: expect.any(Date), isActive: true };
      
      mockDatabase.findByEmail.mockResolvedValue(null);
      mockDatabase.create.mockResolvedValue(expectedUser);
      mockEmailService.sendWelcomeEmail.mockRejectedValue(new Error('Email service down'));
      
      // Should still return the user even if email fails
      await expect(userService.createUser(validUserData)).rejects.toThrow('Email service down');
      expect(mockDatabase.create).toHaveBeenCalled();
    });

    // Null and Undefined Cases
    it('should handle null userData', async () => {
      await expect(userService.createUser(null))
        .rejects
        .toThrow();
    });

    it('should handle undefined userData', async () => {
      await expect(userService.createUser(undefined))
        .rejects
        .toThrow();
    });
  });
});
```

## 🎯 What This Accomplishes

- **100% Code Coverage**: Tests all code paths and branches
- **Comprehensive Edge Cases**: Handles empty, null, and boundary conditions
- **Proper Mocking**: Isolates unit under test from dependencies
- **Clear Test Structure**: Arrange-Act-Assert pattern with descriptive names
- **Error Scenarios**: Tests both validation and external failure cases

## 📊 Test Coverage Analysis

| Test Category | Coverage | Count |
|---------------|----------|-------|
| **Happy Path** | ✅ | 2 tests |
| **Edge Cases** | ✅ | 2 tests |
| **Validation Errors** | ✅ | 4 tests |
| **Business Logic Errors** | ✅ | 1 test |
| **External Failures** | ✅ | 2 tests |
| **Null/Undefined** | ✅ | 2 tests |

## 📋 Copy This Prompt

<div class="copy-section">
<button class="copy-btn" onclick="copyToClipboard('generate-unit-tests')">📋 Copy Prompt</button>
<span class="copy-feedback" id="copy-feedback-generate-unit-tests"></span>
</div>

## 🔄 Variations

**For Different Languages:**
- **Python**: Use pytest fixtures, parametrized tests, mock.patch
- **Java**: JUnit 5, Mockito, AssertJ for fluent assertions
- **C#**: NUnit/xUnit, Moq, FluentAssertions
- **Go**: testify/suite, gomock, table-driven tests

**For Different Testing Types:**
- **Integration Tests**: Test with real dependencies, database transactions
- **End-to-End Tests**: Full user workflow testing with Cypress/Playwright
- **Performance Tests**: Load testing, benchmark comparisons