# Deploy to Google Cloud - Step by Step Guide

Complete step-by-step instructions to deploy your Purchase Management System to Google Cloud.

## 🎯 Goal

Deploy your application to:
- **Frontend**: `https://purchase-management.fedhubsoftware.com`
- **Backend API**: `https://api.purchase-management.fedhubsoftware.com/api`

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] **Windows 10/11** (this guide is optimized for Windows)
- [ ] **PowerShell** (comes with Windows - right-click Start → Windows PowerShell)
- [ ] Google account (Gmail account works)
- [ ] Credit card for billing (Google Cloud free tier available)
- [ ] Domain `fedhubsoftware.com` registered
- [ ] Access to DNS settings for `fedhubsoftware.com`
- [ ] Google Cloud SDK installed (we'll install it in Step 1)

## 🪟 Windows-Specific Notes

**This guide is fully optimized for Windows!**

- ✅ All commands use **PowerShell** syntax
- ✅ All file paths use Windows format (`\` instead of `/`)
- ✅ All variables use PowerShell format (`$VARIABLE`)
- ✅ All commands are copy-paste ready for Windows

**How to open PowerShell:**
1. Press `Windows Key + X`
2. Select "Windows PowerShell" or "Terminal"
3. Or search "PowerShell" in Start menu

**Tip:** Run PowerShell as Administrator if you encounter permission issues.

---

## Step 1: Install Google Cloud SDK

### Windows Installation (Recommended Method)

**Option 1: Download and Install (Easiest)**

1. Visit: https://cloud.google.com/sdk/docs/install
2. Download: **GoogleCloudSDKInstaller.exe** (for Windows)
3. Run the installer
4. Follow the installation wizard
5. Make sure to check "Add to PATH" during installation

**Option 2: Using Chocolatey (If you have it)**

Open PowerShell as Administrator and run:

```powershell
# Install using Chocolatey
choco install gcloudsdk

# Verify installation
gcloud --version
```

**Option 3: Manual Installation**

If the above don't work, you can manually install:
1. Download the ZIP file from Google Cloud SDK page
2. Extract to `C:\Program Files (x86)\Google\Cloud SDK`
3. Add to PATH manually

### Verify Installation

Open a **NEW PowerShell window** and run:

```powershell
# Check if gcloud is installed
gcloud --version

# If you see version info, you're good to go!
# If you get an error, restart PowerShell or add to PATH
```

### After Installation - Initialize gcloud

Open PowerShell and run:

```powershell
# Initialize gcloud (this will open a browser for authentication)
gcloud init

# If browser doesn't open, login manually:
gcloud auth login

# Follow the prompts:
# 1. Select your Google account
# 2. Allow permissions
# 3. Choose or create a project (you can skip this, we'll create one in Step 2)
# 4. Choose default region: us-central1 (or press Enter for default)

# Verify you're logged in
gcloud auth list
```

**Windows Tip:** If the browser doesn't open automatically:
1. Copy the URL shown in PowerShell
2. Paste it in your browser
3. Complete authentication
4. Return to PowerShell

---

## Step 2: Create Google Cloud Project

Open PowerShell and run:

```powershell
# Set your project ID (must be globally unique)
# Replace with your own unique name
$PROJECT_ID = "purchase-management-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Create the project
gcloud projects create $PROJECT_ID --name="Purchase Management"

# Set it as the active project
gcloud config set project $PROJECT_ID

# Enable billing (you'll need to do this in the console first time)
# Go to: https://console.cloud.google.com/billing
# Or link via command (replace YOUR_BILLING_ACCOUNT_ID):
# gcloud billing accounts list  # Get your billing account ID
# gcloud billing projects link $PROJECT_ID --billing-account=YOUR_BILLING_ACCOUNT_ID

# Enable required APIs (this may take a few minutes)
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage-component.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable compute.googleapis.com

Write-Host "Project ID: $PROJECT_ID"
Write-Host "SAVE THIS PROJECT_ID - You'll need it!"
```

**⚠️ IMPORTANT:** Save your `PROJECT_ID` somewhere - you'll need it throughout the deployment!

---

## Step 3: Create PostgreSQL Database

Open PowerShell and run:

```powershell
# Set variables
$DB_INSTANCE_NAME = "purchase-management-db"
$DB_REGION = "us-central1"

# Generate secure passwords
$DB_ROOT_PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$DB_USER_PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

Write-Host "DB Root Password: $DB_ROOT_PASSWORD"
Write-Host "DB User Password: $DB_USER_PASSWORD"
Write-Host "SAVE THESE PASSWORDS!"

# Create Cloud SQL PostgreSQL instance
gcloud sql instances create $DB_INSTANCE_NAME `
  --database-version=POSTGRES_15 `
  --tier=db-f1-micro `
  --region=$DB_REGION `
  --root-password=$DB_ROOT_PASSWORD `
  --storage-type=SSD `
  --storage-size=20GB `
  --backup-start-time=03:00

Write-Host "Waiting for database to be created (this takes 5-10 minutes)..."
Start-Sleep -Seconds 30

# Check status
gcloud sql instances describe $DB_INSTANCE_NAME --format="value(state)"

# Create database
gcloud sql databases create purchase_management --instance=$DB_INSTANCE_NAME

# Create database user
gcloud sql users create app_user `
  --instance=$DB_INSTANCE_NAME `
  --password=$DB_USER_PASSWORD

# Get connection name (needed later)
$CONNECTION_NAME = gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)"
Write-Host "Connection Name: $CONNECTION_NAME"
```

**⏱️ Wait:** Database creation takes 5-10 minutes. You can check status with:
```powershell
gcloud sql instances describe purchase-management-db
```

---

## Step 4: Store Secrets

Open PowerShell and run:

```powershell
# Generate JWT secret
$JWT_SECRET = -join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "JWT Secret: $JWT_SECRET"

# Store secrets in Secret Manager
echo $JWT_SECRET | gcloud secrets create jwt-secret --data-file=-
echo $DB_USER_PASSWORD | gcloud secrets create db-user-password --data-file=-

# Get project number
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding jwt-secret `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding db-user-password `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
```

---

## Step 5: Update Backend Configuration

### Update cloudbuild.yaml

1. Open `backend/cloudbuild.yaml` in your editor
2. Find the `substitutions` section (at the bottom)
3. Replace `PROJECT_ID` with your actual project ID:

```yaml
substitutions:
  _CLOUDSQL_INSTANCE: 'purchase-mgmt-20260505224101:us-central1:purchase-management-db'
  _DB_USER: 'app_user'
  _JWT_SECRET: 'jwt-secret'
  _DB_PASSWORD: 'db-user-password'
```

**Example:** If your PROJECT_ID is `purchase-management-20241221120000`, it should be:
```yaml
substitutions:
  _CLOUDSQL_INSTANCE: 'purchase-management-20241221120000:us-central1:purchase-management-db'
```

---

## Step 6: Deploy Backend to Cloud Run (Windows)

Open PowerShell and run:

```powershell
# Navigate to backend directory
cd backend

# Deploy (this builds the Docker image and deploys to Cloud Run)
# This takes 5-10 minutes
gcloud builds submit --config=cloudbuild.yaml

# Get the backend URL
$BACKEND_URL = gcloud run services describe purchase-management-api `
  --region us-central1 `
  --format="value(status.url)"

Write-Host "Backend URL: $BACKEND_URL"
```

---

## Step 6.1: Set Up Auto Deployment Trigger for Backend (Windows + GitHub)

This step creates an automatic deployment so that **every push to your main branch rebuilds and redeploys the backend** to Cloud Run using the existing `backend/cloudbuild.yaml`.

1. Push your code to GitHub (if not already):

```powershell
# From the project root
git status
git add .
git commit -m "Initial Google Cloud backend deployment"
git branch -M main      # Only if you want 'main' as default branch
git remote add origin https://github.com/YOUR_USER/purchase-management-postgresql.git
git push -u origin main
```

2. In your browser, open Google Cloud Console → **Cloud Build → Triggers**.  
3. Click **“Create Trigger”**.
4. Choose **GitHub** as the repository source and connect your GitHub account (if prompted).
5. Select your repository that contains this project.
6. Configure the trigger:
   - **Name**: `backend-auto-deploy`
   - **Event**: **Push to a branch**
   - **Branch**: `^main$` (or `^master$` if you use `master`)
   - **Configuration**: **Cloud Build configuration file (YAML or JSON)**
   - **Cloud Build file location**: `backend/cloudbuild.yaml`
7. Click **Create**.

Now, whenever you push changes to the selected branch, Google Cloud Build will:

1. Run `backend/cloudbuild.yaml`
2. Build a new Docker image for the backend
3. Redeploy `purchase-management-api` on Cloud Run automatically

You can monitor deployments in:

- **Cloud Build → History** (build logs)  
- **Cloud Run → Services → purchase-management-api → Revisions** (deployed versions)

**⏱️ Wait:** This takes 5-10 minutes. The build process will:
1. Build Docker image
2. Push to Container Registry
3. Deploy to Cloud Run

---

## Step 7: Run Database Migrations

### Option A: Using Cloud SQL Proxy (Recommended)

1. **Download Cloud SQL Proxy:**
   - Visit: https://cloud.google.com/sql/docs/postgres/sql-proxy
   - Download: `cloud_sql_proxy_x64.exe` (for Windows)
   - Save it in your project root or a folder in your PATH

2. **Start the proxy** (keep this PowerShell window open):

```powershell
# Navigate to where you saved cloud_sql_proxy_x64.exe
# If it's in your project root:
cd E:\CODE\FedHub\purchase-management-postgresql

# Replace YOUR_PROJECT_ID with your actual project ID from Step 2
.\cloud_sql_proxy_x64.exe -instances=YOUR_PROJECT_ID:us-central1:purchase-management-db=tcp:5432

# You should see: "Ready for new connections"
# Keep this window open!
```

3. **Open a NEW PowerShell window**, and run migrations:

```powershell
# Set environment variables (replace with your password from Step 3)
$env:PGHOST="127.0.0.1"
$env:PGPORT="5432"
$env:PGDATABASE="purchase_management"
$env:PGUSER="app_user"
$env:PGPASSWORD="YOUR_DB_USER_PASSWORD"  # From Step 3

# Navigate to migrations directory
cd database\migrations

# Run migrations (if you have psql installed)
psql -f 001_initial_schema.sql
psql -f 002_triggers.sql
psql -f 003_functions.sql
psql -f 004_views.sql
```

**Windows Note:** If you don't have `psql` installed:

**Option 1: Install PostgreSQL Client (Recommended)**
1. Visit: https://www.postgresql.org/download/windows/
2. Download PostgreSQL installer
3. During installation, make sure to install "Command Line Tools"
4. Add PostgreSQL bin folder to PATH (usually `C:\Program Files\PostgreSQL\15\bin`)

**Option 2: Use Cloud Console SQL Editor (Easier)**
1. Go to: https://console.cloud.google.com/sql/instances
2. Click on your database instance
3. Click "Databases" tab
4. Click on `purchase_management` database
5. Click "Connect using Cloud Shell" or use the SQL editor
6. Copy and paste SQL from each migration file

### Option B: Using gcloud sql connect

```powershell
# Connect to database
gcloud sql connect purchase-management-db --user=app_user

# Then copy and paste SQL from each migration file manually
# Or use the Cloud Console SQL editor
```

---

## Step 8: Build Frontend

Open PowerShell and run:

```powershell
# Navigate to frontend directory
cd ..\frontend

# Create production environment file
"VITE_API_BASE=$BACKEND_URL/api" | Out-File -FilePath .env.production -Encoding utf8

# Verify the file
Get-Content .env.production

# Install dependencies (if not already done)
npm install

# Build frontend
npm run build

# Verify build output
Get-ChildItem build
```

---

## Step 9: Deploy Frontend to Cloud Storage

Open PowerShell and run:

```powershell
# Create unique bucket name
$BUCKET_NAME = "purchase-management-frontend-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Create storage bucket
gsutil mb -p $PROJECT_ID -c STANDARD -l us-central1 gs://$BUCKET_NAME

# Enable static website hosting
gsutil web set -m index.html -e index.html gs://$BUCKET_NAME

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Upload frontend files
gsutil -m cp -r build\* gs://$BUCKET_NAME/

# Set cache headers
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://$BUCKET_NAME/assets/*
gsutil -m setmeta -h "Cache-Control:no-cache" gs://$BUCKET_NAME/*.html

Write-Host "Frontend uploaded to: gs://$BUCKET_NAME"
```

---

## Step 10: Set Up Custom Domain - Backend API

Open PowerShell and run:

```powershell
# Reserve static IP for backend
gcloud compute addresses create purchase-management-backend-ip --global

# Get the IP address
$BACKEND_IP = gcloud compute addresses describe purchase-management-backend-ip --global --format="value(address)"
Write-Host "Backend IP: $BACKEND_IP"
Write-Host "SAVE THIS IP - You'll need it for DNS!"

# Create serverless NEG (Network Endpoint Group)
gcloud compute network-endpoint-groups create purchase-management-neg `
  --region=us-central1 `
  --network-endpoint-type=serverless `
  --cloud-run-service=purchase-management-api

# Create backend service
gcloud compute backend-services create purchase-management-backend-service `
  --global `
  --load-balancing-scheme=EXTERNAL

# Add NEG to backend service
gcloud compute backend-services add-backend purchase-management-backend-service `
  --global `
  --network-endpoint-group=purchase-management-neg `
  --network-endpoint-group-region=us-central1

# Create URL map
gcloud compute url-maps create purchase-management-backend-map `
  --default-service=purchase-management-backend-service

# Create SSL certificate
gcloud compute ssl-certificates create purchase-management-backend-ssl `
  --domains=api.purchase-management.fedhubsoftware.com

# Create HTTPS target proxy
gcloud compute target-https-proxies create purchase-management-backend-proxy `
  --url-map=purchase-management-backend-map `
  --ssl-certificates=purchase-management-backend-ssl

# Create forwarding rule
gcloud compute forwarding-rules create purchase-management-backend-rule `
  --global `
  --target-https-proxy=purchase-management-backend-proxy `
  --ports=443 `
  --address=$BACKEND_IP
```

---

## Step 11: Set Up Custom Domain - Frontend

Open PowerShell and run:

```powershell
# Reserve static IP for frontend
gcloud compute addresses create purchase-management-frontend-ip --global

# Get the IP address
$FRONTEND_IP = gcloud compute addresses describe purchase-management-frontend-ip --global --format="value(address)"
Write-Host "Frontend IP: $FRONTEND_IP"
Write-Host "SAVE THIS IP - You'll need it for DNS!"

# Create backend bucket
gcloud compute backend-buckets create purchase-management-frontend-backend `
  --gcs-bucket-name=$BUCKET_NAME

# Create URL map
gcloud compute url-maps create purchase-management-frontend-map `
  --default-backend-bucket=purchase-management-frontend-backend

# Create SSL certificate
gcloud compute ssl-certificates create purchase-management-frontend-ssl `
  --domains=purchase-management.fedhubsoftware.com

# Create HTTPS target proxy
gcloud compute target-https-proxies create purchase-management-frontend-proxy `
  --url-map=purchase-management-frontend-map `
  --ssl-certificates=purchase-management-frontend-ssl

# Create forwarding rule
gcloud compute forwarding-rules create purchase-management-frontend-rule `
  --global `
  --target-https-proxy=purchase-management-frontend-proxy `
  --ports=443 `
  --address=$FRONTEND_IP
```

---

## Step 12: Configure DNS Records

Go to your domain registrar (where you manage `fedhubsoftware.com`) and add these DNS A records:

### DNS Records to Add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `api.purchase-management` | `$BACKEND_IP` (from Step 10) | 3600 |
| A | `purchase-management` | `$FRONTEND_IP` (from Step 11) | 3600 |

**Example:**
- If `$BACKEND_IP` is `34.102.136.180`, add:
  - Name: `api.purchase-management`
  - Type: A
  - Value: `34.102.136.180`
  
- If `$FRONTEND_IP` is `34.102.136.181`, add:
  - Name: `purchase-management`
  - Type: A
  - Value: `34.102.136.181`

**⏱️ Wait:** DNS propagation can take 5 minutes to 48 hours (usually 5-30 minutes).

---

## Step 13: Update Frontend API URL

Open PowerShell and run:

```powershell
cd frontend

# Update .env.production with custom API domain
"VITE_API_BASE=https://api.purchase-management.fedhubsoftware.com/api" | Out-File -FilePath .env.production -Encoding utf8

# Rebuild frontend
npm run build

# Re-upload to bucket
gsutil -m cp -r build\* gs://$BUCKET_NAME/
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://$BUCKET_NAME/assets/*
gsutil -m setmeta -h "Cache-Control:no-cache" gs://$BUCKET_NAME/*.html
```

---

## Step 14: Update Backend CORS

Open PowerShell and run:

```powershell
# Update Cloud Run service with frontend URL
gcloud run services update purchase-management-api `
  --region us-central1 `
  --update-env-vars "FRONTEND_URL=https://purchase-management.fedhubsoftware.com"
```

---

## Step 15: Wait for SSL Certificates

Google-managed SSL certificates take 10-60 minutes to provision after DNS is configured.

Check status:

```powershell
# Check backend SSL certificate
gcloud compute ssl-certificates describe purchase-management-backend-ssl

# Check frontend SSL certificate
gcloud compute ssl-certificates describe purchase-management-frontend-ssl
```

Wait until status shows `ACTIVE`.

---

## Step 16: Test Your Deployment

### Test Backend API

Open PowerShell and run:

```powershell
# Test health endpoint
Invoke-WebRequest -Uri "https://api.purchase-management.fedhubsoftware.com/api/healthz" | Select-Object -ExpandProperty Content

# Or using curl (if available)
# curl https://api.purchase-management.fedhubsoftware.com/api/healthz

# Should return: {"ok":true,"uptime":...}
```

### Test Frontend

1. Open browser
2. Navigate to: `https://purchase-management.fedhubsoftware.com`
3. Try logging in:
   - **Admin**: `admin@fedhubsoftware.com` / `Admin@123`
   - **Employee**: `employee@fedhubsoftware.com` / `Employee@123`

### Verify Everything

- [ ] Frontend loads at `https://purchase-management.fedhubsoftware.com`
- [ ] API calls go to `https://api.purchase-management.fedhubsoftware.com/api`
- [ ] Login works correctly
- [ ] No CORS errors in browser console (F12)
- [ ] SSL certificate is valid (green lock icon)

---

## 🎉 Congratulations!

Your application is now live at:
- **Frontend**: `https://purchase-management.fedhubsoftware.com`
- **Backend API**: `https://api.purchase-management.fedhubsoftware.com/api`

---

## 🔧 Troubleshooting

### Backend Not Accessible

Open PowerShell and run:

```powershell
# Check Cloud Run service status
gcloud run services describe purchase-management-api --region us-central1

# Check logs
gcloud logging read "resource.type=cloud_run_revision" --limit 20
```

### DNS Not Resolving

Open PowerShell or Command Prompt and run:

```powershell
# Check DNS
nslookup api.purchase-management.fedhubsoftware.com
nslookup purchase-management.fedhubsoftware.com
```

**Solution:** Wait for DNS propagation (can take up to 48 hours, usually 5-30 minutes).

### SSL Certificate Not Active

Open PowerShell and run:

```powershell
# Check certificate status
gcloud compute ssl-certificates describe purchase-management-frontend-ssl

# Common issues:
# 1. DNS not pointing to IP yet
# 2. DNS propagation delay
# 3. Certificate domain verification failed
```

**Solution:** Ensure DNS A records are correctly set and wait.

### CORS Errors

Open PowerShell and run:

```powershell
# Verify FRONTEND_URL is set
gcloud run services describe purchase-management-api `
  --region us-central1 `
  --format="value(spec.template.spec.containers[0].env)"

# Update if needed
gcloud run services update purchase-management-api `
  --region us-central1 `
  --update-env-vars "FRONTEND_URL=https://purchase-management.fedhubsoftware.com"
```

---

## 📊 Quick Reference

### Important Values to Save

- `PROJECT_ID`: Your Google Cloud project ID
- `DB_USER_PASSWORD`: Database user password
- `JWT_SECRET`: JWT secret key
- `BACKEND_IP`: Backend load balancer IP
- `FRONTEND_IP`: Frontend load balancer IP
- `BUCKET_NAME`: Frontend storage bucket name

### Useful Commands

Open PowerShell and run:

```powershell
# View all services
gcloud run services list
gcloud compute forwarding-rules list --global

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 20

# Update backend
cd backend
gcloud builds submit --config=cloudbuild.yaml

# Update frontend
cd frontend
npm run build
gsutil -m cp -r build\* gs://$BUCKET_NAME/
```

---

## 💰 Cost Estimation

**Monthly costs (approximate):**
- Cloud Run: $10-50 (pay per use, scales to zero)
- Cloud SQL (db-f1-micro): $7-10
- Cloud Storage: $1-5
- Load Balancer: $18 (base) + $0.025/GB
- SSL Certificates: Free (Google-managed)
- **Total: ~$36-83/month** for low to medium traffic

**Free tier available:**
- Cloud Run: 2 million requests/month free
- Cloud Storage: 5GB free

---

## ✅ Deployment Checklist

- [ ] Google Cloud SDK installed
- [ ] Project created
- [ ] Billing enabled
- [ ] APIs enabled
- [ ] Database created
- [ ] Secrets stored
- [ ] Backend deployed
- [ ] Migrations completed
- [ ] Frontend built
- [ ] Frontend deployed
- [ ] Load balancers created
- [ ] SSL certificates created
- [ ] DNS records added
- [ ] CORS configured
- [ ] Application tested

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review Cloud Console logs
3. Check DNS resolution
4. Verify SSL certificate status

**You're all set!** 🚀

