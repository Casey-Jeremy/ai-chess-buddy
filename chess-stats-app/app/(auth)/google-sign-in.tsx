import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useHaptics } from '../../hooks/useHaptics';

const chessBackground = require('../../assets/chess.jpg');

export default function GoogleSignInScreen() {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const haptics = useHaptics();

  const handleGoogleSignIn = async () => {
    haptics.light();
    setLoading(true);
    try {
      await signInWithGoogle();
      haptics.success();
      // After successful sign-in, navigate to link account screen
      router.push('/(auth)/link-account');
    } catch (error: any) {
      haptics.error();
      console.error('Sign in error:', error);
      Alert.alert(
        'Sign In Failed',
        error.message || 'Failed to sign in with Google. Please try again.',
        [{ text: 'OK', onPress: () => haptics.light() }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={chessBackground} resizeMode="cover" style={styles.background}>
      <StatusBar style="light" />
      <View style={styles.scrim} />
      <SafeAreaView
        testID="google-sign-in-screen"
        style={styles.safeArea}
        edges={['top', 'right', 'bottom', 'left']}
      >
        <View style={styles.content}>
          <View style={styles.panel}>
            <View style={styles.titleBlock}>
              <Text testID="app-title" style={styles.title}>
              Chess Stats
              </Text>
              <Text testID="app-subtitle" style={styles.subtitle}>
                Analyze your Chess.com games and improve your play
              </Text>
            </View>

            <TouchableOpacity
              testID="google-sign-in-button"
              onPress={handleGoogleSignIn}
              disabled={loading}
              style={[styles.button, loading && styles.buttonDisabled]}
              activeOpacity={0.82}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <Text style={styles.buttonLabel}>
                  Sign in with Google
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.infoText}>
              By signing in, you agree to link your Chess.com account to view your game analytics
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 7, 18, 0.58)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  panel: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#e5e7eb',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    minHeight: 56,
    borderRadius: 8,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonLabel: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoText: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 18,
  },
});
