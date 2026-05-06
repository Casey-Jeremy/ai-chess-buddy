# Quick Start Guide

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Xcode (for iOS development)
- Expo Go app (for quick testing)

## Initial Setup

### 1. Install Dependencies

```bash
cd chess-stats-app
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `chess-stats-app` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key  # Optional
```

### 3. Set Up Supabase

1. Create a project at https://supabase.com
2. Run the migration in `supabase/migrations/001_create_user_profiles.sql`
3. Configure Google OAuth in Authentication > Providers
4. Copy your project URL and anon key to `.env`

## Running the App

### Development Mode

```bash
# Start the development server
npm start

# Or run directly on iOS simulator
npm run ios

# Or run on Android emulator
npm run android
```

### Testing on Physical Device

#### Option 1: Expo Go (Quickest)
1. Install Expo Go from App Store
2. Run `npm start`
3. Scan the QR code with your camera
4. App opens in Expo Go

#### Option 2: Development Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for device
eas build --profile development --platform ios

# Install the build on your device
# Then run:
npm start --dev-client
```

## Running Tests

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run E2E tests (requires simulator)
npm run test:e2e:build  # Build once
npm run test:e2e        # Run tests
```

## Common Commands

```bash
# Start development server
npm start

# Clear cache and restart
npm start -- --clear

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Type checking
npx tsc --noEmit

# Lint (if configured)
npm run lint
```

## Project Structure

```
chess-stats-app/
├── app/                    # Screens (Expo Router)
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab screens
│   ├── game/              # Game detail screen
│   ├── opening/           # Opening detail screen
│   ├── archive/           # Archive screens
│   └── analysis/          # Analysis screens
├── components/            # Reusable components
├── services/              # API and business logic
│   ├── ChessComApiService.ts
│   ├── SupabaseService.ts
│   ├── CacheService.ts
│   ├── AnalyticsService.ts
│   └── OpenRouterService.ts
├── hooks/                 # Custom React hooks
├── contexts/              # React contexts
├── types/                 # TypeScript type definitions
├── __mocks__/            # Jest mocks
├── __tests__/            # Integration tests
└── e2e/                  # E2E tests
```

## Key Features

### 1. Authentication
- Google Sign-In via Supabase
- Chess.com account linking
- Session management

### 2. Player Data
- Profile viewing
- Statistics by time control
- Game history browsing

### 3. Analytics
- Opening analysis
- Performance dashboard
- Phase analysis (opening/middlegame/endgame)
- AI-powered improvement suggestions

### 4. Offline Support
- Automatic data caching
- Offline indicator
- Background refresh

### 5. Navigation
- Tab-based navigation
- State preservation
- Deep linking support

## Troubleshooting

### App won't start
```bash
# Clear cache
npm start -- --clear

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Tests failing
```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
npm install
```

### Build errors
```bash
# Clear Expo cache
expo start -c

# Reset Metro bundler
npx expo start --clear
```

### Supabase connection issues
- Verify `.env` file exists and has correct values
- Check Supabase project is active
- Verify Google OAuth is configured

### Chess.com API errors
- Check internet connection
- Verify username is valid
- Check rate limits (300 requests/minute)

## Development Tips

### Hot Reload
- Save files to see changes instantly
- Shake device to open developer menu
- Press `r` in terminal to reload

### Debugging
- Use React Native Debugger
- Check console logs in terminal
- Use `console.log()` for debugging
- Enable remote debugging in dev menu

### Testing
- Write tests alongside features
- Run tests before committing
- Use property-based tests for complex logic
- Test on physical device regularly

## Environment Variables

Required:
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

Optional:
- `EXPO_PUBLIC_OPENROUTER_API_KEY` - For AI-powered suggestions

## Documentation

- [Full README](./README.md)
- [Setup Guide](./SETUP.md)
- [Supabase Setup](./SUPABASE_SETUP.md)
- [E2E Testing](./E2E_TESTING_SETUP.md)
- [Offline Support](./OFFLINE_SUPPORT.md)
- [AI Suggestions](./AI_SUGGESTIONS_SETUP.md)
- [Testing Summary](./TESTING_SUMMARY.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Bug Tracking](./BUG_TRACKING.md)

## Getting Help

- Check existing documentation
- Review test files for examples
- Check Expo documentation: https://docs.expo.dev
- Check Supabase documentation: https://supabase.com/docs
- Review Chess.com API docs: https://www.chess.com/news/view/published-data-api

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Set up Supabase
4. ⚠️ Test on physical device
5. ⚠️ Deploy to TestFlight
6. ⚠️ Submit to App Store

## Status

**Development**: ✅ Complete  
**Testing**: ✅ All automated tests passing  
**Configuration**: ✅ Optimized  
**Documentation**: ✅ Comprehensive  
**Ready for Device Testing**: ✅ Yes
