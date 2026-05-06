# Chess.com API Reference

This document provides a comprehensive overview of the Chess.com Public API endpoints, indicating which ones are currently implemented in our chess stats app and which ones are available for future development.

## API Base URL
```
https://api.chess.com/pub
```

## Currently Implemented Endpoints ✅

### Player Endpoints

#### 1. Get Player Profile
- **Endpoint**: `/player/{username}`
- **Method**: `getPlayerProfile(username: string)`
- **Status**: ✅ **IMPLEMENTED**
- **Usage**: Used in `usePlayerProfile` hook
- **Description**: Fetches basic player information including username, avatar, country, join date, etc.
- **Response**: `PlayerProfile` type

#### 2. Get Player Statistics
- **Endpoint**: `/player/{username}/stats`
- **Method**: `getPlayerStats(username: string)`
- **Status**: ✅ **IMPLEMENTED**
- **Usage**: Used in `usePlayerStats` hook
- **Description**: Fetches player statistics for all game types (bullet, blitz, rapid, daily)
- **Response**: `PlayerStats` type

#### 3. Get Player Game Archives
- **Endpoint**: `/player/{username}/games/archives`
- **Method**: `getGameArchives(username: string)`
- **Status**: ✅ **IMPLEMENTED**
- **Usage**: Used in `useGameArchives` hook
- **Description**: Returns list of monthly archive URLs for a player's games
- **Response**: Array of archive URLs

#### 4. Get Monthly Game Archive
- **Endpoint**: `/player/{username}/games/{YYYY}/{MM}`
- **Method**: `getMonthlyArchive(username: string, year: number, month: number)`
- **Status**: ✅ **IMPLEMENTED**
- **Usage**: Used in `useMonthlyArchive` and `useRecentGames` hooks
- **Description**: Fetches all games for a specific month
- **Response**: Array of `Game` objects

#### 5. Get Current Games
- **Endpoint**: `/player/{username}/games`
- **Method**: `getPlayerGames(username: string)`
- **Status**: ✅ **IMPLEMENTED**
- **Usage**: Used in `useCurrentGames` hook
- **Description**: Fetches current/ongoing games for a player
- **Response**: Object with games array

#### 6. Get Games To Move
- **Endpoint**: `/player/{username}/games/to-move`
- **Method**: `getPlayerGamesToMove(username: string)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches games where it's the player's turn to move
- **Response**: Object with games array

#### 7. Get Monthly Archive PGN
- **Endpoint**: `/player/{username}/games/{YYYY}/{MM}/pgn`
- **Method**: `getMonthlyArchivePgn(username: string, year: number, month: number)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches PGN format of all games for a specific month
- **Response**: Raw PGN string

#### 8. Get Player Clubs
- **Endpoint**: `/player/{username}/clubs`
- **Method**: `getPlayerClubs(username: string)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches clubs that the player is a member of
- **Response**: Object with clubs array

#### 9. Get Player Tournaments
- **Endpoint**: `/player/{username}/tournaments`
- **Method**: `getPlayerTournaments(username: string)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches tournaments the player has participated in
- **Response**: Object with finished, in_progress, and registered arrays

### Other Implemented Endpoints

#### 10. Get Titled Players
- **Endpoint**: `/titled/{title}`
- **Method**: `getTitledPlayers(title: string)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches list of players with a specific title (GM, IM, FM, etc.)
- **Response**: Object with players array

#### 11. Get Club Profile
- **Endpoint**: `/club/{url-ID}`
- **Method**: `getClubProfile(clubSlug: string)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches club information
- **Response**: Club object

#### 12. Get Club Members
- **Endpoint**: `/club/{url-ID}/members`
- **Method**: `getClubMembers(clubSlug: string)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches list of club members
- **Response**: Members object

#### 13. Get Tournament
- **Endpoint**: `/tournament/{url-ID}`
- **Method**: `getTournament(tournamentId: string)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches tournament information
- **Response**: Tournament object

#### 14. Get Tournament Round
- **Endpoint**: `/tournament/{url-ID}/{round}`
- **Method**: `getTournamentRound(tournamentId: string, round: number)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches specific tournament round information
- **Response**: Round object

#### 15. Get Tournament Round Group
- **Endpoint**: `/tournament/{url-ID}/{round}/{group}`
- **Method**: `getTournamentRoundGroup(tournamentId: string, round: number, group: number)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches specific tournament round group information
- **Response**: Group object

#### 16. Get Team Match
- **Endpoint**: `/match/{id}`
- **Method**: `getTeamMatch(matchId: number)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches team match information
- **Response**: Match object

#### 17. Get Team Match Board
- **Endpoint**: `/match/{id}/{board}`
- **Method**: `getTeamMatchBoard(matchId: number, board: number)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches specific board information from a team match
- **Response**: Board object

