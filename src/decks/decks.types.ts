import { SpellInstance, UnitInstance } from "../cards/cards.types"


export type Deck = {
  units: UnitInstance[]
  spells: SpellInstance[]
}

export type DeckIds = {
  unitIds: string[]
  spellIds: string[]
}