import { EFFECT_TRIGGERS, EffectContext } from "../../effects/effects.types";
import { getRandomInt } from "../../games/logic/serviceHelpers";
import { MAX_HAND_SIZE } from "../../games/shared/games.constants";
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
                    const willTrigger = ctx.actions.RNGCheck(1/8, ctx.data.playerId);

                    if (willTrigger) {
                        // rng damage
                        const damageWeights = new Map<number, number>([
                            [1, 50], [2, 25], [3, 12], [4, 6], [5, 3], [6, 2], [7, 1], [8, 1], [9, 0.5], [10, 0.5]
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

                        if (opponentUnits.length > 0) {
                            const optionsAmount = opponentUnits.length + 1; // 1 for opponent itself
                            const randomNumber = getRandomInt(1, optionsAmount);

                            // attack
                            if (randomNumber === optionsAmount) { // got biggest number? attack opponent
                                ctx.actions.attackPlayer(ctx.actions.getOpponentId(ctx.data.playerId), damage);
                            }  
                            else {
                                const target = opponentUnits[randomNumber - 1];
                                if (target) {
                                    ctx.actions.decreaseUnitHealth(target.unit, damage);
                                }
                            }
                        }
                    }
                }
            }
        ],
        cost: 7,
    },
    {
        id: "A_2",
        name: "Vampire Survivor",
        type: InstanceType.ARTIFACT,
        effectDesc: "Every time one of your units die, heal 1 HP.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_DIED],
                execute: (ctx: EffectContext) => {
                    const referenced = ctx.data.referenced;

                    if (referenced && ctx.instances.getOwnerId(referenced) === ctx.instances.getOwnerId(ctx.data.source)) {
                        ctx.actions.increasePlayerHealth(ctx.actions.getPlayerState(ctx.data.playerId), 1);
                    }
                }
            }
        ],
        cost: 9, 
    },
    {
        id: "A_3",
        name: "Vampire Destructor",
        type: InstanceType.ARTIFACT,
        effectDesc: "Every time one of your units is summoned, deal 1 damage to a random opponent's unit.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_SUMMONED],
                execute: (ctx: EffectContext) => {
                    const referenced = ctx.data.referenced;

                    if (referenced && ctx.instances.getOwnerId(referenced) === ctx.instances.getOwnerId(ctx.data.source)) {
                        const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);
                        const randomNumber = getRandomInt(1, opponentUnits.length);

                        ctx.actions.attackUnit(ctx.data.playerId, opponentUnits[randomNumber - 1].unit, 1);
                    }
                }
            }
        ],
        cost: 9, 
    },
    {
        id: "A_4",
        name: "Tal's Idea (technically)",
        type: InstanceType.ARTIFACT,
        effectDesc: "Win the game.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.BOUGHT],
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
                    "Lightning Orbs you play activate twice.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.BOUGHT],
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

                    if (referenced && referenced.id === "S_8" && 
                        ctx.instances.getOwnerId(referenced) === ctx.instances.getOwnerId(ctx.data.source)) {
                            const lightningOrb = ctx.instances.createSpellInstance("S_8", ctx.data.playerId);
                            ctx.actions.useSpell(ctx.data.playerId, lightningOrb);
                    }
                }
            }
        ],
        cost: 7,     
    },
    {
        id: "A_6",
        name: "Hype moments & aura",
        type: InstanceType.ARTIFACT,
        effectDesc: "If you reach exactly 1 HP, you deal 10 damage to all off the opponent's units, then disable this.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.PLAYER_DAMAGED],
                execute: (ctx: EffectContext) => {
                    const data = ctx.instances.getAdditionalData(ctx.data.source);

                    if (data["disabled"] === false) {
                        const playerHp = ctx.actions.getPlayerState(ctx.data.playerId).hp;

                        if (playerHp === 1) {
                            const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);

                            for (const unit of opponentUnits) {
                                ctx.actions.attackUnit(ctx.data.playerId, unit.unit, 10);
                            }

                            data["disabled"] = true;
                        }
                    }
                }
            }
        ],
        additionalData: {
            "disabled": false
        },
        cost: 6,     
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
        cost: 5,     
    },
    {
        id: "A_8",
        name: "Armor kind of",
        type: InstanceType.ARTIFACT,
        effectDesc: "Every time you get hit, heal 2 HP. (you won't heal if you die though, fuck you)",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.PLAYER_DAMAGED],
                execute: (ctx: EffectContext) => {
                    const playerState = ctx.actions.getPlayerState(ctx.data.playerId)
                    if (playerState.hp > 0) ctx.actions.increasePlayerHealth(ctx.actions.getPlayerState(ctx.data.playerId), 2);
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
        cost: 9,     
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
                    const attacker = ctx.data.attacker;

                    if (attacker && ctx.instances.getOwnerId(attacker) !== ctx.instances.getOwnerId(ctx.data.source)) {
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
                trigger: [EFFECT_TRIGGERS.BOUGHT],
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
                trigger: [EFFECT_TRIGGERS.BOUGHT],
                execute: (ctx: EffectContext) => {
                    const playerBench = ctx.actions.getPlayerState(ctx.data.playerId).bench;
                    const playerUnits = ctx.actions.getPlayerUnits(ctx.data.playerId);
                    playerBench.map((unit) => {
                        if (unit && unit.id == "U_25" && unit.additionalData)
                        {
                            unit.additionalData["triggers"] = 2
                        }
                    })

                    playerUnits.map((slot) => {
                        const unit = slot.unit
                        if (unit && unit.id == "U_25" && unit.additionalData)
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
        effectDesc: "Whenever an enemy unit is killed, summon a 1/1 copy.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_DIED],
                execute: (ctx: EffectContext) => {
                    const referenced = ctx.data.referenced
                    const source = ctx.data.source

                    if (referenced && ctx.instances.getOwnerId(referenced) != ctx.instances.getOwnerId(source))
                    {
                        const instanceCopy = ctx.instances.createUnitInstance(referenced.id, ctx.data.playerId)
                        instanceCopy.atk = 1
                        instanceCopy.hp = 1
                        ctx.actions.summonUnit(ctx.data.playerId, instanceCopy)
                    }
                }
            }
        ],
        cost: 10,     
    },
    {
        id: "A_14",
        name: "White Pen Of Hope",
        type: InstanceType.ARTIFACT,
        effectDesc: "Whenever one of your units is summoned, it gains +1 HP.",
        effects: [
          {
                trigger: [EFFECT_TRIGGERS.ANY_SUMMONED],
                execute: (ctx: EffectContext) => {
                    const referenced = ctx.data.referenced;
                    
                    if (referenced && referenced.type === InstanceType.UNIT && 
                        ctx.instances.getOwnerId(referenced) === ctx.instances.getOwnerId(ctx.data.source)) {
                            ctx.actions.increaseUnitHealth(referenced, 1, false);
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
        cost: 0,     
    },
    {
        id: "A_16",
        name: "Very Very Interesting",
        type: InstanceType.ARTIFACT,
        effectDesc: "Gaster blasters cost -2 (will give you $2 upon playing it, fuck you )",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_SPELL_PLAYED],
                execute: (ctx: EffectContext) => {
                    const referenced = ctx.data.referenced;
                    
                    if (referenced && referenced.id === "S_666" && 
                        ctx.instances.getOwnerId(referenced) === ctx.instances.getOwnerId(ctx.data.source)) {
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
        name: "1000 Blank White Cards",
        type: InstanceType.ARTIFACT,
        effectDesc: "Turn End: Fill your hand with Blank White Cards, until all 1000 blank white cards are used.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.TURN_END],
                execute: (ctx: EffectContext) => {
                    const source = ctx.instances.typeInstance(ctx.data.source, InstanceType.ARTIFACT);
                    const data = ctx.instances.getAdditionalData(source);

                    const player = ctx.actions.getPlayerState(ctx.data.playerId);

                    while (data["cards"] > 0 && player.hand.length < MAX_HAND_SIZE) {
                        const blankWhiteCard = ctx.instances.createSpellInstance("S_26", ctx.data.playerId);
                        ctx.actions.addSpellToHand(player, blankWhiteCard);

                        data["cards"] -= 1;
                    }
                }
            }
        ],
        additionalData: {
            "cards": 1000
        },
        cost: 10,     
    },
    {
        id: "A_18",
        name: "Piggy Bank", 
        type: InstanceType.ARTIFACT,
        effectDesc: "Gain 1$ whenever an enemy unit dies",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_DIED],
                execute: (ctx: EffectContext) => {
                   const referenced = ctx.data.referenced;
                   const source = ctx.data.source

                   if (referenced && ctx.instances.getOwnerId(referenced) !== ctx.instances.getOwnerId(source))
                   {
                        const playerState = ctx.actions.getPlayerState(ctx.data.playerId)
                        ctx.actions.increasePlayerMoney(playerState, 1)
                   }
                }
            }
        ],
        cost: 5,     
    },
    {
        id: "A_19",
        name: "Thorn Ring", 
        type: InstanceType.ARTIFACT,
        effectDesc: "Ally units gain +1 ATK whenever they kill an enemy unit",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_KILLED],
                execute: (ctx: EffectContext) => {
                   const referenced = ctx.data.referenced;
                   const source = ctx.data.source

                   const artifactOwnerId = ctx.instances.getOwnerId(source)

                   if (referenced && ctx.instances.getOwnerId(referenced) !== artifactOwnerId)
                   {
                        const attacker = ctx.data.attacker
                        if (attacker && ctx.instances.getOwnerId(attacker) === artifactOwnerId)
                        {
                            ctx.actions.increaseUnitAttack(attacker, 1)
                        }
                   }
                }
            }
        ],
        cost: 5,     
    },
    {
        id: "A_20",
        name: "Death Note", 
        type: InstanceType.ARTIFACT,
        effectDesc: "Turn start: gain a counter. at 4 counters or above, whenever you attack a unit the counter is set to 0 and the attacked dies.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.TURN_START],
                execute: (ctx: EffectContext) => {
                    ctx.instances.getAdditionalData(ctx.data.source)["counter"]++
                }
            },
            {
                trigger: [EFFECT_TRIGGERS.ANY_ATTACKED],
                execute: (ctx: EffectContext) => {
                    const additionalData = ctx.instances.getAdditionalData(ctx.data.source)
                    const attacked = ctx.data.attacked
                    const attacker = ctx.data.attacker

                    const artifactOwnerId = ctx.instances.getOwnerId(ctx.data.source)

                    const validAttacked = attacked && ctx.instances.getOwnerId(attacked) !== artifactOwnerId
                    const validAttacker = attacker && ctx.instances.getOwnerId(attacker) === artifactOwnerId

                    if (validAttacked && validAttacker)
                    {
                        if (additionalData["counter"] >= 4)
                        {
                            additionalData["counter"] = 0
                            ctx.actions.decreaseUnitHealth(attacked, attacked.hp, undefined, true)
                        }
                    }
                }
            }
        ],
        additionalData: 
        {
            counter: 0
        },
        cost: 5,     
    },
    {
        id: "A_21",
        name: "Straightforward ball",
        type: InstanceType.ARTIFACT,
        effectDesc: "Turn end: deals 1 damage to the rightmost enemy unit.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.TURN_END],
                execute: (ctx: EffectContext) => {
                    const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);

                    if (opponentUnits.length > 0){
                        ctx.actions.decreaseUnitHealth(opponentUnits[opponentUnits.length - 1].unit, 1);
                    }
                }
            }
        ],
        cost: 9,     
    },
    {
        id: "A_22",
        name: "Tomfoolery",
        type: InstanceType.ARTIFACT,
        effectDesc: "Created units gain +1/+1",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.ANY_SUMMONED],
                execute: (ctx: EffectContext) => {
                    const referenced = ctx.data.referenced
                    if (referenced && referenced.type == InstanceType.UNIT && !referenced.assignedBenchSlot)
                    {
                        ctx.actions.increaseUnitAttack(referenced, 1)
                        ctx.actions.increaseUnitHealth(referenced, 1, false)
                    }
                }
            }
        ],
        cost: 10,     
    },
    {
        id: "A_23",
        name: "Russian Roulette",
        type: InstanceType.ARTIFACT,
        effectDesc: "Gain 15$, 1/6: Lose the game.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.BOUGHT],
                execute: (ctx: EffectContext) => {
                    const artifactOwnerId = ctx.instances.getOwnerId(ctx.data.source)
                    const suceeded = ctx.actions.RNGCheck(5/6, artifactOwnerId)
                    if (!suceeded) ctx.actions.endGame(ctx.actions.getOpponentId(artifactOwnerId))
                    else 
                    {
                        const playerState = ctx.actions.getPlayerState(artifactOwnerId)
                        ctx.actions.increasePlayerMoney(playerState, 15)
                    }
                }
            },
                
        ],
        cost: 0,     
    },
];

export const artifactsMap = new Map<string, ArtifactInstance>(
    ArtifactList.map((artifact) => [artifact.id, artifact])
);