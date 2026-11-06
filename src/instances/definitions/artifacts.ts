import { EFFECT_TRIGGERS, EffectContext } from "../../effects/effects.types";
import { getRandomInt } from "../../games/logic/serviceHelpers";
import { ArtifactInstance, InstanceType, UnitInstance } from "../shared/instances.types";


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
                        const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);

                        if (opponentUnits) {
                            const optionsAmount = opponentUnits.length + 1; // 1 for opponent itself
                            const randomNumber = getRandomInt(1, optionsAmount);

                            // attack
                            if (randomNumber === optionsAmount) { // got biggest number? attack opponent
                                ctx.actions.attackPlayer(ctx.actions.getOpponentId(ctx.data.playerId), damage);
                            }  
                            else {
                                const target = opponentUnits[randomNumber - 1];
                                if (target) {
                                    ctx.actions.attackUnit(ctx.data.playerId, target.unit, damage);
                                }
                            }
                        }
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
        cost: 13, 
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
                    const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);
                    const randomNumber = getRandomInt(1, opponentUnits.length);

                    ctx.actions.attackUnit(ctx.data.playerId, opponentUnits[randomNumber - 1].unit, 1);
                }
            }
        ],
        cost: 13, 
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
                    "Lightning Orbs activate twice.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    for (let i = 0; i < 3; i++){
                        const lightningOrb = ctx.instances.createSpellInstance("S_8", ctx.data.playerId);
                        ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.data.playerId), lightningOrb);
                    }
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.ANY_SPELL_PLAYED],
                execute: (ctx: EffectContext) => {
                    const referenced = ctx.data.referenced;

                    if (referenced && referenced.id === "S_8") {
                        const lightningOrb = ctx.instances.createSpellInstance("S_8", ctx.data.playerId);
                        ctx.actions.useSpell(ctx.data.playerId, lightningOrb);
                    }
                }
            }
        ],
        cost: 12,     
    },
    {
        id: "A_6",
        name: "Hype moments & aura",
        type: InstanceType.ARTIFACT,
        effectDesc: "If you reach exactly 1 HP, you deal 10 damage to all off the opponent's units.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.PLAYER_DAMAGED],
                execute: (ctx: EffectContext) => {
                    const playerHp = ctx.actions.getPlayerState(ctx.data.playerId).hp;

                    if (playerHp === 1) {
                        const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);

                        for (const unit of opponentUnits) {
                            ctx.actions.attackUnit(ctx.data.playerId, unit.unit, 10);
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
        cost: 8,     
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
    },
    {
        id: "A_9",
        name: "Justice",
        type: InstanceType.ARTIFACT,
        effectDesc: "Turn End: Deal 1 damage to the enemy unit with the least HP.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.TURN_END],
                execute: (ctx: EffectContext) => {
                    const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);

                    let unitToAttack: UnitInstance | null = null;
                    for (const unit of opponentUnits) {
                        if (!unitToAttack) {
                            unitToAttack = unit.unit;
                        }
                        else if (unitToAttack.hp > unit.unit.hp) {
                            unitToAttack = unit.unit;
                        }
                    }

                    if (unitToAttack) {
                        ctx.actions.attackUnit(ctx.data.playerId, unitToAttack, 1);
                    }
                }
            }
        ],
        cost: 10,     
    },
    {
        id: "A_10",
        name: "Daruma Doll",
        type: InstanceType.ARTIFACT,
        effectDesc: "Deals 1 Damage to enemy units when they attack on even numbered turns",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_ATTACKED],
                execute: (ctx: EffectContext) => {
                    const attacker = ctx.data.attacker

                    if (attacker) {
                        const opponentTurn = ctx.actions.getOpponentState(ctx.data.playerId).turn;
                        if (opponentTurn % 2 == 0) {
                            ctx.actions.decreaseUnitHealth(attacker, 1);
                        }
                    }
                }
            }
        ],
        cost: 6,     
    },
    {
        id: "A_11",
        name: "Judgement",
        type: InstanceType.ARTIFACT,
        effectDesc: "Summon a random unit",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED], //? im not sure if artifacts run on summoned. we can add that
                execute: (ctx: EffectContext) => {
                    const unitsMap = ctx.instances.getUnits()
                    const unitIds = [...unitsMap.values()].map(unit =>
                        unit.id
                    );

                    const randomUnitId = unitIds[Math.floor(Math.random() * unitIds.length)];
                    const randomUnitInstance = ctx.instances.createUnitInstance(randomUnitId, ctx.data.playerId)

                    ctx.actions.summonUnit(ctx.data.playerId, randomUnitInstance)
                }
            }
        ],
        cost: 4,     
    },
    {
        id: "A_12",
        name: "Saiki Kusuke",
        type: InstanceType.ARTIFACT,
        effectDesc: "Saiki K. triggers 2 effects instead of 1",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED], //! pretty sure this just doesnt work
                execute: (ctx: EffectContext) => {
                    const playerBench = ctx.actions.getPlayerState(ctx.data.playerId).bench
                    const playerUnits = ctx.actions.getPlayerUnits(ctx.data.playerId)

                    playerBench.map((unit) => {
                        if (unit && unit.id == "S_25" && unit.additionalData)
                        {
                            unit.additionalData["triggers"] = 2
                        }
                    })

                    playerUnits.map((slot) => {
                        const unit = slot.unit
                        if (unit && unit.id == "S_25" && unit.additionalData)
                        {
                            unit.additionalData["triggers"] = 2
                        }
                    })
                }
            }
        ],
        cost: 5,     
    },
    {
        id: "A_13",
        name: "Leshy's Camera",
        type: InstanceType.ARTIFACT,
        effectDesc: "Whenever a enemy unit is killed, summon a 1/1 copy.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_DIED],
                execute: (ctx: EffectContext) => {
                    const source = ctx.data.source
                    if (source.ownerId != ctx.data.playerId)
                    {
                        const instanceCopy = ctx.instances.createUnitInstance(source.id, ctx.data.playerId)
                        instanceCopy.atk = 1
                        instanceCopy.hp = 1
                        ctx.actions.summonUnit(ctx.data.playerId, instanceCopy)
                    }
                }
            }
        ],
        cost: 5,     
    },
    {
        id: "A_14",
        name: "White Pen Of Hope",
        type: InstanceType.ARTIFACT,
        effectDesc: "Whenever a unit is summoned, it gains +1 HP.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_SUMMONED],
                execute: (ctx: EffectContext) => {
                    const referenced = ctx.data.referenced;
                    if (referenced && referenced.type === InstanceType.UNIT) {
                        ctx.actions.increaseUnitHealth(referenced, 1);
                    }

                }
            }
        ],
        cost: 9,     
    },
    {
        id: "A_15",
        name: "Joker",
        type: InstanceType.ARTIFACT,
        effectDesc: "+4 Mult* (Mult holds no meaning in this game.)",
        effects: [],
        cost: 1,     
    },
    {
        id: "A_16",
        name: "Very Very Interesting",
        type: InstanceType.ARTIFACT,
        effectDesc: "Gaster blasters cost -2 (will give you $2 upon playing it, fuck you )", // (so you still need 4$ to play it..?)
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_SPELL_PLAYED],
                execute: (ctx: EffectContext) => {
                    const referenced = ctx.data.referenced;
                    if (referenced && referenced.id === "S_666") {
                        const playerState = ctx.actions.getPlayerState(ctx.data.playerId);
                        ctx.actions.increasePlayerMoney(playerState, 2);
                    }
                }
            }
        ],
        cost: 5,     
    },
    {
        id: "A_17",
        name: "1000 Blank White Cards", // TODO:
        type: InstanceType.ARTIFACT,
        effectDesc: "",
        effects: [
            {
                trigger: [],
                execute: (ctx: EffectContext) => {
                   
                }
            }
        ],
        cost: 5,     
    },
];

export const artifactsMap = new Map<string, ArtifactInstance>(
    ArtifactList.map((spell) => [spell.id, spell])
);