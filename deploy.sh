#!/usr/bin/env bash
set -e

echo "🎵 Starting Audira Production Deployment..."

if [ ! -f .env ]; then
  if [ -f .env.production.example ]; then
    echo "⚠️ .env not found. Copying .env.production.example to .env..."
    cp .env.production.example .env
    echo "❗ Please edit .env with your actual domain and credentials before proceeding."
    exit 1
  fi
fi

# Pull latest images & build
echo "📦 Building containers..."
docker compose build --pull

# Start postgres and backend first
echo "🐘 Launching Database & Running Migrations..."
docker compose up -d postgres
sleep 3
docker compose up -d backend

# Launch frontend and reverse proxy
echo "🚀 Booting Web Frontend and NGINX Gateway..."
docker compose up -d web nginx certbot

echo "✅ Audira Music Platform is now live!"
echo "🌐 Access your app at https://${DOMAIN:-yourdomain.com}"
echo "📡 Unified API endpoint: https://${DOMAIN:-yourdomain.com}/api/v1"
