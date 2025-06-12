---
title: "Add Comprehensive Logging"
category: "quality"
difficulty: "beginner"
tags: ["logging", "debugging", "monitoring", "observability"]
effectiveness: 4.6
usage_count: 134
last_updated: "2024-12-06"
---

# Add Comprehensive Logging

**Purpose**: Add proper logging statements for debugging, monitoring, and observability.

## 📝 Prompt Template

```
Add comprehensive logging to this code:

```
[YOUR CODE HERE]
```

Please add:
1. **Entry/exit logging** - Function start and completion
2. **Error logging** - All error conditions with context
3. **Performance logging** - Execution time for important operations
4. **Business logic logging** - Key decisions and state changes
5. **Structured logging** - Use consistent format with metadata

Use appropriate log levels (debug, info, warn, error) and include relevant context.
```

## 💻 Example Usage

### Before (Input Code):
```javascript
async function processPayment(orderId, paymentData) {
  const order = await getOrder(orderId);
  
  if (order.status !== 'pending') {
    throw new Error('Order is not in pending status');
  }
  
  const paymentResult = await paymentGateway.charge(
    paymentData.amount,
    paymentData.token
  );
  
  if (paymentResult.success) {
    await updateOrderStatus(orderId, 'paid');
    await sendConfirmationEmail(order.customerEmail);
    return { success: true, transactionId: paymentResult.id };
  } else {
    await updateOrderStatus(orderId, 'failed');
    throw new Error(paymentResult.errorMessage);
  }
}
```

### After (AI Result):
```javascript
const logger = require('./logger'); // Assume structured logger

async function processPayment(orderId, paymentData) {
  const startTime = Date.now();
  const logContext = {
    orderId,
    amount: paymentData.amount,
    operation: 'processPayment'
  };
  
  logger.info('Payment processing started', logContext);
  
  try {
    // Log order retrieval
    logger.debug('Fetching order details', { orderId });
    const order = await getOrder(orderId);
    
    logger.info('Order retrieved successfully', {
      ...logContext,
      orderStatus: order.status,
      customerEmail: order.customerEmail
    });
    
    // Validate order status
    if (order.status !== 'pending') {
      logger.warn('Payment attempted on non-pending order', {
        ...logContext,
        currentStatus: order.status,
        expectedStatus: 'pending'
      });
      throw new Error('Order is not in pending status');
    }
    
    // Log payment gateway call
    logger.info('Initiating payment gateway charge', {
      ...logContext,
      gateway: 'stripe', // or whatever gateway
      maskedToken: paymentData.token.slice(-4) // Only log last 4 characters
    });
    
    const paymentResult = await paymentGateway.charge(
      paymentData.amount,
      paymentData.token
    );
    
    logger.info('Payment gateway response received', {
      ...logContext,
      success: paymentResult.success,
      transactionId: paymentResult.id,
      gatewayResponseTime: Date.now() - startTime
    });
    
    if (paymentResult.success) {
      logger.info('Payment successful, updating order status', {
        ...logContext,
        transactionId: paymentResult.id,
        newStatus: 'paid'
      });
      
      await updateOrderStatus(orderId, 'paid');
      
      logger.debug('Order status updated successfully', {
        ...logContext,
        status: 'paid'
      });
      
      // Send confirmation email
      logger.info('Sending confirmation email', {
        ...logContext,
        recipientEmail: order.customerEmail
      });
      
      try {
        await sendConfirmationEmail(order.customerEmail);
        logger.info('Confirmation email sent successfully', {
          ...logContext,
          recipientEmail: order.customerEmail
        });
      } catch (emailError) {
        // Don't fail the payment if email fails, but log it
        logger.error('Failed to send confirmation email', {
          ...logContext,
          error: emailError.message,
          recipientEmail: order.customerEmail
        });
      }
      
      const totalProcessingTime = Date.now() - startTime;
      logger.info('Payment processing completed successfully', {
        ...logContext,
        transactionId: paymentResult.id,
        processingTimeMs: totalProcessingTime,
        result: 'success'
      });
      
      return { 
        success: true, 
        transactionId: paymentResult.id 
      };
      
    } else {
      logger.warn('Payment failed, updating order status', {
        ...logContext,
        errorMessage: paymentResult.errorMessage,
        errorCode: paymentResult.errorCode,
        newStatus: 'failed'
      });
      
      await updateOrderStatus(orderId, 'failed');
      
      logger.info('Order status updated to failed', {
        ...logContext,
        status: 'failed'
      });
      
      const error = new Error(paymentResult.errorMessage);
      error.code = paymentResult.errorCode;
      
      logger.error('Payment processing failed', {
        ...logContext,
        error: error.message,
        errorCode: error.code,
        processingTimeMs: Date.now() - startTime,
        result: 'failure'
      });
      
      throw error;
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logger.error('Payment processing error', {
      ...logContext,
      error: error.message,
      errorStack: error.stack,
      processingTimeMs: processingTime,
      result: 'error'
    });
    
    // Re-throw the error after logging
    throw error;
  }
}

// Enhanced logger configuration example
const logger = {
  debug: (message, context = {}) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(JSON.stringify({
        level: 'DEBUG',
        timestamp: new Date().toISOString(),
        message,
        ...context
      }));
    }
  },
  
  info: (message, context = {}) => {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  },
  
  warn: (message, context = {}) => {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  },
  
  error: (message, context = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      ...context
    }));
  }
};
```

## 🎯 What This Accomplishes

- **Debugging Support**: Easy to trace execution flow and identify issues
- **Performance Monitoring**: Track processing times and bottlenecks
- **Business Intelligence**: Understand user behavior and system usage
- **Security Auditing**: Track payment flows and potential fraud
- **Operational Alerts**: Enable monitoring systems to detect problems

## 📊 Log Output Example

```json
{
  "level": "INFO",
  "timestamp": "2024-12-06T10:30:00.000Z",
  "message": "Payment processing started",
  "orderId": "ORD-12345",
  "amount": 99.99,
  "operation": "processPayment"
}

{
  "level": "INFO", 
  "timestamp": "2024-12-06T10:30:01.234Z",
  "message": "Payment processing completed successfully",
  "orderId": "ORD-12345",
  "amount": 99.99,
  "operation": "processPayment",
  "transactionId": "txn_abc123",
  "processingTimeMs": 1234,
  "result": "success"
}
```

## 📋 Copy This Prompt

<div class="copy-section">
<button class="copy-btn" onclick="copyToClipboard('add-logging')">📋 Copy Prompt</button>
<span class="copy-feedback" id="copy-feedback-add-logging"></span>
</div>