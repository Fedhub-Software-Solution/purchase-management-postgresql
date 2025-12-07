# Quick Start: Deploy to Google Cloud

Simplified step-by-step guide for deploying to Google Cloud Platform.

## Prerequisites

1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
2. Create GCP account and project
3. Enable billing

## Quick Deployment Steps

### 1. Initialize GCP Project

```bash
# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com sqladmin.googleapis.com storage-component.googleapis.com secretmanager.googleapis.com
```

### 2. Create PostgreSQL Database

```bash
# Create Cloud SQL instance
gcloud sql instances create purchase-management-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_ROOT_PASSWORD

# Create database
gcloud sql databases create purchase_management --instance=purchase-management-db

# Create user
gcloud sql users create app_user \
  --instance=purchase-management-db \
  --password=YOUR_USER_PASSWORD
```

### 3. Store Secrets

```bash
# Store JWT secret
echo -n "YOUR_32_CHARACTER_JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-

# Store DB password
echo -n "YOUR_USER_PASSWORD" | gcloud secrets create db-user-password --data-file=-
```

### 4. Deploy Backend

```bash
cd backend

# Update cloudbuild.yaml with your PROJECT_ID and instance name
# Then deploy:
gcloud builds submit --config=cloudbuild.yaml

# Get the service URL
gcloud run services describe purchase-management-api \
  --region us-central1 \
  --format="value(status.url)"
```

### 5. Build and Deploy Frontend

```bash
cd frontend

# Create .env.production with your backend URL
echo "VITE_API_BASE=YOUR_CLOUD_RUN_URL/api" > .env.production

# Build
npm run build

# Create storage bucket (replace with unique name)
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l us-central1 gs://purchase-management-frontend-UNIQUE

# Upload files
gsutil -m cp -r dist/* gs://purchase-management-frontend-UNIQUE/

# Make public
gsutil iam ch allUsers:objectViewer gs://purchase-management-frontend-UNIQUE/

# Enable static website
gsutil web set -m index.html -e index.html gs://purchase-management-frontend-UNIQUE
```

### 6. Run Database Migrations

```bash
# Option 1: Using Cloud SQL Proxy
# Download: https://cloud.google.com/sql/docs/postgres/sql-proxy
# Start proxy:
./cloud_sql_proxy -instances=YOUR_PROJECT_ID:us-central1:purchase-management-db=tcp:5432

# In another terminal:
psql -h 127.0.0.1 -U app_user -d purchase_management -f database/migrations/001_initial_schema.sql
# Repeat for 002, 003, 004
```

### 7. Access Your Application

- **Frontend**: `https://storage.googleapis.com/purchase-management-frontend-UNIQUE/index.html`
- **Backend API**: `https://purchase-management-api-xxxxx-uc.a.run.app`

## Next Steps

1. Set up custom domain (see GCP_DEPLOYMENT.md)
2. Configure Cloud CDN for better performance
3. Set up monitoring and alerts
4. Configure automated backups

For detailed instructions, see [GCP_DEPLOYMENT.md](./GCP_DEPLOYMENT.md)

