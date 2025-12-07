# Frontend Architecture

Detailed documentation of the frontend architecture, patterns, and structure.

## Technology Stack

- **React 18** - UI library with hooks
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **RTK Query** - Data fetching and caching
- **Vite** - Build tool and dev server
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form management
- **jsPDF** - PDF generation
- **Recharts** - Data visualization
- **Sonner** - Toast notifications
- **Motion (Framer Motion)** - Animations

## Project Structure

```
frontend/src/
├── components/          # React components
│   ├── client/         # Client management components
│   ├── purchase/       # Purchase order components
│   ├── invoice/        # Invoice components
│   ├── finance/        # Finance components
│   └── ui/             # Reusable UI components (Radix UI)
├── lib/                # Libraries and utilities
│   ├── api/            # RTK Query API slices
│   └── auth.ts         # Authentication utilities
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # Global styles
├── App.tsx             # Root component
├── main.tsx            # Entry point
└── store.ts            # Redux store configuration
```

## Architecture Patterns

### 1. Component Organization

**Feature-Based Structure:**
Each major feature has its own folder with sub-components:
- `InvoiceManagement.tsx` - Main container
- `invoice/InvoiceList.tsx` - List view
- `invoice/InvoiceForm.tsx` - Create/edit form
- `invoice/InvoiceView.tsx` - Detail view
- `invoice/InvoiceKPIs.tsx` - Statistics cards
- `invoice/InvoiceFilters.tsx` - Filter controls
- `invoice/types.ts` - Feature-specific types
- `invoice/utils.ts` - Feature-specific utilities

**Benefits:**
- Clear separation of concerns
- Easy to locate feature code
- Reusable sub-components
- Maintainable codebase

### 2. State Management

**Redux Toolkit + RTK Query:**
- **RTK Query** for server state (API data)
- **React State** for local UI state
- **Redux Store** for global application state

**API Slices:**
Each domain has its own API slice:
```typescript
// lib/api/slices/invoices.ts
export const invoiceApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: `${API_BASE}/invoices` }),
  tagTypes: ['Invoice'],
  endpoints: (builder) => ({
    listInvoices: builder.query<Invoice[], ListParams>({...}),
    getInvoice: builder.query<Invoice, string>({...}),
    createInvoice: builder.mutation<Invoice, CreateInvoiceInput>({...}),
    // ...
  }),
});
```

**Caching Strategy:**
- Automatic caching of query results
- Cache invalidation on mutations
- Optimistic updates for better UX
- Background refetching

### 3. Data Fetching

**RTK Query Hooks:**
```typescript
// In components
const { data, isLoading, error } = useListInvoicesQuery({ 
  search: filters.search,
  status: filters.status 
});

const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
```

**Benefits:**
- Automatic loading states
- Error handling
- Caching and deduplication
- Background updates

### 4. Component Patterns

**Container/Presenter Pattern:**
- Container components handle logic and data fetching
- Presenter components handle UI rendering
- Example: `InvoiceManagement` (container) → `InvoiceList` (presenter)

**Custom Hooks:**
- Reusable logic extracted to hooks
- Example: Form validation, data transformations

**Composition:**
- Large components split into smaller sub-components
- Shared components in `components/ui/`
- Feature-specific components in feature folders

### 5. Form Management

**React Hook Form:**
- Declarative form handling
- Built-in validation
- Performance optimized (uncontrolled components)

**Example:**
```typescript
const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('field', { required: true })} />
  {errors.field && <span>Error message</span>}
</form>
```

### 6. Routing

**Client-Side Routing:**
- Page-based navigation (not using React Router)
- State-based page switching
- URL updates can be added with React Router

**Current Implementation:**
```typescript
const [currentPage, setCurrentPage] = useState('dashboard');

const renderPage = () => {
  switch (currentPage) {
    case 'dashboard': return <Dashboard />;
    case 'invoices': return <InvoiceManagement />;
    // ...
  }
};
```

### 7. Styling

**Tailwind CSS:**
- Utility-first CSS
- Responsive design
- Dark mode support (via next-themes)

**Component Styling:**
- Tailwind classes for styling
- Radix UI for accessible components
- Custom CSS for complex animations

### 8. Type Safety

**TypeScript:**
- Strict type checking
- Shared types between frontend and backend
- Type inference for better DX

