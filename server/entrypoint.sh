#!/bin/bash
# server/entrypoint.sh

# Exit immediately if a command exits with a non-zero status
set -e

echo "Running database migrations..."
# Run migrations from the root /app directory where alembic.ini is
alembic upgrade head

echo "Starting server..."
# Set working directory to web_server for uvicorn
cd web_server
exec python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
