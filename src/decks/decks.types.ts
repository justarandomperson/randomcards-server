import { SpellInstance, UnitInstance } from "../instances/shared/instances.types"


export type Deck = {
  units: UnitInstance[],
  spells: SpellInstance[]
}

export type Storage = {
  units: UnitInstance[],
  spells: [string, { data: SpellInstance, amount: number }][];
}

export type DeckIds = {
  unitIds: string[]
  spellIds: string[]
}