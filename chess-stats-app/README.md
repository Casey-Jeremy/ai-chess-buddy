# Chess Stats App

A React Native iOS application that provides analytics-based chess improvement insights by integrating with the Chess.com public API.

## 🚀 Quick Start

**New to the project?** Start here: [Quick Start Guide](./QUICK_START.md)

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Get up and running quickly
- **[Setup Guide](./SETUP.md)** - Detailed setup instructions
- **[Supabase Setup](./SUPABASE_SETUP.md)** - Configure authentication
- **[Testing Summary](./TESTING_SUMMARY.md)** - Test coverage and results
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification
- **[Bug Tracking](./BUG_TRACKING.md)** - Known issues and status
- **[E2E Testing](./E2E_TESTING_SETUP.md)** - End-to-end test setup
- **[Offline Support](./OFFLINE_SUPPORT.md)** - Caching and offline mode
- **[AI Suggestions](./AI_SUGGESTIONS_SETUP.md)** - AI-powered insights

## ✨ Features

- 🔐 **Google Sign-In** authentication via Supabase
- 👤 **Player Profiles** - View Chess.com profiles and statistics
- 📊 **Performance Dashboard** - Key metrics and rating trends
- ♟️ **Opening Analysis** - Identify strengths and weaknesses
- 🎯 **Phase Analysis** - Opening, middlegame, and endgame insights
- 🤖 **AI-Powered Suggestions** - Personalized improvement recommendations
- 📱 **Offline Support** - Automatic caching and offline mode
- 🎨 **Modern UI** - Clean design with Tailwind CSS

## 🛠 Tech Stack

- **Framework**: Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **Styling**: Tailwind CSS v4 via NativeWind v5
- **Data Fetching**: React Query (TanStack Query)
- **Backend**: Supabase (Authentication + PostgreSQL)
- **Local Storage**: AsyncStorage for caching
- **Testing**: Jest + fast-check (property-based testing)
- **E2E Testing**: Detox

## 📁 Project Structure

```
chess-stats-app/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab screens
│   ├── game/              # Game detail screen
│   ├── opening/           # Opening detail screen
│   ├── archive/           # Archive screens
│   └── analysis/          # Analysis screens
├── components/             # Shared UI components
├── services/              # API and business logic services
│   ├── ChessComApiService.ts
│   ├── SupabaseService.ts
│   ├── AnalyticsService.ts
│   ├── CacheService.ts
│   └── OpenRouterService.ts
├── hooks/                 # Custom React hooks
├── contexts/              # React contexts
├── types/                 # TypeScript type definitions
├── __tests__/            # Integration tests
├── e2e/                  # E2E tests
└── global.css            # Tailwind CSS styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Xcode (for iOS development)
- Expo Go app (for quick testing)

### Installation

1. **Install dependencies:**
   ```bash
   cd chess-stats-app
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on iOS:**
   ```bash
   npm run ios
   ```

For detailed setup instructions, see the [Quick Start Guide](./QUICK_START.md).

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e:build  # Build once
npm run test:e2e        # Run tests
```

**Test Status**: ✅ All 58+ tests passing  
**Coverage**: Comprehensive (19 property-based tests + unit tests + integration tests)

See [Testing Summary](./TESTING_SUMMARY.md) for detailed test coverage.

## 📦 Deployment

The app is ready for physical device testing. See the [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) for:
- Environment configuration
- Physical device testing steps
- App Store submission process
- Performance optimization tips

## 🐛 Known Issues

No critical bugs. Minor cosmetic warnings in tests (non-blocking).  
See [Bug Tracking](./BUG_TRACKING.md) for details.

## 🔧 Development Commands

```bash
npm start              # Start development server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm test              # Run tests
npm test -- --watch   # Run tests in watch mode
```

## 📊 Project Status

- ✅ **Development**: Complete
- ✅ **Testing**: All automated tests passing
- ✅ **Configuration**: Optimized
- ✅ **Documentation**: Comprehensive
- ⚠️ **Physical Device Testing**: Pending
- ⚠️ **App Store Submission**: Pending

## 🤝 Contributing

This is a personal project, but feedback and suggestions are welcome!

## 📄 License

Private project - All rights reserved

## 🔗 Resources

- [Expo Documentation](https://docs.expo.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Chess.com API](https://www.chess.com/news/view/published-data-api)
- [React Native](https://reactnative.dev)
- [Tailwind CSS](https://tailwindcss.com)

## 📞 Support

For issues or questions:
1. Check the [Bug Tracking](./BUG_TRACKING.md) document
2. Review the [Quick Start Guide](./QUICK_START.md)
3. Consult the relevant documentation above

---

**Ready to get started?** → [Quick Start Guide](./QUICK_START.md)
