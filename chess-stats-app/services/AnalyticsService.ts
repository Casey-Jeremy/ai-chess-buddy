import {
  Game,
  PlayerStats,
  OpeningAnalysis,
  PhaseAnalysis,
  PerformanceDashboard,
  Pattern,
  TimeControlMetrics,
  RatingDataPoint,
  PhaseStats,
  ImprovementSuggestion,
} from '../types';
import openRouterService from './OpenRouterService';

export class AnalyticsService {
  /**
   * Analyzes games to extract and aggregate opening statistics
   * Requirements: 9.1, 9.2, 9.3
   */
  async analyzeOpenings(games: Game[]): Promise<OpeningAnalysis[]> {
    const openingMap = new Map<string, {
      eco: string;
      games: Game[];
      wins: number;
      losses: number;
      draws: number;
      totalRating: number;
    }>();

    // Aggregate games by opening
    for (const game of games) {
      // Try to extract opening from PGN if the 'opening' field is missing or generic
      let openingName = game.opening;
      
      if (!openingName || openingName.toLowerCase().includes('unknown')) {
        openingName = this.extractOpeningFromPgn(game.pgn);
      }
      
      // If still no opening name, use ECO as a fallback or a default
      if (!openingName) {
        const eco = this.extractECO(game.pgn);
        openingName = eco ? `Opening ${eco}` : 'Unknown Opening';
      }

      const eco = this.extractECO(game.pgn) || '';
      
      if (!openingMap.has(openingName)) {
        openingMap.set(openingName, {
          eco,
          games: [],
          wins: 0,
          losses: 0,
          draws: 0,
          totalRating: 0,
        });
      }

      const opening = openingMap.get(openingName)!;
      opening.games.push(game);

      // Determine result from player's perspective
      const result = this.getPlayerResult(game);
      if (result === 'win') opening.wins++;
      else if (result === 'loss') opening.losses++;
      else if (result === 'draw') opening.draws++;

      // Add rating (average of both players)
      opening.totalRating += (game.white.rating + game.black.rating) / 2;
    }

    // Convert map to array of OpeningAnalysis
    const analyses: OpeningAnalysis[] = [];
    for (const [openingName, data] of openingMap.entries()) {
      const gamesPlayed = data.games.length;
      const successRate = this.calculateSuccessRate(data.wins, data.losses, data.draws);
      const averageRating = gamesPlayed > 0 ? data.totalRating / gamesPlayed : 0;

      analyses.push({
        openingName,
        eco: data.eco,
        gamesPlayed,
        wins: data.wins,
        losses: data.losses,
        draws: data.draws,
        successRate,
        averageRating,
        games: data.games,
      });
    }

    // Sort by games played (most frequent first)
    return analyses.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
  }

  private extractOpeningFromPgn(pgn: string | undefined): string {
    if (!pgn) return '';
    
    // Look for the [Opening "..."] tag in PGN
    const openingMatch = pgn.match(/\[Opening "(.*?)"\]/);
    if (openingMatch && openingMatch[1]) {
      return openingMatch[1];
    }
    
    // Fallback: look for [Variation "..."] and combine with ECO if possible
    const variationMatch = pgn.match(/\[Variation "(.*?)"\]/);
    if (variationMatch && variationMatch[1]) {
      const eco = this.extractECO(pgn);
      return eco ? `${eco}: ${variationMatch[1]}` : variationMatch[1];
    }
    
    return '';
  }

