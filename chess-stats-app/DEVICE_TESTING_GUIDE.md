# Device Testing Guide

## Current Status

The Expo dev server is starting. Once it's ready, you'll see a QR code in the terminal.

## Steps to Test on Your Physical Device

### Option 1: Using Expo Go (Recommended for Quick Testing)

1. **Install Expo Go**
   - Download "Expo Go" from the App Store on your iOS device
   - Open the app

2. **Connect to Dev Server**
   - Once the dev server shows a QR code in the terminal
   - Open the Camera app on your iPhone
   - Point it at the QR code
   - Tap the notification that appears
   - The app will open in Expo Go

3. **Alternative Connection Method**
   - In Expo Go, tap "Enter URL manually"
   - Type the URL shown in the terminal (usually starts with `exp://`)

### Option 2: Using Development Build (For Full Native Features)

If Expo Go doesn't work or you need full native features:

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for iOS device
eas build --profile development --platform ios

# Follow the prompts and install the build on your device
```

## Known Issue: NativeWind Styling

**Note**: We temporarily disabled NativeWind in the metro config due to an ESM loading issue on Windows. This means:
- ✅ App functionality will work
- ⚠️ Tailwind CSS styling may not apply correctly
- The app will use default React Native styles

### To Fix NativeWind Later:

1. Update to latest NativeWind version
2. Or use inline styles temporarily
3. Or switch to StyleSheet.create() for now

## What to Test on Your Device

### 1. Authentication Flow
- [ ] Google Sign-In button appears
- [ ] Tapping it opens Google OAuth
- [ ] After signing in, you're prompted for Chess.com username
- [ ] Username validation works
- [ ] Account linking succeeds

### 2. Data Fetching
- [ ] Enter a valid Chess.com username (try "hikaru" or "magnuscarlsen")
- [ ] Profile loads correctly
- [ ] Statistics display
- [ ] Games list loads

### 3. Navigation
- [ ] Bottom tabs appear (Dashboard, Openings, Games, Profile)
- [ ] Tapping tabs switches screens
- [ ] State is preserved when switching tabs
- [ ] Back navigation works

### 4. Offline Mode
- [ ] Turn on Airplane Mode
- [ ] App shows offline indicator
- [ ] Cached data still displays
- [ ] Turn off Airplane Mode
- [ ] Data refreshes automatically

### 5. Performance
- [ ] App launches quickly
- [ ] Scrolling is smooth
- [ ] No lag when switching tabs
- [ ] Images load properly

## Troubleshooting

### "Unable to connect to Metro"
- Make sure your phone and computer are on the same WiFi network
- Try restarting the dev server: `npx expo start --clear`
- Check firewall settings

### "Network request failed"
- Check your .env file has correct Supabase credentials
- Verify internet connection
- Check Supabase project is active

### App crashes on launch
- Check the terminal for error messages
- Try clearing cache: `npx expo start --clear`
- Reinstall the app in Expo Go

### Styling looks wrong
- This is expected due to NativeWind being disabled
- Functionality should still work
- We'll fix styling after confirming core features work

## Next Steps After Testing

1. Document any bugs or issues you find
2. Test all features from the checklist
3. If everything works, we can:
   - Fix the NativeWind styling issue
   - Build a standalone app
   - Submit to TestFlight
   - Eventually submit to App Store

## Getting Help

If you encounter issues:
1. Check the terminal output for errors
2. Look at the Expo Go app logs (shake device → "Show Dev Menu" → "Debug Remote JS")
3. Share any error messages you see
