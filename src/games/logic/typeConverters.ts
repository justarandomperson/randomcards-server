import { ArtifactInstance, ClientArtifactData } from "../../artifacts/artifacts.types";
import { ClientSpellData, ClientUnitData, SpellInstance, UnitInstance } from "../../cards/cards.types";
import { ClientPlayerData, PlayerState } from "../shared/games.types";


export const playerStateToClient = (player: PlayerState): ClientPlayerData => {
    const clientArtifacts: ClientArtifactData[] = player.artifacts.map(
        (artifact) => artifactInstanceToClient(artifact)
    );

    const clientPlayerData: ClientPlayerData = {
        name: player.name,
        health: player.health,
        money: player.money,
        turn: player.turn,
        drawpileCount: player.drawpile.length,
        artifacts: clientArtifacts
    };

    return clientPlayerData;
}

export const unitInstanceToClient = (unit: UnitInstance): ClientUnitData => {
    const clientUnitData: ClientUnitData = {
        instanceId: unit.instanceId,
        id: unit.id,
        name: unit.name,
        type: unit.type,
        effectDesc: unit.effectDesc,
        statuses: unit.statuses,
        cost: unit.cost,
        hp: unit.hp,
        atk: unit.atk
    };

    return clientUnitData;
}

export const spellInstanceToClient = (spell: SpellInstance): ClientSpellData => {
    const clientSpellData: ClientSpellData = {
        instanceId: spell.instanceId,
        id: spell.id,
        name: spell.name,
        type: spell.type,
        effectDesc: spell.effectDesc,
        cost: spell.cost,
    };

    return clientSpellData;
}

export const artifactInstanceToClient = (artifact: ArtifactInstance): ClientArtifactData => {
    const clientArtifactData: ClientArtifactData = {
        instanceId: artifact.instanceId,
        id: artifact.id,
        name: artifact.name,
        effectDesc: artifact.effectDesc,
        cost: artifact.cost
    };

    return clientArtifactData;
}