import { Effect } from './effect.types';


export enum CardType {
  UNIT = 'unit',
  SPELL = 'spell'
}


export type UnitInstance = {
  instanceId?: string
  id: string
  name: string
  ownerID?: string
  type: CardType.UNIT
  effectDesc: string
  effects: Effect[]
  cost: number
  atk: number
  hp: number
};

export type UnitData = {
  instanceId?: string
  id: string
  name: string
  type: CardType.UNIT
  effectDesc: string
  cost: number
  hp: number
  atk: number
}


export type SpellInstance = {
  instanceId?: string
  id: string
  name: string
  ownerID?: string
  type: CardType.SPELL
  effectDesc: string
  effects: Effect[]
  cost: number
};


export type SpellData = {
  instanceId?: string
  id: string
  name: string
  type: CardType.SPELL
  effectDesc: string
  cost: number
}