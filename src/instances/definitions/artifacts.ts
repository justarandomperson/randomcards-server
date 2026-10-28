import { EFFECT_TRIGGERS, EffectContext } from "../../effects/effects.types";
import { ArtifactInstance, InstanceType } from "../shared/instances.types";


const ArtifactList: ArtifactInstance[] = [
    {
        id: "A_1",
        name: "random ball",
        type: InstanceType.ARTIFACT,
        effectDesc: "a chance it deals an unspecified amount of damage to an opponent or their unit, in an unspecified manner.",
        effects: [
            {
                trigger: [
                    EFFECT_TRIGGERS.ANY_DAMAGED, EFFECT_TRIGGERS.ANY_DIED, EFFECT_TRIGGERS.ANY_KILLED,
                    EFFECT_TRIGGERS.ANY_SUMMONED, EFFECT_TRIGGERS.TURN_END, EFFECT_TRIGGERS.TURN_START
                ],
                execute: (ctx: EffectContext) => {
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
                        const opponentBoard = ctx.actions.getOpponentBoard(ctx.data.playerId);
                        // TODO: randomly choose target and then deal the damage
                    }
                }
            }
        ],
        cost: 12,
    },
    {
        id: "A_2",
        name: "Vampire Survivor",
        type: InstanceType.ARTIFACT,
        effectDesc: "Every time a unit dies, heal 2 HP.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_DIED],
                execute: (ctx: EffectContext) => {
                    ctx.actions.increasePlayerHealth(ctx.actions.getPlayerState(ctx.data.playerId), 2);
                }
            }
        ],
        cost: 15, 
    },
    {
        id: "A_3",
        name: "Vampire Destructor",
        type: InstanceType.ARTIFACT,
        effectDesc: "Every time a unit is summoned, deal 1 damage to a random opponent's unit.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_SUMMONED],
                execute: (ctx: EffectContext) => {
                    const opponentBoard = ctx.actions.getOpponentBoard(ctx.data.playerId);
                    // TODO: randomly choose target and then deal damage
                }
            }
        ],
        cost: 15, 
    },
    {
        id: "A_4",
        name: "Tal's Idea (not really)",
        type: InstanceType.ARTIFACT,
        effectDesc: "Win the game.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    ctx.actions.endGame(ctx.data.playerId);
                }
            }
        ],
        cost: 500,     
    },
    {
        id: "A_5",
        name: "Infused Core",
        type: InstanceType.ARTIFACT,
        effectDesc: "Add 3 Lightning Orbs to your hand. \n" +
                    "Lightning Orbs deal 1 additional damage.", //! i dont think we can do that part now. do it? or nah?
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    for (let i = 0; i < 3; i++){
                        const lightningOrb = ctx.instances.createSpellInstance("S_8", ctx.data.playerId);
                        ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.data.playerId), lightningOrb);

                        // TODO: the +1 damage part? somehow? or delete it. and add soem thing else cuz then that artifact is ass
                    }
                }
            }
        ],
        cost: 10,     
    },
    {
        id: "A_6",
        name: "Hype moments & aura",
        type: InstanceType.ARTIFACT,
        effectDesc: "If you reach exactly 1 HP, you deal 10 damage to all off the opponent's units.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.PLAYER_DAMAGED], // TODO: integrate PLAYER_DAMAGED and make it work
                execute: (ctx: EffectContext) => {
                    const playerHp = ctx.actions.getPlayerState(ctx.data.playerId).hp;

                    if (playerHp === 1) {
                        const playerBoard = ctx.actions.getOpponentBoard(ctx.data.playerId);

                        for (let i = 0; i < playerBoard.length; i++) {
                            const slot = playerBoard[i];

                            if (slot.unit) {
                                ctx.actions.attackUnit(ctx.data.playerId, slot.unit, 10);
                            }
                        }
                    }
                }
            }
        ],
        cost: 9,     
    },
    {
        id: "A_7",
        name: "Vitaly's magic machine",
        type: InstanceType.ARTIFACT,
        effectDesc: "U forgot about me right? anyway Turn End: Gain 1$.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.TURN_END],
                execute: (ctx: EffectContext) => {
                    ctx.actions.increasePlayerMoney(ctx.actions.getPlayerState(ctx.data.playerId), 1);
                }
            }
        ],
        cost: 9,     
    },
    {
        id: "A_8",
        name: "Armor kind of",
        type: InstanceType.ARTIFACT,
        effectDesc: "Every time you get hit, heal 2 HP.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.PLAYER_DAMAGED],
                execute: (ctx: EffectContext) => {
                    ctx.actions.increasePlayerHealth(ctx.actions.getPlayerState(ctx.data.playerId), 2);
                }
            }
        ],
        cost: 10,     
    }
    
];

export const artifactsMap = new Map<string, ArtifactInstance>(
    ArtifactList.map((spell) => [spell.id, spell])
);