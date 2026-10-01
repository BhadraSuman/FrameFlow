#!/bin/sh
set -e

echo "📦 [FrameFlow API] Syncing database schema to PostgreSQL..."
max_retries=15
count=0

until npx prisma db push --schema=./packages/db/prisma/schema.postgresql.prisma --accept-data-loss; do
  count=$((count + 1))
  if [ "$count" -ge "$max_retries" ]; then
    echo "❌ [FrameFlow API] Failed to connect to database after $max_retries attempts. Exiting."
    exit 1
  fi
  echo "⏳ [FrameFlow API] Database not ready yet, retrying in 3s ($count/$max_retries)..."
  sleep 3
done

echo "✅ [FrameFlow API] PostgreSQL database schema is up to date!"
echo "🚀 [FrameFlow API] Launching API server on port 4000..."
exec node apps/api/dist/index.js
