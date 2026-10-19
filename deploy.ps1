Write-Host "🎵 Starting Audira Production Deployment..." -ForegroundColor Cyan

if (-Not (Test-Path ".env")) {
    if (Test-Path ".env.production.example") {
        Copy-Item ".env.production.example" ".env"
        Write-Host "⚠️ Created .env from .env.production.example. Please edit your domain and secrets before launching." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "📦 Building containers..." -ForegroundColor Cyan
docker compose build

Write-Host "🐘 Launching Database & Running Migrations..." -ForegroundColor Cyan
docker compose up -d postgres
Start-Sleep -Seconds 3
docker compose up -d backend

Write-Host "🚀 Booting Web Frontend and NGINX Gateway..." -ForegroundColor Cyan
docker compose up -d web nginx certbot

Write-Host "✅ Audira Music Platform is now live!" -ForegroundColor Green
Write-Host "🌐 Unified API contract available at /api/v1" -ForegroundColor Green
