# Aluminate Server API Documentation

## Overview

The Aluminate Server provides a comprehensive API for managing various aspects of the system including projects, users, permissions, and notifications.

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Core Modules

### User Management

- User creation, updates, and deletion
- Role assignments
- Permission management
- Group assignments

### Project Management

- Project creation and updates
- Project leader assignments
- Preventive maintenance tracking
- Corrective maintenance management
- Damage reports

### Notification System

- Email notifications
- Chat functionality
- System logs
- Activity tracking

### File Management

- File uploads and downloads
- Backup management
- Migration utilities

## Error Handling

All API endpoints follow a standard error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional error details
  }
}
```

Common error codes:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

API requests are rate-limited to ensure system stability. Current limits:

- 100 requests per minute per IP
- 1000 requests per hour per user

## Environment Configuration

The API supports multiple environments:

- Development
- Staging
- Production

Each environment has its own configuration settings and security policies.

## Security

- All endpoints use HTTPS
- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based authorization
- Regular security audits and logging

## Notification API

### Notification Sending

- TYPES

```typescript
interface NotificationPayload {
  type: 'system' | 'toast';
  userId?: string;
  message: string;
  needTodo: boolean;
  todoItem: string;
  url?: string;
  data?: any;
}
```

- ACTUALLY SENDING

```typescript
import { notificationChannel } from 'aluminate-server\src\services\socket\channels\NotificationChannel.ts';

OR;

import { channelManager } from '../server';
const notificationChannel = channelManager.getNotificationChannel();

notificationChannel.sendNotification(notificationPayload);
```