  /**
   * Calculates performance metrics for dashboard
   * Requirements: 10.1, 10.2
   */
  async calculatePerformanceMetrics(
    games: Game[],
    stats: PlayerStats | undefined,
    username: string
  ): Promise<PerformanceDashboard | null> {
    try {
      const safeStats = stats || {};
      const normalizedUsername = username.toLowerCase();
      const playerGames = games.filter(
        game =>
          (game.white?.username && game.white.username.toLowerCase() === normalizedUsername) ||
          (game.black?.username && game.black.username.toLowerCase() === normalizedUsername)
      );
      const totalGames = playerGames.length;
      const lastGameAt = playerGames.length > 0 ? Math.max(...playerGames.map(game => game.endTime)) : null;
      
      // Initialize metrics for each time control
      const timeControlData: Record<string, {
        games: number;
        wins: number;
        losses: number;
        draws: number;
        ratings: number[];
      }> = {
        bullet: { games: 0, wins: 0, losses: 0, draws: 0, ratings: [] },
        blitz: { games: 0, wins: 0, losses: 0, draws: 0, ratings: [] },
        rapid: { games: 0, wins: 0, losses: 0, draws: 0, ratings: [] },
        daily: { games: 0, wins: 0, losses: 0, draws: 0, ratings: [] },
      };
      const colorData = {
        white: { games: 0, wins: 0, losses: 0, draws: 0 },
        black: { games: 0, wins: 0, losses: 0, draws: 0 },
      };

      // Aggregate game results by time control
      for (const game of playerGames) {
        const timeControl = this.categorizeTimeControl(game.timeControl);
        const data = timeControlData[timeControl];
        const color = game.white.username.toLowerCase() === normalizedUsername ? 'white' : 'black';
        
        data.games++;
        colorData[color].games++;
        const result = this.getPlayerResult(game, normalizedUsername);
        if (result === 'win') data.wins++;
        else if (result === 'loss') {
          data.losses++;
        } else if (result === 'draw') {
          data.draws++;
        }
        if (result === 'win') colorData[color].wins++;
        else if (result === 'loss') colorData[color].losses++;
        else colorData[color].draws++;

        // Track rating for this game
        const playerRating = this.getPlayerRating(game, normalizedUsername);
        if (playerRating > 0) {
          data.ratings.push(playerRating);
        }
      }

      // Build time control metrics
      const byTimeControl = {
        bullet: this.buildTimeControlMetrics(timeControlData.bullet, safeStats.chess_bullet),
        blitz: this.buildTimeControlMetrics(timeControlData.blitz, safeStats.chess_blitz),
        rapid: this.buildTimeControlMetrics(timeControlData.rapid, safeStats.chess_rapid),
        daily: this.buildTimeControlMetrics(timeControlData.daily, safeStats.chess_daily),
      };

      // Calculate overall win rate
      const totalWins = Object.values(timeControlData).reduce((sum, tc) => sum + tc.wins, 0);
      const totalDraws = Object.values(timeControlData).reduce((sum, tc) => sum + tc.draws, 0);
      const totalLosses = Object.values(timeControlData).reduce((sum, tc) => sum + tc.losses, 0);
      const overallWinRate = totalGames > 0 
        ? this.calculateSuccessRate(totalWins, totalGames - totalWins - totalDraws, totalDraws)
        : 0;
      const drawRate = totalGames > 0 ? (totalDraws / totalGames) * 100 : 0;
      const lossRate = totalGames > 0 ? (totalLosses / totalGames) * 100 : 0;
      const whiteWinRate = colorData.white.games > 0
        ? this.calculateSuccessRate(colorData.white.wins, colorData.white.losses, colorData.white.draws)
        : 0;
      const blackWinRate = colorData.black.games > 0
        ? this.calculateSuccessRate(colorData.black.wins, colorData.black.losses, colorData.black.draws)
        : 0;

      // Find strongest and weakest time controls
      const timeControls = Object.entries(byTimeControl)
        .filter(([_, metrics]) => metrics.games > 0)
        .sort((a, b) => b[1].winRate - a[1].winRate);
      
      const strongestTimeControl = timeControls[0]?.[0] || 'none';
      const weakestTimeControl = timeControls[timeControls.length - 1]?.[0] || 'none';

      // Build rating trend
      const ratingTrend = this.buildRatingTrend(playerGames, normalizedUsername);
      const rapidGames = timeControlData.rapid.games;
      const blitzGames = timeControlData.blitz.games;
      const bulletGames = timeControlData.bullet.games;
      const dailyGames = timeControlData.daily.games;
      const topOpenings = await this.buildTopOpenings(playerGames);
      const skillScores = this.buildSkillScores(
        playerGames,
        topOpenings,
        totalWins,
        totalDraws,
        totalLosses
      );

      return {
        totalGames,
        totalWins,
        lastGameAt,
        rapidGames,
        blitzGames,
        bulletGames,
        dailyGames,
        overallWinRate,
        whiteWinRate,
        blackWinRate,
        drawRate,
        lossRate,
        byTimeControl,
        strongestTimeControl,
        weakestTimeControl,
        ratingTrend,
        topOpenings,
        skillScores,
      };
    } catch (error) {
      console.error('Error in calculatePerformanceMetrics:', error);
      return null;
    }
  }