#### 18. Get Country
- **Endpoint**: `/country/{iso}`
- **Method**: `getCountry(countryCode: string)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches country information
- **Response**: Country object

#### 19. Get Country Players
- **Endpoint**: `/country/{iso}/players`
- **Method**: `getCountryPlayers(countryCode: string)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches list of players from a specific country
- **Response**: Object with players array

#### 20. Get Country Clubs
- **Endpoint**: `/country/{iso}/clubs`
- **Method**: `getCountryClubs(countryCode: string)`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches list of clubs from a specific country
- **Response**: Object with clubs array

#### 21. Get Daily Puzzle
- **Endpoint**: `/puzzle`
- **Method**: `getDailyPuzzle()`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches the daily chess puzzle
- **Response**: Puzzle object

#### 22. Get Point System Config
- **Endpoint**: `https://api.chess-dev.com/pub/point-system-config`
- **Method**: `getPointSystemConfig()`
- **Status**: ✅ **IMPLEMENTED** (but not used in hooks)
- **Description**: Fetches point system configuration (development API)
- **Response**: Config object

## Available But Not Implemented Endpoints ❌

### Streamer Endpoints

#### 1. Get Streamers
- **Endpoint**: `/streamers`
- **Status**: ❌ **NOT IMPLEMENTED**
- **Description**: Fetches information about Chess.com streamers
- **Potential Use**: Could be used to show featured streamers or chess content

### Leaderboards

#### 2. Get Leaderboards
- **Endpoint**: `/leaderboards`
- **Status**: ❌ **NOT IMPLEMENTED**
- **Description**: Fetches current leaderboards for different categories
- **Potential Use**: Could show top players globally or by category

### Team Match Live

#### 3. Get Team Match Live
- **Endpoint**: `/match/live/{id}`
- **Status**: ❌ **NOT IMPLEMENTED**
- **Description**: Fetches live team match information
- **Potential Use**: Could show live team matches and updates

### Additional Player Endpoints

#### 4. Get Player Is-Online Status
- **Endpoint**: `/player/{username}/is-online`
- **Status**: ❌ **NOT IMPLEMENTED**
- **Description**: Checks if a player is currently online
- **Potential Use**: Could show online status in player profiles

## Implementation Status Summary

### Actively Used (9 endpoints)
These endpoints are implemented and actively used through React Query hooks:

1. ✅ Player Profile (`usePlayerProfile`)
2. ✅ Player Statistics (`usePlayerStats`)
3. ✅ Game Archives (`useGameArchives`)
4. ✅ Monthly Archive (`useMonthlyArchive`, `useRecentGames`)
5. ✅ Current Games (`useCurrentGames`)

### Implemented But Unused (17 endpoints)
These endpoints are implemented in the service but not used in the UI:

6. ✅ Games To Move
7. ✅ Monthly Archive PGN
8. ✅ Player Clubs
9. ✅ Player Tournaments
10. ✅ Titled Players
11. ✅ Club Profile
12. ✅ Club Members
13. ✅ Tournament
14. ✅ Tournament Round
15. ✅ Tournament Round Group
16. ✅ Team Match
17. ✅ Team Match Board
18. ✅ Country
19. ✅ Country Players
20. ✅ Country Clubs
21. ✅ Daily Puzzle
22. ✅ Point System Config

### Not Implemented (4+ endpoints)
These endpoints are available in the Chess.com API but not implemented:

1. ❌ Streamers
2. ❌ Leaderboards
3. ❌ Team Match Live
4. ❌ Player Is-Online Status

## Recommendations for Future Development

### High Priority
1. **Daily Puzzle Integration**: Already implemented but unused - could add a daily puzzle feature
2. **Player Clubs**: Show clubs the player belongs to in their profile
3. **Tournament History**: Display tournament participation and results
4. **Leaderboards**: Show global rankings and leaderboards

### Medium Priority
1. **Streamers**: Feature chess streamers and content
2. **Country Statistics**: Show country-based statistics and rankings
3. **Live Team Matches**: Display ongoing team competitions
4. **Online Status**: Show if players are currently online

### Low Priority
1. **PGN Export**: Allow users to download their games in PGN format
2. **Club Management**: Features for club members and administrators
3. **Tournament Details**: Deep dive into tournament structures and results

## Rate Limiting & Best Practices

The current implementation includes:
- ✅ Rate limiting (100ms minimum between requests)
- ✅ Request queuing to prevent concurrent API calls
- ✅ Exponential backoff retry logic
- ✅ Comprehensive error handling
- ✅ Caching with AsyncStorage
- ✅ Offline support with cached data

## API Response Caching Strategy

Current caching implementation:
- **Player Profile**: 24 hours cache
- **Player Statistics**: 24 hours cache
- **Game Archives**: 24 hours cache
- **Monthly Archives**: 24 hours cache
- **Recent Games**: 24 hours cache
- **Current Games**: 5 minutes cache
- **Analytics Data**: 24 hours cache

This caching strategy balances data freshness with API rate limits and provides excellent offline support.