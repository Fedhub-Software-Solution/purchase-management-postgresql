# API Documentation

Complete reference for all API endpoints in the Purchase Management System.

## Base URL

- **Development**: `http://localhost:8080/api`
- **Production**: `/api` (relative to deployment domain)

## Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained via the `/api/auth/login` endpoint and expire after 12 hours.

## Common Response Formats

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
  "nextPageToken": "token_string",
  "hasMore": true
}
```

## Endpoints

### Authentication

#### POST /api/auth/login
Login and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin"
  }
}
```

#### POST /api/auth/logout
Logout (client-side token removal).

**Response:**
```json
{
  "ok": true
}
```

#### GET /api/auth/me
Get current authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin"
}
```

#### GET /api/auth/master/users
List all users (admin only).

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin",
    "active": true
  }
]
```

#### POST /api/auth/master/users
Create new user (admin only).

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password",
  "name": "User Name",
  "role": "employee"
}
```

---

### Clients

#### GET /api/clients
List all clients with pagination and filtering.

**Query Parameters:**
- `limit` (number): Number of results per page (default: 50)
- `pageToken` (string): Token for pagination
- `search` (string): Search in company name, email, contact person
- `status` (string): Filter by status (`active` | `inactive`)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "company": "Company Name",
      "contactPerson": "Contact Name",
      "email": "email@example.com",
      "phone": "+1234567890",
      "status": "active",
      "gstNumber": "GST123",
      "msmeNumber": "MSME123",
      "panNumber": "PAN123",
      "billingAddress": {
        "street": "Street",
        "city": "City",
        "state": "State",
        "postalCode": "12345",
        "country": "Country"
      },
      "shippingAddress": {...},
      "baseCurrency": "INR",
      "notes": "Notes",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "nextPageToken": "token",
  "hasMore": true
}
```

#### GET /api/clients/:id
Get a single client by ID.

**Response:**
```json
{
  "id": "uuid",
  "company": "Company Name",
  ...
}
```

#### POST /api/clients
Create a new client.

**Request Body:**
```json
{
  "company": "Company Name",
  "contactPerson": "Contact Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "status": "active",
  "gstNumber": "GST123",
  "msmeNumber": "MSME123",
  "panNumber": "PAN123",
  "billingAddress": {
    "street": "Street",
    "city": "City",
    "state": "State",
    "postalCode": "12345",
    "country": "Country"
  },
  "shippingAddress": {...},
  "baseCurrency": "INR",
  "notes": "Notes"
}
```

#### PUT /api/clients/:id
Update a client (full replacement).

**Request Body:** Same as POST

#### PATCH /api/clients/:id
Update a client (partial update).

**Request Body:** Any subset of client fields

#### DELETE /api/clients/:id
Delete a client.

**Response:**
```json
{
  "ok": true
}
```

---

### Purchase Orders

#### GET /api/purchases
List all purchase orders with pagination and filtering.

**Query Parameters:**
- `limit` (number): Results per page
- `pageToken` (string): Pagination token
- `search` (string): Search in PO number
- `status` (string): Filter by status
- `clientId` (string): Filter by client ID

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "clientId": "uuid",
      "poNumber": "PO-2025-001",
      "date": "2025-01-01",
      "status": "approved",
      "items": [
        {
          "id": "uuid",
          "name": "Item Name",
          "model": "Model",
          "supplier": "Supplier",
          "quantity": 10,
          "unitPrice": 100.00,
          "uom": "pcs",
          "currency": "INR",
          "total": 1000.00
        }
      ],
      "subtotal": 1000.00,
      "tax": 180.00,
      "total": 1180.00,
      "baseCurrency": "INR",
      "notes": "Notes",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "nextPageToken": "token",
  "hasMore": true
}
```

#### GET /api/purchases/:id
Get a single purchase order by ID.

#### GET /api/purchases/byClient/:clientId
Get all purchase orders for a specific client.

#### POST /api/purchases/byIds
Get multiple purchase orders by IDs.

**Request Body:**
```json
{
  "ids": ["uuid1", "uuid2", ...]
}
```

#### POST /api/purchases
Create a new purchase order.

**Request Body:**
```json
{
  "clientId": "uuid",
  "poNumber": "PO-2025-001",
  "date": "2025-01-01",
  "status": "draft",
  "items": [
    {
      "name": "Item Name",
      "model": "Model",
      "supplier": "Supplier",
      "quantity": 10,
      "unitPrice": 100.00,
      "uom": "pcs",
      "currency": "INR"
    }
  ],
  "baseCurrency": "INR",
  "notes": "Notes"
}
```

**Note:** `subtotal`, `tax`, and `total` are calculated automatically.

#### PATCH /api/purchases/:id
Update a purchase order (partial).

#### PUT /api/purchases/:id
Update a purchase order (full replacement).

#### DELETE /api/purchases/:id
Delete a purchase order.

---

### Invoices

#### GET /api/invoices
List all invoices with pagination and filtering.

**Query Parameters:**
- `limit` (number): Results per page
- `pageToken` (string): Pagination token
- `search` (string): Search in invoice number
- `status` (string): Filter by status (`draft` | `sent` | `paid` | `overdue`)
- `clientId` (string): Filter by client ID

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2025-001",
      "clientId": "uuid",
      "date": "2025-01-01",
      "dueDate": "2025-01-31",
      "status": "sent",
      "items": [
        {
          "id": "uuid",
          "name": "Item Name",
          "model": "Model",
          "supplier": "Supplier",
          "quantity": 10,
          "unitPrice": 100.00,
          "uom": "pcs",
          "currency": "INR",
          "total": 1000.00,
          "purchaseId": "uuid",
          "poNumber": "PO-2025-001"
        }
      ],
      "subtotal": 1000.00,
      "tax": 180.00,
      "total": 1180.00,
      "paymentTerms": "30",
      "baseCurrency": "INR",
      "notes": "Notes",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "nextPageToken": "token",
  "hasMore": true
}
```

