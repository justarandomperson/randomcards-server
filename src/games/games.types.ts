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


export const SOCKET_EVENT_NAMES = { // this is used both on 'emit' and on 'on'
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  QUEUE: 'queue',
  DEQUEUE: 'dequeue',
  PLAY_UNIT: 'play_unit',
  PLAY_SPELL: 'play_spell',
  BUY_ARTIFACT: 'buy_artifact',
  END_TURN: 'end_turn',

  MATCH_START: 'match_start',
  START_TURN: 'start_turn',
  UPDATE_GAME_PHASE: 'update_game_phase',
  UPDATE_MONEY: 'update_money',
  UPDATE_HEALTH: 'update_health',
  UPDATE_DRAWPILE_COUNT: 'update_drawpile_count',
  UPDATE_CARD: 'update_card',
  UPDATE_ARTIFACT: 'update_artifact',
  UPDATE_HAND: 'update_hand',
  UPDATE_BENCH: 'update_bench',
  UPDATE_BOARD: 'update_board',
  UPDATE_SHOP: 'update_shop',
} as const;


// other
export type DeckIds = {
  unitIds: string[],
  spellIds: string[]
}