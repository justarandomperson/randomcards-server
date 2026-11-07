import { AnyInstance, UnitInstance } from '../instances/shared/instances.types';
import { GameActions } from '../games/providers/games.actions';
import { GameState, selectTargetFilter } from '../games/shared/games.types'
import { InstancesService } from '../instances/providers/instances.service';


export type EffectContext = {
  state: GameState
  actions: GameActions
  instances: InstancesService
  data: EffectContextData
};

export type EffectContextData = {
  playerId: string
  source: AnyInstance
  targetUnit?: UnitInstance
  targetPlayerId?: string
  attacker?: UnitInstance
  attacked?: UnitInstance
  referenced?: AnyInstance
}

export type Effect = {
  trigger: EffectTrigger[]
  execute(ctx: EffectContext): void
  hasTarget?: selectTargetFilter
  value?: number
};

export type EffectTrigger = typeof EFFECT_TRIGGERS[keyof typeof EFFECT_TRIGGERS]

export enum Status {
  SILENCED = 'silenced',
  PARALYZED ='paralyzed',
  TAUNT ='taunt',
  HASTE = 'haste',
  DODGE = 'dodge',
  COOLDOWN = 'cooldown'
};

export type TriggerData = {
  playerId: string,
  source?: AnyInstance,
  attacker?: UnitInstance
  attacked?: UnitInstance
  referenced?: AnyInstance
};

export type anyTriggerData = {
  source?: AnyInstance,
  attacker?: UnitInstance
  attacked?: UnitInstance
  referenced?: AnyInstance
};

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
  BOUGHT: 'bought',
  DEATH: 'death',
  KILL: 'kill',
  DAMAGED: 'damaged',
  ATTACKED: 'attacked',
  COOLDOWN_END: 'cooldown_end',

  PLAYER_DAMAGED: 'player_damaged',

  ANY_SUMMONED: 'any_summoned',
  ANY_SPELL_PLAYED: 'any_spell_played',
  ANY_DIED: 'any_died',
  ANY_KILLED: 'any_killed',
  ANY_ATTACKED: 'any_attacked',
  ANY_DAMAGED: 'any_damaged',
  ANY_COOLDOWN_END: 'any_cooldown_end'
} as const;