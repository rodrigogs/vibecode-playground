# Environment Variables for Brain-rot Factory

## Authentication (GitHub OAuth)

To enable GitHub authentication, you need to create a GitHub OAuth App and set the following environment variables in your `.env.local` file:

### Required Variables:

```env
# Auth.js Secret (already generated)
AUTH_SECRET=your_generated_secret_here

# GitHub OAuth
GITHUB_ID=your_github_oauth_app_client_id
GITHUB_SECRET=your_github_oauth_app_client_secret
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

### Production Setup:

For production deployment, update the URLs:
- **Homepage URL**: `https://yourdomain.com`
- **Authorization callback URL**: `https://yourdomain.com/api/auth/callback/github`

### Future Provider Extensions:

This authentication system is designed to be extensible. To add new providers (Google, Discord, etc.), simply:

1. Install the provider package if needed
2. Add the provider to `src/lib/auth.ts`
3. Add the required environment variables
4. Update the sign-in page to include the new provider button

Example for Google:
```typescript
// In auth.ts
import Google from 'next-auth/providers/google'

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({ ... }),
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  // ... rest of config
}
```
