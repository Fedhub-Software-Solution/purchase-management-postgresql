# Backend Architecture

Detailed documentation of the backend architecture, patterns, and structure.

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client library
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Zod** - Schema validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logging
- **Compression** - Response compression

## Project Structure

```
backend/src/
├── routes/              # API route handlers
│   ├── auth.ts          # Authentication routes
│   ├── clients.ts       # Client management
│   ├── purchases.ts     # Purchase orders
│   ├── invoices/        # Invoice handlers (modular)
│   │   ├── list.ts      # List endpoint
│   │   ├── stats.ts     # Statistics endpoint
│   │   ├── crud.ts      # CRUD operations
│   │   └── helpers.ts   # Helper functions
│   ├── finance/         # Finance handlers (modular)
│   │   ├── list.ts
│   │   ├── stats.ts
│   │   └── crud.ts
│   ├── settings.ts      # Settings management
│   └── health.ts        # Health check
├── database.ts          # Database connection pool
├── common.ts            # Shared utilities
├── types.ts             # TypeScript types
├── app.ts               # Express app configuration
└── index.ts             # Application entry point
```

## Architecture Patterns

### 1. RESTful API Design

**Resource-Based URLs:**
- `/api/clients` - Client resources
- `/api/purchases` - Purchase order resources
- `/api/invoices` - Invoice resources
- `/api/finance` - Finance record resources

**HTTP Methods:**
- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Full update
- `PATCH` - Partial update
- `DELETE` - Delete resources

### 2. Route Organization

**Flat Routes (Simple):**
- `auth.ts` - All auth endpoints
- `clients.ts` - All client endpoints
- `purchases.ts` - All purchase endpoints

**Modular Routes (Complex):**
- `invoices/` - Split into multiple files
  - `list.ts` - List and filtering logic
  - `stats.ts` - Statistics calculation
  - `crud.ts` - Create, read, update, delete
  - `helpers.ts` - Shared helper functions

**Benefits:**
- Better code organization
- Easier to maintain
- Clear separation of concerns

### 3. Database Layer

**Connection Pooling:**
```typescript
const pool = new Pool({
  max: 20,                    // Max connections
  idleTimeoutMillis: 30000,   // Idle timeout
  connectionTimeoutMillis: 2000
});
```

**Query Helpers:**
- `query()` - Execute SELECT queries
- `queryOne()` - Execute SELECT and return single row
- `transaction()` - Execute operations in a transaction

**Benefits:**
- Connection reuse
- Automatic connection management
- Transaction support
- Error handling

### 4. Authentication & Authorization

**JWT-Based Authentication:**
- Tokens issued on login
- 12-hour expiration
- Token verification middleware
- Role-based access control

**Middleware:**
```typescript
export function authRequired(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Role-Based Access:**
- `admin` - Full access
- `employee` - Limited access
- Admin-only endpoints protected

### 5. Input Validation

**Zod Schemas:**
```typescript
const clientSchema = z.object({
  company: z.string().min(1),
  email: z.string().email(),
  status: z.enum(['active', 'inactive']),
  // ...
});
```

**Validation Flow:**
1. Request received
2. Schema validation
3. Return 400 if invalid
4. Process if valid

### 6. Error Handling

**Centralized Error Handler:**
```typescript
app.use((err, req, res, next) => {
  const status = err?.status || 500;
  const message = err?.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});
```

**Database Error Handling:**
- SQL error detection
- User-friendly error messages
- Detailed errors in development
- Sanitized errors in production

### 7. Transaction Management

**Atomic Operations:**
```typescript
await transaction(async (client) => {
  // Insert invoice
  await client.query('INSERT INTO invoices ...');
  
  // Insert invoice items
  for (const item of items) {
    await client.query('INSERT INTO invoice_items ...');
  }
  
  // Link purchases
  await client.query('INSERT INTO invoice_purchases ...');
});
```

**Benefits:**
- Data consistency
- Rollback on errors
- ACID compliance

## Request Flow

### 1. Request Processing

```
HTTP Request
    │
    ├─> CORS Middleware
    │       │
    │       └─> Check origin
    │
    ├─> Helmet Middleware
    │       │
    │       └─> Security headers
    │
    ├─> Compression Middleware
    │       │
    │       └─> Compress response
    │
    ├─> JSON Parser
    │       │
    │       └─> Parse request body
    │
    ├─> Morgan Logger
    │       │
    │       └─> Log request
    │
    └─> Route Handler
            │
            ├─> Authentication (if required)
            │       │
            │       └─> Verify JWT token
            │
            ├─> Validation
            │       │
            │       └─> Validate input (Zod)
            │
            ├─> Business Logic
            │       │
            │       ├─> Database queries
            │       │
            │       └─> Data transformation
            │
            └─> Response
                    │
                    └─> JSON response
