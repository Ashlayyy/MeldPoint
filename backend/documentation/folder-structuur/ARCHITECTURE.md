# Application Architecture Guide

## Component Relationships

```
Request Flow:
Route → Controller → Service → Database
↑                              ↓
Response ←←←←←←←←←←←←←←←←←←←←←←
```

## Adding New Features

### 1. Create a Route (`src/routes/`)

```typescript
// src/routes/task.routes.ts
import { Router } from 'express';
import TaskController from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const taskController = new TaskController();

// Define routes with middleware
router.get('/tasks', authMiddleware, taskController.getAllTasks);
router.post('/tasks', authMiddleware, taskController.createTask);

export default router;
```

### 2. Create a Controller (`src/controllers/`)

```typescript
// src/controllers/task.controller.ts
import { Request, Response } from 'express';
import TaskService from '../services/task.service';

export default class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  async getAllTasks(req: Request, res: Response) {
    try {
      const tasks = await this.taskService.getAllTasks();
      return res.json(tasks);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
```

### 3. Create a Service (`src/services/`)

```typescript
// src/services/task.service.ts
import prisma from '../db/prismaClient';

export default class TaskService {
  async getAllTasks() {
    return prisma.task.findMany();
  }
}
```

## Component Relationships Explained

### 1. Routes (Entry Point)

- Define API endpoints and HTTP methods
- Apply middleware (authentication, validation)
- Direct requests to appropriate controller methods
- Keep routes clean and simple

### 2. Controllers (Request Handlers)

- Receive HTTP requests from routes
- Handle request/response logic
- Validate input data
- Call appropriate service methods
- Format responses
- Handle errors
- Don't contain business logic

### 3. Services (Business Logic)

- Contain all business logic
- Interact with database through Prisma
- Handle complex operations
- Can use multiple models/tables
- Can call other services
- Independent of HTTP layer

### 4. Models (Data Layer)

- Defined in Prisma schema
- Represent database structure
- Define relationships
- Handle data validation

## Best Practices

### Route Organization

```typescript
// Group related routes
router.get('/tasks', taskController.getAllTasks);
router.get('/tasks/:id', taskController.getTaskById);
router.post('/tasks', taskController.createTask);
router.put('/tasks/:id', taskController.updateTask);
```

### Controller Organization

```typescript
export default class TaskController {
  // Group related operations
  async getAllTasks() {
    /* ... */
  }
  async getTaskById() {
    /* ... */
  }
  async createTask() {
    /* ... */
  }
  async updateTask() {
    /* ... */
  }
}
```

### Service Organization

```typescript
export default class TaskService {
  // Group related business logic
  async getAllTasks() {
    /* ... */
  }
  async getTaskById() {
    /* ... */
  }
  async createTask() {
    /* ... */
  }
  async updateTask() {
    /* ... */
  }
}
```

## Example: Complete Feature Flow

```typescript
// 1. Route Definition
router.post('/tasks', authMiddleware, taskController.createTask);

// 2. Controller Method
async createTask(req: Request, res: Response) {
  try {
    const { title, description } = req.body;
    const userId = req.user.id; // From auth middleware

    const task = await this.taskService.createTask({
      title,
      description,
      userId
    });

    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// 3. Service Method
async createTask(data: CreateTaskDTO) {
  // Business logic validation
  if (!this.isValidTaskTitle(data.title)) {
    throw new Error('Invalid task title');
  }

  // Create task in database
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      userId: data.userId,
      status: 'PENDING'
    }
  });
}
```

## Tips for Clean Architecture

1. **Single Responsibility**

   - Each component should do one thing well
   - Keep methods focused and small
   - Split large files into smaller ones

2. **Dependency Injection**

   - Pass dependencies through constructors
   - Makes testing easier
   - Reduces tight coupling

3. **Error Handling**

   - Use try/catch in controllers
   - Create custom error classes
   - Return consistent error responses

4. **Type Safety**

   - Use TypeScript interfaces/types
   - Define DTOs for data transfer
   - Validate data at boundaries

5. **Testing**
   - Write tests for each layer
   - Mock dependencies
   - Test error cases
