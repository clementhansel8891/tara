#!/bin/sh
set -e

echo "========================================"
echo " TARA Backend — Docker Entrypoint"
echo "========================================"

# Wait for the database to be ready (belt + suspenders beyond healthcheck)
echo "[1/4] Waiting for database..."
MAX_RETRIES=30
RETRY=0
until echo "SELECT 1" | npx prisma db execute --stdin > /dev/null 2>&1 || [ $RETRY -ge $MAX_RETRIES ]; do
  RETRY=$((RETRY + 1))
  echo "  Database not ready yet (attempt $RETRY/$MAX_RETRIES)..."
  sleep 2
done

if [ $RETRY -ge $MAX_RETRIES ]; then
  echo "  WARNING: Database connection timeout — proceeding anyway..."
fi

# Run Prisma migrations
echo "[2/4] Running database migrations..."
npx prisma migrate deploy || {
  echo "  Migrations failed — trying db push as fallback..."
  npx prisma db push --accept-data-loss 2>/dev/null || true
}

# Seed default data if first run
echo "[3/4] Seeding default configuration..."
node dist/scripts/seed-defaults.js 2>/dev/null || echo "  (No seed script or already seeded)"

# Start the application
echo "[4/4] Starting TARA Backend..."
echo "========================================"
exec node dist/main.js
