import { Effect } from './effect.types';

export type UnitInstance = {
  name: string;
  atk: number;
  hp: number;
  cost: number;
  id: string;
  ownerID?: string;

  effects: Effect[];
};

export type SpellInstance = {
  name: string;
  cost: number;
  id: string;

};

export type Card = {
  id: string;
};
