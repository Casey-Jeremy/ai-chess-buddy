# AI Chess Buddy ♟️

AI Chess Buddy is a modern, premium mobile application built with React Native and Expo that helps chess players analyze their performance on Chess.com using AI-driven insights.

## 🌟 Features

- **Grandmaster Dashboard**: A high-contrast, professional overview of your chess performance, including win rates, rating trends, and game volume across different time controls.
- **AI Performance Insights**: Intelligent analysis of your games using LLMs (via OpenRouter) to identify strengths, weaknesses, and specific recommendations for improvement.
- **Opening Mastery**: Detailed analysis of your opening repertoire. Identify "Growth Areas" where your win rate is low and access curated learning resources from Chess.com, Lichess, and Chessable.
- **Visual Game Archives**: A modernized history of your games, sorted by date with visual result cues (trophies for wins, etc.) and detailed game summaries.
- **Interactive Game Details**: View specific game information, including move lists and final board positions using Chess.com's dynamic board API.
- **Offline Support**: Built-in offline indicators and caching to ensure you can view your stats even without an active internet connection.

## 🚀 Tech Stack

- **Framework**: React Native with Expo (Managed Workflow)
- **Navigation**: Expo Router (File-based routing)
- **State Management**: TanStack Query (React Query) for efficient data fetching and caching
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Icons**: Expo Vector Icons (MaterialCommunityIcons, Ionicons)
- **API**: Chess.com Public Data API
- **AI**: OpenRouter API for performance analysis

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo Go app on your mobile device (to preview)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Casey-Jeremy/ai-chess-buddy.git
   cd ai-chess-buddy
   ```

2. Install dependencies:
   ```bash
   cd chess-stats-app
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the `chess-stats-app` directory and add your OpenRouter API key:
   ```env
   EXPO_PUBLIC_OPENROUTER_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

5. Scan the QR code with the Expo Go app (Android) or Camera app (iOS) to run the app on your device.

## 📂 Project Structure

- `app/` — Main screens and navigation layouts (Expo Router)
- `components/` — Reusable UI components (MetricCards, Skeletons, etc.)
- `hooks/` — Custom React hooks for data fetching and logic
- `services/` — Core business logic, including API services and performance analytics
- `contexts/` — React Context providers for Auth and Network state
- `types/` — TypeScript interfaces and type definitions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
