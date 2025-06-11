# Project Structure Documentation

## Overview

Aluminate is a Vue.js-based application using TypeScript, built with modern development practices and tools like Vite. This documentation provides a comprehensive overview of the project structure, architecture, and key relationships between components.

## Core Project Structure

```
aluminate/
├── src/                  # Main application source code
├── public/              # Static assets
├── improvements/        # Improvement documentation
├── Documentation/       # Project documentation
└── configuration files  # Various config files at root
```

### Configuration Files

- `package.json` - Project dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- Environment Files:
  - `.env.development` - Development environment variables
  - `.env.staging` - Staging environment variables
  - `.env.production` - Production environment variables

## Source Code Architecture (`/src`)

### Core Files

```
src/
├── main.ts             # Application entry point
├── App.vue             # Root Vue component
└── config.ts           # Application configuration
```

### Key Directories

1. **State Management**

```
src/
├── stores/             # Pinia stores for state management
└── composables/        # Vue composition API utilities
```

2. **UI Layer**

```
src/
├── components/         # Reusable Vue components
├── views/             # Page components
├── layouts/           # Layout templates
├── theme/            # Theme-related components
└── scss/             # Styling files
```

3. **Business Logic**

```
src/
├── API/               # API integration layer
├── services/         # Business logic services
└── helpers/          # Utility helper functions
```

4. **Data & Types**

```
src/
├── types/            # TypeScript type definitions
├── data/            # Static data files
└── _mockApis/       # Mock API data for development
```

5. **Application Features**

```
src/
├── router/           # Vue Router configuration
├── plugins/         # Vue plugins
├── utils/locales/   # Translation files (en, nl, pl)
└── assets/         # Application assets
```

## Key Architectural Relationships

### Frontend Data Flow

1. Views (pages) compose reusable components
2. Components use services for business logic
3. Services communicate with backend via API layer
4. Global state is managed by Pinia stores
5. Routing handled by Vue Router

### Security Architecture

- Security features centralized in `SecurityService.ts`
- User authentication flow managed through dedicated components
- Security settings accessible via Security components

### Internationalization

- Multiple language support (English, Dutch, Polish)
- Translations managed through locale files
- Easy extensibility for new languages

### Asset Management

- Static assets stored in `/public`
- Dynamic assets managed in `/src/assets`
- Theme-specific assets in `/src/theme`
