---
title: "Implement Data Structure"
category: "optimization"
difficulty: "advanced"
tags: ["algorithms", "data-structures", "performance", "computer-science"]
effectiveness: 4.6
usage_count: 67
last_updated: "2024-12-06"
---

# Implement Data Structure

**Purpose**: Implement efficient data structures with optimal time and space complexity for specific use cases.

## 📝 Prompt Template

```
Implement an efficient data structure for this use case:

```
[YOUR REQUIREMENTS/USE CASE HERE]
```

Please create:
1. **Data structure design** - Choose optimal structure for the requirements
2. **Core operations** - Insert, delete, search, update with optimal complexity
3. **Time complexity analysis** - Big O notation for all operations
4. **Space complexity** - Memory usage analysis and optimization
5. **Edge case handling** - Handle empty states, boundaries, and errors
6. **Performance optimizations** - Implement caching, lazy loading, or other optimizations
7. **Usage examples** - Demonstrate practical applications

Include comprehensive tests and performance benchmarks.
```

## 💻 Example Usage

### Before (Input Code):
```
I need a data structure for a cache system that:
- Has a maximum capacity
- Evicts least recently used items when full
- Supports O(1) get and put operations
- Tracks access frequency for analytics
- Supports bulk operations
- Should be thread-safe for concurrent access
```

