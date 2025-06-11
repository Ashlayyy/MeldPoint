# Project Folder Structure

## Root Directory Structure

```
aluminate-server/
├── src/                    # Source code
│   ├── controllers/        # Request handlers
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic
│   ├── modules/           # Feature modules
│   ├── helpers/           # Utility functions
│   └── db/                # Database related code
├── prisma/                # Database schema and migrations
│   └── schema/            # Prisma schema files
├── documentation/         # Project documentation
```

## Key Directories Explained

### Source Code (`src/`)

#### Controllers
- Handle incoming HTTP requests
- Validate request data
- Call appropriate services
- Format responses

#### Routes
- Define API endpoints
- Handle request routing
- Apply middleware
- Link controllers to endpoints

#### Services
- Implement business logic
- Handle data processing
- Interact with database
- Manage external integrations

#### Modules
- Email Service
- Messages System
- Notification Handler
- Authentication
- File Management

#### Helpers
- Utility functions
- Common helpers
- Database retry logic
- Logging functionality

### Database (`prisma/`)
- Schema definitions
- Migration files
- Database configurations
- Seeding scripts

### Documentation
- API Documentation
- Integration guides
- System architecture
- Deployment procedures

## Module-Specific Structure

### GitHub Integration
```
services/
├── github.service.ts    # GitHub API integration
├── github-webhook.service.ts  # Webhook handling
└── github-issue-tracker.service.ts  # Issue tracking
```

## Best Practices
- Each module is self-contained
- Clear separation of concerns
- Consistent naming conventions
- Modular and maintainable structure 