import { BasicPlayerData } from "../../matchmaking/matchmaking.types";
import { PlayerState } from "../shared/games.types";
import { STARTING_HEALTH, STARTING_MONEY, STARTING_TURN } from "../shared/games.constants";
import { Deck } from "../../decks/shared/decks.types";


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
        bench: deck.units,
        currentEffects: []
    };

    return playerState;
}