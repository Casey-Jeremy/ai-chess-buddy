import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, Dimensions } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import cacheService from '../../services/CacheService';
import { Game } from '../../types';
import ErrorMessage from '../../components/ErrorMessage';
import OfflineIndicator from '../../components/OfflineIndicator';
import { GameDetailSkeleton } from '../../components/SkeletonScreen';
import { Chess } from 'chess.js';

export default function GameDetailScreen() {
  const { user } = useAuth();
  const { isOffline } = useNetwork();
  const router = useRouter();
  const params = useLocalSearchParams();
  const gameId = params.id as string;

  // Fetch game details
  const { data: game, isLoading, error, refetch } = useQuery({
    queryKey: ['gameDetail', gameId],
    queryFn: async () => {
      if (!user?.chessComUsername) throw new Error('No Chess.com username linked');
      
      // Try cache first
      const cacheKey = `game_${gameId}`;
      const cached = await cacheService.get<Game>(cacheKey);
      if (cached && !cached.isStale) {
        return cached.data;
      }

      // For now, we need to fetch from archives since Chess.com doesn't have a direct game endpoint
      // This is a limitation - in a real app, we'd need to store game data or fetch from archives
      throw new Error('Game details not available. Please access games from the archives.');
    },
    enabled: !!user?.chessComUsername && !!gameId,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const handleRetry = () => {
    refetch();
  };

  if (!user?.chessComUsername) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Text className="text-xl font-semibold text-gray-800 mb-2">No Chess.com Account Linked</Text>
        <Text className="text-gray-600 text-center">
          Please link your Chess.com account to view game details
        </Text>
      </View>
    );
  }

  // Show skeleton screen on initial load
  // Requirements: 8.3
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Game Details',
            headerBackTitle: 'Back',
          }}
        />
        <ScrollView className="flex-1 bg-gray-50">
          <OfflineIndicator isVisible={isOffline} />
          <GameDetailSkeleton />
        </ScrollView>
      </>
    );
  }

  // Show error message with retry
  // Requirements: 2.5, 4.5
  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Game Details',
            headerBackTitle: 'Back',
          }}
        />
        <OfflineIndicator isVisible={isOffline} />
        <ErrorMessage
          error={error}
          onRetry={handleRetry}
        />
      </>
    );
  }

  if (!game) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Text className="text-xl font-semibold text-gray-800 mb-2">Game Not Found</Text>
        <Text className="text-gray-600 text-center">
          Unable to load game details
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Game Details',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView className="flex-1 bg-gray-50">
        <OfflineIndicator isVisible={isOffline} />
        <View className="p-4">
          <GameDetailContent game={game} currentUsername={user.chessComUsername!} />
        </View>
      </ScrollView>
    </>
  );
}

interface GameDetailContentProps {
  game: Game;
  currentUsername: string;
}

