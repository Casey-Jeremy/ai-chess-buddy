# Supabase Setup Guide

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Google Cloud Console account for OAuth setup

## Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in project details and create the project
4. Wait for the project to be provisioned

## Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to Settings > API
2. Copy the following values:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public key

3. Create a `.env` file in the `chess-stats-app` directory:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 3: Configure Google OAuth

### In Google Cloud Console:

1. Go to https://console.cloud.google.com
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen if prompted
6. Select "Web application" as the application type
7. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - Replace `your-project-ref` with your actual Supabase project reference
8. Copy the Client ID and Client Secret

### In Supabase Dashboard:

1. Go to Authentication > Providers
2. Find "Google" in the list and click to configure
3. Enable the Google provider
4. Paste your Google Client ID and Client Secret
5. Save the configuration

## Step 4: Run Database Migration

You can run the migration in two ways:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/001_create_user_profiles.sql`
4. Paste into the SQL Editor and click "Run"

### Option B: Using Supabase CLI

1. Install Supabase CLI: `npm install -g supabase`
2. Link your project: `supabase link --project-ref your-project-ref`
3. Run migrations: `supabase db push`

## Step 5: Configure Expo Deep Linking

1. In your `app.json`, ensure you have a scheme configured:
```json
{
  "expo": {
    "scheme": "chessstatsapp"
  }
}
```

2. The app will use this scheme for OAuth redirects

## Step 6: Test Authentication

1. Start your Expo app: `npm start`
2. Try signing in with Google
3. Verify that the user profile is created in the `user_profiles` table

## Troubleshooting

### OAuth redirect not working
- Ensure the redirect URI in Google Cloud Console matches your Supabase project URL
- Check that the Google provider is enabled in Supabase

### Database errors
- Verify that the migration ran successfully
- Check that Row Level Security policies are in place

### Environment variables not loading
- Restart the Expo development server after adding `.env` file
- Ensure variable names start with `EXPO_PUBLIC_`
