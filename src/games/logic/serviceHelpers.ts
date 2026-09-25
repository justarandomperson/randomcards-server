import { Deck, GameState } from "../shared/games.types";


export const CheckPlayUnitValid = (game: GameState, boardIndex: number): string | null => {
    if (boardIndex > game.board.length || boardIndex < 0) {
        return 'out of bounds';
    } 
    if (game.board[boardIndex] != null) {
        return 'slot taken';
    }

    return null;
}