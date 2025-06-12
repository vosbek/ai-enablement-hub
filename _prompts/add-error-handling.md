---
title: "Add Comprehensive Error Handling"
category: "quality"
difficulty: "intermediate"
tags: ["error-handling", "reliability", "best-practices"]
effectiveness: 4.7
usage_count: 89
last_updated: "2024-12-06"
---

# Add Comprehensive Error Handling

**Purpose**: Add robust error handling, input validation, and graceful failure modes to existing code.

## 📝 Prompt Template

```
Add comprehensive error handling to this code:

```
[YOUR CODE HERE]
```

Please add:
1. **Input validation** - Check for null, undefined, invalid types
2. **Try-catch blocks** - Handle exceptions gracefully  
3. **Error messages** - Clear, actionable error descriptions
4. **Fallback behavior** - What to do when things fail
5. **Logging** - Appropriate error logging for debugging

Return the improved code with proper error handling.
```

## 💻 Example Usage

### Before (Input Code):
```javascript
function calculateDiscount(price, discountPercent) {
  const discount = price * (discountPercent / 100);
  return price - discount;
}

function processOrder(order) {
  const total = calculateDiscount(order.price, order.discount);
  const tax = total * 0.08;
  return {
    subtotal: total,
    tax: tax,
    total: total + tax
  };
}
```

### After (AI Result):
```javascript
function calculateDiscount(price, discountPercent) {
  // Input validation
  if (typeof price !== 'number' || price < 0) {
    throw new Error('Price must be a non-negative number');
  }
  if (typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percent must be a number between 0 and 100');
  }
  
  try {
    const discount = price * (discountPercent / 100);
    return price - discount;
  } catch (error) {
    console.error('Error calculating discount:', error);
    throw new Error('Failed to calculate discount');
  }
}

function processOrder(order) {
  try {
    // Input validation
    if (!order || typeof order !== 'object') {
      throw new Error('Order must be a valid object');
    }
    if (!order.hasOwnProperty('price') || !order.hasOwnProperty('discount')) {
      throw new Error('Order must contain price and discount properties');
    }
    
    const total = calculateDiscount(order.price, order.discount);
    const tax = total * 0.08;
    
    const result = {
      subtotal: total,
      tax: tax,
      total: total + tax
    };
    
    // Validate result
    if (isNaN(result.total) || result.total < 0) {
      throw new Error('Invalid calculation result');
    }
    
    return result;
    
  } catch (error) {
    console.error('Error processing order:', error);
    
    // Return fallback response
    return {
      subtotal: 0,
      tax: 0,
      total: 0,
      error: error.message
    };
  }
}
```

## 🎯 What This Accomplishes

- **Prevents crashes** from invalid inputs
- **Clear error messages** help developers debug issues  
- **Graceful fallbacks** keep the application running
- **Proper logging** aids in production troubleshooting
- **Type safety** ensures functions work as expected

## 📋 Copy This Prompt

<div class="copy-section">
<button class="copy-btn" onclick="copyToClipboard('add-error-handling')">📋 Copy Prompt</button>
<span class="copy-feedback" id="copy-feedback-add-error-handling"></span>
</div>

## 🔄 Variations

**For Different Languages:**
- **Python**: Focus on try/except blocks and type hints
- **Java**: Emphasize checked exceptions and proper exception hierarchy
- **Go**: Use error return values and proper error wrapping
- **C#**: Include exception handling best practices and using statements

**For Different Contexts:**
- **API endpoints**: Add HTTP status codes and error responses
- **Database operations**: Include transaction rollbacks and connection handling
- **Async operations**: Handle Promise rejections and async/await errors