import { CardType, UnitInstance } from '../cards.types';


const unitList: UnitInstance[] = [
    {
        id: "U_1",
        name: "dog",
        type: CardType.UNIT,
        effectDesc: "im dog",
        effects: [],
        cost: 3,
        hp: 1,
        atk: 2,
    },
    {
        id: "U_11",
        name: "sans the skeleton",
        type: CardType.UNIT,
        effectDesc: "sans attacks",
        effects: [
            {
                trigger: ["summon", "turn_start"],
                execute: (ctx) => {
                    ctx.game.actions.createSpellToPlayerHandFromId(ctx.playerId, "666")
                }
            }
        ],
        cost: 6,
        hp: 1,
        atk: 1
    },
    {
        id: "U_12",
        name: "Green Gaster",
        type: CardType.UNIT,
        effectDesc: "Summon: Turns an unit to green (deals 1 damage)",
        effects: [
            {
                trigger: ["summon"],
                execute: (ctx) => {
                    //maybe later store the effect "magic numbers" somewhere else
                    //probably still inside the card

                    if (ctx.targetId) ctx.game.actions.damageUnit(ctx.targetId, 1)
                }
            }
        ],
        cost: 6,
        hp: 6,
        atk: 6
    }
];

export const unitCards = new Map<string, UnitInstance>(
    unitList.map((spell) => [spell.id, spell])
);