#### GET /api/invoices/stats
Get invoice statistics.

**Response:**
```json
{
  "total": 100,
  "draft": 10,
  "sent": 30,
  "paid": 50,
  "overdue": 10,
  "totalAmount": 1000000.00,
  "paidAmount": 500000.00,
  "pendingAmount": 500000.00
}
```

#### GET /api/invoices/:id
Get a single invoice by ID.

#### POST /api/invoices
Create a new invoice.

**Request Body:**
```json
{
  "clientId": "uuid",
  "purchaseIds": ["uuid1", "uuid2"],
  "dueDate": "2025-01-31",
  "paymentTerms": "30",
  "notes": "Notes"
}
```

**Note:** Invoice number is generated automatically. Items are copied from purchase orders.

#### PATCH /api/invoices/:id
Update an invoice (partial).

#### PUT /api/invoices/:id
Update an invoice (full replacement).

#### PATCH /api/invoices/:id/status
Update invoice status only.

**Request Body:**
```json
{
  "status": "paid"
}
```

#### DELETE /api/invoices/:id
Delete an invoice.

---

### Finance Records

#### GET /api/finance
List all finance records with pagination and filtering.

**Query Parameters:**
- `limit` (number): Results per page
- `pageToken` (string): Pagination token
- `search` (string): Search in description
- `type` (string): Filter by type (`income` | `expense`)
- `status` (string): Filter by status
- `category` (string): Filter by category
- `startDate` (string): Filter by start date (ISO format)
- `endDate` (string): Filter by end date (ISO format)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "income",
      "status": "completed",
      "category": "Invoice Payment",
      "amount": 1000.00,
      "currency": "INR",
      "description": "Payment for invoice",
      "paymentMethod": "bank_transfer",
      "date": "2025-01-01",
      "invoiceId": "uuid",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "nextPageToken": "token",
  "hasMore": true
}
```

#### GET /api/finance/stats
Get finance statistics.

**Response:**
```json
{
  "totalIncome": 1000000.00,
  "totalExpenses": 500000.00,
  "netProfit": 500000.00,
  "incomeCount": 50,
  "expenseCount": 30
}
```

#### POST /api/finance
Create a new finance record.

**Request Body:**
```json
{
  "type": "income",
  "status": "completed",
  "category": "Invoice Payment",
  "amount": 1000.00,
  "currency": "INR",
  "description": "Payment description",
  "paymentMethod": "bank_transfer",
  "date": "2025-01-01",
  "invoiceId": "uuid"
}
```

#### PATCH /api/finance/:id
Update a finance record (partial).

#### DELETE /api/finance/:id
Delete a finance record.

---

### Settings

#### GET /api/settings
Get current application settings.

**Response:**
```json
{
  "theme": "light",
  "sidebarCollapsed": false,
  "emailNotifications": true,
  "pushNotifications": false,
  "invoiceReminders": true,
  "companyName": "FedHub Software Solutions",
  "companyEmail": "info@fedhubsoftware.com",
  "companyPhone": "+91 9003285428",
  "companyAddress": "Address",
  "companyGST": "33AACCF2123P1Z5",
  "companyPAN": "AACCF2123P",
  "companyMSME": "UDYAM-TN-06-0012345",
  "defaultTaxRate": 18,
  "defaultPaymentTerms": 30,
  "invoicePrefix": "INV",
  "twoFactorAuth": false,
  "sessionTimeout": 60,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

#### PATCH /api/settings
Update settings (partial update).

**Request Body:**
```json
{
  "companyName": "New Company Name",
  "defaultTaxRate": 20
}
```

#### PUT /api/settings
Replace all settings (keeps defaults for missing fields).

**Request Body:** Complete settings object

#### GET /api/settings/history
Get settings history (optional, for audit).

---

### Health

#### GET /api/health
Health check endpoint with database connectivity test.

**Response:**
```json
{
  "ok": true,
  "uptime": 3600,
  "database": "connected",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding rate limiting for production deployments.

## Pagination

List endpoints support cursor-based pagination:

1. First request: `GET /api/resource?limit=50`
2. Next page: `GET /api/resource?limit=50&pageToken=<token>`

The `nextPageToken` is provided in the response when `hasMore` is `true`.

## Filtering and Search

Most list endpoints support:
- `search` - Full-text search across relevant fields
- `status` - Filter by status
- `clientId` - Filter by client
- Date ranges (where applicable)

## Data Validation

All input data is validated using Zod schemas. Invalid data returns a `400` error with validation details.