  /**
   * Analyzes games by phase (opening, middlegame, endgame)
   * Requirements: 11.1, 11.2
   */
  async analyzeGamePhases(games: Game[]): Promise<PhaseAnalysis> {
    const phaseData = {
      opening: { decided: 0, wins: 0, games: [] as Game[] },
      middlegame: { decided: 0, wins: 0, games: [] as Game[] },
      endgame: { decided: 0, wins: 0, games: [] as Game[] },
    };

    for (const game of games) {
      const phase = this.categorizeGamePhase(game);
      const result = this.getPlayerResult(game);
      
      phaseData[phase].decided++;
      if (result === 'win') phaseData[phase].wins++;
      
      // Store up to 5 example games per phase
      if (phaseData[phase].games.length < 5) {
        phaseData[phase].games.push(game);
      }
    }

    return {
      openingPhase: this.buildPhaseStats(phaseData.opening),
      middlegamePhase: this.buildPhaseStats(phaseData.middlegame),
      endgamePhase: this.buildPhaseStats(phaseData.endgame),
    };
  }

  /**
   * Identifies common patterns and issues in gameplay
   * Requirements: 11.1, 11.2
   */
  async identifyPatterns(games: Game[]): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    // Pattern 1: Time pressure issues
    const timePressureGames = games.filter(game => 
      this.hasTimePressureIssue(game)
    );
    if (timePressureGames.length > games.length * 0.2) {
      patterns.push({
        type: 'time-pressure',
        description: 'Frequent losses due to time pressure',
        frequency: timePressureGames.length,
        severity: timePressureGames.length > games.length * 0.3 ? 'high' : 'medium',
        exampleGames: timePressureGames.slice(0, 3),
        recommendation: 'Practice faster decision-making and time management',
      });
    }

    // Pattern 2: Conversion rate issues
    const conversionIssues = this.analyzeConversionRate(games);
    if (conversionIssues.frequency > 0) {
      patterns.push(conversionIssues);
    }

    // Pattern 3: Opening weaknesses
    const openingWeaknesses = await this.findOpeningWeaknesses(games);
    if (openingWeaknesses) {
      patterns.push(openingWeaknesses);
    }

    // Pattern 4: Endgame issues
    const endgameIssues = this.analyzeEndgamePerformance(games);
    if (endgameIssues.frequency > 0) {
      patterns.push(endgameIssues);
    }

