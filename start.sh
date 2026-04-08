#!/bin/sh
# Render-optimized startup script

echo ">>> XENTRY DiagBot Pro Starting..."

# Render provides PORT env, fallback to 3000
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

echo ">>> PORT=$PORT HOSTNAME=$HOSTNAME"

# Ensure data directory exists
mkdir -p /data

# Copy initial DB if not present (first deploy)
if [ ! -f /data/diagbot.db ]; then
  echo ">>> No database found, this is unexpected - creating empty one"
  touch /data/diagbot.db
fi

# Start Next.js server directly
echo ">>> Starting Next.js server..."
exec node server.js
