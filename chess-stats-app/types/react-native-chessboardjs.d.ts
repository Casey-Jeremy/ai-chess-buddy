declare module 'react-native-chessboardjs' {
  import { Component, RefObject } from 'react';
  import { ViewStyle } from 'react-native';

  export interface ClearPremoves {
    clearPremoves: (clearLastPieceColour?: boolean) => void;
  }

  export type Square = string;
  export type Piece = string;

  export interface ChessBoardProps {
    ref?: RefObject<ClearPremoves>;
    boardOrientation?: 'white' | 'black';
    customDarkSquareStyle?: ViewStyle;
    customLightSquareStyle?: ViewStyle;
    customBoardStyle?: ViewStyle;
    customSquareStyles?: Record<string, ViewStyle>;
    position?: string;
    size?: { width: number; height?: number };
    onPress?: () => void;
    onPieceDrop: (sourceSquare: Square, targetSquare: Square, piece: Piece) => boolean;
    onSquareClick?: (square: Square) => boolean;
    onPromotionCheck?: (sourceSquare: Square, targetSquare: Square, piece: Piece) => boolean;
    isDraggablePiece?: (args: { piece: Piece }) => boolean;
    arePremovesAllowed?: boolean;
    whiteKingInCheck?: boolean;
    blackKingInCheck?: boolean;
  }

  export default class Chessboard extends Component<ChessBoardProps> {}
}
