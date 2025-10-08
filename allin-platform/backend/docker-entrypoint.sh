#!/bin/sh
set -e

echo "🔄 Waiting for PostgreSQL..."
until pg_isready -h postgres -U postgres -d allin; do
  sleep 2
done
echo "✅ PostgreSQL is ready!"

echo "🔄 Running database migrations..."
npm run migrate:deploy

echo "🔄 Seeding database..."
npm run seed || echo "⚠️  Seeding failed or already seeded"

echo "🚀 Starting backend server..."
exec "$@"
