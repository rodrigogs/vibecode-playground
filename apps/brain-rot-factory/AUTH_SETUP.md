# Environment Variables for Brain-rot Factory

## Authentication (GitHub OAuth & Google OAuth)

This application uses NextAuth.js v5 for authentication with support for multiple OAuth providers.

### Required Variables:

```env
# Auth.js Secret (already generated)
AUTH_SECRET=your_generated_secret_here

# GitHub OAuth
GITHUB_ID=your_github_oauth_app_client_id
GITHUB_SECRET=your_github_oauth_app_client_secret

# Google OAuth
GOOGLE_ID=your_google_oauth_client_id
GOOGLE_SECRET=your_google_oauth_client_secret
```

### Setting up GitHub OAuth:

1. Go to GitHub.com → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Brain-rot Factory (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**
6. Add them to your `.env.local` file as `GITHUB_ID` and `GITHUB_SECRET`

### Setting up Google OAuth:

1. **Go to Google Cloud Console**: Visit [Google Cloud Console](https://console.cloud.google.com/)

2. **Create or Select a Project**:
   - If you don't have a project, click "Create Project"
   - Give it a name like "Brain-rot Factory" and click "Create"

3. **Enable Google+ API** (if required):
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "People API"
   - Click on it and press "Enable"

4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" for user type (unless you have a Google Workspace)
   - Fill in the required fields:
     - **App name**: Brain-rot Factory
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Add your domain in "Authorized domains" (for production)
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application" as Application type
   - Fill in the details:
     - **Name**: Brain-rot Factory Web Client
     - **Authorized redirect URIs**: 
       - For development: `http://localhost:3000/api/auth/callback/google`
       - For production: `https://yourdomain.com/api/auth/callback/google`
   - Click "Create"

6. **Copy Credentials**:
   - Copy the **Client ID** and **Client Secret**
   - Add them to your `.env.local` file as `GOOGLE_ID` and `GOOGLE_SECRET`

### Production Setup:

For production deployment, update the URLs:

**GitHub:**
- **Homepage URL**: `https://yourdomain.com`
- **Authorization callback URL**: `https://yourdomain.com/api/auth/callback/github`

**Google:**
- **Authorized redirect URIs**: `https://yourdomain.com/api/auth/callback/google`

### Future Provider Extensions:

This authentication system is designed to be extensible. To add new providers (Discord, Twitter, etc.), simply:

1. Install the provider package if needed
2. Add the provider to `src/lib/auth.ts`
3. Add the required environment variables
4. Update the sign-in page to include the new provider button

Example for Discord:
```typescript
// In auth.ts
import Discord from 'next-auth/providers/discord'

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({ ... }),
    Google({ ... }),
    Discord({
      clientId: process.env.DISCORD_ID!,
      clientSecret: process.env.DISCORD_SECRET!,
    }),
  ],
  // ... rest of config
}
```

## Summary

The application now supports both GitHub and Google OAuth authentication. Users can sign in with either provider, and the system will handle the authentication flow seamlessly.
