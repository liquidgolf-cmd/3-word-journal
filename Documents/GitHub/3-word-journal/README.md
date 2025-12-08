# 3 Word Journal

A beautiful, modern journaling app that helps you capture life's lessons in just three words.

## Features

- ✨ AI-powered word suggestions
- 📝 Manual entry mode
- 🔍 Search and filter entries
- 📊 Statistics tracking
- 🔐 Google OAuth authentication
- 💾 User-specific data storage
- 📱 Responsive design
- ♿ Accessibility features

## Setup

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

4. Add your Google OAuth Client ID to `.env`:
   ```
   VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
   ```

   See `GOOGLE_OAUTH_SETUP.md` for detailed instructions on getting your Client ID.

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:
```bash
npm run build
```

The built files will be in the `dist` directory.

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the environment variable `VITE_GOOGLE_CLIENT_ID` in Vercel dashboard
4. Deploy!

Or use the Vercel CLI:
```bash
npx vercel --prod
```

## Project Structure

```
├── src/
│   ├── components/     # React components (to be added)
│   ├── hooks/         # Custom React hooks (to be added)
│   ├── styles/        # CSS stylesheets
│   │   └── main.css
│   ├── utils/         # Utility functions
│   │   ├── auth.js    # Google OAuth utilities
│   │   ├── constants.js # App constants (TOPICS)
│   │   └── storage.js # localStorage utilities
│   ├── App.jsx        # Main App component
│   └── main.jsx       # Entry point
├── public/            # Static assets
├── index.html         # HTML template
├── vite.config.js     # Vite configuration
└── package.json       # Dependencies and scripts
```

## Improvements Made

### High Priority ✅

1. **Split into separate files** - Code is now organized into components, utilities, and styles
2. **Added Vite build process** - Fast development and optimized production builds
3. **Environment variables** - Google Client ID now uses `VITE_GOOGLE_CLIENT_ID`
4. **Accessibility improvements** - Added ARIA labels, keyboard navigation, and focus management

### Accessibility Features

- ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Enter, Space, Escape)
- Focus indicators
- Screen reader support
- Semantic HTML

## License

MIT

