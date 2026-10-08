# CV Helper

A web application for managing CV documents with Google Drive integration. Built with React, TypeScript, Vite, Firebase, and Netlify Functions.

## Features

- Google Drive document import
- Firebase Authentication with Google OAuth
- Real-time data synchronization
- Serverless functions for secure token exchange

## Prerequisites

- Node.js 20+
- Google Cloud account with OAuth 2.0 credentials
- Firebase project
- Netlify account (for deployment)

## Environment Variables

Create `.env` file in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google OAuth (for frontend)
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

Netlify Environment Variables (for backend functions):
- `GOOGLE_CLIENT_ID` - same as VITE_GOOGLE_CLIENT_ID
- `GOOGLE_CLIENT_SECRET` - from Google Cloud Console

## Local Development

```bash
npm install
npx netlify link   # one-time: link this folder to the deployed Netlify site
npm run dev
```
`npm run dev` is the only local command. It runs Vite and Netlify Functions together
(same as production), including Netlify Blobs used by `google-token.js`. Blobs only
gets real local credentials once the project is linked — `npm run dev` checks for
this and tells you if it's missing.

The app always runs on **http://localhost:8888**. The port is pinned in `[dev]` of
`netlify.toml` because it's the only local origin registered in the Google OAuth
client; any other port fails sign-in with `Error 400: origin_mismatch`. Vite also
prints `localhost:5173`. That's the internal port behind the proxy, so don't open
it. If 8888 or 5173 is already taken, `npm run dev` stops with a message instead of
quietly moving to another port.

## Google Cloud Console Setup

1. Create OAuth 2.0 credentials (Web application type)
2. Add Authorized JavaScript origins:
   - `http://localhost:8888` (local dev via `npm run dev` - see [Local Development](#local-development))
   - `https://your-site.netlify.app` (production)
3. Leave Authorized redirect URIs empty (for popup flow)
4. Configure OAuth consent screen:
   - Home page: `https://your-site.netlify.app`
   - Privacy policy: `https://your-site.netlify.app/privacy`
   - Terms of service: `https://your-site.netlify.app/terms`
5. For production: Submit for verification to remove "unverified app" warning

## Deployment

1. Connect GitHub repo to Netlify
2. Set environment variables in Netlify Dashboard
3. Deploy functions automatically from `netlify/functions/`

## Project Structure

```
src/
  app/           - App routing and providers
  pages/         - Page components (LandingPage, MainPage, Privacy, Terms)
  components/    - Reusable UI components
  modules/       - Feature-specific components
  services/      - API and Firebase services
  store/         - MobX state management
  hooks/         - Custom React hooks
  ui-kit/        - Design system components
  
netlify/
  functions/     - Serverless functions for Google OAuth
```

## Troubleshooting

**"Failed to exchange code for tokens" locally**
- OAuth exchange requires Netlify Functions. Run locally with `npm run dev` (open `http://localhost:8888`) or test on the deployed site.

**"Google hasn't verified this app" warning**
- Expected for testing. Click "Advanced" → "Go to unsafe".
- For production: Complete OAuth verification in Google Cloud Console.

**ID token missing from response**
- Ensure `openid` scope is included in Google Identity Services configuration.

## Scripts

See [Local Development](#local-development) for `npm run dev`.

- `npm run build` - Production build
- `npm run preview` - Preview the production build locally
- `npm run lint` - ESLint check
- `npm run lint:fix` - ESLint auto-fix
- `npm run format` - Prettier formatting