```

### 2. Database Query Flow

```
Route Handler
    │
    ├─> Call query() or queryOne()
    │       │
    │       ├─> Get connection from pool
    │       │
    │       ├─> Execute SQL query
    │       │
    │       ├─> Return results
    │       │
    │       └─> Release connection
    │
    └─> Transform data
            │
            └─> Return to client
```

## Security Measures

### 1. Authentication

- JWT tokens with expiration
- Password hashing (bcrypt, 10 rounds)
- Token verification on protected routes

### 2. Authorization

- Role-based access control
- Admin-only endpoints
- User context in requests

### 3. Input Validation

- Zod schema validation
- Type checking
- Sanitization

### 4. SQL Injection Prevention

- Parameterized queries
- No string concatenation
- Prepared statements

### 5. Security Headers

- Helmet.js for security headers
- CORS configuration
- Content Security Policy (relaxed for dev)

## Error Handling Strategy

### 1. Validation Errors

**Zod Validation:**
```typescript
try {
  const parsed = schema.parse(req.body);
} catch (e) {
  if (e.issues) {
    return res.status(400).json({ 
      error: 'Validation failed',
      issues: e.issues 
    });
  }
}
```

### 2. Database Errors

**Error Detection:**
```typescript
try {
  await query('...');
} catch (err) {
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({ error: 'Duplicate entry' });
  }
  handleDbError(err, res);
}
```

### 3. Application Errors

**Error Response:**
```typescript
res.status(500).json({ 
  error: 'Internal Server Error',
  ...(dev && { stack: err.stack })
});
```

## Performance Optimizations

### 1. Connection Pooling

- Reuse database connections
- Max 20 concurrent connections
- Automatic connection management

### 2. Query Optimization

- Indexed columns for fast queries
- Efficient JOINs
- Pagination for large datasets

### 3. Response Compression

- Gzip compression middleware
- Reduces response size
- Faster transfers

### 4. Caching

- Currently no caching layer
- Can add Redis for caching
- Response caching possible

## Logging

### 1. HTTP Request Logging

**Morgan:**
- Development: Detailed logs
- Production: Tiny format
- Skips health check endpoints

### 2. Error Logging

- Console logging in development
- Detailed stack traces in dev
- Sanitized errors in production

### 3. Database Logging

- Connection events
- Query errors
- Transaction logs

## Environment Configuration

**Environment Variables:**
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_SSL` - SSL connection (true/false)
- `JWT_SECRET` - JWT secret key
- `FRONTEND_URL` - Allowed frontend origins
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 8080)

**Configuration Loading:**
```typescript
dotenv.config({ path: '.env.local-only' });
dotenv.config(); // Fallback to .env
```

## API Response Formats

### Success Response

```json
{
  "id": "uuid",
  "field1": "value1",
  ...
}
```

### Error Response

```json
{
  "error": "Error message"
}
```

### Paginated Response

```json
{
  "data": [...],
  "nextPageToken": "token",
  "hasMore": true
}
```

## Testing Strategy

**Recommended Testing Stack:**
- **Jest** - Test framework
- **Supertest** - HTTP assertions
- **PostgreSQL test database** - Isolated testing

**Test Structure:**
```
__tests__/
├── routes/
├── database/
└── utils/
```

## Deployment Considerations

### 1. Process Management

- Use PM2 or similar
- Auto-restart on crashes
- Log management

### 2. Database Migrations

- Run migrations before starting
- Version control migrations
- Rollback strategy

### 3. Environment Variables

- Secure storage
- No secrets in code
- Different configs per environment

### 4. Monitoring

- Health check endpoint
- Uptime monitoring
- Error tracking (can add Sentry)

## Scalability

### 1. Horizontal Scaling

- Stateless API design
- Shared database
- Load balancer ready

### 2. Database Scaling

- Connection pooling
- Read replicas (can add)
- Query optimization

### 3. Caching Layer

- Can add Redis
- Response caching
- Query result caching

## Future Enhancements

- [ ] API rate limiting
- [ ] Request validation middleware
- [ ] Response caching
- [ ] GraphQL API (optional)
- [ ] WebSocket support
- [ ] File upload handling
- [ ] Email service integration
- [ ] Advanced logging (Winston)
- [ ] Metrics collection (Prometheus)
- [ ] API versioning

