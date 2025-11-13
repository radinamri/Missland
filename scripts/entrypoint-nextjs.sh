#!/bin/sh
set -e

echo "Starting Next.js application..."

# Check required environment variables
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "WARNING: NEXT_PUBLIC_API_URL is not set"
fi

echo "Next.js initialization complete!"

# Execute the main command
exec "$@"
