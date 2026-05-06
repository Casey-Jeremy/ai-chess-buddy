import { PlayerProfile, PlayerStats, Game, ApiError } from '../types';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
}

export class ChessComApiService {
  private baseUrl = 'https://api.chess.com/pub';
  private requestQueue: Promise<any> = Promise.resolve();
  private minRequestInterval = 100; // Minimum 100ms between requests for rate limiting

  /**
   * Centralized error handler that transforms fetch errors into ApiError objects
   */
  private handleApiError(error: any, statusCode?: number): ApiError {
    if (statusCode === 404) {
      return {
        code: 'NOT_FOUND',
        message: 'Player or resource not found',
        retryable: false,
        statusCode: 404,
      };
    }

    if (statusCode === 429) {
      return {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        retryable: true,
        statusCode: 429,
      };
    }

    if (statusCode && statusCode >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'Chess.com server error. Please try again.',
        retryable: true,
        statusCode,
      };
    }

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      retryable: false,
    };
  }

  /**
   * Implements exponential backoff retry logic
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options;
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Don't retry if error is not retryable or we've exhausted retries
        if (!error.retryable || attempt === maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Rate-limited fetch wrapper that ensures minimum interval between requests
   */
  private async rateLimitedFetch(url: string): Promise<Response> {
    // Chain this request after the previous one with a minimum delay
    const request = this.requestQueue.then(async () => {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval));
      return fetch(url);
    });

    this.requestQueue = request.catch(() => {}); // Prevent queue from breaking on errors
    return request;
  }

  /**
   * Generic API call handler with error handling and retry logic
   */
  private async apiCall<T>(url: string): Promise<T> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await this.rateLimitedFetch(url);

        if (!response.ok) {
          const apiError = this.handleApiError(null, response.status);
          throw apiError;
        }

        const data = await response.json();
        return data as T;
      } catch (error: any) {
        // If it's already an ApiError, rethrow it
        if (error.code) {
          throw error;
        }

        // Otherwise, transform it
        const apiError = this.handleApiError(error);
        throw apiError;
      }
    });
  }

  /**
   * Fetches player profile information
   * Requirements: 1.4, 2.1
   */
  async getPlayerProfile(username: string): Promise<PlayerProfile> {
    const url = `${this.baseUrl}/player/${username}`;
    const data = await this.apiCall<any>(url);

    // Transform Chess.com API response to our PlayerProfile type
    return {
      username: data.username || data.player_id?.toString() || username,
      playerId: data.player_id || 0,
      url: data.url || '',
      name: data.name,
      avatar: data.avatar,
      followers: data.followers || 0,
      country: data.country || '',
      joined: data.joined || 0,
      lastOnline: data.last_online || 0,
      status: data.status || 'unknown',
    };
  }

  /**
   * Fetches player statistics across all game types
   * Requirements: 2.3
   */
  async getPlayerStats(username: string): Promise<PlayerStats> {
    const url = `${this.baseUrl}/player/${username}/stats`;
    const data = await this.apiCall<PlayerStats>(url);
    return data;
  }

  /**
   * Fetches list of available game archive URLs
   * Requirements: 3.1
   */
  async getGameArchives(username: string): Promise<string[]> {
    const url = `${this.baseUrl}/player/${username}/games/archives`;
    const data = await this.apiCall<{ archives: string[] }>(url);
    return data.archives || [];
  }

  /**
   * Fetches all games for a specific month
   * Requirements: 3.2
   */
  async getMonthlyArchive(username: string, year: number, month: number): Promise<Game[]> {
    // Format month with leading zero (01-12)
    const monthStr = month.toString().padStart(2, '0');
    const url = `${this.baseUrl}/player/${username}/games/${year}/${monthStr}`;
    const data = await this.apiCall<{ games: Game[] }>(url);
    return data.games || [];
  }

  /**
   * Fetches current games payload for a player
   */
  async getPlayerGames(username: string): Promise<{ games: Game[] }> {
    const url = `${this.baseUrl}/player/${username}/games`;
    return this.apiCall<{ games: Game[] }>(url);
  }

  /**
   * Fetches games where it is the player's move
   */
  async getPlayerGamesToMove(username: string): Promise<{ games: Game[] }> {
    const url = `${this.baseUrl}/player/${username}/games/to-move`;
    return this.apiCall<{ games: Game[] }>(url);
  }

  /**
   * Fetches archive PGN for a specific month
   */
  async getMonthlyArchivePgn(username: string, year: number, month: number): Promise<string> {
    const monthStr = month.toString().padStart(2, '0');
    const url = `${this.baseUrl}/player/${username}/games/${year}/${monthStr}/pgn`;
    const response = await this.rateLimitedFetch(url);

    if (!response.ok) {
      throw this.handleApiError(null, response.status);
    }

    return response.text();
  }

  async getPlayerClubs(username: string): Promise<{ clubs: any[] }> {
    const url = `${this.baseUrl}/player/${username}/clubs`;
    return this.apiCall<{ clubs: any[] }>(url);
  }

  async getPlayerTournaments(username: string): Promise<{ finished: any[]; in_progress: any[]; registered: any[] }> {
    const url = `${this.baseUrl}/player/${username}/tournaments`;
    return this.apiCall<{ finished: any[]; in_progress: any[]; registered: any[] }>(url);
  }

  async getTitledPlayers(title: string): Promise<{ players: string[] }> {
    const url = `${this.baseUrl}/titled/${title}`;
    return this.apiCall<{ players: string[] }>(url);
  }

  async getClubProfile(clubSlug: string): Promise<any> {
    const url = `${this.baseUrl}/club/${clubSlug}`;
    return this.apiCall<any>(url);
  }

  async getClubMembers(clubSlug: string): Promise<any> {
    const url = `${this.baseUrl}/club/${clubSlug}/members`;
    return this.apiCall<any>(url);
  }

  async getTournament(tournamentId: string): Promise<any> {
    const url = `${this.baseUrl}/tournament/${tournamentId}`;
    return this.apiCall<any>(url);
  }

  async getTournamentRound(tournamentId: string, round: number): Promise<any> {
    const url = `${this.baseUrl}/tournament/${tournamentId}/${round}`;
    return this.apiCall<any>(url);
  }

  async getTournamentRoundGroup(tournamentId: string, round: number, group: number): Promise<any> {
    const url = `${this.baseUrl}/tournament/${tournamentId}/${round}/${group}`;
    return this.apiCall<any>(url);
  }

  async getTeamMatch(matchId: number): Promise<any> {
    const url = `${this.baseUrl}/match/${matchId}`;
    return this.apiCall<any>(url);
  }

  async getTeamMatchBoard(matchId: number, board: number): Promise<any> {
    const url = `${this.baseUrl}/match/${matchId}/${board}`;
    return this.apiCall<any>(url);
  }

  async getCountry(countryCode: string): Promise<any> {
    const url = `${this.baseUrl}/country/${countryCode}`;
    return this.apiCall<any>(url);
  }

  async getCountryPlayers(countryCode: string): Promise<{ players: string[] }> {
    const url = `${this.baseUrl}/country/${countryCode}/players`;
    return this.apiCall<{ players: string[] }>(url);
  }

  async getCountryClubs(countryCode: string): Promise<{ clubs: string[] }> {
    const url = `${this.baseUrl}/country/${countryCode}/clubs`;
    return this.apiCall<{ clubs: string[] }>(url);
  }

  async getDailyPuzzle(): Promise<any> {
    const url = `${this.baseUrl}/puzzle`;
    return this.apiCall<any>(url);
  }

  async getPointSystemConfig(): Promise<any> {
    const url = 'https://api.chess-dev.com/pub/point-system-config';
    return this.apiCall<any>(url);
  }
}

export default new ChessComApiService();
