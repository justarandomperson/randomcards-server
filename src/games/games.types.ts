import { Card, CardInstance } from "./cards/card.types";

export type GameState = {
    players: PlayerState[]
    gameId: string;

    board: CardInstance[];

    player1Turn: boolean
}

export type PlayerState = {
    id: string,
    deck: CardInstance[],
    hand: CardInstance[],
    bench: CardInstance[]
}

export type Player =
{
    id: string,
    deck: string[]
}
