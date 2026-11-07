import { BasicPlayerData } from "../../matchmaking/matchmaking.types";
import { PlayerState } from "../shared/games.types";
import { STARTING_HEALTH, STARTING_MONEY, STARTING_TURN } from "../shared/games.constants";
import { Deck } from "../../decks/shared/decks.types";
import { shuffleSpells } from "./serviceHelpers";
import { artifactsMap } from "../../instances/definitions/artifacts";


export const initPlayerState = (player: BasicPlayerData, deck: Deck): PlayerState => {
    const playerState: PlayerState = {
        socketId: player.socketId,
        name: player.name,
        hp: STARTING_HEALTH,
        money: STARTING_MONEY,
        turn: STARTING_TURN,
        artifacts: [artifactsMap.get("A_2")!], //* debug
        drawpile: shuffleSpells(deck.spells),
        hand: [],
        bench: deck.units,
        currentEffects: [],
        artifactsBoughtThisTurn: 0
    };

    return playerState;
}