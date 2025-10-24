# Wassel TeleRehab - AI-Powered Medical Rehabilitation Platform

A comprehensive web application for generating personalized medical rehabilitation plans using AI, built with Next.js and Firebase.

## Features

- 🔐 **Secure Authentication**: Firebase Auth with Arabic language support
- 📋 **Patient Assessment**: Comprehensive forms for medical history and condition evaluation
- 🤖 **AI-Powered Plans**: OpenAI integration for generating personalized rehabilitation plans
- 💬 **Real-time Communication**: Patient-provider messaging system
- 📊 **Progress Tracking**: Goals, reports, and analytics dashboard
- 📱 **Responsive Design**: RTL support for Arabic interface
- 🔒 **HIPAA Compliant**: Encrypted data storage and secure transmission

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: OpenAI GPT for rehabilitation plan generation
- **Deployment**: Cloudflare Pages with Edge Functions
- **UI**: Radix UI components with custom styling

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/llu77/omar.git
cd omar

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Deployment

### Cloudflare Pages (Recommended)

This application is optimized for Cloudflare Pages deployment:

```bash
# Build for Cloudflare
npm run build:cloudflare

# Deploy to Cloudflare Pages
npm run deploy:cloudflare
```

For detailed deployment instructions, see [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md).

### Other Platforms

The application can also be deployed to:
- Vercel
- Netlify
- Firebase Hosting
- Any Node.js hosting provider

## Configuration

### Environment Variables

Copy `.env.cloudflare.example` and configure:

```bash
NODE_ENV=production
OPENAI_API_KEY=your_openai_api_key_here
```

### Firebase Setup

Firebase configuration is included in the application. For production, consider using environment variables for security.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:cloudflare` - Build for Cloudflare Pages
- `npm run preview:cloudflare` - Preview Cloudflare build locally
- `npm run deploy:cloudflare` - Deploy to Cloudflare Pages
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── communication/     # Messaging system
│   └── ...
├── components/            # Reusable UI components
├── lib/                   # Utilities and configurations
├── ai/                    # AI integration logic
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Security

This application handles sensitive medical data. Please review:
- [SECURITY.md](./SECURITY.md) for security policies
- Firebase security rules
- Environment variable management
- Data encryption practices

## License

All rights reserved to Symbol AI.

## Support

For support and documentation, please refer to:
- [Deployment Guide](./CLOUDFLARE_DEPLOYMENT.md)
- [Project Blueprint](./docs/blueprint.md)
- GitHub Issues for bug reports
