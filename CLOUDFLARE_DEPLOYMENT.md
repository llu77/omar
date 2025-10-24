# Cloudflare Deployment Guide for Wassel TeleRehab

This guide explains how to deploy the Wassel TeleRehab application to Cloudflare Pages.

## Prerequisites

1. Cloudflare account
2. Wrangler CLI installed (`npm install -g wrangler`)
3. Node.js 18+ and npm

## Deployment Steps

### 1. Login to Cloudflare
```bash
npx wrangler auth login
```

### 2. Build for Cloudflare
```bash
npm run build:cloudflare
```

### 3. Deploy to Cloudflare Pages
```bash
npm run deploy:cloudflare
```

### 4. Environment Variables Setup

Set the following environment variables in your Cloudflare Pages dashboard:

#### Required Environment Variables:
- `OPENAI_API_KEY`: Your OpenAI API key for AI functionality
- `NODE_ENV`: Set to "production"

#### Firebase Configuration (if using environment variables instead of hardcoded):
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID

## Project Structure

The application uses:
- **Next.js 14** with App Router
- **Edge Runtime** for API routes and dynamic pages
- **Firebase** for authentication, database, and storage
- **Cloudflare Pages Functions** for serverless execution

## Build Configuration

- `next.config.mjs`: Configured for Cloudflare compatibility
- `wrangler.toml`: Cloudflare Pages configuration
- Edge runtime enabled for dynamic routes

## Local Development with Cloudflare

To test locally with Cloudflare Pages environment:
```bash
npm run preview:cloudflare
```

## Domain Configuration

After deployment:
1. Go to Cloudflare Pages dashboard
2. Configure custom domain if needed
3. Set up DNS records in Cloudflare

## Monitoring and Logs

- View deployment logs in Cloudflare Pages dashboard
- Monitor function execution in Cloudflare Analytics
- Check Firebase usage in Firebase console

## Troubleshooting

### Build Issues
- Ensure all routes use edge runtime for dynamic pages
- Check that environment variables are properly set
- Verify Firebase configuration

### Runtime Issues
- Check Cloudflare Functions logs
- Verify Firebase security rules
- Ensure API keys are correctly configured

## Architecture

```
Client (Browser)
    ↓
Cloudflare Pages (Static Assets + Functions)
    ↓
Firebase Services (Auth, Firestore, Storage)
    ↓
OpenAI API (AI Features)
```

## Performance

- Static assets served from Cloudflare CDN
- API routes run on Cloudflare Edge
- Firebase provides real-time database functionality
- Global edge deployment for low latency