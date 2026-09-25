import { ArtifactInstance, ClientArtifactData } from "../../artifacts/artifacts.types";
import { UnitInstance, SpellInstance, ClientUnitData, ClientSpellData, CardZone } from "../../cards/cards.types"; 


export type GameState = {
  //? do we maybe need to keep track of gamePhase? do calculate who starts their shop phase first?
  gameId: string
  players: Map<string, PlayerState>
  board: (UnitInstance | null)[]
  shop: (ArtifactInstance | null)[]
  gamePhase: GamePhase
  playerTurnId: string
};

export type PlayerState = {
  socketId: string
  name: string
  health: number
  money: number
  turn: number
  artifacts: ArtifactInstance[]
  drawpile: SpellInstance[]
  hand: SpellInstance[]
  bench: (UnitInstance | null)[]
};

export enum GamePhase {
  PLAY = 'play',
  SHOP = 'shop'
}

export type Deck = {
  unitIds: UnitInstance[]
  spellIds: SpellInstance[]
}


// Note: these are types sent to the client, used only for that
// they contain only what the client should get

export type ClientPlayerData = {
  name: string
  health: number
  money: number
  turn: number
  drawpileCount: number
  artifacts: ClientArtifactData[]
}


// event and socket related

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
} as const


// from server to client
export type MatchStartPayload = {
  playerData: ClientPlayerData
  opponentData: ClientPlayerData
  isFirstTurn: boolean
};

export type UpdateMoneyPayload = {
  playerId: string,
  newMoney: number
}

export type UpdateHealthPayload = {
  playerId: string,
  newHealth: number
}

export type UpdateDrawpileCountPayload = {
  playerId: string,
  newDrawpileCount: number
}

export type UpdateCardPayload = 
  | { card: ClientUnitData;  insideOf: CardZone.BENCH | CardZone.BOARD; index: number }
  | { card: ClientSpellData; insideOf: CardZone.HAND;                   index: number };