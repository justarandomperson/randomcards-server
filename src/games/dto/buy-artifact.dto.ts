import { IsString } from "class-validator";


export default class BuyArtifactDto {
    @IsString()
    instanceId: string;
}