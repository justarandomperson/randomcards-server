import { Card, UnitInstance, SpellInstance } from './cards/card.types';

export type GameState = {
  players: Map<string, PlayerState>
  gameID: string;

  board: (UnitInstance | null)[];

  playerTurnID: string;
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
