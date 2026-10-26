import { WsException } from "@nestjs/websockets";
import { AnyInstance, UnitInstance } from "../instances/shared/instances.types";
import { CurrentEffectData, GameState } from "../games/shared/games.types";
import { Effect, EFFECT_TRIGGERS, EffectContext, EffectTrigger } from "./effects.types";
import { GameActions } from "../games/providers/games.actions";
import { InstancesService } from "../instances/instances.service";


export class EffectsService {

    constructor(
        private readonly state: GameState,
        private readonly actions: GameActions,
        private readonly instances: InstancesService
    ) {}


    // initializers, getters and setters etc
    private getEffectContext(playerId: string, source: AnyInstance, target?: UnitInstance): EffectContext {
        return {
            state: this.state,
            actions: this.actions,
            instances: this.instances,
            playerId,
            source,
            target
        };
    }


    // services
    runEffect(effect: Effect, playerId: string, source: AnyInstance, targetId?: UnitInstance) {
        const context = this.getEffectContext(playerId, source, targetId);
        effect.execute(context);
    }

    runTriggerEffects(playerId: string, trigger: EffectTrigger, sourceInstance?: AnyInstance): boolean {
        switch (trigger) {
            case EFFECT_TRIGGERS.TURN_START:
            case EFFECT_TRIGGERS.TURN_END:
            case EFFECT_TRIGGERS.ANY_COOLDOOWN_END:
            case EFFECT_TRIGGERS.ANY_DAMAGED:
            case EFFECT_TRIGGERS.ANY_DIED:
            case EFFECT_TRIGGERS.ANY_KILLED:
            case EFFECT_TRIGGERS.ANY_SPELL_PLAYED:
            case EFFECT_TRIGGERS.ANY_SUMMONED:
                return this.runTurnStartEndEffects(playerId, trigger);

            default:
                if (!sourceInstance) {
                    throw new WsException("effect needs the source card/artifact id");
                }

                return this.runInstanceSpecificEffectsForTrigger(playerId, trigger, sourceInstance);

        }
    }

    private runTurnStartEndEffects(playerId: string, trigger: EffectTrigger): boolean {
        let needsTarget = false;

        const playersSummonedUnits = this.state.board.filter(
            (unit): unit is UnitInstance => unit?.ownerId === playerId
        );

        playersSummonedUnits.map((unit) => {
            unit.effects.map((effect) => {
                if (effect.trigger.includes(trigger)) {
                    if (this.checkEffectNeedsTarget(effect, playerId, unit)) {
                        needsTarget = true;
                    }

                    else {
                        this.runEffect(effect, playerId, unit);
                    }
                }
            })
        });

        const playersArtifacts = this.actions.getPlayerState(playerId).artifacts;

        playersArtifacts.map((artifact) => {
            artifact.effects.map((effect) => {
              if (effect.trigger.includes(trigger)) {
                    if (this.checkEffectNeedsTarget(effect, playerId, artifact)) {
                        needsTarget = true;
                    }

                    else {
                        this.runEffect(effect, playerId, artifact);
                    }

                }  
            })
        });

        return needsTarget;
    }

    private runInstanceSpecificEffectsForTrigger(playerId: string, trigger: EffectTrigger, sourceInstance: AnyInstance): boolean {
        let needsTarget = false;

        sourceInstance.effects.map((effect) => {
            if (effect.trigger.includes(trigger)) {
                if (this.checkEffectNeedsTarget(effect, playerId, sourceInstance)) {
                    needsTarget = true;
                }

                else {
                    this.runEffect(effect, playerId, sourceInstance);
                }
            }  
        });

        return needsTarget;
    }

    private checkEffectNeedsTarget(effect: Effect, playerId: string, source: AnyInstance): boolean {
        if (effect.hasTarget) {
            const newEffectData: CurrentEffectData = { effect, source };
            this.actions.pushPlayerCurrentEffect(this.actions.getPlayerState(playerId), newEffectData);
            
            return true;
        }

        return false;
    }
}
