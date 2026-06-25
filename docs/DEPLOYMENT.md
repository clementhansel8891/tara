# Deployment Guide

## Environment Variables

### Frontend (`.env`)
```bash
VITE_API_URL=http://localhost:3001   # Backend URL (for non-proxy setups)
```

### Backend (`backend/.env`)
```bash
# Server
PORT=3001
NODE_ENV=production

# Database (required)
DATABASE_URL="postgresql://user:password@host:5432/tara?schema=public"

# Security (required in production)
JWT_SECRET=<generate-with: openssl rand -base64 32>
BCRYPT_ROUNDS=12
FIELD_ENCRYPTION_KEY=<generate-with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Email (optional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=
MAIL_FROM=noreply@company.com
```

## Docker Production Deployment

### Full Stack (recommended)

```bash
# 1. Set environment
cp .env.example .env
# Edit .env with production values

# 2. Build and start
docker compose up -d --build

# 3. Run migrations
docker compose exec backend npx prisma migrate deploy

# 4. Seed initial data (first time only)
docker compose exec backend npx prisma db seed
```

Services:
- Frontend + Nginx: port 80/443
- Backend API: port 3001 (internal)
- PostgreSQL + PostGIS: port 5432 (internal)
- Redis: port 6379 (internal)

### Development (DB only)

```bash
docker compose -f docker-compose.dev.yml up -d
# Then run frontend/backend natively with npm run dev
```

## Nginx Configuration

The `nginx.conf` handles:
- SPA routing (all paths → index.html)
- API proxy (`/api/` → backend `/v1/`)
- WebSocket proxy (`/socket.io/`)
- Gzip compression
- Security headers (X-Frame-Options, CSP, HSTS)
- Static asset caching (1 year for hashed files)

## SSL/HTTPS

For production, add SSL certificates to Nginx:
```nginx
listen 443 ssl;
ssl_certificate /etc/nginx/ssl/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/privkey.pem;
```

Or use a reverse proxy like Cloudflare, Traefik, or Caddy.

## Database Backups

PostgreSQL backups should be configured externally:
```bash
# Daily backup
pg_dump -U postgres tara | gzip > /backups/tara_$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup.sql.gz | psql -U postgres tara
```

## Health Check

```bash
curl http://localhost:3001/health
# {"status":"ok","service":"tara-backend","version":"2.0.0","timestamp":"..."}
```

## Scaling Considerations

- **500 employees**: Single instance is sufficient
- **Database**: Add read replicas for analytics queries
- **Redis**: Required for session management at scale
- **WebSocket**: Sticky sessions if using multiple backend instances
