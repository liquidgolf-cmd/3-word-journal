# Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: "3 Word Journal" (or any name you prefer)
5. Click "Create"

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Enable these APIs:
   - **Google Identity Services API** (for sign-in)
   - **Google Sheets API** (for syncing entries to Sheets - optional but recommended)
3. Search for each, click on it, and click **Enable**

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
   - **Scopes**: If you want to use Google Sheets sync, add this scope:
     - Click **Add or Remove Scopes**
     - Search for: `https://www.googleapis.com/auth/spreadsheets`
     - Check the box and click **Update**
     - Click **Save and Continue**
     - (If not using Sheets sync, you can skip scopes)
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

### "Error 400: origin_mismatch" (Most Common)
**This error means your Vercel domain is not registered in Google Cloud Console.**

**To Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID (the one you created)
4. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   - `https://3-word-journal-v1.vercel.app` (your production URL)
   - `https://3-word-journal-v1-*.vercel.app` (for preview deployments - note: Google doesn't support wildcards, so you may need to add specific preview URLs)
   - `http://localhost:3000` (for local development)
   - `http://localhost:4173` (for Vite preview)
   - If you have a custom domain, add that too: `https://yourdomain.com`
5. Under **Authorized redirect URIs**, add the same URLs
6. Click **SAVE**
7. **Wait 5-10 minutes** for changes to propagate
8. Try signing in again

**Important Notes:**
- Google doesn't support wildcard subdomains in OAuth origins
- For preview deployments, you may need to add each preview URL individually, OR
- Use a single production URL and test on that domain
- Changes can take a few minutes to take effect

### "Invalid client" error
- Make sure your Client ID is correct
- Check that your domain is in the Authorized JavaScript origins
- Verify the Client ID in your Vercel environment variables matches Google Cloud Console

### Sign-in button doesn't appear
- Check browser console for errors
- Make sure the Google Identity Services script is loading
- Verify your Client ID is set correctly in environment variables

### Redirect URI mismatch
- Make sure the exact URL (including http/https and port) is in Authorized redirect URIs
- For Vercel, use: `https://your-project.vercel.app`
- No trailing slashes in the URLs

## Security Notes

- Never commit your Client ID to public repositories if it contains sensitive data
- For production, consider using environment variables
- The Client ID is safe to expose in frontend code, but keep it private if possible

