import { EFFECT_TRIGGERS } from "../effects/effects.types";
import { ArtifactInstance } from "./artifacts.types";


const ArtifactList: ArtifactInstance[] = [
    {
        id: "A_1",
        name: "random ball",
        effectDesc: "a chance it deals an unspecified amount of damage to an opponents unit, in an unspecified manner.",
        effects:  [
                    // TODO: just have all effect triggers, but randomize if it actually attacks
                ],
        cost: 3,
    }
];

export const Artifacts = new Map<string, ArtifactInstance>(
    ArtifactList.map((spell) => [spell.id, spell])
);