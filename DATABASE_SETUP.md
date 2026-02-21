# Database Setup Instructions

## Option 1: Docker (Recommended)

If you have Docker installed and running, start the PostgreSQL database:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5433
- pgAdmin on port 5051 (http://localhost:5051)

## Option 2: Local PostgreSQL Installation

If Docker is not available, install PostgreSQL locally:

1. Download PostgreSQL 15+ from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Create a database:
   ```sql
   CREATE DATABASE zenvix_dev;
   CREATE USER zenvix WITH PASSWORD 'zenvix_dev_password';
   GRANT ALL PRIVILEGES ON DATABASE zenvix_dev TO zenvix;
   ```

## Option 3: Cloud PostgreSQL (Supabase, Neon, etc.)

Use a cloud PostgreSQL provider and update the `.env` file with your connection string:

```env
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
```

## Next Steps

Once PostgreSQL is running, generate and apply the migration:

```bash
# Generate migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

## Verify Connection

Test the database connection:

```bash
npx prisma db pull
```
