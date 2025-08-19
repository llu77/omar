#!/bin/bash

# Cloudflare Deployment Script for Wassel TeleRehab
# This script builds and deploys the application to Cloudflare Pages

set -e  # Exit on error

echo "🚀 Starting Cloudflare deployment for Wassel TeleRehab..."

# Check if required tools are installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed. Please install Node.js and npm first."
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ npx is required but not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build for Cloudflare Pages
echo "🔨 Building application for Cloudflare Pages..."
npm run build:cloudflare

# Check if build was successful
if [ ! -d ".vercel/output/static" ]; then
    echo "❌ Build failed - output directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build output is in: .vercel/output/static"
echo ""
echo "📝 Next steps:"
echo "1. Login to Cloudflare: npx wrangler auth login"
echo "2. Deploy to Cloudflare Pages: npx wrangler pages deploy .vercel/output/static --project-name=wassel-telerehab"
echo ""
echo "🔧 Or use the npm script: npm run deploy:cloudflare"
echo ""
echo "📖 For detailed instructions, see: CLOUDFLARE_DEPLOYMENT.md"

# Optionally deploy directly if DEPLOY environment variable is set
if [ "$DEPLOY" = "true" ]; then
    echo "🚀 Deploying to Cloudflare Pages..."
    npx wrangler pages deploy .vercel/output/static --project-name=wassel-telerehab
    echo "✅ Deployment completed!"
fi