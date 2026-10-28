import { WsException } from "@nestjs/websockets";
import { AnyInstance, InstanceType, UnitInstance } from "../instances/shared/instances.types";
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
        //? we can definitely refactor this function cuz its repeating. also part of this is repeating in the specifics function
        let needsTarget = false;

        const playersSummonedUnits = this.state.board.filter(
            (unit): unit is UnitInstance => unit?.ownerId === triggerData.playerId
        );
        for (const unit of playersSummonedUnits) {
            if (unit.statuses.silenced) {
                continue; // silenced? THEN SHUT UP
            }

            for (const effect of unit.effects) {
                if (effect.trigger.includes(trigger)) {  
                    const effectContextData = this.createEffectContextData(triggerData, unit);
                    
                    if (this.checkEffectNeedsTarget(effect, effectContextData)) {
                        needsTarget = true;
                    }

                    else {
                        this.runEffect(effect, effectContextData);
                    }
                }
            }
        }

        const playersArtifacts = this.actions.getPlayerState(triggerData.playerId).artifacts;
        playersArtifacts.map((artifact) => {
            artifact.effects.map((effect) => {
              if (effect.trigger.includes(trigger)) {
                    const effectContextData = this.createEffectContextData(triggerData, artifact);

                    if (this.checkEffectNeedsTarget(effect, effectContextData)) {
                        needsTarget = true;
                    }

                    else {
                        this.runEffect(effect, effectContextData);
                    }

                }  
            })
        });

        return needsTarget;
    }

    private runInstanceSpecificEffectsForTrigger(trigger: EffectTrigger, triggerData: TriggerData): boolean {
        const source = triggerData.source;
        if (!source) {
            throw new WsException("effect needs the source card/artifact id");
        }

        if (source.type === InstanceType.UNIT) {
            if (source.statuses.silenced) {
                return false; // didnt run effect, but also doesnt need target, so false.
            }
        }

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

    private createEffectContextData(triggerData: TriggerData, source: AnyInstance): EffectContextData {
        const effectContextData: EffectContextData = {
            playerId: triggerData.playerId,
            source: source,
            attacker: triggerData.attacker,
            attacked: triggerData.attacked
        }

        return effectContextData;
    }

}
