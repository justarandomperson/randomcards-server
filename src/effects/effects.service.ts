import { WsException } from "@nestjs/websockets";
import { AnyInstance, InstanceType } from "../instances/shared/instances.types";
import { CurrentEffectData, GameState } from "../games/shared/games.types";
import { Effect, EFFECT_TRIGGERS, EffectContext, EffectContextData, EffectTrigger, TriggerData } from "./effects.types";
import { GameActions } from "../games/providers/games.actions";
import { InstancesService } from "../instances/instances.service";


export class EffectsService {

    constructor(
        private readonly state: GameState,
        private readonly actions: GameActions,
        private readonly instances: InstancesService
    ) {}


    // initializers, getters and setters etc
    private getEffectContext(data: EffectContextData): EffectContext {
        return {
            state: this.state,
            actions: this.actions,
            instances: this.instances,
            data: {
                playerId: data.playerId,
                source: data.source,
                targetUnit: data.targetUnit,
                targetPlayerId: data.targetPlayerId,
                attacker: data.attacker,
                attacked: data.attacked
            }
        };
    }

    private createEffectContextData(triggerData: TriggerData, source: AnyInstance): EffectContextData {
        const effectContextData: EffectContextData = {
            playerId: triggerData.playerId,
            source: source,
            attacker: triggerData.attacker,
            attacked: triggerData.attacked
        }

        return effectContextData;
    }


    // helpers
    private iterateEffects(trigger: EffectTrigger, triggerData: TriggerData, source: AnyInstance): boolean {
        let needsTarget = false;

        source.effects.map((effect) => {
            if (effect.trigger.includes(trigger)) {
                const effectContextData = this.createEffectContextData(triggerData, source);

                if (this.checkEffectNeedsTarget(effect, effectContextData)) {
                    needsTarget = true;
                }

                else {
                    this.runEffect(effect, effectContextData);
                }
            }  
        });

        return needsTarget;
    }

    private checkEffectNeedsTarget(effect: Effect, data: EffectContextData): boolean {
        if (effect.hasTarget) {

            const newEffectData: CurrentEffectData = { effect, data };
            this.actions.pushPlayerCurrentEffect(this.actions.getPlayerState(data.playerId), newEffectData);
            
            return true;
        }

        return false;
    }


    // services
    runEffect(effect: Effect, data: EffectContextData) {
        const context = this.getEffectContext(data);
        effect.execute(context);
    }

    runTriggerEffects(trigger: EffectTrigger, data: TriggerData): boolean {
        switch (trigger) {
            case EFFECT_TRIGGERS.TURN_START:
            case EFFECT_TRIGGERS.TURN_END:
            case EFFECT_TRIGGERS.ANY_COOLDOOWN_END:
            case EFFECT_TRIGGERS.ANY_DAMAGED:
            case EFFECT_TRIGGERS.ANY_DIED:
            case EFFECT_TRIGGERS.ANY_KILLED:
            case EFFECT_TRIGGERS.ANY_SPELL_PLAYED:
            case EFFECT_TRIGGERS.ANY_SUMMONED:
            case EFFECT_TRIGGERS.PLAYER_DAMAGED:
                return this.runUnspecificEffects(trigger, data);

            default:
                return this.runInstanceSpecificEffectsForTrigger(trigger, data);

        }
    }

    private runUnspecificEffects(trigger: EffectTrigger, triggerData: TriggerData): boolean {
        let needsTarget = false;

        const playerBoard = this.actions.getPlayerBoard(triggerData.playerId); 
        for (const slot of playerBoard) {
            const unit = slot.unit;

            if (unit && !unit.statuses.silenced) {
                needsTarget = this.iterateEffects(trigger, triggerData, unit);
            }
        }

        const playerArtifacts = this.actions.getPlayerState(triggerData.playerId).artifacts;
        for (const artifact of playerArtifacts) {
            needsTarget = this.iterateEffects(trigger, triggerData, artifact);
        }

        return needsTarget;
    }

    private runInstanceSpecificEffectsForTrigger(trigger: EffectTrigger, triggerData: TriggerData): boolean {
        const source = triggerData.source;
        if (!source) {
            throw new WsException("effect needs the source card/artifact id");
        }

        if (source.type === InstanceType.UNIT && source.statuses.silenced) {
            return false; // didnt run effect, but also doesnt need target, so false.
        }

        return this.iterateEffects(trigger, triggerData, source);
    }
}
