import { PLAY_TURNS_PER_CYCLE, TURNS_PER_CYCLE } from "../shared/games.constants";
import { GamePhase, GameState } from "../shared/games.types";


export const CheckPlayUnitValid = (game: GameState, boardIndex: number): string | null => {
    if (boardIndex > game.board.length || boardIndex < 0) {
        return 'out of bounds';
    } 
    if (game.board[boardIndex] != null) {
        return 'slot taken';
    }

    return null;
}

export const calculateTurnStartMoney = (turn: number): number => {
    return (turn * 2);
}

export const translateBoardIndex = (index: number, isPlayer1: boolean) =>
{
    if (isPlayer1) return index
    else return index + 4
}

export const shouldSwitchPhase = (currentPhase: GamePhase, player1Turn: number, player2Turn: number): boolean => {
    const totalTurns = player1Turn + player2Turn;
    const nextTurnPhase = totalTurns % TURNS_PER_CYCLE < PLAY_TURNS_PER_CYCLE ? GamePhase.PLAY : GamePhase.SHOP;

    return nextTurnPhase !== currentPhase;
}