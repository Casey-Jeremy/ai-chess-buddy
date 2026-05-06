# Chess Board Setup Instructions

The `@og-nav/expo-chessboard` library requires native modules that are not available in Expo Go. You need to create a development build to use the chess board feature.

## Option 1: Create a Development Build (Recommended)

### For iOS (requires Mac with Xcode):
```bash
npx expo run:ios
```

### For Android:
```bash
npx expo run:android
```

This will:
1. Install native dependencies
2. Build the app with native modules
3. Install it on your device/simulator
4. Start the development server

## Option 2: Use EAS Build (Cloud Build)

If you don't have the native development environment set up:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Create a development build
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

Then install the built app on your device and scan the QR code from `npx expo start --dev-client`.

## Option 3: Temporary Fallback (Current State)

The app currently has a fallback that shows a message when the chess board can't load. This allows the rest of the app to work in Expo Go, but you won't see the visual chess board.

## Why This Is Needed

The chess board library uses:
- `react-native-reanimated` (v3/v4) - requires native worklets module
- `react-native-gesture-handler` - requires native gesture handling
- `react-native-svg` - for rendering pieces

These require native code that must be compiled into the app, which Expo Go doesn't support for third-party libraries.

## Verifying It Works

Once you have a development build running:
1. Navigate to any game
2. You should see a beautiful interactive chess board showing the final position
3. The board will be responsive and properly sized

## Troubleshooting

If you see "Chess board unavailable":
- You're running in Expo Go (not a development build)
- Create a development build using Option 1 or 2 above

If the build fails:
- Make sure you have the latest Expo SDK: `npx expo install --fix`
- Clear caches: `npx expo start --clear`
- Rebuild: `npx expo prebuild --clean`
