import { ArtifactInstance, ArtifactLocation, ClientArtifactData } from "../../artifacts/artifacts.types";
import { UnitInstance, SpellInstance, ClientUnitData, ClientSpellData, CardLocation } from "../../cards/cards.types"; 
import { GameActions } from "../logic/gameActions";


export type Game = { 
  state: GameState
  actions: GameActions 
};

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


// event payloads
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

export type UpdateCardPayload = {
  card: ClientUnitData | ClientSpellData,
  location: CardLocation
}

export type UpdateArtifactPayload = { 
  artifact: ClientArtifactData,
  location: ArtifactLocation,
  playerId?: string 
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