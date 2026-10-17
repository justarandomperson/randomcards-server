import { WsException } from "@nestjs/websockets";
import { CardsService } from "../cards/cards.service";
import { UnitInstance } from "../cards/cards.types";
import { GameState } from "../games/shared/games.types";
import { AnyInstance, Effect, EFFECT_TRIGGERS, EffectContext, EffectTrigger } from "./effects.types";
import { ArtifactsService } from "../artifacts/artifacts.service";
import { GameActions } from "../games/providers/games.actions";
import { Server } from 'socket.io';


export class EffectsService {
    private readonly actions: GameActions;

    constructor(
        private readonly state: GameState,
        private readonly cards: CardsService,
        private readonly artifacts: ArtifactsService,
        private readonly gameActions: GameActions
    ) {
    }


    // initializers, getters and setters etc
    private getEffectContext(playerId: string, sourceId: string, targetId?: string): EffectContext {
        return {
            state: this.state,
            actions: this.actions,
            cardsService: this.cards,
            artifactsService: this.artifacts,
            playerId,
            sourceId,
            targetId
        };
    }

    private getAnyInstanceId(instance: AnyInstance): string {
        const instanceId = instance.instanceId;

        if (!instanceId) {
            throw new WsException(`${instance.name} has no instanceId.`);
        }

        return instanceId;
    }


    // services
    runEffect(effect: Effect, playerId: string, sourceId: string, targetId?: string) {
        const context = this.getEffectContext(playerId, sourceId, targetId);
        effect.execute(context);
    }

    runEffectsForTrigger(playerId: string, trigger: EffectTrigger, sourceInstance?: AnyInstance): boolean {
        switch (trigger) {
            case EFFECT_TRIGGERS.TURN_START:
            case EFFECT_TRIGGERS.TURN_END:
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
                    const instanceId = this.cards.getCardInstanceId(unit);

                    if (this.checkEffectNeedsTarget(effect, playerId, instanceId)) {
                        needsTarget = true;
                    }

                    else {
                        this.runEffect(effect, playerId, instanceId);
                    }
                }
            })
        });

        const playersArtifacts = this.actions.getPlayerState(playerId).artifacts;

        playersArtifacts.map((artifact) => {
            artifact.effects.map((effect) => {
              if (effect.trigger.includes(trigger)) {
                    const instanceId = this.artifacts.getArtifactInstanceId(artifact);

                    if (this.checkEffectNeedsTarget(effect, playerId, instanceId)) {
                        needsTarget = true;
                    }

                    else {
                        this.runEffect(effect, playerId, instanceId);
                    }

                }  
            })
        });

        return needsTarget;
    }

    private runInstanceSpecificEffectsForTrigger(playerId: string, trigger: EffectTrigger, sourceInstance: AnyInstance): boolean {
        const instanceId = this.getAnyInstanceId(sourceInstance);
        let needsTarget = false;

        sourceInstance.effects.map((effect) => {
            if (effect.trigger.includes(trigger)) {
                if (this.checkEffectNeedsTarget(effect, playerId, instanceId)) {
                    needsTarget = true;
                }

                else {
                    this.runEffect(effect, playerId, instanceId);
                }
            }  
        });

        return needsTarget;
    }

    private checkEffectNeedsTarget(effect: Effect, playerId: string, sourceId: string): boolean {
        if (effect.hasTarget) {
            this.actions.setPlayerCurrentEffectData(playerId, {effect, sourceId});
            return true;
        }

        return false;
    }
}
