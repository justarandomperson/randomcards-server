import { WsException } from "@nestjs/websockets";
import { CardsService } from "../cards/cards.service";
import { UnitInstance } from "../cards/cards.types";
import { Game } from "../games/shared/games.types";
import { AnyInstance, EFFECT_TRIGGERS, EffectContext, EffectTrigger, UnitOrArtifact } from "./effects.types";
import { ArtifactsService } from "../artifacts/artifacts.service";


export class EffectsService {
    constructor(
        private readonly game: Game,
        private readonly cardsService: CardsService,
        private readonly artifactsService: ArtifactsService
    ) {}


    // initializers, getters and setters etc
    private getEffectContext(playerId: string, sourceId: string): EffectContext {
        return {
            game: this.game,
            cardsService: this.cardsService,
            artifactsService: this.artifactsService,
            playerId: playerId,
            sourceId: sourceId
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
    runEffect(playerId: string, trigger: EffectTrigger, sourceInstance?: AnyInstance) {
        switch (trigger) {
            case EFFECT_TRIGGERS.TURN_START:
            case EFFECT_TRIGGERS.TURN_END:
                return this.runTurnStartEndEffects(playerId, trigger);

            default:
                if (!sourceInstance) {
                    throw new WsException("effect needs the source unit/artifact");
                }

                return this.runInstanceSpecificEffects(playerId, sourceInstance);

        }
    }

    private runTurnStartEndEffects(playerId: string, trigger: EffectTrigger) {
        const playersSummonedUnits = this.game.state.board.filter(
            (unit): unit is UnitInstance => unit?.ownerId === playerId
        );

        playersSummonedUnits.map((unit) => {
            unit.effects.map((effect) => {
                if (effect.trigger.includes(trigger)) {
                    const context = this.getEffectContext(playerId, this.cardsService.getCardInstanceId(unit))
                    effect.execute(context);
                }
            })
        });

        const playersArtifacts = this.game.actions.getPlayerState(playerId).artifacts;

        playersArtifacts.map((artifact) => {
            artifact.effects.map((effect) => {
              if (effect.trigger.includes(trigger)) {
                    const context = this.getEffectContext(playerId, this.artifactsService.getArtifactInstanceId(artifact))
                    effect.execute(context);
                }  
            })
        })
    }

    private runInstanceSpecificEffects(playerId: string, sourceInstance: AnyInstance) {
        const instanceId = this.getAnyInstanceId(sourceInstance);

        sourceInstance.effects.map((effect) => {
            const context = this.getEffectContext(playerId, instanceId);
            effect.execute(context);
        })
    }
}
