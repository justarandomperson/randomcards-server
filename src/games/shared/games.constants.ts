export const STARTING_HEALTH = 20;
export const STARTING_MONEY = 100;
export const STARTING_TURN = 1;
export const STARTING_SPELLS_IN_HAND = 3;

export const UNITS_IN_DECK = 8;
export const SPELLS_IN_DECK = 12; // also max drawpile size

export const MAX_CARDS_PER_BOARD_ROW = 4;
export const MAX_CARD_IN_BOARD = 8;

export const MAX_HAND_SIZE = 6;

export const MAX_ARTIFACTS_IN_SHOP = 5;
export const MAX_ARTIFACTS_TO_BUY_PER_TURN = 2;

export const TURN_NUMBER_MONEY_MULT = 2;

export const PLAY_TURNS_PER_PLAYER = 3;
export const SHOP_TURNS_PER_PLAYER = 1;
export const CYCLE_TURNS_PER_PLAYER = PLAY_TURNS_PER_PLAYER + SHOP_TURNS_PER_PLAYER;

export const MINIMUM_MONEY = 0;


export const SOCKET_EVENT_NAMES = { // this is used both on 'emit' and on 'on'
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  QUEUE: 'queue',
  DEQUEUE: 'dequeue',
  PLAY_UNIT: 'play_unit',
  PLAY_SPELL: 'play_spell',
  BUY_ARTIFACT: 'buy_artifact',
  END_TURN: 'end_turn',
  ATTACK_UNIT: 'attack_unit',
  ATTACK_PLAYER: 'attack_player',
  SELECTED_TARGET: 'selected_target',

  MATCH_START: 'match_start',
  START_TURN: 'start_turn',
  SELECT_TARGET: 'select_target',
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
  PLAYED_SPELL: 'played_spell',
  GAME_END: 'game_end'
} as const;

