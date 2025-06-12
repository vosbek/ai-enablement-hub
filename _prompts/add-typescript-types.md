---
title: "Add TypeScript Types"
category: "quality"
difficulty: "intermediate"
tags: ["typescript", "types", "type-safety", "interfaces"]
effectiveness: 4.5
usage_count: 92
last_updated: "2024-12-06"
---

# Add TypeScript Types

**Purpose**: Convert JavaScript code to TypeScript with proper types, interfaces, and type safety.

## 📝 Prompt Template

```
Convert this JavaScript code to TypeScript with proper typing:

```
[YOUR CODE HERE]
```

Please add:
1. **Interface definitions** - For objects and function parameters
2. **Type annotations** - For variables, parameters, and return types
3. **Generic types** - Where appropriate for reusability
4. **Union types** - For values that can be multiple types
5. **Strict type checking** - Ensure no 'any' types unless necessary

Return fully typed TypeScript code with interface definitions.
```

## 💻 Example Usage

### Before (Input Code):
```javascript
function processApiResponse(response) {
  if (!response.success) {
    throw new Error(response.message);
  }
  
  return response.data.map(item => ({
    id: item.id,
    name: item.name,
    email: item.email,
    createdAt: new Date(item.created_at),
    isActive: item.status === 'active'
  }));
}

class UserManager {
  constructor(apiClient) {
    this.api = apiClient;
    this.users = [];
  }

  async fetchUsers(filters) {
    const response = await this.api.get('/users', filters);
    this.users = processApiResponse(response);
    return this.users;
  }

  findUserById(id) {
    return this.users.find(user => user.id === id);
  }
}
```

### After (AI Result):
```typescript
// Interface definitions
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface RawUserData {
  id: number;
  name: string;
  email: string;
  created_at: string;
  status: 'active' | 'inactive' | 'pending';
}

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  isActive: boolean;
}

interface UserFilters {
  status?: 'active' | 'inactive' | 'pending';
  search?: string;
  limit?: number;
  offset?: number;
}

interface ApiClient {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>>;
}

// Typed functions
function processApiResponse(response: ApiResponse<RawUserData[]>): User[] {
  if (!response.success) {
    throw new Error(response.message || 'API request failed');
  }
  
  return response.data.map((item: RawUserData): User => ({
    id: item.id,
    name: item.name,
    email: item.email,
    createdAt: new Date(item.created_at),
    isActive: item.status === 'active'
  }));
}

class UserManager {
  private api: ApiClient;
  private users: User[] = [];

  constructor(apiClient: ApiClient) {
    this.api = apiClient;
  }

  async fetchUsers(filters?: UserFilters): Promise<User[]> {
    const response = await this.api.get<RawUserData[]>('/users', filters);
    this.users = processApiResponse(response);
    return this.users;
  }

  findUserById(id: number): User | undefined {
    return this.users.find((user: User) => user.id === id);
  }

  getUsers(): readonly User[] {
    return Object.freeze([...this.users]);
  }
}

// Usage example with proper typing
const userManager = new UserManager(apiClient);

// TypeScript will enforce correct types
userManager.fetchUsers({ 
  status: 'active', 
  limit: 10 
}).then((users: User[]) => {
  const user = userManager.findUserById(1);
  if (user) {
    console.log(`Found user: ${user.name} (${user.email})`);
  }
});
```

## 🎯 What This Accomplishes

- **Type Safety**: Prevents runtime errors through compile-time checking
- **Better IntelliSense**: Enhanced autocomplete and refactoring support
- **Self-Documenting**: Types serve as inline documentation
- **Refactoring Safety**: Changes are validated across the entire codebase
- **API Contracts**: Clear interfaces define expected data structures

## 📋 Copy This Prompt

<div class="copy-section">
<button class="copy-btn" onclick="copyToClipboard('add-typescript-types')">📋 Copy Prompt</button>
<span class="copy-feedback" id="copy-feedback-add-typescript-types"></span>
</div>