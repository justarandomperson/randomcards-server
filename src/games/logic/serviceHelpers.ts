import { ArtifactInstance, InstanceZone, SpellInstance } from "../../instances/shared/instances.types";
import { CYCLE_TURNS_PER_PLAYER, PLAY_TURNS_PER_PLAYER, SHOP_TURNS_PER_PLAYER } from "../shared/games.constants";
import { GamePhase } from "../shared/games.types";


export const calculateTurnStartMoney = (turn: number): number => {
    const money =  Math.floor(turn * 1.5);

    if (money > 10) {
        return 10;
    }

    return money;
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
    if (totalTurns % 2 == 0) {
        return false;
    }

    const totalTurnsPerPlayer = Math.floor(totalTurns / 2);
    const nextTurnPhase = (totalTurnsPerPlayer % CYCLE_TURNS_PER_PLAYER) >= PLAY_TURNS_PER_PLAYER ?
        GamePhase.SHOP : GamePhase.PLAY;

    return nextTurnPhase !== currentPhase;
}

export const fillShop = (currentShop: (ArtifactInstance | null)[], pool: ArtifactInstance[]): (ArtifactInstance | null)[] => {
    const newShop = currentShop.map((slot, i) => {
        if (slot) {
            return slot;
        }
        if (pool.length == 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * pool.length);
        const [picked] = pool.splice(randomIndex, 1);

        picked.location = { insideOf: InstanceZone.SHOP, index: i }
        
        return picked;
    })

    return newShop;
}

export const shuffleSpells = (spells: SpellInstance[]): SpellInstance[] => {
    const shuffledSpells = spells.toSorted(() => Math.random() - 0.5);
    return shuffledSpells;
}

export const getRandomInt = (min: number, max: number): number => {
    if (max <= min) return 0;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
