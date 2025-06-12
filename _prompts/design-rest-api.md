---
title: "Design RESTful API"
category: "documentation"
difficulty: "intermediate"
tags: ["api", "rest", "design", "documentation"]
effectiveness: 4.6
usage_count: 78
last_updated: "2024-12-06"
---

# Design RESTful API

**Purpose**: Design well-structured RESTful APIs with proper endpoints, HTTP methods, and comprehensive documentation.

## 📝 Prompt Template

```
Design a RESTful API for this functionality:

```
[YOUR FEATURE/REQUIREMENTS HERE]
```

Please create:
1. **Endpoint structure** - RESTful URLs following best practices
2. **HTTP methods** - GET, POST, PUT, DELETE with proper usage
3. **Request/Response formats** - JSON schemas with examples
4. **Status codes** - Appropriate HTTP status codes for each scenario
5. **Authentication** - Security considerations and auth requirements
6. **Error handling** - Consistent error response format
7. **API documentation** - Clear documentation for developers

Include OpenAPI/Swagger specification if possible.
```

## 💻 Example Usage

### Before (Input Code):
```
I need an API for a task management system where users can:
- Create, view, update, and delete tasks
- Organize tasks into projects
- Assign tasks to team members
- Track task status and due dates
- Comment on tasks
```

### After (AI Result):
```yaml
# OpenAPI 3.0 Specification
openapi: 3.0.0
info:
  title: Task Management API
  description: RESTful API for managing tasks, projects, and team collaboration
  version: 1.0.0
  contact:
    email: api-support@company.com

servers:
  - url: https://api.taskmanager.com/v1
    description: Production server

paths:
  # Projects
  /projects:
    get:
      summary: List all projects
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Project'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
    post:
      summary: Create a new project
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProjectRequest'
      responses:
        '201':
          description: Project created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Project'
        '400':
          $ref: '#/components/responses/BadRequest'

  /projects/{projectId}:
    get:
      summary: Get project by ID
      parameters:
        - $ref: '#/components/parameters/ProjectId'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Project'
        '404':
          $ref: '#/components/responses/NotFound'
    
    put:
      summary: Update project
      parameters:
        - $ref: '#/components/parameters/ProjectId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateProjectRequest'
      responses:
        '200':
          description: Project updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Project'
    
    delete:
      summary: Delete project
      parameters:
        - $ref: '#/components/parameters/ProjectId'
      responses:
        '204':
          description: Project deleted successfully
        '409':
          description: Cannot delete project with active tasks

  # Tasks
  /projects/{projectId}/tasks:
    get:
      summary: List tasks in a project
      parameters:
        - $ref: '#/components/parameters/ProjectId'
        - name: status
          in: query
          schema:
            type: string
            enum: [todo, in_progress, review, done]
        - name: assignee
          in: query
          schema:
            type: string
        - name: due_date
          in: query
          schema:
            type: string
            format: date
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Task'
    
    post:
      summary: Create a new task
      parameters:
        - $ref: '#/components/parameters/ProjectId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTaskRequest'
      responses:
        '201':
          description: Task created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'

  /tasks/{taskId}:
    get:
      summary: Get task by ID
      parameters:
        - $ref: '#/components/parameters/TaskId'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
    
    put:
      summary: Update task
      parameters:
        - $ref: '#/components/parameters/TaskId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateTaskRequest'
      responses:
        '200':
          description: Task updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
    
    delete:
      summary: Delete task
      parameters:
        - $ref: '#/components/parameters/TaskId'
      responses:
        '204':
          description: Task deleted successfully

  # Task Comments
  /tasks/{taskId}/comments:
    get:
      summary: Get task comments
      parameters:
        - $ref: '#/components/parameters/TaskId'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Comment'
    
    post:
      summary: Add comment to task
      parameters:
        - $ref: '#/components/parameters/TaskId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCommentRequest'
      responses:
        '201':
          description: Comment created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Comment'

components:
  schemas:
    Project:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        owner_id:
          type: string
          format: uuid
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
        task_count:
          type: integer
    
    Task:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        status:
          type: string
          enum: [todo, in_progress, review, done]
        priority:
          type: string
          enum: [low, medium, high, urgent]
        assignee_id:
          type: string
          format: uuid
        project_id:
          type: string
          format: uuid
        due_date:
          type: string
          format: date-time
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
        comment_count:
          type: integer
    
    Comment:
      type: object
      properties:
        id:
          type: string
          format: uuid
        content:
          type: string
        author_id:
          type: string
          format: uuid
        task_id:
          type: string
          format: uuid
        created_at:
          type: string
          format: date-time
    
    CreateProjectRequest:
      type: object
      required: [name]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        description:
          type: string
          maxLength: 500
    
    CreateTaskRequest:
      type: object
      required: [title]
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        description:
          type: string
          maxLength: 1000
        priority:
          type: string
          enum: [low, medium, high, urgent]
          default: medium
        assignee_id:
          type: string
          format: uuid
        due_date:
          type: string
          format: date-time
    
    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: array
              items:
                type: object
                properties:
                  field:
                    type: string
                  message:
                    type: string

  parameters:
    ProjectId:
      name: projectId
      in: path
      required: true
      schema:
        type: string
        format: uuid
    
    TaskId:
      name: taskId
      in: path
      required: true
      schema:
        type: string
        format: uuid

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: "VALIDATION_ERROR"
              message: "Invalid input data"
              details:
                - field: "name"
                  message: "Name is required"
    
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error:
              code: "NOT_FOUND"
              message: "Resource not found"

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

### Example HTTP Requests:

```bash
# Create a new project
POST /v1/projects
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Website Redesign",
  "description": "Complete redesign of company website"
}

# Create a task
POST /v1/projects/123e4567-e89b-12d3-a456-426614174000/tasks
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "title": "Design landing page mockup",
  "description": "Create wireframes and high-fidelity mockups",
  "priority": "high",
  "assignee_id": "987fcdeb-51a2-43c7-9f8d-123456789abc",
  "due_date": "2024-12-15T17:00:00Z"
}

# Update task status
PUT /v1/tasks/456e7890-e12b-34c5-a678-426614174111
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "status": "in_progress"
}
```

## 🎯 What This Accomplishes

- **RESTful Design**: Follows REST principles and HTTP conventions
- **Clear Structure**: Logical endpoint hierarchy and naming
- **Comprehensive Documentation**: Complete API specification with examples
- **Error Handling**: Consistent error responses with helpful messages
- **Security**: JWT-based authentication for all endpoints
- **Validation**: Input validation and constraints defined

## 📋 Copy This Prompt

<div class="copy-section">
<button class="copy-btn" onclick="copyToClipboard('design-rest-api')">📋 Copy Prompt</button>
<span class="copy-feedback" id="copy-feedback-design-rest-api"></span>
</div>