function GameDetailContent({ game, currentUsername }: GameDetailContentProps) {
  // Determine user color
  const userColor = game.white.username.toLowerCase() === currentUsername.toLowerCase() ? 'white' : 'black';
  const userPlayer = userColor === 'white' ? game.white : game.black;
  const opponentPlayer = userColor === 'white' ? game.black : game.white;

  // Format date
  const gameDate = game.endTime 
    ? new Date(game.endTime * 1000).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown Date';

  // Format time control
  const timeControl = formatTimeControl(game.timeControl);

  // Determine result
  const userResult = userPlayer.result;
  const isWin = userResult === 'win';
  const isDraw = ['repetition', 'stalemate', 'insufficient', '50move', 'draw'].includes(userResult);
  
  const resultText = isWin ? 'Victory' : isDraw ? 'Draw' : 'Defeat';
  const resultDetail = formatResultDetail(userResult);

  const resultColor = isWin ? '#10b981' : isDraw ? '#64748b' : '#ef4444';
  const resultBg = isWin ? 'bg-emerald-50' : isDraw ? 'bg-slate-50' : 'bg-rose-50';

  // Parse PGN for moves
  const moves = parsePGNMoves(game.pgn);

  return (
    <View>
      {/* Result Header */}
      <View className={`${resultBg} rounded-3xl p-8 mb-6 border border-slate-100 items-center justify-center`}>
        <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${isWin ? 'bg-emerald-100' : isDraw ? 'bg-slate-200' : 'bg-rose-100'}`}>
          <MaterialCommunityIcons
            name={isWin ? 'trophy' : isDraw ? 'equal' : 'close-circle'} 
            size={32} 
            color={resultColor} 
          />
        </View>
        <Text style={{ color: resultColor }} className="text-4xl font-black tracking-tight mb-1">
          {resultText}
        </Text>
        <Text className="text-slate-500 font-bold uppercase text-[10px] tracking-[2px]">
          {resultDetail}
        </Text>
        <Text className="text-slate-400 font-medium text-xs mt-4">{gameDate}</Text>
      </View>

      {/* Players Section */}
      <View className="mb-6">
        <Text className="text-xl font-black text-slate-900 mb-4 px-1">Players</Text>
        <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          {/* White Player */}
          <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-50">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
                <MaterialCommunityIcons name="circle-outline" size={24} color="#94a3b8" />
              </View>
              <View>
                <Text className="text-lg font-bold text-slate-900 leading-tight">
                  {game.white.username}
                </Text>
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  WHITE {userColor === 'white' && '• YOU'}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-xl font-black text-slate-900">{game.white.rating}</Text>
              <Text className="text-slate-400 text-[9px] font-bold uppercase">RATING</Text>
            </View>
          </View>

          {/* Black Player */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-slate-900 items-center justify-center mr-3">
                <MaterialCommunityIcons name="circle" size={24} color="#ffffff" />
              </View>
              <View>
                <Text className="text-lg font-bold text-slate-900 leading-tight">
                  {game.black.username}
                </Text>
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  BLACK {userColor === 'black' && '• YOU'}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-xl font-black text-slate-900">{game.black.rating}</Text>
              <Text className="text-slate-400 text-[9px] font-bold uppercase">RATING</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Game Info */}
      <View className="mb-6">
        <Text className="text-xl font-black text-slate-900 mb-4 px-1">Game Info</Text>
        <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <InfoRow label="Time Control" value={timeControl} icon="timer-outline" />
          <InfoRow label="Rated Game" value={game.rated ? 'Yes' : 'No'} icon="shield-check-outline" />
          {game.opening && !game.opening.toLowerCase().includes('unknown') ? (
            <InfoRow 
              label="Opening" 
              value={game.opening.split(':')[0]} 
              detail={game.opening.split(':')[1]?.trim()}
              icon="chess-pawn" 
            />
          ) : (
            <InfoRow 
              label="Opening" 
              value="Theory Unknown" 
              detail="This specific variation isn't in our database yet."
              icon="chess-pawn" 
            />
          )}
          <InfoRow label="Result Type" value={resultDetail} icon="flag-outline" />
        </View>
      </View>

      {/* Chess Board - Final Position */}
      <View className="mb-6">
        <Text className="text-xl font-black text-slate-900 mb-4 px-1">Final Position</Text>
        <View className="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm overflow-hidden">
          <ChessBoard pgn={game.pgn} />
        </View>
      </View>

      {/* Moves */}
      {moves.length > 0 && (
        <View className="mb-12">
          <Text className="text-xl font-black text-slate-900 mb-4 px-1">Move List</Text>
          <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <MoveList moves={moves} />
          </View>
        </View>
      )}
    </View>
  );
}

function formatResultDetail(result: string): string {
  const mapping: Record<string, string> = {
    'win': 'Checkmate',
    'checkmated': 'Checkmated',
    'resigned': 'Resignation',
    'timeout': 'Time Out',
    'abandoned': 'Abandoned',
    'repetition': 'Repetition',
    'stalemate': 'Stalemate',
    'insufficient': 'Insufficient Material',
    '50move': '50-Move Rule',
    'draw': 'Agreement',
  };
  return mapping[result] || result.charAt(0).toUpperCase() + result.slice(1);
}

interface InfoRowProps {
  label: string;
  value: string;
  detail?: string;
  icon: any;
}

function InfoRow({ label, value, detail, icon }: InfoRowProps) {
  return (
    <View className="flex-row items-center py-4 border-b border-slate-50 last:border-0">
      <View className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center mr-3">
        <MaterialCommunityIcons name={icon} size={18} color="#64748b" />
      </View>
      <View className="flex-1">
        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">{label}</Text>
        <Text className="text-slate-900 font-bold text-base mt-0.5">{value}</Text>
        {detail && <Text className="text-slate-500 text-xs font-medium mt-0.5">{detail}</Text>}
      </View>
    </View>
  );
}

interface MoveListProps {
  moves: string[];
}

function MoveList({ moves }: MoveListProps) {
  // Group moves into pairs (white, black)
  const movePairs: Array<{ number: number; white: string; black?: string }> = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <View>
      {movePairs.map((pair) => (
        <View key={pair.number} className="flex-row py-1">
          <Text className="text-gray-500 w-12">{pair.number}.</Text>
          <Text className="text-gray-900 flex-1">{pair.white}</Text>
          {pair.black && (
            <Text className="text-gray-900 flex-1">{pair.black}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

interface ChessBoardProps {
  pgn: string;
}

function ChessBoard({ pgn }: ChessBoardProps) {
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const screenWidth = Dimensions.get('window').width;
  const boardSize = Math.min(screenWidth - 32, 400);

  useEffect(() => {
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);
      setFen(chess.fen());
    } catch (error) {
      console.error('Error loading PGN:', error);
    }
  }, [pgn]);

  // Use Chess.com's board image API
  // Format: https://www.chess.com/dynboard?fen={FEN}&size=3
  const boardImageUrl = `https://www.chess.com/dynboard?fen=${encodeURIComponent(fen)}&size=3&coordinates=inside`;

  return (
    <View className="items-center">
      <Image
        source={{ uri: boardImageUrl }}
        style={{ width: boardSize, height: boardSize }}
        resizeMode="contain"
      />
      <Text className="text-gray-500 text-xs mt-2 text-center">
        Final board position
      </Text>
    </View>
  );
}

/**
 * Helper function to format time control for display
 */
function formatTimeControl(timeControl: string | undefined): string {
  if (!timeControl) return 'Unknown';
  
  if (timeControl.includes('/')) {
    // Daily format like "1/86400"
    return 'Daily';
  }
  
  const seconds = parseInt(timeControl);
  if (isNaN(seconds)) return timeControl;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (seconds < 180) return `Bullet (${minutes}+${remainingSeconds})`;
  if (seconds < 600) return `Blitz (${minutes}+${remainingSeconds})`;
  if (seconds < 1800) return `Rapid (${minutes}+${remainingSeconds})`;
  return `Classical (${minutes}+${remainingSeconds})`;
}

/**
 * Parse PGN to extract moves
 */
function parsePGNMoves(pgn: string): string[] {
  // Remove headers and metadata
  const lines = pgn.split('\n');
  const moveLines = lines.filter(line => !line.startsWith('[') && line.trim() !== '');
  const moveText = moveLines.join(' ');
  
  // Remove move numbers and result
  const cleanedText = moveText
    .replace(/\d+\./g, '') // Remove move numbers
    .replace(/\{[^}]*\}/g, '') // Remove comments
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, '') // Remove result
    .trim();
  
  // Split into individual moves
  const moves = cleanedText.split(/\s+/).filter(move => move.length > 0);
  
  return moves;
}
