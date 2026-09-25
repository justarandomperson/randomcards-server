export type Match = { 
    gameId: string
    players: BasicPlayerData[]
};

export type BasicPlayerData = {
    socketId: string
    deckIds: DeckIds
}

export type DeckIds = {
    unitIds: string[]
    spellIds: string[]
}