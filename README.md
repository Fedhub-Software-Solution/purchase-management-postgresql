# Purchase Management System

A comprehensive purchase order and invoice management system built with React, Node.js, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd purchase-management-cursor
   ```

2. **Set up the database**
   ```bash
   # Create database
   psql -U postgres
   CREATE DATABASE purchase_management;
   \q
   
   # Run migrations
   cd database
   psql -U postgres -d purchase_management -f migrations/001_initial_schema.sql
   psql -U postgres -d purchase_management -f migrations/002_triggers.sql
   psql -U postgres -d purchase_management -f migrations/003_functions.sql
   psql -U postgres -d purchase_management -f migrations/004_views.sql
   ```

3. **Configure backend**
   ```bash
   cd backend
   cp .env.local-only.example .env.local-only
   # Edit .env.local-only with your database credentials
   npm install
   ```

4. **Configure frontend**
   ```bash
   cd frontend
   npm install
   ```

5. **Start the application**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080

### Default Login Credentials

- **Admin**: `admin@fedhubsoftware.com` / `Admin@123`
- **Employee**: `employee@fedhubsoftware.com` / `Employee@123`

## 📁 Project Structure

```
purchase-management-cursor/
├── backend/              # Node.js/Express backend
│   ├── src/
│   │   ├── routes/      # API route handlers
│   │   ├── database.ts  # PostgreSQL connection
│   │   └── types.ts     # TypeScript types
│   └── package.json
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── lib/         # API slices (RTK Query)
│   │   └── types/       # TypeScript types
│   └── package.json
└── database/            # Database migrations
    └── migrations/      # SQL migration files
```

## 🏗️ Architecture

This is a full-stack application with:

- **Frontend**: React 18 + Redux Toolkit (RTK Query) + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Database**: PostgreSQL with migrations, triggers, and functions
- **Authentication**: JWT-based authentication
- **UI Framework**: Radix UI + Tailwind CSS

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 📚 Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System architecture and design patterns
- [API Documentation](./API_DOCUMENTATION.md) - Complete API endpoint reference
- [Database Schema](./DATABASE_SCHEMA.md) - Database structure and relationships
- [Frontend Architecture](./FRONTEND_ARCHITECTURE.md) - Frontend structure and patterns
- [Backend Architecture](./BACKEND_ARCHITECTURE.md) - Backend structure and patterns
- [Deploy to Google Cloud - Step by Step](./DEPLOY_TO_GCP_NOW.md) - Complete step-by-step guide to deploy NOW ⭐ START HERE
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Google Cloud Deployment - Step by Step](./GCP_DEPLOYMENT_STEP_BY_STEP.md) - Complete walkthrough for GCP deployment
- [Google Cloud Deployment](./GCP_DEPLOYMENT.md) - Detailed GCP deployment guide
- [Quick Start Deployment](./DEPLOYMENT_QUICK_START.md) - Quick deployment steps
- [Hostinger Deployment](./HOSTINGER_DEPLOYMENT.md) - Complete Hostinger VPS/Cloud deployment guide
- [Desktop App Guide](./DESKTOP_APP_GUIDE.md) - Convert to desktop application (Electron/Tauri)

## 🎯 Features

### Core Modules

1. **Client Management**
   - Create, read, update, delete clients
   - Client information with billing/shipping addresses
   - GST, PAN, MSME number tracking

2. **Purchase Order Management**
   - Create purchase orders with multiple items
   - Bulk import from CSV
   - Status tracking (draft, approved, pending, rejected)
   - Multi-currency support

3. **Invoice Management**
   - Generate invoices from purchase orders
   - Support for multiple purchase orders per invoice
   - Invoice status tracking (draft, sent, paid, overdue)
   - PDF generation and download
   - Automatic invoice numbering

4. **Finance Management**
   - Track financial transactions
   - Income and expense records
   - Payment method tracking
   - Category-based organization

5. **Settings Management**
   - Company information configuration
   - Tax rate settings
   - Payment terms configuration
   - Default currency settings

### Key Features

- ✅ JWT-based authentication with role-based access
- ✅ Real-time data synchronization with RTK Query
- ✅ Responsive UI with modern design
- ✅ PDF invoice generation
- ✅ Multi-currency support
- ✅ Advanced filtering and search
- ✅ Dashboard with KPIs and statistics
- ✅ Bulk operations support

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **Redux Toolkit** - State management
- **RTK Query** - Data fetching and caching
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Radix UI** - Component library
- **Tailwind CSS** - Styling
- **jsPDF** - PDF generation
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **pg** - PostgreSQL client
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Zod** - Schema validation

## 📝 Development

### Backend Development

```bash
cd backend
npm run dev    # Development with hot reload
npm run build  # Build for production
npm start      # Run production build
```

### Frontend Development

```bash
cd frontend
npm run dev    # Development server
npm run build  # Production build
```

### Database Migrations

```bash
# Run a specific migration
psql -U postgres -d purchase_management -f database/migrations/001_initial_schema.sql

# Or use the setup script
cd database
./setup.sh  # Linux/Mac
./setup.ps1 # Windows PowerShell
```

## 🧪 Testing

Currently, the project uses manual testing. Automated tests can be added using:
- **Jest** for unit tests
- **React Testing Library** for component tests
- **Supertest** for API tests

## 📦 Build for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

## 🔒 Security

- JWT tokens with expiration
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- CORS configuration
- Helmet.js for security headers
- Input validation with Zod

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Team/Contributors]

## 📞 Support

For issues and questions, please contact [Your Contact Information]

