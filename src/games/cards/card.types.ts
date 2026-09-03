import { Effect } from "./effect.types";

export type CardInstance = {
    name: string;
    isUnit: boolean;
    atk: number;
    hp: number;
    cost: number;
    id: string;

    effects: Effect[];
};

export type Card = {
    id: string;
}