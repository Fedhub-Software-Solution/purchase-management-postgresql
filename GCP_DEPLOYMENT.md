# Google Cloud Platform Deployment Guide

Complete guide for deploying the Purchase Management System to Google Cloud Platform (GCP) for production.

## Architecture Overview

**Recommended GCP Services:**
- **Cloud Run** - Backend API (containerized Node.js)
- **Cloud Storage + Cloud CDN** - Frontend static files
- **Cloud SQL (PostgreSQL)** - Database
- **Cloud Build** - CI/CD pipeline
- **Secret Manager** - Environment variables and secrets

## Prerequisites

1. **Google Cloud Account**
   - Create account at https://cloud.google.com
   - Enable billing
   - Install Google Cloud SDK (gcloud CLI)

2. **Install gcloud CLI**
   ```bash
   # Windows (PowerShell)
   (New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
   & $env:Temp\GoogleCloudSDKInstaller.exe

   # Or use Chocolatey
   choco install gcloudsdk

   # Verify installation
   gcloud --version
   ```

3. **Initialize gcloud**
   ```bash
   gcloud init
   gcloud auth login
   ```

## Step 1: Create GCP Project

```bash
# Create new project
gcloud projects create purchase-management-prod --name="Purchase Management Production"

# Set as active project
gcloud config set project purchase-management-prod

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage-component.googleapis.com \
  secretmanager.googleapis.com
```

## Step 2: Set Up Cloud SQL (PostgreSQL)

### Create PostgreSQL Instance

```bash
# Create Cloud SQL instance
gcloud sql instances create purchase-management-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD \
  --storage-type=SSD \
  --storage-size=20GB \
  --backup-start-time=03:00 \
  --enable-bin-log

# Create database
gcloud sql databases create purchase_management --instance=purchase-management-db

# Create database user
gcloud sql users create app_user \
  --instance=purchase-management-db \
  --password=YOUR_APP_USER_PASSWORD
```

### Get Connection Details

```bash
# Get connection name (needed for Cloud Run)
gcloud sql instances describe purchase-management-db --format="value(connectionName)"
# Output: project-id:region:instance-name
```

### Run Database Migrations

```bash
# Option 1: Using Cloud SQL Proxy (local)
# Download Cloud SQL Proxy
# https://cloud.google.com/sql/docs/postgres/sql-proxy

# Start proxy
./cloud_sql_proxy -instances=PROJECT_ID:REGION:INSTANCE_NAME=tcp:5432

# In another terminal, run migrations
psql -h 127.0.0.1 -U postgres -d purchase_management -f database/migrations/001_initial_schema.sql
psql -h 127.0.0.1 -U postgres -d purchase_management -f database/migrations/002_triggers.sql
psql -h 127.0.0.1 -U postgres -d purchase_management -f database/migrations/003_functions.sql
psql -h 127.0.0.1 -U postgres -d purchase_management -f database/migrations/004_views.sql

# Option 2: Using gcloud sql connect
gcloud sql connect purchase-management-db --user=postgres
# Then run SQL commands directly
```

## Step 3: Store Secrets in Secret Manager

```bash
# Create secrets
echo -n "YOUR_JWT_SECRET_KEY_MIN_32_CHARACTERS_LONG" | gcloud secrets create jwt-secret --data-file=-
echo -n "YOUR_DB_PASSWORD" | gcloud secrets create db-password --data-file=-
echo -n "YOUR_DB_USER_PASSWORD" | gcloud secrets create db-user-password --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding db-user-password \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 4: Prepare Backend for Cloud Run

### Create Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "dist/index.js"]
```

### Create .dockerignore

Create `backend/.dockerignore`:

```
node_modules
dist
.env
.env.local
.env.local-only
*.log
.git
.gitignore
```

### Create Cloud Run Configuration

Create `backend/cloudbuild.yaml`:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/purchase-management-api', '.']
  
  # Push the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/purchase-management-api']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'purchase-management-api'
      - '--image'
      - 'gcr.io/$PROJECT_ID/purchase-management-api'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--add-cloudsql-instances'
      - 'PROJECT_ID:REGION:INSTANCE_NAME'
      - '--set-env-vars'
      - 'NODE_ENV=production,DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME,DB_NAME=purchase_management,DB_USER=app_user,DB_SSL=true'
      - '--set-secrets'
      - 'JWT_SECRET=jwt-secret:latest,DB_PASSWORD=db-user-password:latest'

images:
  - 'gcr.io/$PROJECT_ID/purchase-management-api'
