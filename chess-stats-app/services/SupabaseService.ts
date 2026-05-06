import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { User } from '../types';

WebBrowser.maybeCompleteAuthSession();

// These will be configured with environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_PROJECT_REF = getSupabaseProjectRef(SUPABASE_URL);
const AUTH_STORAGE_KEY = SUPABASE_PROJECT_REF
  ? `sb-${SUPABASE_PROJECT_REF}-auth-token`
  : 'supabase-auth-token';
const OAUTH_REDIRECT_URL =
  process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || 'chessstats://auth/callback';
const AUTH_CALLBACK_TIMEOUT_MS = 60000;
const PROFILE_TIMEOUT_MS = 4000;
const SESSION_TIMEOUT_MS = 30000;
const memoryStorage = new Map<string, string>();

const memoryAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    return memoryStorage.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    memoryStorage.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    memoryStorage.delete(key);
  },
};

function getSupabaseProjectRef(url: string): string {
  try {
    return new URL(url).hostname.split('.')[0] || '';
  } catch {
    return '';
  }
}

// Database types for user_profiles table
interface UserProfile {
  id: string;
  email: string;
  chess_com_username: string | null;
  created_at: string;
  updated_at: string;
}

export class SupabaseService {
  private supabase: SupabaseClient;
  private currentSession: Session | null = null;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: memoryAuthStorage,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: 'pkce',
        persistSession: true,
      },
    });
  }

  /**
   * Initiates Google OAuth sign-in flow
   * @returns Promise resolving to User object
   */
  async signInWithGoogle(): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: OAUTH_REDIRECT_URL,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw new Error(`Google sign-in failed: ${error.message}`);
    }

    if (!data.url) {
      throw new Error('No OAuth URL returned from Supabase');
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Google OAuth redirect URL:', OAUTH_REDIRECT_URL);
      console.log('Supabase Google OAuth URL:', data.url);
    }

    const callbackUrl = await this.openOAuthSession(data.url);
    if (process.env.NODE_ENV !== 'production') {
      const callbackParams = this.getUrlParams(callbackUrl);
      console.log('Google OAuth callback has code:', callbackParams.has('code'));
      console.log('Google OAuth callback has tokens:', callbackParams.has('access_token'));
    }

    const session = await this.createSessionFromUrl(callbackUrl);
    
    if (!session?.user) {
      throw new Error('No user session after OAuth');
    }

    return await this.getUserProfileWithFallback(session);
  }

  /**
   * Signs out the current user
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
    this.currentSession = null;
    memoryStorage.delete(AUTH_STORAGE_KEY);
  }

  /**
   * Gets the currently authenticated user
   * @returns Promise resolving to User object or null if not authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { session }, error } = this.currentSession
      ? { data: { session: this.currentSession }, error: null }
      : await this.supabase.auth.getSession();
    
    if (error || !session?.user) {
      return null;
    }

    const fallbackUser = this.mapSessionToUser(session);

    try {
      const profile = await this.withTimeout(
        this.fetchUserProfile(session.user.id),
        PROFILE_TIMEOUT_MS,
        'Loading user profile'
      );

      return profile ? this.mapProfileToUser(profile) : fallbackUser;
    } catch (error) {
      console.warn('Falling back to auth session user:', error);
      return fallbackUser;
    }
  }

  /**
   * Links a Chess.com username to the user's account
   * @param userId - The user's ID
   * @param chessComUsername - The Chess.com username to link
   */
  async linkChessComAccount(userId: string, chessComUsername: string): Promise<void> {
    const { data: { session } } = this.currentSession
      ? { data: { session: this.currentSession } }
      : await this.supabase.auth.getSession();
    const email = session?.user.email || '';

    const { error } = await this.supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email,
        chess_com_username: chessComUsername,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      throw new Error(`Failed to link Chess.com account: ${error.message}`);
    }
  }

  /**
   * Gets the linked Chess.com username for a user
   * @param userId - The user's ID
   * @returns Promise resolving to the Chess.com username or null if not linked
   */
  async getLinkedChessComUsername(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('chess_com_username')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.chess_com_username;
  }

  /**
   * Waits for an OAuth session to be established
   * @private
   */
  private async waitForSession(timeout: number = 60000): Promise<Session | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        return session;
      }
      // Wait 500ms before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return null;
  }

  /**
   * Creates a Supabase session from the OAuth redirect URL returned by Expo.
   * @private
   */
  private async createSessionFromUrl(url: string): Promise<Session | null> {
    const params = this.getUrlParams(url);
    const errorCode = params.get('error') || params.get('error_code');

    if (errorCode) {
      const description = params.get('error_description');
      throw new Error(description || errorCode);
    }

    const code = params.get('code');
    if (code) {
      return await this.exchangePkceCodeForSession(code);
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      const result = await this.withTimeout(
        this.supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
        SESSION_TIMEOUT_MS,
        'Setting OAuth session'
      );

      if (!result) {
        throw new Error('Timed out while creating your Google session. Please try again.');
      }

      const { data, error } = result;

      if (error) {
        throw new Error(`Failed to set OAuth session: ${error.message}`);
      }

      return data.session;
    }

    throw new Error('OAuth callback did not include a session code. Please try signing in again.');
  }

  /**
   * Opens the provider auth flow and resolves from either Expo's auth-session
   * result or the native deep-link event, whichever arrives first.
   * @private
   */
  private async openOAuthSession(url: string): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      let settled = false;
      let subscription: { remove: () => void } | null = null;

      const timeoutId = setTimeout(() => {
        settleError(
          new Error(
            `Google sign-in did not return to the app. Make sure Supabase allows ${OAUTH_REDIRECT_URL} as a redirect URL.`
          )
        );
      }, AUTH_CALLBACK_TIMEOUT_MS);

      const cleanup = () => {
        clearTimeout(timeoutId);
        subscription?.remove();
      };

      const settleSuccess = (callbackUrl: string) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(callbackUrl);
      };

      function settleError(error: Error) {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      }

      subscription = Linking.addEventListener('url', ({ url: callbackUrl }) => {
        if (callbackUrl.startsWith(OAUTH_REDIRECT_URL)) {
          settleSuccess(callbackUrl);
        }
      });

      WebBrowser.openAuthSessionAsync(url, OAUTH_REDIRECT_URL)
        .then((result) => {
          if (result.type === 'success') {
            settleSuccess(result.url);
            return;
          }

          settleError(new Error('Google sign-in was cancelled'));
        })
        .catch((error) => {
          settleError(error instanceof Error ? error : new Error(String(error)));
        });
    });
  }

  /**
   * Reads query and hash params because OAuth providers may return either.
   * @private
   */
  private getUrlParams(url: string): URLSearchParams {
    const queryString = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
    const hashString = url.includes('#') ? url.split('#')[1] : '';
    const params = [queryString, hashString].filter(Boolean).join('&');

    return new URLSearchParams(params);
  }

  /**
   * Exchanges the PKCE auth code directly to avoid SDK lock/storage hangs in Expo dev builds.
   * @private
   */
  private async exchangePkceCodeForSession(code: string): Promise<Session> {
    const codeVerifier = this.getStoredCodeVerifier();
    const response = await this.fetchWithTimeout(
      `${SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
          auth_code: code,
          code_verifier: codeVerifier,
        }),
      },
      SESSION_TIMEOUT_MS,
      'Exchanging OAuth code for session'
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload.error_description ||
          payload.msg ||
          payload.message ||
          payload.error ||
          'Failed to exchange OAuth code for session'
      );
    }

    const session = {
      ...payload,
      expires_at: payload.expires_at ?? Math.round(Date.now() / 1000) + payload.expires_in,
    } as Session;

    if (!session.access_token || !session.refresh_token || !session.user) {
      throw new Error('Supabase returned an invalid OAuth session.');
    }

    this.saveSession(session);

    if (process.env.NODE_ENV !== 'production') {
      console.log('Google OAuth session created for:', session.user.email);
    }

    return session;
  }

  /**
   * Reads the PKCE verifier stored when Supabase generated the provider URL.
   * @private
   */
  private getStoredCodeVerifier(): string {
    const verifierEntry =
      memoryStorage.get(`${AUTH_STORAGE_KEY}-code-verifier`) ??
      Array.from(memoryStorage.entries()).find(([key]) => key.endsWith('-code-verifier'))?.[1];

    if (!verifierEntry) {
      throw new Error('Missing Google sign-in verifier. Please try signing in again.');
    }

    let verifier = verifierEntry;

    try {
      verifier = JSON.parse(verifierEntry);
    } catch {
      // Stored value is already plain text.
    }

    return verifier.split('/')[0];
  }

  /**
   * Saves the session where Supabase's client expects to find it.
   * @private
   */
  private saveSession(session: Session): void {
    this.currentSession = session;
    memoryStorage.delete(`${AUTH_STORAGE_KEY}-code-verifier`);
    memoryStorage.set(AUTH_STORAGE_KEY, JSON.stringify(session));
  }

  /**
   * Adds a real timeout around fetch because React Native requests can hang.
   * @private
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number,
    label: string
  ): Promise<Response> {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

    return await new Promise<Response>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        controller?.abort();
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fetch(url, {
        ...options,
        signal: controller?.signal,
      })
        .then((response) => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Fetches a user profile without creating one.
   * @private
   */
  private async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Returns profile data when it is available, otherwise returns the auth user immediately.
   * @private
   */
  private async getUserProfileWithFallback(session: Session): Promise<User> {
    const fallbackUser = this.mapSessionToUser(session);

    try {
      const profileUser = await this.withTimeout(
        this.getOrCreateUserProfile(session.user.id, session.user.email || ''),
        PROFILE_TIMEOUT_MS,
        'Creating user profile'
      );

      return profileUser || fallbackUser;
    } catch (error) {
      console.warn('Profile sync failed after sign-in:', error);
      return fallbackUser;
    }
  }

  /**
   * Prevents auth UI from spinning indefinitely on slow network/database calls.
   * @private
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    label: string
  ): Promise<T | null> {
    let timeoutId: ReturnType<typeof setTimeout>;

    return await new Promise<T | null>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        console.warn(`${label} timed out after ${timeoutMs}ms`);
        resolve(null);
      }, timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timeoutId);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Gets or creates a user profile in the database
   * @private
   */
  private async getOrCreateUserProfile(userId: string, email: string): Promise<User> {
    // Try to get existing profile
    const existingProfile = await this.fetchUserProfile(userId);

    if (existingProfile) {
      return this.mapProfileToUser(existingProfile);
    }

    // Create new profile
    const now = new Date().toISOString();
    const { data: newProfile, error } = await this.supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        chess_com_username: null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error || !newProfile) {
      throw new Error(`Failed to create user profile: ${error?.message}`);
    }

    return this.mapProfileToUser(newProfile);
  }

  /**
   * Maps database profile to User type
   * @private
   */
  private mapProfileToUser(profile: UserProfile): User {
    return {
      id: profile.id,
      email: profile.email,
      chessComUsername: profile.chess_com_username,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
    };
  }

  /**
   * Maps an auth session directly to the app user shape while profile sync catches up.
   * @private
   */
  private mapSessionToUser(session: Session): User {
    const createdAt = session.user.created_at ? new Date(session.user.created_at) : new Date();
    const updatedAt = session.user.updated_at ? new Date(session.user.updated_at) : createdAt;

    return {
      id: session.user.id,
      email: session.user.email || '',
      chessComUsername: null,
      createdAt,
      updatedAt,
    };
  }

  /**
   * Gets the Supabase client instance for advanced usage
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }
}

export default new SupabaseService();
