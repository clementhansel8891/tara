# Deployment Guide

## Quick Start (Docker — Recommended)

```bash
# 1. Clone and configure
git clone <repository-url>
cd project-tara
cp .env.example .env
# Edit .env with your production values

# 2. Build and run everything
docker compose up --build -d

# Done. All services start automatically.
```

### What Happens on Startup

1. **PostgreSQL** starts with PostGIS extensions (via `docker/init-db.sql`)
2. **Redis** starts for caching and sessions
3. **Backend** waits for DB health, then:
   - Runs `prisma migrate deploy` (creates/updates all tables)
   - Seeds default data (7 agent configs, roles, Hermes settings)
   - Starts the NestJS API on port 3001
4. **Frontend** builds (Vite) and serves via nginx on port 80

### Access Points

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost | Web app (nginx) |
| Backend API | http://localhost:3001/v1/ | REST API |
| Health Check | http://localhost:3001/health | Container health |
| Hermes WebSocket | ws://localhost:3001/event-stream | Event stream for AI agents |
| Database | localhost:5432 | PostgreSQL (dev tools) |
| Redis | localhost:6379 | Cache/sessions |

---

## Environment Variables

### Root `.env` (Docker Compose)

```bash
# Database
DB_PASSWORD=tara_secret_2024        # PostgreSQL password
DB_PORT=5432                        # Exposed DB port

# Redis
REDIS_PORT=6379                     # Exposed Redis port

# Backend
BACKEND_PORT=3001                   # Exposed backend port
JWT_SECRET=change-this-in-production  # JWT signing key
ALLOWED_ORIGINS=http://localhost     # CORS origins (comma-separated)

# Frontend
FRONTEND_PORT=80                    # Exposed frontend port
VITE_API_URL=http://localhost:3001  # API URL baked into frontend bundle

# Hermes AI (optional)
HERMES_ENABLED=false                # Enable on first boot
HERMES_API_KEY=                     # API key for Hermes authentication
```

### Backend `backend/.env` (Native Development)

```bash
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tara?schema=public"
JWT_SECRET=dev-secret-key
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
REDIS_URL=redis://localhost:6379

# SOP Document Storage (persistent path on VPS)
# Defaults to ./uploads/sop if not set
SOP_UPLOAD_DIR=/var/data/tara/sop
```

---

## File Storage (SOP Documents)

SOP PDF files are stored on disk (not in the database) for performance. The storage path is configured via the `SOP_UPLOAD_DIR` environment variable.

### VPS Persistence

To ensure uploaded PDFs survive container restarts and redeployments:

1. **Set `SOP_UPLOAD_DIR`** to a persistent directory on your VPS:
   ```bash
   SOP_UPLOAD_DIR=/var/data/tara/sop
   ```

2. **Mount as a Docker volume** in `docker-compose.yml`:
   ```yaml
   backend:
     volumes:
       - sop_data:/var/data/tara/sop
   
   volumes:
     sop_data:
   ```

3. **Ensure correct permissions**:
   ```bash
   sudo mkdir -p /var/data/tara/sop
   sudo chown -R 1000:1000 /var/data/tara/sop
   ```

The backend auto-creates the directory on startup if it doesn't exist. File metadata (title, category, path) is stored in the `sop_documents` PostgreSQL table.

---

## Development Setup (Native)

```bash
# 1. Start only database and Redis
docker compose -f docker-compose.dev.yml up -d

# 2. Install dependencies
npm install
cd backend && npm install && cd ..

# 3. Run migrations
cd backend && npx prisma migrate deploy && cd ..

# 4. Seed defaults (optional, first time)
cd backend && npx ts-node src/scripts/seed-defaults.ts && cd ..

# 5. Start dev servers (frontend + backend with hot reload)
npm run dev
```

---

## Docker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                docker compose up                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐  │
│  │ frontend │  │ backend  │  │    db    │  │ redis │  │
│  │  :80     │  │  :3001   │  │  :5432   │  │ :6379 │  │
│  │  nginx   │  │  NestJS  │  │ PostGIS  │  │ Cache │  │
│  └─────┬────┘  └─────┬────┘  └──────────┘  └───────┘  │
│        │              │                                  │
│        │  /api/───────┘                                  │
│        │  /socket.io/─┘                                  │
│        │  /event-stream/┘                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Nginx Configuration

The `nginx.conf` handles:
- SPA routing (all paths → `index.html`)
- API proxy (`/api/` → backend `/v1/`)
- WebSocket proxy (`/socket.io/` → backend)
- Event Stream proxy (`/event-stream/` → backend, 24h timeout for Hermes)
- Gzip compression
- Security headers (X-Frame-Options, X-Content-Type-Options)
- Static asset caching (1 year for hashed files)

---

## SSL/HTTPS (Production)

For production, add SSL certificates to Nginx:
```nginx
listen 443 ssl;
ssl_certificate /etc/nginx/ssl/fullchain.pem;
ssl_certificate_key /etc/nginx/ssl/privkey.pem;
```

Or use a reverse proxy like Cloudflare, Traefik, or Caddy in front.

---

## Database

### Extensions Required
- **PostGIS** — geospatial (GPS attendance, geofencing)
- **uuid-ossp** — UUID generation
- **pg_trgm** — trigram search (employee name search)

These are installed automatically by `docker/init-db.sql` on first container creation.

### Migrations

Migrations run automatically on container start via `docker-entrypoint.sh`. For manual control:

```bash
# Apply pending migrations
docker compose exec backend npx prisma migrate deploy

# Create a new migration (development)
cd backend && npx prisma migrate dev --name my_change

# Reset database (WARNING: destroys all data)
docker compose exec backend npx prisma migrate reset --force
```

### Backups

```bash
# Daily backup
docker compose exec db pg_dump -U postgres tara | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup.sql.gz | docker compose exec -T db psql -U postgres tara
```

---

## Hermes AI Integration (Post-Deployment)

After the system is running, configure Hermes via the admin API:

```bash
# 1. Enable Hermes integration
curl -X PUT http://localhost:3001/v1/admin/hermes \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "api_key": "your-hermes-api-key"}'

# 2. Register a Hermes agent
curl -X POST http://localhost:3001/v1/admin/hermes/agents \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hermes Primary",
    "type": "llm_agent",
    "endpoint_url": "https://your-hermes-server.com",
    "authority_level": "read_write",
    "subscribed_events": ["attendance.*", "leave.*"],
    "is_enabled": true
  }'

# 3. Test connection
curl -X POST http://localhost:3001/v1/admin/hermes/test \
  -H "Authorization: Bearer <admin-jwt>"
```

Or configure via the Web UI: `Settings > Hermes AI`.

---

## Health Check

```bash
curl http://localhost:3001/health
# {"status":"ok","service":"tara-backend","version":"2.0.0","timestamp":"..."}
```

Docker uses this endpoint for container health monitoring. The backend container is only marked as healthy after the API is fully ready.

---

## Scaling Considerations

- **500 employees**: Single instance is sufficient
- **Database**: Add read replicas for analytics queries
- **Redis**: Required for session management at scale
- **WebSocket**: Sticky sessions if using multiple backend instances
- **Hermes**: Connects via WebSocket — single persistent connection per agent
