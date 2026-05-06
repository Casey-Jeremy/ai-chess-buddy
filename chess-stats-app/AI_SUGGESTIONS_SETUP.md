# AI-Powered Improvement Suggestions Setup

This document explains how to set up and use the AI-powered improvement suggestions feature in the Chess Stats App.

## Overview

The app uses OpenRouter's free AI models to generate personalized chess improvement suggestions based on your game history. The AI analyzes:

- Opening weaknesses and success rates
- Middlegame tactical patterns
- Endgame conversion rates
- Time management issues

## Setup

### 1. Get an OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Navigate to your API keys section
4. Create a new API key

### 2. Configure the App

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your OpenRouter API key to `.env`:
   ```
   EXPO_PUBLIC_OPENROUTER_API_KEY=your_actual_api_key_here
   ```

### 3. Restart the App

After adding the API key, restart your Expo development server:

```bash
npm start
```

## Usage

The AI-powered suggestions are automatically generated when you view your analytics. The `AnalyticsService.generateImprovementSuggestions()` method is called with:

- Your game history
- Phase analysis (opening, middlegame, endgame)
- Opening analysis

### Example Usage

```typescript
import analyticsService from './services/AnalyticsService';

// Fetch your games and stats
const games = await chessComApiService.getMonthlyArchive(username, year, month);
const stats = await chessComApiService.getPlayerStats(username);

// Analyze games
const phaseAnalysis = await analyticsService.analyzeGamePhases(games);
const openingAnalysis = await analyticsService.analyzeOpenings(games);

// Generate AI-powered suggestions
const suggestions = await analyticsService.generateImprovementSuggestions(
  games,
  phaseAnalysis,
  openingAnalysis
);

// Display suggestions to user
suggestions.forEach(suggestion => {
  console.log(`Category: ${suggestion.category}`);
  console.log(`Priority: ${suggestion.priority}`);
  console.log(`Insight: ${suggestion.insight}`);
  console.log(`Recommendation: ${suggestion.recommendation}`);
});
```

## Fallback Behavior

If the OpenRouter API key is not configured or if the API call fails, the app will automatically fall back to rule-based suggestions. These fallback suggestions are still useful but less personalized than AI-generated ones.

## Free Tier Limitations

OpenRouter's free tier uses the `openrouter/auto:free` model, which:

- Routes to available free models
- May have rate limits
- May have slower response times during peak usage

For production use, consider upgrading to a paid plan for more reliable service.

## Troubleshooting

### API Key Not Working

1. Verify the API key is correctly copied to `.env`
2. Ensure there are no extra spaces or quotes around the key
3. Restart the Expo development server
4. Check the console for error messages

### No Suggestions Generated

1. Ensure you have enough game history (at least 5-10 games)
2. Check that the games have proper opening and phase data
3. Look for console warnings about API configuration

### Rate Limiting

If you encounter rate limiting:

1. Wait a few minutes before trying again
2. Consider caching suggestions to reduce API calls
3. Upgrade to a paid OpenRouter plan for higher limits

## Privacy

All game data sent to OpenRouter is:

- Aggregated statistics only (no PGN or move-by-move data)
- Used only for generating suggestions
- Not stored by OpenRouter (per their privacy policy)

## Support

For issues with:

- OpenRouter API: Visit [OpenRouter Support](https://openrouter.ai/docs)
- Chess Stats App: Open an issue in the project repository
