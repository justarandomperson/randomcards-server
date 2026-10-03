import { DeckIds } from "../decks/decks.types";


export type Match = { 
    gameId: string
    players: BasicPlayerData[]
};

export type BasicPlayerData = {
    socketId: string
    name: string
    deckIds: DeckIds
}