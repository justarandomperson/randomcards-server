export type Match = { 
    gameId: string
    players: BasicPlayerData[]
};

export type BasicPlayerData = {
    socketId: string
    name: string
    deckIds: DeckIds
}

export type DeckIds = {
    unitIds: string[]
    spellIds: string[]
}