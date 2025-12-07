# System Architecture

## Overview

The Purchase Management System is a full-stack web application built with a modern, scalable architecture. It follows a three-tier architecture pattern with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  React + Redux Toolkit (RTK Query) + TypeScript + Vite      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Components  │  │  RTK Query   │  │   State      │      │
│  │   (UI)       │  │   (API)      │  │  Management  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
│         Node.js + Express + TypeScript                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │  Middleware  │  │   Services   │      │
│  │  (Handlers)  │  │  (Auth/CORS) │  │  (Business)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│                    PostgreSQL 14+                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Tables     │  │  Triggers   │  │  Functions   │      │
│  │  (Data)      │  │  (Auto-upd) │  │  (Logic)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## System Layers

### 1. Frontend Layer

**Technology Stack:**
- React 18 with TypeScript
- Redux Toolkit for state management
- RTK Query for API communication
- Vite for build tooling
- Radix UI for components
- Tailwind CSS for styling

**Key Patterns:**
- Component-based architecture
- Container/Presenter pattern
- Custom hooks for reusable logic
- RTK Query for data fetching and caching

**Structure:**
```
frontend/src/
├── components/        # React components
│   ├── client/      # Client management components
│   ├── purchase/    # Purchase order components
│   ├── invoice/     # Invoice components
│   ├── finance/      # Finance components
│   └── ui/          # Reusable UI components
├── lib/             # Libraries and utilities
│   └── api/         # RTK Query API slices
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

### 2. Backend Layer

**Technology Stack:**
- Node.js with Express
- TypeScript for type safety
- PostgreSQL client (pg)
- JWT for authentication
- Zod for validation

**Key Patterns:**
- RESTful API design
- Route-based organization
- Middleware for cross-cutting concerns
- Transaction management for data integrity

**Structure:**
```
backend/src/
├── routes/          # API route handlers
│   ├── auth.ts      # Authentication
│   ├── clients.ts   # Client management
│   ├── purchases.ts # Purchase orders
│   ├── invoices/   # Invoice handlers (modular)
│   └── finance/    # Finance handlers (modular)
├── database.ts      # Database connection pool
├── common.ts        # Shared utilities
└── types.ts         # TypeScript types
```

### 3. Database Layer

**Technology Stack:**
- PostgreSQL 14+
- SQL migrations
- Triggers for auto-updates
- Functions for business logic
- Views for reporting

**Key Features:**
- Relational data model
- ACID compliance
- Automatic timestamp updates
- Invoice number generation
- Reporting views

## Data Flow

### 1. Authentication Flow

```
User Login
    │
    ├─> Frontend: Login Component
    │       │
    │       └─> POST /api/auth/login
    │               │
    │               ├─> Backend: Verify credentials
    │               │       │
    │               │       └─> Database: Query users table
    │               │
    │               └─> Return JWT token
    │
    └─> Store token in localStorage
            │
            └─> Use token for subsequent requests
```

### 2. Data Fetching Flow

```
Component Needs Data
    │
    ├─> RTK Query Hook (useListInvoicesQuery)
    │       │
    │       ├─> Check cache
    │       │   └─> Return cached data if available
    │       │
    │       └─> Fetch from API
    │               │
    │               ├─> GET /api/invoices
    │               │       │
    │               │       ├─> Backend: Route handler
    │               │       │       │
    │               │       │       └─> Database: Query
    │               │       │
    │               │       └─> Return data
    │               │
    │               └─> Update cache
    │
    └─> Component re-renders with data
```

### 3. Data Mutation Flow

```
User Creates Invoice
    │
    ├─> Frontend: InvoiceForm Component
    │       │
    │       └─> RTK Query Mutation (useCreateInvoiceMutation)
    │               │
    │               └─> POST /api/invoices
    │                       │
    │                       ├─> Backend: Route handler
    │                       │       │
    │                       │       ├─> Validate input (Zod)
    │                       │       │
    │                       │       ├─> Start transaction
    │                       │       │
    │                       │       ├─> Insert invoice
    │                       │       │
    │                       │       ├─> Insert invoice items
    │                       │       │
    │                       │       ├─> Link purchases
    │                       │       │
    │                       │       └─> Commit transaction
    │                       │
    │                       └─> Return created invoice
    │                               │
    │                               └─> RTK Query: Invalidate cache
    │                                       │
    │                                       └─> Refetch data
```

## Design Patterns

### 1. Repository Pattern (Implicit)

Database queries are abstracted through helper functions:
- `query()` - Execute SELECT queries
- `queryOne()` - Execute SELECT and return single row
- `transaction()` - Execute operations in a transaction

### 2. Service Layer Pattern

Business logic is encapsulated in route handlers:
- Authentication logic in `routes/auth.ts`
- Invoice generation logic in `routes/invoices/helpers.ts`
- Statistics calculation in route handlers

### 3. Component Composition

Frontend uses composition for complex UIs:
- Large components split into smaller sub-components
- Shared components in `components/ui/`
- Feature-specific components in feature folders

### 4. API Slice Pattern (RTK Query)

Each domain has its own API slice:
- `clients.ts` - Client operations
- `purchases.ts` - Purchase operations
- `invoices.ts` - Invoice operations
- `finance.ts` - Finance operations
- `settings.ts` - Settings operations

## Security Architecture

### Authentication

- JWT tokens with 12-hour expiration
- Tokens stored in localStorage/sessionStorage
- Token verification on protected routes
- Role-based access control (admin/employee)

### Authorization

- Middleware checks JWT token
- Role verification for admin-only operations
- User context available in request handlers

### Data Protection

- Password hashing with bcrypt (10 rounds)
- SQL injection prevention (parameterized queries)
- Input validation with Zod schemas
- CORS configuration
- Helmet.js security headers

## Scalability Considerations

### Database

- Connection pooling (max 20 connections)
- Indexed columns for fast queries
- Views for complex reporting queries
- Triggers for automatic updates

### Backend

- Stateless API design
- Horizontal scaling capability
- Connection pooling for database
- Compression middleware

### Frontend

- Code splitting with Vite
- Lazy loading of components
- RTK Query caching reduces API calls
- Optimistic updates for better UX

## Error Handling

### Frontend

- RTK Query error handling
- Toast notifications for user feedback
- Error boundaries (can be added)
- Form validation errors

### Backend

- Centralized error handler
- Database error handling
- HTTP status codes
- Error messages (sanitized in production)

## Performance Optimizations

### Frontend

- RTK Query caching and invalidation
- Memoization with React hooks
- Lazy component loading
- Image optimization

### Backend

- Database query optimization
- Connection pooling
- Compression middleware
- Efficient pagination

## Monitoring and Logging

### Backend

- Morgan for HTTP request logging
- Console logging for errors
- Database connection logging

### Frontend

- Console logging for debugging
- Error tracking (can integrate Sentry)

## Future Enhancements

- [ ] Automated testing (Jest, React Testing Library)
- [ ] API rate limiting
- [ ] Redis caching layer
- [ ] WebSocket for real-time updates
- [ ] File upload for attachments
- [ ] Email notifications
- [ ] Advanced reporting and analytics
- [ ] Multi-tenancy support
- [ ] Audit logging
- [ ] Backup and restore automation