### After (AI Result):
```javascript
/**
 * Advanced LRU Cache with frequency tracking and thread safety
 * Time Complexity: O(1) for all main operations
 * Space Complexity: O(capacity)
 */

class AdvancedLRUCache {
  constructor(capacity = 100) {
    if (capacity <= 0) {
      throw new Error('Capacity must be positive');
    }
    
    this.capacity = capacity;
    this.size = 0;
    
    // Double-linked list nodes for LRU ordering
    this.head = { key: null, value: null, prev: null, next: null };
    this.tail = { key: null, value: null, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
    
    // Hash map for O(1) access
    this.cache = new Map();
    
    // Frequency tracking
    this.accessCount = new Map();
    this.totalAccesses = 0;
    
    // Thread safety
    this.mutex = new Mutex();
    
    // Performance metrics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      puts: 0
    };
  }

  /**
   * Get value by key - O(1)
   */
  async get(key) {
    return this.mutex.runExclusive(() => {
      if (!this.cache.has(key)) {
        this.stats.misses++;
        return undefined;
      }

      const node = this.cache.get(key);
      
      // Move to front (most recently used)
      this._moveToHead(node);
      
      // Update frequency tracking
      this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
      this.totalAccesses++;
      this.stats.hits++;

      return node.value;
    });
  }

  /**
   * Put key-value pair - O(1)
   */
  async put(key, value) {
    return this.mutex.runExclusive(() => {
      this.stats.puts++;

      if (this.cache.has(key)) {
        // Update existing key
        const node = this.cache.get(key);
        node.value = value;
        this._moveToHead(node);
        return;
      }

      // Create new node
      const newNode = {
        key,
        value,
        prev: null,
        next: null
      };

      if (this.size >= this.capacity) {
        // Evict least recently used
        const evicted = this._removeTail();
        this.cache.delete(evicted.key);
        this.accessCount.delete(evicted.key);
        this.stats.evictions++;
      } else {
        this.size++;
      }

      // Add to cache and move to head
      this.cache.set(key, newNode);
      this._addToHead(newNode);
      this.accessCount.set(key, 1);
    });
  }

  /**
   * Delete key - O(1)
   */
  async delete(key) {
    return this.mutex.runExclusive(() => {
      if (!this.cache.has(key)) {
        return false;
      }

      const node = this.cache.get(key);
      this._removeNode(node);
      this.cache.delete(key);
      this.accessCount.delete(key);
      this.size--;
      
      return true;
    });
  }

  /**
   * Bulk operations for efficiency
   */
  async putMany(entries) {
    return this.mutex.runExclusive(() => {
      for (const [key, value] of entries) {
        this._putSync(key, value);
      }
    });
  }

  async getMany(keys) {
    return this.mutex.runExclusive(() => {
      const results = new Map();
      for (const key of keys) {
        const value = this._getSync(key);
        if (value !== undefined) {
          results.set(key, value);
        }
      }
      return results;
    });
  }

  /**
   * Analytics and introspection
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0;

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(3),
      size: this.size,
      capacity: this.capacity,
      utilization: (this.size / this.capacity).toFixed(3)
    };
  }

  getFrequencyStats() {
    const frequencies = Array.from(this.accessCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      totalAccesses: this.totalAccesses,
      uniqueKeys: this.accessCount.size,
      mostAccessed: frequencies
    };
  }

  /**
   * Memory management
   */
  clear() {
    this.cache.clear();
    this.accessCount.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.size = 0;
    this.totalAccesses = 0;
  }

  // Internal helper methods
  _moveToHead(node) {
    this._removeNode(node);
    this._addToHead(node);
  }

  _addToHead(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  _removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _removeTail() {
    const last = this.tail.prev;
    this._removeNode(last);
    return last;
  }

  _putSync(key, value) {
    // Synchronous version for bulk operations
    this.stats.puts++;

    if (this.cache.has(key)) {
      const node = this.cache.get(key);
      node.value = value;
      this._moveToHead(node);
      return;
    }

    const newNode = { key, value, prev: null, next: null };

    if (this.size >= this.capacity) {
      const evicted = this._removeTail();
      this.cache.delete(evicted.key);
      this.accessCount.delete(evicted.key);
      this.stats.evictions++;
    } else {
      this.size++;
    }

    this.cache.set(key, newNode);
    this._addToHead(newNode);
    this.accessCount.set(key, 1);
  }

  _getSync(key) {
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return undefined;
    }

    const node = this.cache.get(key);
    this._moveToHead(node);
    this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
    this.totalAccesses++;
    this.stats.hits++;

    return node.value;
  }
}

// Simple mutex implementation for thread safety
class Mutex {
  constructor() {
    this.locked = false;
    this.queue = [];
  }

  async runExclusive(fn) {
    return new Promise((resolve, reject) => {
      const execute = () => {
        try {
          const result = fn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.locked = false;
          if (this.queue.length > 0) {
            const next = this.queue.shift();
            setTimeout(next, 0);
          }
        }
      };

      if (this.locked) {
        this.queue.push(execute);
      } else {
        this.locked = true;
        execute();
      }
    });
  }
}

// Usage Examples and Tests
async function demonstrateUsage() {
  const cache = new AdvancedLRUCache(3);

  // Basic operations
  await cache.put('a', 1);
  await cache.put('b', 2);
  await cache.put('c', 3);

  console.log(await cache.get('a')); // 1
  console.log(await cache.get('b')); // 2

  // This should evict 'c' (least recently used)
  await cache.put('d', 4);
  console.log(await cache.get('c')); // undefined

  // Bulk operations
  await cache.putMany([['e', 5], ['f', 6]]);
  const results = await cache.getMany(['a', 'e', 'f']);
  console.log(results); // Map with values

  // Analytics
  console.log(cache.getStats());
  console.log(cache.getFrequencyStats());
}

// Performance benchmark
async function benchmark() {
  const cache = new AdvancedLRUCache(1000);
  const iterations = 10000;

  console.time('LRU Cache Performance');

  // Fill cache
  for (let i = 0; i < iterations; i++) {
    await cache.put(`key${i}`, `value${i}`);
  }

  // Random access pattern
  for (let i = 0; i < iterations; i++) {
    const key = `key${Math.floor(Math.random() * iterations)}`;
    await cache.get(key);
  }

  console.timeEnd('LRU Cache Performance');
  console.log('Final stats:', cache.getStats());
}

// Test suite
class LRUCacheTests {
  static async runAll() {
    await this.testBasicOperations();
    await this.testCapacityLimit();
    await this.testLRUEviction();
    await this.testBulkOperations();
    console.log('✅ All tests passed!');
  }

  static async testBasicOperations() {
    const cache = new AdvancedLRUCache(2);
    
    await cache.put('a', 1);
    assert(await cache.get('a') === 1, 'Get should return stored value');
    
    assert(await cache.delete('a') === true, 'Delete should return true for existing key');
    assert(await cache.get('a') === undefined, 'Get should return undefined for deleted key');
  }

  static async testCapacityLimit() {
    const cache = new AdvancedLRUCache(2);
    
    await cache.put('a', 1);
    await cache.put('b', 2);
    await cache.put('c', 3); // Should evict 'a'
    
    assert(await cache.get('a') === undefined, 'Oldest item should be evicted');
    assert(await cache.get('b') === 2, 'Recent item should remain');
    assert(await cache.get('c') === 3, 'New item should be accessible');
  }

  static async testLRUEviction() {
    const cache = new AdvancedLRUCache(2);
    
    await cache.put('a', 1);
    await cache.put('b', 2);
    await cache.get('a'); // Make 'a' most recent
    await cache.put('c', 3); // Should evict 'b'
    
    assert(await cache.get('a') === 1, 'Recently accessed item should remain');
    assert(await cache.get('b') === undefined, 'LRU item should be evicted');
  }

  static async testBulkOperations() {
    const cache = new AdvancedLRUCache(5);
    
    await cache.putMany([['a', 1], ['b', 2], ['c', 3]]);
    const results = await cache.getMany(['a', 'b', 'c']);
    
    assert(results.size === 3, 'Bulk get should return all items');
    assert(results.get('a') === 1, 'Bulk get should return correct values');
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Export for use
module.exports = { AdvancedLRUCache, LRUCacheTests };

// Example usage
// demonstrateUsage();
// benchmark();
// LRUCacheTests.runAll();
```

## 🎯 What This Accomplishes

- **Optimal Performance**: O(1) operations for get, put, and delete
- **Memory Efficient**: Minimal overhead with optimal space usage
- **Thread Safe**: Concurrent access support with mutex
- **Analytics Ready**: Frequency tracking and performance metrics
- **Production Ready**: Comprehensive error handling and edge cases

## 📊 Complexity Analysis

| Operation | Time Complexity | Space Complexity | Notes |
|-----------|-----------------|------------------|-------|
| **get(key)** | O(1) | O(1) | Hash map lookup + list update |
| **put(key, value)** | O(1) | O(1) | Hash map insert + list operations |
| **delete(key)** | O(1) | O(1) | Hash map delete + list removal |
| **putMany(n items)** | O(n) | O(n) | Batch processing for efficiency |
| **getMany(n keys)** | O(n) | O(n) | Parallel lookup optimization |

## 📋 Copy This Prompt

<div class="copy-section">
<button class="copy-btn" onclick="copyToClipboard('implement-data-structure')">📋 Copy Prompt</button>
<span class="copy-feedback" id="copy-feedback-implement-data-structure"></span>
</div>