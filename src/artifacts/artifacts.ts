import { EFFECT_TRIGGERS, EffectContext } from "../effects/effects.types";
import { ArtifactInstance } from "./artifacts.types";


const ArtifactList: ArtifactInstance[] = [
    {
        id: "A_1",
        name: "random ball",
        effectDesc: "a chance it deals an unspecified amount of damage to an opponent or their unit, in an unspecified manner.",
        effects: [
            {
                trigger: [
                    EFFECT_TRIGGERS.ANY_DAMAGED, EFFECT_TRIGGERS.ANY_DIED, EFFECT_TRIGGERS.ANY_KILLED,
                    EFFECT_TRIGGERS.ANY_SUMMONED, EFFECT_TRIGGERS.TURN_END, EFFECT_TRIGGERS.TURN_START
                ],
                execute: (context: EffectContext) => {
                    const willTrigger = Math.random() > 0.8;
                    if (willTrigger) {
                        // rng damage
                        const damageWeights = new Map<number, number>([
                            [1, 22], [2, 27], [3, 16], [4, 12], [5, 7], [6, 6], [7, 5], [8, 4], [10, 1]
                        ]);
                        const totalWeight = [...damageWeights.values()].reduce((sum, w) => sum + w, 0);
                        let roll = Math.random() * totalWeight;
                        let damage = 1;

                        for (const [dmg, weight] of damageWeights) {
                            roll -= weight;
                            if (roll < 0) {
                                damage = dmg;
                                break;
                            }
                        }

                        // rng target
                        // TODO: idk how to get the opponents' board
                    }
                }
            }
        ],
        cost: 12,
    },
    {
        id: "A_2",
        name: "Vampire Survivor",
        effectDesc: "Every time a unit dies, heal 2 HP.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_DIED],
                execute: (context: EffectContext) => {
                    context.actions.healPlayer(context.playerId, 2);
                }
            }
        ],
        cost: 15, 
    },
    {
        id: "A_3",
        name: "Vampire Survivor",
        effectDesc: "Every time a unit is summoned, damage a random opponent's unit.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_SUMMONED],
                execute: (context: EffectContext) => {
                    // TODO: idk how to get the opponents' board
                }
            }
        ],
        cost: 15, 
    }
];

export const Artifacts = new Map<string, ArtifactInstance>(
    ArtifactList.map((spell) => [spell.id, spell])
);