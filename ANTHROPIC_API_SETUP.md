# Anthropic API Setup for AI Word Generation

The "AI Suggested" feature uses Anthropic's Claude API to generate three-word suggestions based on your experience description.

## Step 1: Get an Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Give it a name (e.g., "3 Word Journal")
6. **Copy the API key** - you'll only see it once!

## Step 2: Add API Key to Environment Variables

**Important:** We use a serverless function to avoid CORS issues, so the API key is stored server-side (not exposed to the browser).

### For Local Development:

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add this line:
   ```
   ANTHROPIC_API_KEY=your-api-key-here
   ```
3. Replace `your-api-key-here` with your actual API key
4. **Important:** Make sure `.env` is in your `.gitignore` file (it should be already)
5. Restart your dev server

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Add:
   - **Name:** `ANTHROPIC_API_KEY` (NOT VITE_ANTHROPIC_API_KEY)
   - **Value:** Your Anthropic API key
   - **Environment:** Production, Preview, and Development (select all)
5. Click **Save**
6. **Redeploy** your application for the changes to take effect

**Note:** The API key is now stored securely on the server and never exposed to the browser.

## Step 3: Verify It Works

1. Start your local dev server: `npm run dev`
2. Sign in to your journal
3. Click on "AI Suggested" mode
4. Enter an experience description
5. Click "Generate Three Words"
6. You should see AI-generated word suggestions

## Troubleshooting

### "API key is not configured" error
- Make sure you've added `VITE_ANTHROPIC_API_KEY` to your environment variables
- For local dev: Check that `.env` file exists and has the correct variable name
- For Vercel: Make sure you've added it in the dashboard and redeployed

### "Invalid API key" error
- Verify your API key is correct in the environment variables
- Check that there are no extra spaces or quotes around the key
- Make sure you're using the full API key (starts with `sk-ant-`)

### "API rate limit exceeded" error
- You've hit Anthropic's rate limit
- Wait a few minutes and try again
- Consider upgrading your Anthropic plan if you need higher limits

### "Network error" message
- Check your internet connection
- The Anthropic API might be temporarily unavailable
- Try again in a moment

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit your API key to Git** - The `.env` file should be in `.gitignore`
2. **API keys are exposed in frontend code** - Since we're using `VITE_` prefix, the key will be bundled in the client-side code
3. **For production apps**, consider:
   - Using a backend proxy to hide the API key
   - Setting up rate limiting
   - Monitoring API usage

## Cost Information

- Anthropic API has usage-based pricing
- Check [Anthropic Pricing](https://www.anthropic.com/pricing) for current rates
- The app uses `claude-sonnet-4-20250514` model
- Each generation uses approximately 50-100 tokens

## Alternative: Use a Backend Proxy (Recommended for Production)

For better security, you can create a backend API endpoint that:
1. Receives the experience text from the frontend
2. Makes the Anthropic API call server-side
3. Returns the generated words
4. Keeps the API key secure on the server

This prevents exposing your API key in the frontend bundle.

