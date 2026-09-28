import { randomUUID } from "crypto";
import { ArtifactInstance } from "../../artifacts/artifacts.types";
import { BasicPlayerData } from "../../matchmaking/matchmaking.types";
import { Deck, PlayerState } from "../shared/games.types";
import { STARTING_HEALTH, STARTING_MONEY, STARTING_TURN } from "../shared/games.constants";
import { SpellInstance, UnitInstance } from "../../cards/cards.types";
import { unitCards } from "../../cards/definitions/units";
import { spellCards } from "../../cards/definitions/spells";


export const fillShop = (currentShop: (ArtifactInstance | null)[]): ArtifactInstance[] => {
    // TODO: make this actually fill the null spaces of a shop with new random artifacts.
    const placeholderArtifact: ArtifactInstance = {
        id: '0',
        instanceId: randomUUID(),
        name: 'buy me for respect',
        effectDesc: 'yeah, you should',
        effects: [],
        cost: 3
    };

    const newShop = currentShop.map((artifact) => artifact ?? placeholderArtifact);

    return newShop;
}

export const initPlayerState = (player: BasicPlayerData, deck: Deck): PlayerState => {
    const playerState: PlayerState = {
        socketId: player.socketId,
        name: player.name,
        health: STARTING_HEALTH,
        money: STARTING_MONEY,
        turn: STARTING_TURN,
        artifacts: [],
        drawpile: deck.spells,
        hand: [],
        bench: deck.units
    }

    return playerState;
}

export const generateUnitInstance = (unitId: string): UnitInstance | null => {
    const unit = unitCards.get(unitId);
    if (!unit){
        return null;
    }

    unit.instanceId = randomUUID();
    return unit;
}

export const generateSpellInstance = (spellId: string): SpellInstance | null => {
    const spell = spellCards.get(spellId);
    if (!spell){
            return null;
        }

    spell.instanceId = randomUUID();
    return spell ?? null;
}