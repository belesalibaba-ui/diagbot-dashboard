#!/bin/sh

echo ">>> Creating data directory..."
mkdir -p /data

echo ">>> Running prisma db push..."
npx prisma db push --force-reset

echo ">>> Seeding admin..."
node seed.js

echo ">>> Starting server..."
exec node server.js
