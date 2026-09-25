import { GameState } from '../games/shared/games.types';
import { GameActions } from '../cards/game-actions';


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
