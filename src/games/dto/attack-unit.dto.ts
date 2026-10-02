import { IsString } from "class-validator";


export default class AttackUnitDto {
    @IsString()
    attackerId: string;

    @IsString()
    targetId: string;
}