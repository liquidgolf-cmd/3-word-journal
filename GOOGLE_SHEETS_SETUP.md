# Google Sheets Sync Setup

This guide will help you set up Google Sheets sync for your 3 Word Journal.

## Prerequisites

- You must have Google OAuth already set up (see `GOOGLE_OAUTH_SETUP.md`)
- Your Google Client ID must be configured

## Step 1: Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (the same one used for OAuth)
3. Navigate to **APIs & Services** → **Library**
4. Search for "Google Sheets API"
5. Click on it and click **Enable**

## Step 2: Update OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Click **Edit App**
3. Scroll down to **Scopes**
4. Click **Add or Remove Scopes**
5. In the filter box, search for: `https://www.googleapis.com/auth/spreadsheets`
6. Check the box next to `.../auth/spreadsheets`
7. Click **Update**
8. Click **Save and Continue**
9. If you see a warning about verification, you can continue (for personal use/test apps)

## Step 3: Test the Integration

1. Deploy your app (or run locally)
2. Sign in with your Google account
3. Create some journal entries
4. Click the **"📊 Sync to Sheets"** button
5. You'll be prompted to grant access to Google Sheets
6. After granting access, your entries will be synced to a new Google Sheet
7. You'll see a success message with a link to your spreadsheet

## How It Works

- **First Sync**: Creates a new Google Sheet named "3 Word Journal"
- **Subsequent Syncs**: Updates the same spreadsheet (replaces all data)
- **Spreadsheet Format**: 
  - Headers: Date, Word 1, Word 2, Word 3, Topic, Experience Summary, Full Story, Experience Date, Entry ID
  - Each row is one journal entry

## Troubleshooting

### "Permission denied" error
- Make sure you've enabled Google Sheets API in Google Cloud Console
- Check that the scope is added to your OAuth consent screen
- Try clicking "Sync to Sheets" again and grant permissions when prompted

### "Failed to get access token"
- Make sure your Google Client ID is correct
- Check that the OAuth consent screen has the Sheets scope enabled
- Clear your browser cache and try again

### Spreadsheet not created
- Check browser console for errors
- Make sure you have permission to create Google Sheets in your Google account
- Verify the Google Sheets API is enabled in your project

### Data not syncing
- Check that you have entries to sync (button is disabled if no entries)
- Look for error messages in the success/error banner
- Check browser console for detailed error messages

## Security Notes

- The spreadsheet is created in your Google Drive
- Only you have access to it (unless you share it)
- The sync replaces all data in the sheet (doesn't append)
- Your Google Client ID is safe to expose in frontend code

## Next Steps

After syncing, you can:
- View your entries in Google Sheets
- Share the spreadsheet with others
- Export to other formats from Sheets
- Use Sheets features like filtering, sorting, etc.

