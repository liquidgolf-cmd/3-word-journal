# Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: "3 Word Journal" (or any name you prefer)
5. Click "Create"

## Step 2: Enable Google Identity Services API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Identity Services API" or "Google+ API"
3. Click on it and click **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in:
     - App name: "3 Word Journal"
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - Skip scopes (click **Save and Continue**)
   - Add test users if needed (click **Save and Continue**)
   - Click **Back to Dashboard**

4. Now create the OAuth Client ID:
   - Application type: **Web application**
   - Name: "3 Word Journal Web Client"
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (for local testing)
     - `http://localhost:8080` (if using a local server)
     - `https://your-vercel-url.vercel.app` (your production URL)
   - **Authorized redirect URIs:**
     - `http://localhost:3000` (for local testing)
     - `http://localhost:8080` (if using a local server)
     - `https://your-vercel-url.vercel.app` (your production URL)
   - Click **Create**

5. **Copy the Client ID** - it will look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

## Step 4: Add Client ID to Your App

1. Open `index.html` in your project
2. Find this line near the top of the script section:
   ```javascript
   const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID:
   ```javascript
   const GOOGLE_CLIENT_ID = '123456789-abcdefghijklmnop.apps.googleusercontent.com';
   ```

## Step 5: Update Vercel Environment (Optional)

If you want to use environment variables instead of hardcoding:

1. In Vercel dashboard, go to your project → **Settings** → **Environment Variables**
2. Add: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = your client ID
3. Update the code to use: `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Step 6: Test the Integration

1. Deploy your app to Vercel (or run locally)
2. You should see a "Sign in" button
3. Click it and sign in with your Google account
4. After signing in, you should see your name and avatar in the top right
5. Your journal entries will now be stored per user

## Troubleshooting

### "Invalid client" error
- Make sure your Client ID is correct
- Check that your domain is in the Authorized JavaScript origins

### Sign-in button doesn't appear
- Check browser console for errors
- Make sure the Google Identity Services script is loading
- Verify your Client ID is set correctly

### Redirect URI mismatch
- Make sure the exact URL (including http/https and port) is in Authorized redirect URIs
- For Vercel, use: `https://your-project.vercel.app`

## Security Notes

- Never commit your Client ID to public repositories if it contains sensitive data
- For production, consider using environment variables
- The Client ID is safe to expose in frontend code, but keep it private if possible

