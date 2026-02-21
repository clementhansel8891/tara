# Quick Start: Database Setup

## Current Status

Docker is installed but Docker Engine is not currently running.

## Option 1: Start Docker Desktop (Recommended)

1. **Start Docker Desktop:**
   - Open Docker Desktop application
   - Wait for it to fully start (whale icon in system tray should be steady)

2. **Start PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

3. **Verify it's running:**
   ```bash
   docker ps
   ```

## Option 2: Use Cloud PostgreSQL (Fastest)

If you want to proceed immediately without Docker:

### Using Supabase (Free Tier)

1. Go to https://supabase.com
2. Create a new project
3. Copy the connection string from Settings → Database
4. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5433/postgres"
   ```

### Using Neon (Free Tier)

1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Update `.env` with the connection string

## Next Steps (Once Database is Running)

```bash
# Generate Prisma Client (fixes TypeScript errors)
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Seed demo data
npx prisma db seed
```

## Verify Connection

```bash
npx prisma db pull
```

This should show your database schema if the connection is successful.
