---
title: "Create Integration Tests"
category: "testing"
difficulty: "intermediate"
tags: ["testing", "integration", "api", "automation"]
effectiveness: 4.7
usage_count: 89
last_updated: "2024-12-06"
---

# Create Integration Tests

**Purpose**: Create comprehensive integration tests that verify component interactions, API endpoints, and system workflows.

## 📝 Prompt Template

```
Create integration tests for this system:

```
[YOUR APPLICATION/API/SYSTEM HERE]
```

Please create:
1. **Test scenarios** - Cover main user workflows and system interactions
2. **API endpoint tests** - Test all HTTP methods, status codes, and responses
3. **Database integration** - Test data persistence and retrieval
4. **External service mocks** - Mock third-party APIs and services
5. **Error scenarios** - Test failure cases and error handling
6. **Test data setup** - Create fixtures and seed data for tests
7. **CI/CD integration** - Make tests suitable for automated pipelines

Include test runners, assertions, and comprehensive coverage of system behavior.
```

## 💻 Example Usage

### Before (Input Code):
```javascript
// Express API with user authentication and order management
app.post('/api/auth/login', loginHandler);
app.get('/api/users/profile', requireAuth, getProfile);
app.post('/api/orders', requireAuth, createOrder);
app.get('/api/orders/:id', requireAuth, getOrder);
app.put('/api/orders/:id/status', requireAuth, updateOrderStatus);

// Database models: User, Order, Product
// External services: PaymentService, EmailService
```

