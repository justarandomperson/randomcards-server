import { ArtifactsService } from '../artifacts/artifacts.service';
import { ArtifactInstance } from '../artifacts/artifacts.types';
import { CardsService } from '../cards/cards.service'
import { SpellInstance, UnitInstance } from '../cards/cards.types';
import { GameActions } from '../games/providers/games.actions';
import { GameState } from '../games/shared/games.types'


export type EffectContext = {
  state: GameState
  actions: GameActions
  cards: CardsService
  artifacts: ArtifactsService
  playerId: string
  source: AnyInstance
  target?: UnitInstance
};

export type Effect = {
  trigger: EffectTrigger[]
  execute(ctx: EffectContext): void
  hasTarget?: boolean
  value?: number
};


export type EffectTrigger = typeof EFFECT_TRIGGERS[keyof typeof EFFECT_TRIGGERS]

export enum Status {
  SILENCED = 'silenced',
  PARALYZED ='paralyzed',
  TAUNT ='taunt',
  HASTE = 'haste',
  DODGE = 'dodge',
};

export type UnitOrArtifact = UnitInstance | ArtifactInstance
export type AnyInstance = UnitInstance | ArtifactInstance | SpellInstance

// lists
export const EFFECTS = {
  DRAW_SPELL: 'draw_spell',
  DAMAGE_UNIT: 'damage_unit',
  DAMAGE_PLAYER: 'damage_player',
  UPDATE_CARD_DATA: 'update_card_data',
  CREATE_SPELL: 'create_spell',
  SUMMON_UNIT: 'summon_unit',
  UPDATE_MONEY: 'update_money',
  UPDATE_EFFECT: 'update_effect',
  UPDATE_UNIT_COOLDOWN: 'update_unit_cooldown',
  UPDATE_HAND: 'update_hand',
  RETURN_CARD: 'return_card',
  UPDATE_UNIT_STATUS: 'update_unit_status',
} as const;

export const EFFECT_TRIGGERS = {
  TURN_START: 'turn_start',
  TURN_END: 'turn_end',
  SUMMONED: 'summoned',
  DEATH: 'death',
  KILL: 'kill',
  DAMAGED: 'damaged',
  COOLDOWN_END: 'cooldown_end',

  ANY_SUMMONED: 'any_summoned',
  ANY_SPELL_PLAYED: 'any_spell_played',
  ANY_DIED: 'any_died',
  ANY_KILLED: 'any_killed',
  ANY_DAMAGED: 'any_damaged',
  ANY_COOLDOOWN_END: 'any_cooldown_end'
} as const;