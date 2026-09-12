import { UnitInstance, SpellInstance } from './cards/card.types';


export type GameState = {
  //? do we maybe need to keep track of gamePhase? do calculate who starts their shop phase first?
  players: Map<string, PlayerState>
  gameID: string;

  board: (UnitInstance | null)[];

  playerTurnID: string;
};

export type PlayerState = {
  id: string;
  hp: number;
  money: number;
  drawpile: SpellInstance[];
  hand: SpellInstance[];
  bench: UnitInstance[];
};

export type Player = {
  id: string;
  deck: string[];
};
