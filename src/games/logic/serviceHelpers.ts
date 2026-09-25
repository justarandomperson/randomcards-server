import { SpellInstance, UnitInstance } from "../../cards/cards.types";
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

export const findCardInstance = <T extends UnitInstance | SpellInstance>(
    instanceId: string, cardList: (T | null)[]
): { cardInstance: T; index: number } | null => {
    const index = cardList.findIndex(
        (card) => card?.instanceId === instanceId
    );

    if (index === -1) {
        return null;
    }

    return { cardInstance: cardList[index]!, index };
};

export const calculateTurnStartMoney = (currentMoney: number, turn: number): number => {
    return currentMoney + (turn * 2);
}