    return patterns;
  }

  /**
   * Generates AI-powered improvement suggestions based on game analysis
   * Requirements: 11.3, 11.4
   */
  async generateImprovementSuggestions(
    games: Game[],
    phaseAnalysis: PhaseAnalysis,
    openingAnalysis: OpeningAnalysis[]
  ): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];

    // Check if AI service is configured
    if (!openRouterService.isConfigured()) {
      console.warn('OpenRouter API key not configured. Returning fallback suggestions.');
      return this.getFallbackSuggestions(games, phaseAnalysis, openingAnalysis);
    }

    try {
      // Analyze opening weaknesses
      const openingSuggestion = await this.generateOpeningSuggestion(games, openingAnalysis);
      if (openingSuggestion) {
        suggestions.push(openingSuggestion);
      }

      // Analyze middlegame patterns
      const middlegameSuggestion = await this.generateMiddlegameSuggestion(games, phaseAnalysis);
      if (middlegameSuggestion) {
        suggestions.push(middlegameSuggestion);
      }

      // Analyze endgame issues
      const endgameSuggestion = await this.generateEndgameSuggestion(games, phaseAnalysis);
      if (endgameSuggestion) {
        suggestions.push(endgameSuggestion);
      }

      // Analyze time management
      const timeManagementSuggestion = await this.generateTimeManagementSuggestion(games);
      if (timeManagementSuggestion) {
        suggestions.push(timeManagementSuggestion);
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      // Return fallback suggestions on error
      return this.getFallbackSuggestions(games, phaseAnalysis, openingAnalysis);
    }
  }

  // Helper methods

  private extractECO(pgn: string | undefined): string {
    if (!pgn) return '';
    const match = pgn.match(/\[ECO "(.*?)"\]/);
    return match ? match[1] : '';
  }

  private getPlayerResult(game: Game, username?: string): 'win' | 'loss' | 'draw' {
    const normalizedUsername = (username || '').toLowerCase();
    const isWhite = game.white.username.toLowerCase() === normalizedUsername || 
                   (game.pgn && game.pgn.includes(`[White "${username}"]`));
    
    const result = isWhite ? game.white.result : game.black.result;
    
    if (['win', 'checkmated'].includes(result)) return isWhite ? 'win' : 'loss';
    if (['resigned', 'timeout', 'abandoned'].includes(result)) return 'loss';
    if (['repetition', 'stalemate', 'insufficient', '50move', 'draw'].includes(result)) return 'draw';
    
    return 'loss'; // Default to loss for other result types
  }

  private getPlayerRating(game: Game, username?: string): number {
    if (username) {
      const normalizedUsername = username.toLowerCase();
      const isWhite = game.white.username.toLowerCase() === normalizedUsername;
      return isWhite ? game.white.rating : game.black.rating;
    }

    return game.white.rating;
  }

  private calculateSuccessRate(wins: number, losses: number, draws: number): number {
    const total = wins + losses + draws;
    if (total === 0) return 0;
    return ((wins + 0.5 * draws) / total) * 100;
  }

  private categorizeTimeControl(timeControl: string | undefined): 'bullet' | 'blitz' | 'rapid' | 'daily' {
    if (!timeControl) return 'daily';
    // Parse time control string (e.g., "600" for 10 minutes, "180+2" for 3 min + 2 sec)
    const baseTime = parseInt(timeControl.split('+')[0] || '0');
    
    if (baseTime === 0 || timeControl.includes('/')) return 'daily';
    if (baseTime < 180) return 'bullet';
    if (baseTime < 600) return 'blitz';
    return 'rapid';
  }

  private buildTimeControlMetrics(
    data: { games: number; wins: number; losses: number; draws: number; ratings: number[] },
    statsData?: any
  ): TimeControlMetrics {
    const winRate = data.games > 0 
      ? this.calculateSuccessRate(data.wins, data.losses, data.draws)
      : 0;
    
    const currentRating = statsData?.last?.rating || 0;

    return {
      games: data.games,
      wins: data.wins,
      losses: data.losses,
      draws: data.draws,
      winRate,
      currentRating,
    };
  }

  private buildRatingTrend(games: Game[], username?: string): RatingDataPoint[] {
    const dataPoints: RatingDataPoint[] = [];
    
    // Sort games by time
    const sortedGames = [...games].sort((a, b) => a.endTime - b.endTime);
    
    // Sample games to create trend (max 50 points)
    const step = Math.max(1, Math.floor(sortedGames.length / 50));
    
    for (let i = 0; i < sortedGames.length; i += step) {
      const game = sortedGames[i];
      dataPoints.push({
        date: game.endTime,
        rating: this.getPlayerRating(game, username),
        timeControl: this.categorizeTimeControl(game.timeControl),
      });
    }

    return dataPoints;
  }

  private categorizeGamePhase(game: Game): 'opening' | 'middlegame' | 'endgame' {
    if (!game.pgn) return 'middlegame';
    // Count moves in PGN
    const moves = game.pgn.split(/\d+\./).filter(m => m.trim()).length;
    
    if (moves < 15) return 'opening';
    if (moves < 40) return 'middlegame';
    return 'endgame';
  }

  private buildPhaseStats(data: { decided: number; wins: number; games: Game[] }): PhaseStats {
    const winRate = data.decided > 0 ? (data.wins / data.decided) * 100 : 0;
    
    return {
      gamesDecided: data.decided,
      winRate,
      commonPatterns: [], // Would be populated with more sophisticated analysis
      exampleGames: data.games,
    };
  }

  private hasTimePressureIssue(game: Game): boolean {
    // Check if game ended in timeout
    return game.white.result === 'timeout' || game.black.result === 'timeout';
  }

  private analyzeConversionRate(games: Game[]): Pattern {
    // Simplified: look for games where player had advantage but didn't convert
    const conversionIssues = games.filter(game => {
      const result = this.getPlayerResult(game);
      const phase = this.categorizeGamePhase(game);
      // If game went to endgame and we didn't win, it might be a conversion issue
      return phase === 'endgame' && result !== 'win';
    });

    return {
      type: 'conversion-rate',
      description: 'Difficulty converting advantages in endgames',
      frequency: conversionIssues.length,
      severity: conversionIssues.length > games.length * 0.3 ? 'high' : 'low',
      exampleGames: conversionIssues.slice(0, 3),
      recommendation: 'Study endgame techniques and practice converting winning positions',
    };
  }

  private async findOpeningWeaknesses(games: Game[]): Promise<Pattern | null> {
    const openingAnalysis = await this.analyzeOpenings(games);
    const weakOpenings = openingAnalysis.filter(
      opening => opening.gamesPlayed >= 3 && opening.successRate < 45
    );

    if (weakOpenings.length === 0) return null;

    const worstOpening = weakOpenings.sort((a, b) => a.successRate - b.successRate)[0];
 
     return {
       type: 'opening-weakness',
       description: `Low success rate with ${worstOpening.openingName}`,
       frequency: worstOpening.gamesPlayed,
       severity: worstOpening.successRate < 35 ? 'high' : 'medium',
       exampleGames: worstOpening.games.slice(0, 3),
       recommendation: `Review theoretical lines for ${worstOpening.openingName} or try an alternative.`,
     };
   }

  private analyzeEndgamePerformance(games: Game[]): Pattern {
    const endgameGames = games.filter(game => this.categorizeGamePhase(game) === 'endgame');
    const losses = endgameGames.filter(game => this.getPlayerResult(game) === 'loss').length;

    return {
      type: 'endgame-issue',
      description: 'Struggles in late-game transitions',
      frequency: losses,
      severity: losses > endgameGames.length * 0.5 ? 'high' : 'medium',
      exampleGames: endgameGames.filter(game => this.getPlayerResult(game) === 'loss').slice(0, 3),
      recommendation: 'Study basic endgame patterns and conversion techniques.',
    };
  }

  // AI-powered suggestion generation helpers

  private async generateOpeningSuggestion(
    games: Game[],
    openingAnalysis: OpeningAnalysis[]
  ): Promise<ImprovementSuggestion | null> {
    // Find weak openings (low success rate, played frequently)
    const weakOpenings = openingAnalysis.filter(
      opening => opening.gamesPlayed >= 3 && opening.successRate < 45
    );

    if (weakOpenings.length === 0) return null;

    const worstOpening = weakOpenings.sort((a, b) => a.successRate - b.successRate)[0];
    const weakOpeningGames = worstOpening.games.slice(0, 5);
    const commonLines = this.extractCommonOpeningLines(weakOpeningGames);
    
    const prompt = `Analyze this chess opening performance:
Opening: ${worstOpening.openingName}
Games Played: ${worstOpening.gamesPlayed}
Win Rate: ${worstOpening.successRate.toFixed(1)}%
Record: ${worstOpening.wins}W-${worstOpening.losses}L-${worstOpening.draws}D
Common early lines:
${commonLines.length > 0 ? commonLines.map((line, index) => `${index + 1}. ${line}`).join('\n') : 'No stable line pattern found'}

Provide a brief, actionable insight (2-3 sentences) about why this opening might be underperforming.
Then provide:
1) A specific recommendation for improvement
2) 2-3 "watch out for" tactical/positional motifs in this opening.`;

    const systemPrompt = 'You are a chess coach analyzing player performance. Provide concise, actionable advice.';

    try {
      const aiResponse = await openRouterService.generateCompletion(prompt, systemPrompt);
      const parsed = this.parseAISuggestion(aiResponse);

      return {
        category: 'opening',
        priority: worstOpening.successRate < 35 ? 'high' : 'medium',
        insight: parsed.insight || `Your ${worstOpening.openingName} has a ${worstOpening.successRate.toFixed(1)}% success rate across ${worstOpening.gamesPlayed} games.`,
        recommendation:
          parsed.recommendation ||
          `Study ${worstOpening.openingName} move-order traps and recurring middlegame plans. Watch out for early tactical shots on your king and central pawn breaks that punish slow development.`,
        supportingData: {
          gamesAffected: worstOpening.gamesPlayed,
          impactOnWinRate: this.calculateImpact(worstOpening.gamesPlayed, games.length),
        },
      };
    } catch (error) {
      console.error('Error generating opening suggestion:', error);
      return null;
    }
  }

  private async generateMiddlegameSuggestion(
    games: Game[],
    phaseAnalysis: PhaseAnalysis
  ): Promise<ImprovementSuggestion | null> {
    const middlegameWinRate = phaseAnalysis.middlegamePhase.winRate;
    const middlegameGames = phaseAnalysis.middlegamePhase.gamesDecided;

    if (middlegameGames < 5 || middlegameWinRate > 50) return null;

    const prompt = `Analyze this chess middlegame performance:
Games Decided in Middlegame: ${middlegameGames}
Win Rate: ${middlegameWinRate.toFixed(1)}%

Provide a brief insight (2-3 sentences) about common middlegame weaknesses and a specific recommendation for improvement.`;

    const systemPrompt = 'You are a chess coach analyzing player performance. Provide concise, actionable advice.';

    try {
      const aiResponse = await openRouterService.generateCompletion(prompt, systemPrompt);
      const parsed = this.parseAISuggestion(aiResponse);

      return {
        category: 'middlegame',
        priority: middlegameWinRate < 40 ? 'high' : 'medium',
        insight: parsed.insight || `Your middlegame win rate is ${middlegameWinRate.toFixed(1)}% across ${middlegameGames} games.`,
        recommendation: parsed.recommendation || 'Focus on improving tactical awareness and positional understanding in the middlegame.',
        supportingData: {
          gamesAffected: middlegameGames,
          impactOnWinRate: this.calculateImpact(middlegameGames, games.length),
        },
      };
    } catch (error) {
      console.error('Error generating middlegame suggestion:', error);
      return null;
    }
  }

  private async generateEndgameSuggestion(
    games: Game[],
    phaseAnalysis: PhaseAnalysis
  ): Promise<ImprovementSuggestion | null> {
    const endgameWinRate = phaseAnalysis.endgamePhase.winRate;
    const endgameGames = phaseAnalysis.endgamePhase.gamesDecided;

    if (endgameGames < 5 || endgameWinRate > 50) return null;

    const prompt = `Analyze this chess endgame performance:
Games Decided in Endgame: ${endgameGames}
Win Rate: ${endgameWinRate.toFixed(1)}%

Provide a brief insight (2-3 sentences) about common endgame weaknesses and a specific recommendation for improvement.`;

    const systemPrompt = 'You are a chess coach analyzing player performance. Provide concise, actionable advice.';

    try {
      const aiResponse = await openRouterService.generateCompletion(prompt, systemPrompt);
      const parsed = this.parseAISuggestion(aiResponse);

      return {
        category: 'endgame',
        priority: endgameWinRate < 40 ? 'high' : 'medium',
        insight: parsed.insight || `Your endgame win rate is ${endgameWinRate.toFixed(1)}% across ${endgameGames} games.`,
        recommendation: parsed.recommendation || 'Study fundamental endgame patterns and practice converting winning positions.',
        supportingData: {
          gamesAffected: endgameGames,
          impactOnWinRate: this.calculateImpact(endgameGames, games.length),
        },
      };
    } catch (error) {
      console.error('Error generating endgame suggestion:', error);
      return null;
    }
  }

  private async generateTimeManagementSuggestion(
    games: Game[]
  ): Promise<ImprovementSuggestion | null> {
    const timeoutGames = games.filter(game => 
      game.white.result === 'timeout' || game.black.result === 'timeout'
    );

    if (timeoutGames.length < games.length * 0.15) return null;

    const prompt = `Analyze this time management issue:
Total Games: ${games.length}
Games Lost on Time: ${timeoutGames.length}
Percentage: ${((timeoutGames.length / games.length) * 100).toFixed(1)}%

Provide a brief insight (2-3 sentences) about time management issues and a specific recommendation for improvement.`;

    const systemPrompt = 'You are a chess coach analyzing player performance. Provide concise, actionable advice.';

    try {
      const aiResponse = await openRouterService.generateCompletion(prompt, systemPrompt);
      const parsed = this.parseAISuggestion(aiResponse);

      return {
        category: 'time-management',
        priority: timeoutGames.length > games.length * 0.25 ? 'high' : 'medium',
        insight: parsed.insight || `You've lost ${timeoutGames.length} games (${((timeoutGames.length / games.length) * 100).toFixed(1)}%) on time.`,
        recommendation: parsed.recommendation || 'Practice playing faster and develop a better sense of time allocation per move.',
        supportingData: {
          gamesAffected: timeoutGames.length,
          impactOnWinRate: this.calculateImpact(timeoutGames.length, games.length),
        },
      };
    } catch (error) {
      console.error('Error generating time management suggestion:', error);
      return null;
    }
  }

  private parseAISuggestion(aiResponse: string): { insight: string; recommendation: string } {
    if (!aiResponse) {
      return { insight: '', recommendation: '' };
    }
    // Try to parse structured response
    // Expected format: insight followed by recommendation
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    if (lines.length >= 2) {
      // Try to find insight and recommendation sections
      let insight = '';
      let recommendation = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('insight') || line.includes('analysis')) {
          insight = lines[i + 1] || lines[i];
        } else if (line.includes('recommendation') || line.includes('suggest')) {
          recommendation = lines[i + 1] || lines[i];
        }
      }

      // If structured parsing failed, split response in half
      if (!insight || !recommendation) {
        const midpoint = Math.floor(lines.length / 2);
        insight = lines.slice(0, midpoint).join(' ');
        recommendation = lines.slice(midpoint).join(' ');
      }

      return {
        insight: insight.replace(/^(insight|analysis):/i, '').trim(),
        recommendation: recommendation.replace(/^(recommendation|suggest):/i, '').trim(),
      };
    }

    // Fallback: use entire response as insight
    return {
      insight: aiResponse,
      recommendation: '',
    };
  }

  private calculateImpact(gamesAffected: number, totalGames: number): number {
    if (totalGames === 0) return 0;
    return (gamesAffected / totalGames) * 100;
  }

  private extractCommonOpeningLines(games: Game[]): string[] {
    const lineCount = new Map<string, number>();

    for (const game of games) {
      const line = this.extractOpeningLineFromPgn(game.pgn);
      if (!line) continue;
      lineCount.set(line, (lineCount.get(line) || 0) + 1);
    }

    return Array.from(lineCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([line]) => line);
  }

  private extractOpeningLineFromPgn(pgn: string | undefined): string {
    if (!pgn) return '';
    const cleaned = pgn
      .replace(/\{[^}]*\}/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\d+\.(\.\.)?/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return '';

    const tokens = cleaned
      .split(' ')
      .filter(token => token && !['1-0', '0-1', '1/2-1/2', '*'].includes(token));

    return tokens.slice(0, 8).join(' ');
  }

  private async buildTopOpenings(games: Game[]): Promise<Array<{
    openingName: string;
    eco: string;
    games: number;
    winRate: number;
  }>> {
    const openings = await this.analyzeOpenings(games);
    const byFrequency = openings
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
      .slice(0, 5)
      .map(opening => ({
        openingName: opening.openingName,
        eco: opening.eco,
        games: opening.gamesPlayed,
        winRate: opening.successRate,
      }));

    return byFrequency;
  }

  private buildSkillScores(
    games: Game[],
    openings: Array<{ winRate: number }>,
    totalWins: number,
    totalDraws: number,
    totalLosses: number
  ): Array<{
    key: 'opening' | 'tactics' | 'ending' | 'advantageCapitalization' | 'resourcefulness' | 'timeManagement';
    label: string;
    score: number;
  }> {
    const totalGames = games.length || 1;
    const timeoutGames = games.filter(game => game.white.result === 'timeout' || game.black.result === 'timeout').length;
    const timeoutRate = timeoutGames / totalGames;
    const endgameGames = games.filter(game => this.categorizeGamePhase(game) === 'endgame').length;
    const openingScore = openings.length > 0
      ? openings.reduce((sum, opening) => sum + opening.winRate, 0) / openings.length
      : 50;
    const tacticsScore = Math.max(15, Math.min(95, ((totalWins + 0.5 * totalDraws) / totalGames) * 100));
    const endingScore = Math.max(15, Math.min(95, (endgameGames / totalGames) * 100 + 30));
    const advantageCapitalization = Math.max(15, Math.min(95, (totalWins / totalGames) * 120));
    const resourcefulness = Math.max(10, Math.min(90, ((totalDraws + Math.max(0, totalWins - totalLosses * 0.5)) / totalGames) * 100));
    const timeManagement = Math.max(10, Math.min(95, (1 - timeoutRate) * 100));

    return [
      { key: 'opening', label: 'Opening', score: Math.round(openingScore) },
      { key: 'tactics', label: 'Tactics', score: Math.round(tacticsScore) },
      { key: 'ending', label: 'Ending', score: Math.round(endingScore) },
      {
        key: 'advantageCapitalization',
        label: 'Advantage Capitalization',
        score: Math.round(advantageCapitalization),
      },
      { key: 'resourcefulness', label: 'Resourcefulness', score: Math.round(resourcefulness) },
      { key: 'timeManagement', label: 'Time Management', score: Math.round(timeManagement) },
    ];
  }

  private getFallbackSuggestions(
    games: Game[],
    phaseAnalysis: PhaseAnalysis,
    openingAnalysis: OpeningAnalysis[]
  ): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Fallback opening suggestion
    const weakOpenings = openingAnalysis.filter(
      opening => opening.gamesPlayed >= 3 && opening.successRate < 45
    );
    if (weakOpenings.length > 0) {
      const worstOpening = weakOpenings.sort((a, b) => a.successRate - b.successRate)[0];
      suggestions.push({
        category: 'opening',
        priority: worstOpening.successRate < 35 ? 'high' : 'medium',
        insight: `Your ${worstOpening.openingName} has a ${worstOpening.successRate.toFixed(1)}% success rate across ${worstOpening.gamesPlayed} games.`,
        recommendation: `Consider studying ${worstOpening.openingName} theory or switching to a different opening system.`,
        supportingData: {
          gamesAffected: worstOpening.gamesPlayed,
          impactOnWinRate: this.calculateImpact(worstOpening.gamesPlayed, games.length),
        },
      });
    }

    // Fallback middlegame suggestion
    if (phaseAnalysis.middlegamePhase.gamesDecided >= 5 && phaseAnalysis.middlegamePhase.winRate < 50) {
      suggestions.push({
        category: 'middlegame',
        priority: phaseAnalysis.middlegamePhase.winRate < 40 ? 'high' : 'medium',
        insight: `Your middlegame win rate is ${phaseAnalysis.middlegamePhase.winRate.toFixed(1)}% across ${phaseAnalysis.middlegamePhase.gamesDecided} games.`,
        recommendation: 'Focus on improving tactical awareness and positional understanding in the middlegame.',
        supportingData: {
          gamesAffected: phaseAnalysis.middlegamePhase.gamesDecided,
          impactOnWinRate: this.calculateImpact(phaseAnalysis.middlegamePhase.gamesDecided, games.length),
        },
      });
    }

    // Fallback endgame suggestion
    if (phaseAnalysis.endgamePhase.gamesDecided >= 5 && phaseAnalysis.endgamePhase.winRate < 50) {
      suggestions.push({
        category: 'endgame',
        priority: phaseAnalysis.endgamePhase.winRate < 40 ? 'high' : 'medium',
        insight: `Your endgame win rate is ${phaseAnalysis.endgamePhase.winRate.toFixed(1)}% across ${phaseAnalysis.endgamePhase.gamesDecided} games.`,
        recommendation: 'Study fundamental endgame patterns and practice converting winning positions.',
        supportingData: {
          gamesAffected: phaseAnalysis.endgamePhase.gamesDecided,
          impactOnWinRate: this.calculateImpact(phaseAnalysis.endgamePhase.gamesDecided, games.length),
        },
      });
    }

    return suggestions;
  }
}

export default new AnalyticsService();
