import { Card, UnitInstance, SpellInstance } from './cards/card.types';

export type GameState = {
  players: PlayerState[];
  gameId: string;

  board: (UnitInstance | null)[];

  player1Turn: boolean;
};

export type PlayerState = {
  id: string;
  hp: number;
  deck: SpellInstance[];
  hand: SpellInstance[];
  bench: UnitInstance[];
};

export type Player = {
  id: string;
  deck: string[];
};