**Type Definitions:**
- `types/index.ts` - Shared types
- Feature-specific types in feature folders
- API types in `lib/api/types.ts`

## Key Components

### 1. App.tsx

Root component that:
- Manages authentication state
- Handles routing/navigation
- Provides layout structure
- Renders page components

### 2. Layout Components

**Layout.tsx:**
- Sidebar navigation
- Main content area
- Responsive design

**Header.tsx:**
- Top navigation bar
- User menu
- Page title

### 3. Feature Components

Each feature follows a similar structure:

**Management Component (Container):**
- State management
- Data fetching
- Event handlers
- Routes to sub-components

**Sub-Components:**
- List - Data table with pagination
- Form - Create/edit forms
- View - Detail view
- Filters - Search and filter controls
- KPIs - Statistics cards

### 4. UI Components

**Radix UI Components:**
- Accessible by default
- Unstyled (styled with Tailwind)
- Keyboard navigation
- ARIA attributes

**Location:** `components/ui/`

**Examples:**
- Button, Input, Select, Dialog, Table, etc.

## Data Flow

### 1. Component Mount

```
Component Mounts
    │
    ├─> RTK Query Hook (useListInvoicesQuery)
    │       │
    │       ├─> Check Cache
    │       │   └─> Return if available
    │       │
    │       └─> Fetch from API
    │               │
    │               └─> Update Cache
    │
    └─> Component Renders with Data
```

### 2. User Action

```
User Clicks "Create Invoice"
    │
    ├─> Form Submission
    │       │
    │       └─> RTK Query Mutation (useCreateInvoiceMutation)
    │               │
    │               ├─> POST /api/invoices
    │               │       │
    │               │       └─> Backend Processes
    │               │
    │               └─> Invalidate Cache
    │                       │
    │                       └─> Refetch Data
    │                               │
    │                               └─> Component Updates
```

### 3. Cache Management

- Automatic cache invalidation on mutations
- Tag-based cache invalidation
- Manual refetch when needed
- Optimistic updates for instant feedback

## Performance Optimizations

### 1. Code Splitting

- Vite automatic code splitting
- Lazy loading of components (can be added)
- Route-based splitting

### 2. Memoization

- React.memo for expensive components
- useMemo for expensive calculations
- useCallback for stable function references

### 3. RTK Query Caching

- Automatic request deduplication
- Cache-first strategy
- Background refetching
- Stale-while-revalidate pattern

### 4. Image Optimization

- Lazy loading images
- Optimized formats
- Responsive images

## Error Handling

### 1. API Errors

RTK Query provides error handling:
```typescript
const { data, error, isLoading } = useListInvoicesQuery();

if (error) {
  // Handle error
  toast.error('Failed to load invoices');
}
```

### 2. Form Validation

React Hook Form validation:
```typescript
const schema = z.object({
  email: z.string().email(),
  // ...
});

const { register, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

### 3. User Feedback

- Toast notifications (Sonner)
- Error messages in forms
- Loading states
- Success confirmations

## Testing Strategy

**Recommended Testing Stack:**
- **Jest** - Unit testing
- **React Testing Library** - Component testing
- **MSW** - API mocking
- **Vitest** - Vite-compatible test runner

**Test Structure:**
```
__tests__/
├── components/
├── utils/
└── lib/
```

## Build and Deployment

### Development

```bash
npm run dev
# Starts Vite dev server on http://localhost:5173
```

### Production Build

```bash
npm run build
# Output in frontend/dist/
```

### Build Output

- Optimized JavaScript bundles
- CSS extraction
- Asset optimization
- Source maps (optional)

## Environment Variables

**Vite Environment Variables:**
- `VITE_API_BASE` - API base URL (optional)
- Automatically detected based on hostname

**Default Behavior:**
- Localhost → `http://localhost:8080/api`
- Production → `/api`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Grid and Flexbox
- Fetch API

## Accessibility

- Radix UI components (ARIA compliant)
- Keyboard navigation
- Screen reader support
- Focus management
- Semantic HTML

## Future Enhancements

- [ ] React Router for URL-based routing
- [ ] Service Worker for offline support
- [ ] Progressive Web App (PWA)
- [ ] Internationalization (i18n)
- [ ] Advanced error boundaries
- [ ] Performance monitoring
- [ ] Automated testing
- [ ] Storybook for component documentation

