# Purchase Management Frontend

React + Redux Toolkit + RTK Query frontend for the Purchase Management System.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
- Copy `.env.example` to `.env.local`
- Update `VITE_API_BASE` if your backend runs on a different port

3. **Start development server:**
```bash
npm run dev
```

The app will start on `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/        # React components (UI)
│   ├── lib/
│   │   └── api/
│   │       └── slices/   # RTK Query API slices
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── store.ts          # Redux store
├── package.json
├── vite.config.ts
└── .env.local
```

## API Integration

The frontend uses RTK Query to communicate with the backend API. All API slices are in `src/lib/api/slices/`:

- `clients.ts` - Client management
- `purchases.ts` - Purchase orders
- `invoices.ts` - Invoice management
- `finance.ts` - Finance records
- `settings.ts` - Application settings

## Authentication

- Login credentials are stored in `localStorage` or `sessionStorage`
- JWT token is sent in `Authorization: Bearer <token>` header
- Default users:
  - Admin: `admin@fedhubsoftware.com` / `Admin@123`
  - Employee: `employee@fedhubsoftware.com` / `Employee@123`

## Building for Production

```bash
npm run build
```

Output will be in the `build/` directory.

## Notes

- **No UI Changes**: All components remain identical to the reference
- **API Compatible**: Works with PostgreSQL backend (same API structure)
- **RTK Query**: Already configured for REST API
