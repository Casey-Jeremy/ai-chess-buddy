import React from 'react';
import { View, Text } from 'react-native';

interface ChessBoardProps {
  fen?: string;
  size?: number;
  className?: string;
}

/**
 * Simple ChessBoard component for displaying final board positions
 * This is a placeholder implementation that shows the FEN string
 * In a production app, you would integrate react-native-chess-board or similar
 */
export default function ChessBoard({ fen, size = 300, className = '' }: ChessBoardProps) {
  // Parse FEN to display a simple board representation
  const renderBoard = () => {
    if (!fen) {
      return (
        <Text className="text-gray-600 text-center">
          No board position available
        </Text>
      );
    }

    // Extract the board part from FEN (first part before space)
    const boardPart = fen.split(' ')[0];
    const ranks = boardPart.split('/');

    return (
      <View className="border-2 border-gray-800">
        {ranks.map((rank, rankIndex) => {
          const squares = [];
          let fileIndex = 0;

          for (const char of rank) {
            if (char >= '1' && char <= '8') {
              // Empty squares
              const emptyCount = parseInt(char);
              for (let i = 0; i < emptyCount; i++) {
                const isLight = (rankIndex + fileIndex) % 2 === 0;
                squares.push(
                  <View
                    key={`${rankIndex}-${fileIndex}`}
                    className={`flex-1 aspect-square justify-center items-center ${
                      isLight ? 'bg-amber-100' : 'bg-amber-700'
                    }`}
                  />
                );
                fileIndex++;
              }
            } else {
              // Piece
              const isLight = (rankIndex + fileIndex) % 2 === 0;
              const pieceSymbol = getPieceSymbol(char);
              squares.push(
                <View
                  key={`${rankIndex}-${fileIndex}`}
                  className={`flex-1 aspect-square justify-center items-center ${
                    isLight ? 'bg-amber-100' : 'bg-amber-700'
                  }`}
                >
                  <Text className="text-2xl">{pieceSymbol}</Text>
                </View>
              );
              fileIndex++;
            }
          }

          return (
            <View key={rankIndex} className="flex-row">
              {squares}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View className={`${className}`} style={{ width: size, height: size }}>
      {renderBoard()}
    </View>
  );
}

/**
 * Convert FEN piece notation to Unicode chess symbols
 */
function getPieceSymbol(piece: string): string {
  const pieces: { [key: string]: string } = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
  };
  return pieces[piece] || piece;
}
