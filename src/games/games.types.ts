export type CardType =
{
    cardName: string;
    isUnit: boolean;
}

export type GameState = {
    player1ID: string;
    player2ID: string;
    gameId: string;

    board: CardType[];

    player1Deck: CardType[];
    player2Deck: CardType[];

    player1Hand: CardType[];
    player2Hand: CardType[];

    player1Bench: CardType[];
    player2Bench: CardType[];

    player1Turn: boolean
}

export type Player =
{
    id: string,
    deck: CardType[]
}
