import { ArtifactInstance } from "../../artifacts/artifacts.types";
import { PLAY_TURNS_PER_CYCLE, TURNS_PER_CYCLE } from "../shared/games.constants";
import { GamePhase } from "../shared/games.types";


export const calculateTurnStartMoney = (turn: number): number => {
    return (turn * 2);
}

export const translateBoardIndex = (index: number, isPlayer1: boolean): number => {
    if (isPlayer1) return index
    else return index + 4
}

export const unTranslateBoardIndex = (index: number, isPlayer1: boolean): number => {
    if (isPlayer1) return index
    else return index - 4
}

export const shouldSwitchPhase = (currentPhase: GamePhase, player1Turn: number, player2Turn: number): boolean => {
    const totalTurns = player1Turn + player2Turn;
    const nextTurnPhase = totalTurns % TURNS_PER_CYCLE < PLAY_TURNS_PER_CYCLE ? GamePhase.PLAY : GamePhase.SHOP;

    return nextTurnPhase !== currentPhase;
}

export const fillShop = (currentShop: (ArtifactInstance | null)[], pool: ArtifactInstance[]): ArtifactInstance[] => {
    const newShop = currentShop.map((slot) => {
        if (!slot) {
            const index = Math.floor((Math.random() * pool.length));

            slot = pool[index];
            pool.splice(index, 1);
        }

        return slot;
    })

    return newShop;
}