### After (AI Result):
```javascript
// integration.test.js - Comprehensive integration test suite

const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const app = require('../app');
const db = require('../database');
const PaymentService = require('../services/PaymentService');
const EmailService = require('../services/EmailService');

describe('Integration Tests', () => {
  let authToken;
  let testUser;
  let testOrder;

  // Test data fixtures
  const fixtures = {
    validUser: {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'customer'
    },
    validProduct: {
      id: 'prod_123',
      name: 'Test Product',
      price: 99.99,
      inventory: 10
    },
    validOrder: {
      items: [
        { productId: 'prod_123', quantity: 2 }
      ],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        zipCode: '12345'
      }
    }
  };

  before(async () => {
    // Setup test database
    await db.migrate.latest();
    await db.seed.run();
    
    // Create test user
    testUser = await db('users').insert(fixtures.validUser).returning('*');
    
    // Create test product
    await db('products').insert(fixtures.validProduct);
  });

  after(async () => {
    // Cleanup test database
    await db.migrate.rollback();
    await db.destroy();
  });

  beforeEach(() => {
    // Reset all stubs before each test
    sinon.restore();
  });

  describe('Authentication Flow', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'newpassword123',
        name: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).to.have.property('token');
      expect(response.body.user).to.include({
        email: newUser.email,
        name: newUser.name
      });
      expect(response.body.user).to.not.have.property('password');
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: fixtures.validUser.email,
          password: fixtures.validUser.password
        })
        .expect(200);

      expect(response.body).to.have.property('token');
      expect(response.body.user.email).to.equal(fixtures.validUser.email);
      
      // Store token for subsequent tests
      authToken = response.body.token;
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: fixtures.validUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error).to.include('Invalid credentials');
    });

    it('should protect authenticated routes', async () => {
      await request(app)
        .get('/api/users/profile')
        .expect(401);

      await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('User Profile Management', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.include({
        email: fixtures.validUser.email,
        name: fixtures.validUser.name
      });
      expect(response.body).to.not.have.property('password');
    });

    it('should update user profile', async () => {
      const updates = {
        name: 'Updated Name',
        phone: '555-1234'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).to.include(updates);
    });

    it('should validate profile update data', async () => {
      const invalidUpdates = {
        email: 'invalid-email',
        name: ''
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body.errors).to.be.an('array');
      expect(response.body.errors).to.have.length.greaterThan(0);
    });
  });

  describe('Order Management Workflow', () => {
    it('should create order successfully', async () => {
      // Mock external services
      const paymentStub = sinon.stub(PaymentService, 'processPayment')
        .resolves({ success: true, transactionId: 'txn_123' });
      
      const emailStub = sinon.stub(EmailService, 'sendOrderConfirmation')
        .resolves({ messageId: 'msg_123' });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...fixtures.validOrder,
          paymentMethod: {
            type: 'credit_card',
            token: 'pm_test_123'
          }
        })
        .expect(201);

      expect(response.body).to.have.property('id');
      expect(response.body.status).to.equal('pending');
      expect(response.body.items).to.have.length(1);
      expect(response.body.total).to.equal(199.98); // 2 * 99.99

      // Verify external service calls
      expect(paymentStub.calledOnce).to.be.true;
      expect(emailStub.calledOnce).to.be.true;

      testOrder = response.body;
    });

    it('should handle payment failure', async () => {
      // Mock payment failure
      sinon.stub(PaymentService, 'processPayment')
        .resolves({ success: false, error: 'Insufficient funds' });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...fixtures.validOrder,
          paymentMethod: {
            type: 'credit_card',
            token: 'pm_test_fail'
          }
        })
        .expect(400);

      expect(response.body.error).to.include('Payment failed');
    });

    it('should validate order data', async () => {
      const invalidOrder = {
        items: [], // Empty items
        shippingAddress: {
          street: '', // Missing required field
          city: 'Test City'
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOrder)
        .expect(400);

      expect(response.body.errors).to.be.an('array');
    });

    it('should get order details', async () => {
      const response = await request(app)
        .get(`/api/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).to.equal(testOrder.id);
      expect(response.body.items).to.be.an('array');
      expect(response.body.shippingAddress).to.be.an('object');
    });

    it('should prevent access to other users orders', async () => {
      // Create another user and get their token
      const otherUser = await db('users').insert({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      }).returning('*');

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@example.com',
          password: 'password123'
        });

      const otherToken = loginResponse.body.token;

      // Try to access original user's order
      await request(app)
        .get(`/api/orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should update order status', async () => {
      const response = await request(app)
        .put(`/api/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'shipped' })
        .expect(200);

      expect(response.body.status).to.equal('shipped');
    });

    it('should validate status transitions', async () => {
      // Try invalid status transition
      const response = await request(app)
        .put(`/api/orders/${testOrder.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'cancelled' })
        .expect(400);

      expect(response.body.error).to.include('Invalid status transition');
    });
  });

  describe('Database Integration', () => {
    it('should handle database connection errors', async () => {
      // Temporarily break database connection
      const originalQuery = db.raw;
      sinon.stub(db, 'raw').rejects(new Error('Connection lost'));

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.error).to.include('Database error');
    });

    it('should maintain data consistency', async () => {
      // Verify that order creation updates product inventory
      const productBefore = await db('products')
        .where('id', fixtures.validProduct.id)
        .first();

      // Mock successful payment
      sinon.stub(PaymentService, 'processPayment')
        .resolves({ success: true, transactionId: 'txn_456' });

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fixtures.validOrder)
        .expect(201);

      const productAfter = await db('products')
        .where('id', fixtures.validProduct.id)
        .first();

      expect(productAfter.inventory).to.equal(
        productBefore.inventory - fixtures.validOrder.items[0].quantity
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).to.include('Invalid JSON');
    });

    it('should handle missing required headers', async () => {
      await request(app)
        .post('/api/orders')
        .send(fixtures.validOrder)
        .expect(401);
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests
      const promises = Array(100).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: fixtures.validUser.email,
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(promises);
      
      // Some responses should be rate limited
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).to.be.greaterThan(0);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent requests', async () => {
      // Create multiple concurrent orders
      const orderPromises = Array(10).fill().map(() => {
        sinon.stub(PaymentService, 'processPayment')
          .resolves({ success: true, transactionId: `txn_${Date.now()}` });

        return request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send(fixtures.validOrder);
      });

      const responses = await Promise.all(orderPromises);
      
      // All orders should be created successfully
      responses.forEach(response => {
        expect(response.status).to.equal(201);
      });
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).to.be.lessThan(1000); // Less than 1 second
    });
  });
});

// Utility functions for test setup
class TestHelpers {
  static async createTestUser(userData = {}) {
    const defaultData = {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User'
    };

    const user = await db('users').insert({
      ...defaultData,
      ...userData
    }).returning('*');

    return user[0];
  }

  static async authenticateUser(email, password) {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    return response.body.token;
  }

  static async cleanupTestData() {
    await db('order_items').del();
    await db('orders').del();
    await db('products').del();
    await db('users').del();
  }

  static createMockPaymentService() {
    return {
      processPayment: sinon.stub().resolves({
        success: true,
        transactionId: 'txn_test_123'
      }),
      refundPayment: sinon.stub().resolves({
        success: true,
        refundId: 'ref_test_123'
      })
    };
  }
}

module.exports = { TestHelpers };
```

```json
// package.json test scripts
{
  "scripts": {
    "test": "mocha test/**/*.test.js --timeout 5000",
    "test:integration": "mocha test/integration/*.test.js --timeout 10000",
    "test:watch": "mocha test/**/*.test.js --watch",
    "test:coverage": "nyc mocha test/**/*.test.js",
    "test:ci": "npm run test:coverage && npm run test:integration"
  },
  "nyc": {
    "exclude": [
      "test/**",
      "coverage/**"
    ],
    "reporter": [
      "text",
      "html",
      "lcov"
    ]
  }
}
```

```yaml
# .github/workflows/test.yml - CI/CD Integration
name: Integration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run database migrations
      run: npm run db:migrate
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db

    - name: Run integration tests
      run: npm run test:ci
      env:
        NODE_ENV: test
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379

    - name: Upload coverage reports
      uses: codecov/codecov-action@v2
      with:
        file: ./coverage/lcov.info
```

## 🎯 What This Accomplishes

- **Complete Coverage**: Tests all major workflows and edge cases
- **Real Integration**: Tests actual database and service interactions
- **Mocking Strategy**: Isolates external dependencies while testing integration points
- **Performance Validation**: Includes load testing and response time checks
- **CI/CD Ready**: Automated testing pipeline with coverage reports

## 📊 Test Coverage Areas

| Test Type | Coverage | Examples |
|-----------|----------|----------|
| **Authentication** | Login, logout, token validation | JWT handling, password validation |
| **API Endpoints** | All CRUD operations | HTTP status codes, response formats |
| **Database** | Data persistence, transactions | CRUD operations, data consistency |
| **External Services** | Third-party API calls | Payment processing, email sending |
| **Error Handling** | All failure scenarios | Network errors, validation failures |
| **Performance** | Load and stress testing | Concurrent requests, response times |

## 📋 Copy This Prompt

<div class="copy-section">
<button class="copy-btn" onclick="copyToClipboard('create-integration-tests')">📋 Copy Prompt</button>
<span class="copy-feedback" id="copy-feedback-create-integration-tests"></span>
</div>