import { randomUUID } from "crypto";
import { ArtifactInstance, ArtifactZone } from "../../artifacts/artifacts.types";
import { BasicPlayerData } from "../../matchmaking/matchmaking.types";
import { PlayerState } from "../shared/games.types";
import { STARTING_HEALTH, STARTING_MONEY, STARTING_TURN } from "../shared/games.constants";
import { Deck } from "../../decks/decks.types";


export const fillShop = (currentShop: (ArtifactInstance | null)[]): ArtifactInstance[] => {
    // TODO: make this actually fill the null spaces of a shop with new random artifacts that havent been bought yet
    const placeholderArtifact: ArtifactInstance = {
        id: '0',
        instanceId: randomUUID(),
        name: 'buy me for respect',
        effectDesc: 'yeah, you should',
        effects: [],
        cost: 3
    };

    const newShop = currentShop.map(
        (artifact, i) => artifact ?? {...placeholderArtifact, location: { insideOf: ArtifactZone.SHOP, index: i }}
    );

    return newShop;
}

export const initPlayerState = (player: BasicPlayerData, deck: Deck): PlayerState => {
    const playerState: PlayerState = {
        socketId: player.socketId,
        name: player.name,
        hp: STARTING_HEALTH,
        money: STARTING_MONEY,
        turn: STARTING_TURN,
        artifacts: [],
        drawpile: deck.spells,
        hand: [],
        bench: deck.units
    }

    return playerState;
}