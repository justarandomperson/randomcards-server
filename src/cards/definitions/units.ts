import { CardType, UnitInstance } from '../cards.types';


export const unitCards: UnitInstance[] = [
    {
        id: "1",
        name: "dog",
        type: CardType.UNIT,
        effectDesc: "im dog",
        effects: [],
        cost: 3,
        hp: 1,
        atk: 2,
    }
/*
        name: "sans the skeleton",
        atk: 1,
        hp: 1,
        cost: 6,
        effects: [
            {
                trigger: ["onSummon", "onTurnStart"],
                execute: (ctx) => {
                    ctx.actions.addCardToPlayerHand(ctx.game, "666", ctx.playerId)
                }
            }
        ],
        id: "11"
    },
*/
];
