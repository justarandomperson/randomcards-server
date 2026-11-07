import { EFFECT_TRIGGERS, EffectContext, Status } from "../../effects/effects.types";
import { getRandomInt } from "../../games/logic/serviceHelpers";
import { InstanceType, InstanceZone, SpellInstance, UnitInstance } from "../shared/instances.types";
import { targetOption } from "../../games/shared/games.types";
import { WsException } from "@nestjs/websockets";


const spellList: SpellInstance[] = [
    {
        id: "S_1",
        name: "cat (non corporeal)",
        type: InstanceType.SPELL,
        effectDesc: "though I may bear the semblance of canine form, I possess no corporeal body whatsoever. " +
                    "Pray, doth it befit thee to name such a being a cat?" +
                    "Farewell, and may the hours yet before you be wondrous and fair!",
        effects: [],
        cost: 0,
        isToken: false
    },
    {
        id: "S_2",
        name: "Flex",
        type: InstanceType.SPELL,
        effectDesc: "Give an ally monster +2 ATK",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: new Set([targetOption.ALLY]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitAttack(ctx.data.targetUnit, 2);
                    }
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_3",
        name: "I love you 😘😍💘",
        type: InstanceType.SPELL,
        effectDesc: "Take 3 hp off of yourself and give it to one of your units",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: new Set([targetOption.ALLY]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackPlayer(ctx.data.playerId, 3);
                        ctx.actions.increaseUnitHealth(ctx.data.targetUnit, 3);
                    }
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_4",
        name: "cooldown hating spell",
        type: InstanceType.SPELL,
        effectDesc: "remove 1 turn from one of your benched unit's cooldown",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: new Set([targetOption.BENCH]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitCooldown(ctx.data.targetUnit, -1);
                    }   
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_5",
        name: "Cast",
        type: InstanceType.SPELL,
        effectDesc: "Play the leftmost orb in your hand.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const playerHand = ctx.actions.getPlayerState(ctx.data.playerId).hand;

                    for (const spell of playerHand) {
                        if (["S_8", "S_9", "S_10"].includes(spell.id)) {
                            ctx.actions.useSpell(ctx.data.playerId, spell);
                            break;
                        }
                    }
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_6",
        name: "Maragi",
        type: InstanceType.SPELL,
        effectDesc: "Deals 2 damage to all enemies.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);

                    for (const unit of opponentUnits) {
                        ctx.actions.attackUnit(ctx.data.playerId, unit.unit, 2);
                    }
                }
            }
        ],
        cost: 4,
        isToken: false
    },
    {
        id: "S_7",
        name: "Shiv",
        type: InstanceType.SPELL,
        effectDesc: "Deal 3 Damage to a monster.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget:  new Set([targetOption.ALLY, targetOption.ENEMY]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackUnit(ctx.data.playerId, ctx.data.targetUnit, 3);
                    }

                    // Note: do silent's effect of giving any of your silents +1 ATK
                    const playerUnits = ctx.actions.getPlayerUnits(ctx.data.playerId);
                    for (const slot of playerUnits) {
                        if (slot.unit.id === 'U_8') {
                            ctx.actions.increaseUnitAttack(slot.unit, 1);
                        }
                    }
                }
            }
        ],
        cost: 0,
        isToken: true
    },
        {
        id: "S_8",
        name: "Lightning Orb",
        type: InstanceType.SPELL,
        effectDesc: "Deal 2 Damage to a random enemy monster.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);
                    
                    if (opponentUnits.length > 0) {
                        const randomNumber = getRandomInt(1, opponentUnits.length - 1);
                        ctx.actions.attackUnit(ctx.data.playerId, opponentUnits[randomNumber].unit, 2);
                    }
                }
            }
        ],
        cost: 1,
        isToken: true
    },
    {
        id: "S_9",
        name: "Frost Orb",
        type: InstanceType.SPELL,
        effectDesc: "Heal yourself by 4 HP or one of your units by 2 HP.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget:  new Set([targetOption.ALLY, targetOption.SELF]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitHealth(ctx.data.targetUnit, 2);
                    }
                    else if (ctx.data.targetPlayerId) {
                        ctx.actions.increasePlayerHealth(ctx.actions.getPlayerState(ctx.data.targetPlayerId), 4);
                    }
                    
                }
            }
        ],
        cost: 2,
        isToken: true
    },
    {
        id: "S_10",
        name: "Dark Orb",
        type: InstanceType.SPELL,
        effectDesc: "Deals 3 damage times the amount of Dark Orbs you have in your hand " +
                    "to the opponent's unit with the least HP.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const playerHand = ctx.actions.getPlayerState(ctx.data.playerId).hand;
                    let damage = 0; // spell effect runs before its removed from hand

                    for (const spell of playerHand) {
                        if (spell.id === "S_10") {
                            damage += 3;
                        }
                    }

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
                        ctx.actions.attackUnit(ctx.data.playerId, unitToAttack, damage);
                    }
                }
            }
        ],
        cost: 3,
        isToken: true
    },
    {
        id: "S_11",
        name: "Darkness",
        type: InstanceType.SPELL,
        effectDesc: "Add 2 Dark Orbs to your hand. They cost 1$ more.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    for (let i = 0; i < 2; i++) {
                        const darkOrb = ctx.instances.createSpellInstance("S_10", ctx.data.playerId);
                        ctx.actions.addSpellToHand(ctx.actions.getPlayerState(ctx.data.playerId), darkOrb);
                        ctx.actions.increaseCardCost(darkOrb, 1);
                    }
                }
            }
        ],
        cost: 3,
        isToken: false
    },
        {
        id: "S_12",
        name: "/kill",
        type: InstanceType.SPELL,
        effectDesc: "Kill a unit.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget:  new Set([targetOption.ALLY, targetOption.ENEMY]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackUnit(ctx.data.playerId, ctx.data.targetUnit, ctx.data.targetUnit.hp);
                    }
                }
            }
        ],
        cost: 5,
        isToken: false
    },
    {
        id: "S_13",
        name: "/mute",
        type: InstanceType.SPELL,
        effectDesc: "Silence and paralyze a unit.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget:  new Set([targetOption.ALLY, targetOption.ENEMY]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.addUnitStatus(ctx.data.targetUnit, Status.SILENCED);
                        ctx.actions.addUnitStatus(ctx.data.targetUnit, Status.PARALYZED);
                    }
                }
            }
        ],
        cost: 5,
        isToken: false
    },
    {
        id: "S_14",
        name: "Skeleton Army",
        type: InstanceType.SPELL,
        effectDesc: "Fill your board with skeletons.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const playerBoard = ctx.actions.getPlayerBoard(ctx.data.playerId);

                    for (const slot of playerBoard) {
                        if (!slot.unit) {
                            const skeleton = ctx.instances.createUnitInstance("U_16", ctx.data.playerId);
                            ctx.actions.summonUnit(ctx.data.playerId, skeleton, slot.index);
                        }
                    }
                }
            }
        ],
        cost: 3,
        isToken: false
    },
    {
        id: "S_15",
        name: "Offering",
        type: InstanceType.SPELL,
        effectDesc: "Lose 4 HP, Gain 3$ and draw 2 cards.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    ctx.actions.decreasePlayerHealth(ctx.actions.getPlayerState(ctx.data.playerId), 6);
                    ctx.actions.increasePlayerMoney(ctx.actions.getPlayerState(ctx.data.playerId), 6);

                    ctx.actions.drawSpell(ctx.data.playerId);
                    ctx.actions.drawSpell(ctx.data.playerId);
                }
            }
        ],
        cost: 0,
        isToken: false
    },
    {
        id: "S_16",
        name: "i need more bullets",
        type: InstanceType.SPELL,
        effectDesc: "give haste to an ally unit.",
        effects: [
            {
                //change to give haste
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: new Set([targetOption.ALLY]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.addUnitStatus(ctx.data.targetUnit, Status.HASTE);
                    }
                }
            }
        ],
        cost: 3,
        isToken: false
    },
    {
        id: "S_17",
        name: "Pot of Greed",
        type: InstanceType.SPELL,
        effectDesc: "Draw 2 cards.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    ctx.actions.drawSpell(ctx.data.playerId);
                    ctx.actions.drawSpell(ctx.data.playerId);
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_666",
        name: "Gaster Blaster",
        type: InstanceType.SPELL,
        effectDesc: "i will blast your glast (deal 8 damage to a unit)",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget:  new Set([targetOption.ALLY, targetOption.ENEMY]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.attackUnit(ctx.data.playerId, ctx.data.targetUnit, 8);
                    }
                }
            }
        ],
        cost: 4,
        isToken: false
    },
    {
        id: "S_18",
        name: "Jarona",
        type: InstanceType.SPELL,
        effectDesc: "Ally unit attacks a random enemy with +2 ATK, doesn't take damage",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget:  new Set([targetOption.ALLY]),
                execute: (ctx: EffectContext) => {
                    const target = ctx.data.targetUnit;

                    if (target) {
                        const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId)

                        const randomUnit = opponentUnits[getRandomInt(0, opponentUnits.length - 1)];
                        if (randomUnit.unit) {
                            ctx.actions.attackUnit(ctx.data.playerId, randomUnit.unit, target.atk + 2, target);
                        }
                    }
                }
            }
        ],
        cost: 5,
        isToken: false
    },
    {
        id: "S_19",
        name: "Hand Jump",
        type: InstanceType.SPELL,
        effectDesc: "Activate an unit's summon ability again",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget:  new Set([targetOption.ALLY, targetOption.ENEMY]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        const summonEffects = ctx.data.targetUnit.effects.filter((effect) => effect.trigger.includes(EFFECT_TRIGGERS.SUMMONED));

                        const newContext: EffectContext = {
                            ...ctx,
                            data: {
                                ...ctx.data,
                                source: ctx.data.targetUnit
                            }
                        };

                        summonEffects.map((effect) => {
                            effect.execute(newContext);
                        });
                    }
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_20",
        name: "Sacrifice the rook",
        type: InstanceType.SPELL,
        effectDesc: "Kill an ally unit, deal it's ATK to all enemy units",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget:  new Set([targetOption.ALLY]),
                execute: (ctx: EffectContext) => {
                    const target = ctx.data.targetUnit;
                    if (target) {
                        ctx.actions.decreaseUnitHealth(target, target.hp);

                        const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);
                        for (const unit of opponentUnits) {
                            ctx.actions.decreaseUnitHealth(unit.unit, target.atk);
                        }
                    }
                }
            }
        ],
        cost: 4,
        isToken: false
    },
    {
        id: "S_21",
        name: "❤️ Proceed",
        type: InstanceType.SPELL,
        effectDesc: "Select an ally unit, the enemy unit in front of it gets paralyzed and the ally unit gains its ATK.",
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget:  new Set([targetOption.ALLY]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        const cardLocation = ctx.instances.getLocationIndex(ctx.data.targetUnit, InstanceZone.BOARD);
                        const enemyUnit = ctx.actions.getUnitInfront(cardLocation)
                        if (enemyUnit) {
                            ctx.actions.addUnitStatus(enemyUnit, Status.PARALYZED);
                            ctx.actions.increaseUnitAttack(ctx.data.targetUnit, enemyUnit.atk);
                        }
                    }
                }
            }
        ],
        cost: 4,
        isToken: false
    },
    {
        id: "S_22",
        name: "Does he know?",
        type: InstanceType.SPELL,
        effectDesc: 'Either generates a "He doesn\'t know!" for you, or "He knows!" for your opponent. ',
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const rnd = Math.random();
                    const id = rnd > .5 ? "S_23" : "S_24";
                    const ownerId = rnd > .5 ? ctx.data.playerId : ctx.actions.getOpponentId(ctx.data.playerId);

                    const spellInstance = ctx.instances.createSpellInstance(id, ownerId);
                    const ownerState = ctx.state.players.get(ownerId)

                    if (!ownerState) throw new WsException("Couldn't get owner ")

                    ctx.actions.addSpellToHand(ownerState, spellInstance);
                }
            }
        ],
        cost: 2,
        isToken: false
    },
    {
        id: "S_23",
        name: "He doesn't know!",
        type: InstanceType.SPELL,
        effectDesc: 'Deal 4 damage to an enemy unit',
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: new Set([targetOption.ENEMY]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.decreaseUnitHealth(ctx.data.targetUnit, 4);
                    }
                }
            }
        ],
        cost: 0,
        isToken: true
    },
    {
        id: "S_24",
        name: "He knows!",
        type: InstanceType.SPELL,
        effectDesc: 'Give 4 HP to an ally unit',
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                hasTarget: new Set([targetOption.ALLY]),
                execute: (ctx: EffectContext) => {
                    if (ctx.data.targetUnit) {
                        ctx.actions.increaseUnitHealth(ctx.data.targetUnit, 4);
                    }
                }
            }
        ],
        cost: 0,
        isToken: true
    },
    {
        id: "S_25", // TODO: add pic
        name: "Miku Miku Beam!!!",
        type: InstanceType.SPELL,
        effectDesc: 'Deal 5 damage to a random enemy unit.',
        effects: [
            {
                trigger: [EFFECT_TRIGGERS.SUMMONED],
                execute: (ctx: EffectContext) => {
                    const opponentUnits = ctx.actions.getOpponentUnits(ctx.data.playerId);

                    const optionsAmount = opponentUnits.length;
                    const randomNumber = getRandomInt(0, optionsAmount - 1);

                    ctx.actions.attackUnit(ctx.data.playerId, opponentUnits[randomNumber].unit, 5);
                }
            }
        ],
        cost: 0,
        isToken: true
    },
];

export const spellsMap = new Map<string, SpellInstance>(
    spellList.map((spell) => [spell.id, spell])
);