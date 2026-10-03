import { GameState } from '../games/shared/games.types';
import { GameActions } from '../games/logic/gameActions';


export type EffectTrigger = 'onSummon' | 'onTurnStart' | 'onTurnEnd';

export type EffectContext = {
  game: GameState;
  source: string;
  playerId: string;
  actions: GameActions;
};

export type Effect = {
  trigger: EffectTrigger[];
  execute(ctx: EffectContext): void;

  value?: number;
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
  SUMMON: 'summon',
  DEATH: 'death',
  KILL: 'kill',
  DAMAGED: 'damaged',
  IN_COOLDOWN: 'in_cooldown',
  COOLDOWN_END: 'cooldown_end'
} as const;

export const UNIT_STATUSES = {
  SILENCED: 'silenced',
  PARALYZED: 'paralyzed',
  TAUNT: 'taunt',
  HASTE: 'haste',
  DODGE: 'dodge',
} as const;
