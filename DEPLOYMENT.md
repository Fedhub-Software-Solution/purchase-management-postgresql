# Deployment Guide

Complete guide for deploying the Purchase Management System to production.

## Prerequisites

- Node.js 18+ installed on server
- PostgreSQL 14+ installed and running
- Domain name (optional, for production)
- SSL certificate (for HTTPS)
- Process manager (PM2 recommended)

## Pre-Deployment Checklist

- [ ] Database migrations run
- [ ] Environment variables configured
- [ ] SSL certificate obtained
- [ ] Domain DNS configured
- [ ] Firewall rules configured
- [ ] Backup strategy in place

## Environment Setup

### 1. Database Setup

**Create Production Database:**
```bash
psql -U postgres
CREATE DATABASE purchase_management_prod;
\q
```

**Run Migrations:**
```bash
psql -U postgres -d purchase_management_prod -f database/migrations/001_initial_schema.sql
psql -U postgres -d purchase_management_prod -f database/migrations/002_triggers.sql
psql -U postgres -d purchase_management_prod -f database/migrations/003_functions.sql
psql -U postgres -d purchase_management_prod -f database/migrations/004_views.sql
```

### 2. Backend Configuration

**Create `.env` file:**
```bash
cd backend
cat > .env << EOF
NODE_ENV=production
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_NAME=purchase_management_prod
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false
JWT_SECRET=your_very_secure_jwt_secret_key_min_32_chars
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com
EOF
```

**Install Dependencies:**
```bash
cd backend
npm install --production
npm run build
```

### 3. Frontend Configuration

**Build for Production:**
```bash
cd frontend
npm install
npm run build
```

**Configure API Base URL:**
The frontend automatically detects the API base URL. For production:
- If frontend and backend are on same domain: Uses `/api`
- If different domains: Set `VITE_API_BASE` environment variable

## Deployment Options

### Option 1: Single Server Deployment

**Structure:**
```
/var/www/purchase-management/
├── backend/          # Backend application
├── frontend/dist/    # Frontend build output
└── nginx/            # Nginx configuration
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        root /var/www/purchase-management/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Separate Servers

**Backend Server:**
- Run on port 8080
- Configure CORS for frontend domain
- Use reverse proxy (Nginx)

**Frontend Server:**
- Serve static files
- Configure API base URL
- Use CDN for assets (optional)

## Process Management

### Using PM2

**Install PM2:**
```bash
npm install -g pm2
```

**Backend PM2 Configuration:**
```bash
cd backend
pm2 start dist/index.js --name purchase-management-api
pm2 save
pm2 startup
```

**PM2 Ecosystem File (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [{
    name: 'purchase-management-api',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
```

## Database Backup

### Automated Backups

**Backup Script:**
```bash
#!/bin/bash
BACKUP_DIR="/backups/purchase-management"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres purchase_management_prod > "$BACKUP_DIR/backup_$DATE.sql"
# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

**Cron Job:**
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

## Monitoring

### Health Checks

**Backend Health:**
```bash
curl http://localhost:8080/api/health
```

**Database Health:**
```bash
curl http://localhost:8080/api/health
# Returns database connection status
```

### Log Monitoring

**PM2 Logs:**
```bash
pm2 logs purchase-management-api
```

**Nginx Logs:**
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable
```

### 2. Database Security

- Use strong passwords
- Limit database user permissions
- Enable SSL for database connections
- Restrict database access to localhost

### 3. Application Security

- Use strong JWT secret (32+ characters)
- Enable HTTPS only
- Set secure cookies (if using)
- Regular security updates

### 4. Environment Variables

- Never commit `.env` files
- Use secure secret management
- Rotate secrets regularly

## Scaling

### Horizontal Scaling

**Load Balancer Setup:**
1. Deploy multiple backend instances
2. Use load balancer (Nginx, HAProxy)
3. Shared database
4. Session management (if needed)

### Database Scaling

**Read Replicas:**
- Configure read replicas
- Route read queries to replicas
- Write queries to primary

**Connection Pooling:**
- Already configured (max 20 connections)
- Adjust based on load

## Rollback Strategy

### 1. Database Rollback

```bash
# Restore from backup
psql -U postgres purchase_management_prod < backup_YYYYMMDD.sql
```

### 2. Application Rollback

```bash
# Git rollback
git checkout <previous-version>
npm install
npm run build
pm2 restart purchase-management-api
```

### 3. Frontend Rollback

```bash
# Rebuild previous version
git checkout <previous-version>
npm run build
# Deploy dist/ folder
```

## Maintenance

### Regular Tasks

1. **Database Backups** - Daily automated backups
2. **Log Rotation** - Configure logrotate
3. **Security Updates** - Regular npm updates
4. **Database Maintenance** - VACUUM, ANALYZE
5. **Monitoring** - Check health endpoints

### Update Procedure

1. Pull latest code
2. Run database migrations (if any)
3. Install dependencies: `npm install`
4. Build: `npm run build`
5. Restart: `pm2 restart purchase-management-api`
6. Verify: Check health endpoint

## Troubleshooting

### Common Issues

**Database Connection Failed:**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Check firewall rules
- Verify database exists

**Port Already in Use:**
- Change PORT in `.env`
- Kill existing process: `lsof -ti:8080 | xargs kill`

**Build Failures:**
- Check Node.js version (18+)
- Clear node_modules and reinstall
- Check TypeScript errors

**CORS Errors:**
- Verify FRONTEND_URL in backend `.env`
- Check Nginx proxy configuration

## Performance Tuning

### Backend

- Increase connection pool size if needed
- Enable response compression
- Add Redis caching layer
- Optimize database queries

### Frontend

- Enable gzip compression
- Use CDN for static assets
- Implement service worker caching
- Optimize bundle size

## SSL Certificate

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Production Checklist

- [ ] Database created and migrated
- [ ] Environment variables configured
- [ ] Backend built and tested
- [ ] Frontend built and tested
- [ ] SSL certificate installed
- [ ] Nginx configured
- [ ] PM2 process running
- [ ] Health checks passing
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Firewall configured
- [ ] Domain DNS configured
- [ ] Error logging configured
- [ ] Performance tested

## Support and Maintenance

- Regular backups
- Monitor logs
- Update dependencies
- Security patches
- Performance monitoring
- User feedback

