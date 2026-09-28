import { ArtifactInstance } from "../../artifacts/artifacts.types";
import { SpellInstance, UnitInstance } from "../../cards/cards.types";
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

export const findArtifactInstance = (
    instanceId: string, artifactList: (ArtifactInstance | null)[]
): { artifactInstance: ArtifactInstance; index: number } | null => {
    const index = artifactList.findIndex(
        (artifact) => artifact?.instanceId === instanceId
    );

    if (index === -1) {
        return null;
    }

    return { artifactInstance: artifactList[index]!, index };
}

export const calculateTurnStartMoney = (currentMoney: number, turn: number): number => {
    return currentMoney + (turn * 2);
}

export const changeGamePhase = (phase: GamePhase) => {
    return (phase === GamePhase.PLAY ? GamePhase.SHOP : GamePhase.PLAY);
}

export const shouldSwitchPhase = (currentPhase: GamePhase, player1Turn: number, player2Turn: number): boolean => {
    const totalTurns = player1Turn + player2Turn;
    const nextTurnPhase = totalTurns % TURNS_PER_CYCLE < PLAY_TURNS_PER_CYCLE ? GamePhase.PLAY : GamePhase.SHOP;

    return nextTurnPhase !== currentPhase;
}
