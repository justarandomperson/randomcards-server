import { ArtifactInstance, ClientArtifactData } from "../../artifacts/artifacts.types";
import { ClientSpellData, ClientUnitData, SpellInstance, UnitInstance } from "../../cards/cards.types";
import { DeckIds } from "../../matchmaking/matchmaking.types";
import { ClientPlayerData, Deck, PlayerState } from "../shared/games.types";


export const playerStateToClient = (player: PlayerState): ClientPlayerData => {
    // TODO: make this
}

export const deckIdsToDeck = (deckIds: DeckIds): Deck => {
    // TODO: make this
    // TODO: this also should check if the deck is valid, naturally
}

export const unitInstanceToClient = (unit: UnitInstance): ClientUnitData => {
    // TODO: make this
}

export const spellInstanceToClient = (spell: SpellInstance): ClientSpellData => {
    // TODO: make this
}

export const artifactInstanceToClient = (artifact: ArtifactInstance): ClientArtifactData => {
    // TODO: make this
}