```

### Update Backend for Cloud SQL

Update `backend/src/database.ts` to support Cloud SQL:

```typescript
// Add Cloud SQL support
const pool = new Pool({
  host: process.env.DB_HOST?.startsWith('/cloudsql/') 
    ? `/cloudsql/${process.env.DB_HOST.replace('/cloudsql/', '')}`
    : process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'purchase_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
```

## Step 5: Deploy Backend to Cloud Run

```bash
cd backend

# Build and deploy using Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# Or manually:
# 1. Build Docker image
docker build -t gcr.io/PROJECT_ID/purchase-management-api .

# 2. Push to Container Registry
docker push gcr.io/PROJECT_ID/purchase-management-api

# 3. Deploy to Cloud Run
gcloud run deploy purchase-management-api \
  --image gcr.io/PROJECT_ID/purchase-management-api \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances PROJECT_ID:us-central1:purchase-management-db \
  --set-env-vars "NODE_ENV=production,DB_HOST=/cloudsql/PROJECT_ID:us-central1:purchase-management-db,DB_NAME=purchase_management,DB_USER=app_user,DB_SSL=true" \
  --set-secrets "JWT_SECRET=jwt-secret:latest,DB_PASSWORD=db-user-password:latest" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

# Get service URL
gcloud run services describe purchase-management-api --region us-central1 --format="value(status.url)"
```

## Step 6: Build Frontend for Production

```bash
cd frontend

# Update API base URL for production
# Create .env.production file
echo "VITE_API_BASE=https://purchase-management-api-xxxxx-uc.a.run.app/api" > .env.production

# Build frontend
npm run build

# Output will be in frontend/dist/
```

## Step 7: Deploy Frontend to Cloud Storage + Cloud CDN

### Create Storage Bucket

```bash
# Create bucket (must be globally unique name)
gsutil mb -p PROJECT_ID -c STANDARD -l us-central1 gs://purchase-management-frontend

# Enable static website hosting
gsutil web set -m index.html -e index.html gs://purchase-management-frontend

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://purchase-management-frontend
```

### Upload Frontend Files

```bash
cd frontend

# Upload build files
gsutil -m cp -r dist/* gs://purchase-management-frontend/

# Set cache control for static assets
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://purchase-management-frontend/assets/*

# Set cache control for HTML (no cache)
gsutil -m setmeta -h "Cache-Control:no-cache" gs://purchase-management-frontend/*.html
```

### Set Up Cloud CDN (Optional but Recommended)

```bash
# Create backend bucket
gcloud compute backend-buckets create purchase-management-cdn-backend \
  --gcs-bucket-name=purchase-management-frontend

# Create URL map
gcloud compute url-maps create purchase-management-url-map \
  --default-backend-bucket=purchase-management-cdn-backend

# Create HTTPS proxy
gcloud compute target-https-proxies create purchase-management-https-proxy \
  --url-map=purchase-management-url-map \
  --ssl-certificates=YOUR_SSL_CERTIFICATE_NAME

# Create forwarding rule
gcloud compute forwarding-rules create purchase-management-https-rule \
  --global \
  --target-https-proxy=purchase-management-https-proxy \
  --ports=443
```

## Step 8: Configure Custom Domain (Optional)

### Using Cloud Load Balancer

1. **Reserve Static IP**
   ```bash
   gcloud compute addresses create purchase-management-ip --global
   ```

2. **Create SSL Certificate**
   ```bash
   gcloud compute ssl-certificates create purchase-management-ssl \
     --domains=yourdomain.com,www.yourdomain.com
   ```

3. **Update DNS**
   - Add A record pointing to the reserved IP
   - Point domain to Cloud Load Balancer

## Step 9: Environment Variables Configuration

### Backend Environment Variables (Cloud Run)

Set via Cloud Run console or CLI:

```bash
gcloud run services update purchase-management-api \
  --region us-central1 \
  --update-env-vars "FRONTEND_URL=https://yourdomain.com,DB_HOST=/cloudsql/PROJECT_ID:us-central1:purchase-management-db,DB_NAME=purchase_management,DB_USER=app_user,DB_SSL=true"
```

### Frontend Environment Variables

Update `frontend/.env.production`:

```env
VITE_API_BASE=https://purchase-management-api-xxxxx-uc.a.run.app/api
```

Rebuild and redeploy frontend after changes.

## Step 10: Set Up CI/CD Pipeline

### Create Cloud Build Trigger

Create `cloudbuild.yaml` in project root:

```yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    dir: 'backend'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/purchase-management-api', '.']
  
  - name: 'gcr.io/cloud-builders/docker'
    dir: 'backend'
    args: ['push', 'gcr.io/$PROJECT_ID/purchase-management-api']
  
  - name: 'gcr.io/cloud-builders/gcloud'
    dir: 'backend'
    args:
      - 'run'
      - 'deploy'
      - 'purchase-management-api'
      - '--image'
      - 'gcr.io/$PROJECT_ID/purchase-management-api'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
  
  # Build and deploy frontend
  - name: 'node:18'
    dir: 'frontend'
    entrypoint: 'npm'
    args: ['install']
  
  - name: 'node:18'
    dir: 'frontend'
    entrypoint: 'npm'
    args: ['run', 'build']
  
  - name: 'gcr.io/cloud-builders/gsutil'
    dir: 'frontend'
    args: ['-m', 'cp', '-r', 'dist/*', 'gs://purchase-management-frontend/']
```

### Connect to GitHub/GitLab

```bash
# Connect repository
gcloud builds triggers create github \
  --name="purchase-management-deploy" \
  --repo-name="YOUR_REPO" \
  --repo-owner="YOUR_GITHUB_USERNAME" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

## Step 11: Monitoring and Logging

### Enable Cloud Monitoring

```bash
# Logs are automatically available in Cloud Console
# View logs:
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

### Set Up Alerts

1. Go to Cloud Console > Monitoring > Alerting
2. Create alert policies for:
   - High error rate
   - High latency
   - Low availability
   - Database connection issues

## Step 12: Security Best Practices

### 1. Enable Cloud Armor (DDoS Protection)

```bash
# Create security policy
gcloud compute security-policies create purchase-management-policy \
  --description "Security policy for purchase management"

# Add rules (rate limiting, IP whitelist, etc.)
gcloud compute security-policies rules create 1000 \
  --security-policy purchase-management-policy \
  --expression "true" \
  --action "allow"
```

### 2. Restrict Cloud SQL Access

```bash
# Only allow connections from Cloud Run
gcloud sql instances patch purchase-management-db \
  --authorized-networks=NONE
```

### 3. Use IAM Roles

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create purchase-management-sa \
  --display-name="Purchase Management Service Account"

# Grant minimal permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:purchase-management-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

## Step 13: Cost Optimization

### Cloud Run Settings

```bash
# Configure for cost optimization
gcloud run services update purchase-management-api \
  --region us-central1 \
  --min-instances 0 \
  --max-instances 5 \
  --cpu 1 \
  --memory 512Mi \
  --timeout 300
```

### Cloud SQL Settings

- Use `db-f1-micro` for development
- Scale up to `db-n1-standard-1` for production
- Enable automatic backups
- Set up scheduled snapshots

## Step 14: Backup Strategy

### Database Backups

```bash
# Automated backups are enabled by default
# Manual backup:
gcloud sql backups create --instance=purchase-management-db

# Restore from backup:
gcloud sql backups restore BACKUP_ID --backup-instance=purchase-management-db
```

### Frontend Backup

```bash
# Backup storage bucket
gsutil -m cp -r gs://purchase-management-frontend gs://purchase-management-backup/$(date +%Y%m%d)
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify Cloud SQL instance is running
   - Check Cloud Run has Cloud SQL connection
   - Verify credentials in Secret Manager

2. **Frontend Can't Reach Backend**
   - Check CORS settings in backend
   - Verify FRONTEND_URL environment variable
   - Check Cloud Run service URL

3. **Build Failures**
   - Check Cloud Build logs
   - Verify Dockerfile syntax
   - Check dependencies in package.json

### Useful Commands

```bash
# View Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=purchase-management-api" --limit 50

# Check Cloud Run service status
gcloud run services describe purchase-management-api --region us-central1

# Test database connection
gcloud sql connect purchase-management-db --user=postgres

# View Cloud Build history
gcloud builds list --limit=10
```

## Post-Deployment Checklist

- [ ] Backend API is accessible
- [ ] Database migrations completed
- [ ] Frontend loads correctly
- [ ] API endpoints respond correctly
- [ ] Authentication works
- [ ] CORS configured properly
- [ ] SSL certificate installed (if using custom domain)
- [ ] Monitoring and alerts configured
- [ ] Backups enabled
- [ ] Documentation updated with production URLs

## Estimated Costs

**Monthly estimates (approximate):**
- Cloud Run: $10-50 (depending on traffic)
- Cloud SQL (db-f1-micro): $7-10
- Cloud Storage: $1-5
- Cloud CDN: $5-20 (depending on traffic)
- **Total: ~$25-85/month** (for low to medium traffic)

## Next Steps

1. Set up custom domain
2. Configure SSL certificate
3. Set up monitoring dashboards
4. Configure automated backups
5. Set up staging environment
6. Implement CI/CD pipeline
7. Add performance monitoring
8. Set up error tracking (Sentry, etc.)

## Support

For issues:
- Check Cloud Console logs
- Review Cloud Run metrics
- Check Cloud SQL status
- Review Cloud Build logs

