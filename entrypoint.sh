#!/bin/sh
set -e

echo ">>> Prisma schema sync..."
npx prisma db push --accept-data-loss 2>/dev/null || true

echo ">>> Starting application..."
node server.js
