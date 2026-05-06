import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useHaptics } from '../../hooks/useHaptics';
import chessComApiService from '../../services/ChessComApiService';

const chessBackground = require('../../assets/chess.jpg');

export default function LinkAccountScreen() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { linkChessComAccount, user } = useAuth();
  const router = useRouter();
  const haptics = useHaptics();

  const validateUsername = (value: string): string | null => {
    if (!value.trim()) {
      return 'Username is required';
    }
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Username can only contain letters, numbers, hyphens, and underscores';
    }
    return null;
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    const validationError = validateUsername(username);
    if (validationError) {
      haptics.error();
      setError(validationError);
      return;
    }

    haptics.light();
    setLoading(true);
    setError(null);

    try {
      await chessComApiService.getPlayerProfile(username.trim());
      await linkChessComAccount(username.trim());

      haptics.success();
      Alert.alert(
        'Success',
        'Your Chess.com account has been linked successfully!',
        [
          {
            text: 'Continue',
            onPress: () => {
              haptics.light();
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (err: any) {
      haptics.error();
      console.error('Link account error:', err);

      if (err.code === 'NOT_FOUND') {
        setError('Chess.com username not found. Please check and try again.');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection and try again.');
      } else if (err.code === 'RATE_LIMITED') {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.message || 'Failed to link account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    haptics.light();
    Alert.alert(
      'Skip Account Linking?',
      'You can link your Chess.com account later from the profile screen.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => haptics.light(),
        },
        {
          text: 'Skip',
          onPress: () => {
            haptics.medium();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  return (
    <ImageBackground source={chessBackground} resizeMode="cover" style={styles.background}>
      <StatusBar style="light" />
      <View style={styles.scrim} />
      <SafeAreaView testID="link-account-screen" style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.panel}>
              <View style={styles.markerRow}>
                <View style={styles.markerLine} />
                <Text style={styles.markerText}>FINAL SETUP</Text>
                <View style={styles.markerLine} />
              </View>

              <View style={styles.header}>
                <Text testID="link-account-title" style={styles.title}>
                  Link Chess.com Account
                </Text>
                <Text style={styles.subtitle}>
                  Add your Chess.com username so ChessStats can pull your games and build your dashboard.
                </Text>
              </View>

              {user && (
                <View style={styles.accountRow}>
                  <Text style={styles.accountLabel}>Signed in</Text>
                  <Text testID="user-email" style={styles.accountEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Chess.com username</Text>
                <TextInput
                  testID="username-input"
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="e.g. hikaru"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  style={[styles.input, error && styles.inputError]}
                />
                <View style={styles.helperRow}>
                  {error ? (
                    <Text testID="error-message" style={[styles.helperText, styles.errorText]}>
                      {error}
                    </Text>
                  ) : (
                    <Text style={styles.helperText}>
                      We will verify this with Chess.com before linking.
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                testID="link-account-button"
                onPress={handleSubmit}
                disabled={loading || !username.trim()}
                style={[
                  styles.primaryButton,
                  (loading || !username.trim()) && styles.buttonDisabled,
                ]}
                activeOpacity={0.84}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Link Account
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                testID="skip-button"
                onPress={handleSkip}
                disabled={loading}
                style={styles.skipButton}
                activeOpacity={0.68}
                accessibilityRole="button"
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>

              <Text style={styles.footerNote}>
                You can change this later from your profile.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.66)',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  panel: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
  },
  markerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 22,
  },
  markerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.28)',
  },
  markerText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  title: {
    color: '#ffffff',
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#dbe4ef',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  accountRow: {
    borderLeftWidth: 3,
    borderLeftColor: '#f8fafc',
    paddingLeft: 12,
    marginBottom: 22,
  },
  accountLabel: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  accountEmail: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 9,
  },
  input: {
    minHeight: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(203, 213, 225, 0.42)',
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    color: '#111827',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: '#fb7185',
  },
  helperRow: {
    minHeight: 36,
    justifyContent: 'center',
  },
  helperText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  errorText: {
    color: '#fecdd3',
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonDisabled: {
    opacity: 0.62,
  },
  primaryButtonText: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  skipButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  skipButtonText: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  footerNote: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
