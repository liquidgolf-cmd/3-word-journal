# Google OAuth Troubleshooting Guide

## Error: "Access blocked: app has not completed the Google verification process"

**This means your app is in "Testing" mode and you need to add yourself as a test user.**

### Quick Fix:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Scroll down to **Test users** section
5. Click **+ ADD USERS**
6. Add your email address (the one you use to sign in, e.g., `liquidgolf@gmail.com`)
7. Click **Add**
8. Click **Save** at the bottom
9. **Wait 5-10 minutes** for changes to propagate
10. Try signing in again

### Alternative: Publish Your App (For Public Use)

If you want anyone to be able to use your app:

1. Go to **OAuth consent screen**
2. Scroll to the bottom
3. Click **PUBLISH APP**
4. Confirm the publishing
5. Note: You may need to provide more information (privacy policy, etc.) for public apps

**For personal use, adding yourself as a test user is the easiest solution.**

## Error: "Error 400: origin_mismatch"

See the main `GOOGLE_OAUTH_SETUP.md` file for instructions on fixing this.

## Error: "Error 403: access_denied"

Usually means:
- App is in Testing mode and you're not a test user (see above)
- OAuth consent screen needs to be configured
- Required scopes are missing

## Still Having Issues?

1. Check that your email is added as a test user
2. Make sure you're using the correct Google account
3. Clear browser cache and cookies
4. Wait 10-15 minutes after making changes (Google needs time to propagate)
5. Check the browser console for detailed error messages

