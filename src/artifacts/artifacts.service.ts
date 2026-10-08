import { WsException } from "@nestjs/websockets";
import { ArtifactInstance } from "./artifacts.types";


export class ArtifactsService {
    // intializers, getters setters
    getArtifactInstanceId(artifact: ArtifactInstance): string {
        if (!artifact.instanceId) {
            throw new WsException('artifact has no instanceId');
        }

        return artifact.instanceId;  
    }


    // services
    findArtifactInstance(instanceId: string, artifactList: (ArtifactInstance | null)[]): 
    { artifact: ArtifactInstance; index: number } {
        const index = artifactList.findIndex(
            (artifact) => artifact?.instanceId === instanceId
        );

        if (index === -1) {
            throw new WsException('target not found');
        }

        return { 
            artifact: artifactList[index]!, 
            index 
        };
    }
}