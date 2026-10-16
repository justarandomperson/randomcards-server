import { ArtifactInstance, ArtifactLocation, ClientArtifactData } from "../../artifacts/artifacts.types";
import { UnitInstance, SpellInstance, ClientUnitData, ClientSpellData, CardLocation } from "../../cards/cards.types"; 
import { EffectsService } from "../../effects/effects.service";
import { Effect } from "../../effects/effects.types";
import { GameActions } from "../logic/gameActions";


export type Game = { 
  state: GameState
  actions: GameActions
  effects: EffectsService
};

export type GameState = {
  gameId: string
  players: Map<string, PlayerState>
  board: (UnitInstance | null)[]
  shop: (ArtifactInstance | null)[]
  gamePhase: GamePhase
  playerTurnId: string
  effectEvents: effectEventPayload[];

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
  currentEffectData?: CurrentEffectData
};

export enum GamePhase {
  PLAY = 'play',
  SHOP = 'shop'
}

export type CurrentEffectData = {
  effect: Effect,
  sourceId: string
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

export type effectEventPayload = 
  | { name: 'update_card', payload: { clientId: string, card: UnitInstance | SpellInstance, cardLocation: CardLocation } }
  | { name: 'update_artifact', payload: { clientId: string, artifact: ArtifactInstance, artifactLocation: ArtifactLocation, playerId?: string } }
  | { name: 'update_money' | 'update_health' | 'update_drawpile_count', payload: { gameId: string, playerId: string, amount: number }}


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