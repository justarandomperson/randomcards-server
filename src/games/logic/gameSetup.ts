import { randomUUID } from "crypto";
import { ArtifactInstance } from "../../artifacts/artifacts.types";
import { BasicPlayerData } from "../../matchmaking/matchmaking.types";
import { Deck, PlayerState } from "../shared/games.types";
import { Socket } from "socket.io";
import { STARTING_HEALTH, STARTING_MONEY, STARTING_TURN } from "../shared/games.constants";
import { WsException } from "@nestjs/websockets";

export const fillShop = (currentShop: (ArtifactInstance | null)[]): ArtifactInstance[] => {
    const placeholderArtifact: ArtifactInstance = {
        id: '0',
        instanceId: randomUUID(),
        name: 'buy me for respect',
        effectDesc: 'yeah, you should',
        effects: [],
        cost: 3
    }

    return [placeholderArtifact, placeholderArtifact, placeholderArtifact, placeholderArtifact, placeholderArtifact];
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