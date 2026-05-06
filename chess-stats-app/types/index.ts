// User types
export interface User {
  id: string;
  email: string;
  chessComUsername: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Chess.com API types
export interface PlayerProfile {
  username: string;
  playerId: number;
  url: string;
  name?: string;
  avatar?: string;
  followers: number;
  country: string;
  joined: number;
  lastOnline: number;
  status: string;
}

export interface PlayerStats {
  chess_bullet?: GameTypeStats;
  chess_blitz?: GameTypeStats;
  chess_rapid?: GameTypeStats;
  chess_daily?: GameTypeStats;
}

export interface GameTypeStats {
  last: GameRecord;
  best: GameRecord;
  record: WinLossRecord;
}

export interface GameRecord {
  rating: number;
  date: number;
  gameId?: string;
}

export interface WinLossRecord {
  win: number;
  loss: number;
  draw: number;
}

export interface Game {
  url: string;
  pgn: string;
  timeControl: string;
  timeClass: string;
  rules: string;
  startTime?: number;
  endTime: number;
  rated: boolean;
  fen: string;
  white: PlayerGameInfo;
  black: PlayerGameInfo;
  opening?: string;
  eco?: string;
}

export interface PlayerGameInfo {
  username: string;
  rating: number;
  result: 'win' | 'loss' | 'draw' | 'resigned' | 'timeout' | 'abandoned';
}

// Analytics types
export interface OpeningAnalysis {
  openingName: string;
  eco: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  successRate: number;
  averageRating: number;
  games: Game[];
}

export interface PhaseAnalysis {
  openingPhase: PhaseStats;
  middlegamePhase: PhaseStats;
  endgamePhase: PhaseStats;
}

export interface PhaseStats {
  gamesDecided: number;
  winRate: number;
  commonPatterns: string[];
  exampleGames: Game[];
}

export interface PerformanceDashboard {
  totalGames: number;
  totalWins: number;
  lastGameAt: number | null;
  rapidGames: number;
  blitzGames: number;
  bulletGames: number;
  dailyGames: number;
  overallWinRate: number;
  whiteWinRate: number;
  blackWinRate: number;
  drawRate: number;
  lossRate: number;
  byTimeControl: {
    bullet: TimeControlMetrics;
    blitz: TimeControlMetrics;
    rapid: TimeControlMetrics;
    daily: TimeControlMetrics;
  };
  strongestTimeControl: string;
  weakestTimeControl: string;
  ratingTrend: RatingDataPoint[];
  topOpenings: OpeningPerformance[];
  skillScores: SkillScore[];
}

export interface TimeControlMetrics {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentRating: number;
}

export interface RatingDataPoint {
  date: number;
  rating: number;
  timeControl: string;
}

export interface OpeningPerformance {
  openingName: string;
  eco: string;
  games: number;
  winRate: number;
}

export interface SkillScore {
  key:
    | 'opening'
    | 'tactics'
    | 'ending'
    | 'advantageCapitalization'
    | 'resourcefulness'
    | 'timeManagement';
  label: string;
  score: number;
}

export interface Pattern {
  type: 'time-pressure' | 'conversion-rate' | 'opening-weakness' | 'endgame-issue';
  description: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  exampleGames: Game[];
  recommendation: string;
}

export interface ImprovementSuggestion {
  category: 'opening' | 'middlegame' | 'endgame' | 'time-management';
  priority: 'high' | 'medium' | 'low';
  insight: string;
  recommendation: string;
  supportingData: {
    gamesAffected: number;
    impactOnWinRate: number;
  };
}

// Cache types
export interface CachedData<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

// API Error types
export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  statusCode?: number;
}
