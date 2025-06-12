---
title: "Convert to Async/Await"
category: "optimization"
difficulty: "intermediate"
tags: ["async", "promises", "performance", "modernization"]
effectiveness: 4.4
usage_count: 67
last_updated: "2024-12-06"
---

# Convert to Async/Await

**Purpose**: Convert callback-based or Promise chain code to modern async/await syntax for better readability.

## 📝 Prompt Template

```
Convert this code to use async/await instead of callbacks or Promise chains:

```
[YOUR CODE HERE]
```

Please:
1. **Replace callbacks** with async/await patterns
2. **Simplify Promise chains** using sequential async calls
3. **Add proper error handling** with try/catch blocks
4. **Maintain parallelism** where operations can run concurrently
5. **Improve readability** while preserving the same functionality

Return clean, modern async/await code.
```

## 💻 Example Usage

### Before (Input Code):
```javascript
function fetchUserProfile(userId, callback) {
  getUserData(userId)
    .then(user => {
      return getProfileImage(user.imageId)
        .then(image => {
          return getUserPreferences(userId)
            .then(preferences => {
              return getRecentActivity(userId)
                .then(activity => {
                  const profile = {
                    user,
                    image,
                    preferences,
                    activity
                  };
                  callback(null, profile);
                })
                .catch(err => callback(err, null));
            })
            .catch(err => callback(err, null));
        })
        .catch(err => callback(err, null));
    })
    .catch(err => callback(err, null));
}

function processMultipleUsers(userIds) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    
    userIds.forEach((userId, index) => {
      fetchUserProfile(userId, (err, profile) => {
        if (err) {
          reject(err);
          return;
        }
        
        results[index] = profile;
        completed++;
        
        if (completed === userIds.length) {
          resolve(results);
        }
      });
    });
  });
}
```

### After (AI Result):
```javascript
async function fetchUserProfile(userId) {
  try {
    // Get user data first
    const user = await getUserData(userId);
    
    // Run these operations in parallel since they don't depend on each other
    const [image, preferences, activity] = await Promise.all([
      getProfileImage(user.imageId),
      getUserPreferences(userId),
      getRecentActivity(userId)
    ]);
    
    return {
      user,
      image,
      preferences,
      activity
    };
  } catch (error) {
    // Wrap with more context
    throw new Error(`Failed to fetch profile for user ${userId}: ${error.message}`);
  }
}

async function processMultipleUsers(userIds) {
  try {
    // Process all users in parallel for better performance
    const profiles = await Promise.all(
      userIds.map(userId => fetchUserProfile(userId))
    );
    
    return profiles;
  } catch (error) {
    // If any user fails, you might want different behavior:
    
    // Option 1: Fail fast (current behavior)
    throw error;
    
    // Option 2: Process successfully and collect errors
    // return processUsersWithErrorHandling(userIds);
  }
}

// Alternative implementation that handles partial failures
async function processUsersWithErrorHandling(userIds) {
  const results = await Promise.allSettled(
    userIds.map(async (userId) => {
      try {
        return await fetchUserProfile(userId);
      } catch (error) {
        return { error: error.message, userId };
      }
    })
  );
  
  const successful = [];
  const failed = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.error) {
        failed.push(result.value);
      } else {
        successful.push(result.value);
      }
    } else {
      failed.push({ error: result.reason.message, userId: userIds[index] });
    }
  });
  
  return { successful, failed };
}

// Usage examples
async function example() {
  try {
    // Single user
    const profile = await fetchUserProfile('user123');
    console.log('Profile:', profile);
    
    // Multiple users
    const userIds = ['user1', 'user2', 'user3'];
    const profiles = await processMultipleUsers(userIds);
    console.log('All profiles:', profiles);
    
    // Multiple users with error handling
    const { successful, failed } = await processUsersWithErrorHandling(userIds);
    console.log(`Successfully processed: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

## 🎯 What This Accomplishes

- **Better Readability**: Linear code flow instead of nested callbacks
- **Improved Performance**: Parallel execution with Promise.all()
- **Better Error Handling**: Single try/catch block instead of multiple .catch()
- **Easier Testing**: Async functions are easier to test than callbacks
- **Modern Standards**: Uses current JavaScript best practices

## 📊 Improvements Made

| Aspect | Before | After | Benefit |
|--------|--------|-------|---------|
| **Nesting** | 4 levels deep | Linear flow | Much easier to read |
| **Error Handling** | 4 separate .catch() | 1 try/catch | Centralized error handling |
| **Parallelism** | Sequential execution | Promise.all() | 3x faster execution |
| **Maintainability** | Hard to modify | Easy to extend | Better code evolution |

## 📋 Copy This Prompt

<div class="copy-section">
<button class="copy-btn" onclick="copyToClipboard('convert-to-async')">📋 Copy Prompt</button>
<span class="copy-feedback" id="copy-feedback-convert-to-async"></span>
</div>