import { SpellInstance, UnitInstance } from "../cards/cards.types"


export type Deck = {
  units: UnitInstance[],
  spells: SpellInstance[]
}

export type Storage = {
  units: UnitInstance[],
  spells: Map<string, { data: SpellInstance, amount: number }> 
}

export type StorageObject = {
    units: UnitInstance[],
    spells: [string, {
        data: SpellInstance;
        amount: number;
    }][];
}

export type DeckIds = {
  unitIds: string[]
  spellIds: string[]
}