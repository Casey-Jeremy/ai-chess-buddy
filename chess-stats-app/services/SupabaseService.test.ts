import fc from 'fast-check';
import { SupabaseService } from './SupabaseService';
import * as WebBrowser from 'expo-web-browser';

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(() => Promise.resolve({
    type: 'success',
    url: 'chessstats://auth/callback',
  })),
}));

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}));

describe('SupabaseService - Property-Based Tests', () => {
  let service: SupabaseService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SupabaseService();
    mockSupabaseClient = service.getClient();
  });

  describe('Property 1: Google authentication initiates OAuth flow', () => {
    /**
     * **Feature: chess-stats-app, Property 1: Google authentication initiates OAuth flow**
     * **Validates: Requirements 1.2**
     * 
     * For any Google Sign-In button tap, the app should initiate the Google OAuth flow through Supabase Auth.
     */
    it('should initiate OAuth flow with Google provider for any sign-in attempt', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random OAuth URLs to simulate different Supabase responses
          fc.webUrl(),
          async (oauthUrl) => {
            // Mock the OAuth response
            mockSupabaseClient.auth.signInWithOAuth.mockResolvedValueOnce({
              data: { url: oauthUrl },
              error: null,
            });

            // Mock session establishment (return session immediately)
            mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
              data: {
                session: {
                  user: { id: 'test-user-id', email: 'test@example.com' },
                },
              },
              error: null,
            });

            // Mock user profile creation
            const mockProfile = {
              id: 'test-user-id',
              email: 'test@example.com',
              chess_com_username: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            mockSupabaseClient.from.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            });

            mockSupabaseClient.from.mockReturnValueOnce({
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
                }),
              }),
            });

            // Attempt to sign in
            await service.signInWithGoogle();

            // Verify that signInWithOAuth was called with Google provider
            expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith(
              expect.objectContaining({
                provider: 'google',
                options: expect.objectContaining({
                  redirectTo: 'chessstats://auth/callback',
                  skipBrowserRedirect: true,
                }),
              })
            );

            // Verify that the OAuth URL opens in an auth session that redirects back to the app
            expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
              oauthUrl,
              'chessstats://auth/callback'
            );
          }
        ),
        { numRuns: 100 }
      );
    }, 30000); // Increase timeout for property-based testing

    it('should throw error when OAuth URL is not returned', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            // Mock OAuth response without URL
            mockSupabaseClient.auth.signInWithOAuth.mockResolvedValueOnce({
              data: { url: null },
              error: null,
            });

            // Should throw error when no URL is returned
            await expect(service.signInWithGoogle()).rejects.toThrow(
              'No OAuth URL returned from Supabase'
            );
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should throw error when OAuth fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (errorMessage) => {
            // Mock OAuth error
            mockSupabaseClient.auth.signInWithOAuth.mockResolvedValueOnce({
              data: { url: null },
              error: { message: errorMessage },
            });

            // Should throw error with the error message
            await expect(service.signInWithGoogle()).rejects.toThrow(
              `Google sign-in failed: ${errorMessage}`
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 3: Valid username storage round trip', () => {
    /**
     * **Feature: chess-stats-app, Property 3: Valid username storage round trip**
     * **Validates: Requirements 1.5**
     * 
     * For any valid Chess.com username, after linking it to a user account, 
     * querying Supabase should return the same username.
     */
    it('should store and retrieve Chess.com username correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user IDs and Chess.com usernames
          fc.uuid(),
          fc.string({ minLength: 3, maxLength: 25 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          async (userId, chessComUsername) => {
            // Mock successful update
            mockSupabaseClient.from.mockReturnValueOnce({
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            });

            // Link the Chess.com account
            await service.linkChessComAccount(userId, chessComUsername);

            // Mock successful retrieval
            mockSupabaseClient.from.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { chess_com_username: chessComUsername },
                    error: null,
                  }),
                }),
              }),
            });

            // Retrieve the linked username
            const retrievedUsername = await service.getLinkedChessComUsername(userId);

            // Verify round trip: stored username should equal retrieved username
            expect(retrievedUsername).toBe(chessComUsername);
          }
        ),
        { numRuns: 100 }
      );
    }, 30000);

    it('should return null when no username is linked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            // Mock retrieval with no username
            mockSupabaseClient.from.mockReturnValueOnce({
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { chess_com_username: null },
                    error: null,
                  }),
                }),
              }),
            });

            // Retrieve the linked username
            const retrievedUsername = await service.getLinkedChessComUsername(userId);

            // Should return null when no username is linked
            expect(retrievedUsername).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should throw error when linking fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 3, maxLength: 25 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (userId, chessComUsername, errorMessage) => {
            // Mock failed update
            mockSupabaseClient.from.mockReturnValueOnce({
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: { message: errorMessage } }),
              }),
            });

            // Should throw error when linking fails
            await expect(
              service.linkChessComAccount(userId, chessComUsername)
            ).rejects.toThrow(`Failed to link Chess.com account: ${errorMessage}`);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
