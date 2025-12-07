# Purchase Management Backend

Node.js + Express + TypeScript backend with PostgreSQL database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up database:
- Create PostgreSQL database (see `../database/README.md`)
- Update `.env.local-only` with your database credentials

3. Run migrations:
```bash
# From project root
psql -U postgres -d purchase_management -f database/migrations/001_initial_schema.sql
psql -U postgres -d purchase_management -f database/migrations/002_triggers.sql
psql -U postgres -d purchase_management -f database/migrations/003_functions.sql
psql -U postgres -d purchase_management -f database/migrations/004_views.sql
```

4. Start development server:
```bash
npm run dev
```

The server will start on `http://localhost:8080`

## Environment Variables

Copy `.env.example` to `.env.local-only` and update with your values.

## API Endpoints

See `../API_ENDPOINTS.md` for complete API documentation.

## Project Structure

```
backend/
├── src/
│   ├── database.ts      # PostgreSQL connection
│   ├── app.ts          # Express app setup
│   ├── index.ts        # Entry point
│   ├── types.ts        # TypeScript types
│   ├── common.ts       # Shared utilities
│   └── routes/         # API route handlers
│       ├── auth.ts
│       ├── clients.ts
│       ├── purchases.ts
│       ├── invoices.ts
│       ├── finance.ts
│       └── settings.ts
├── package.json
├── tsconfig.json
└── .env.local-only
```

