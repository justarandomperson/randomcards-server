import { IsBoolean, IsString } from "class-validator";


export default class AttackPlayerDto {
    @IsString()
    attackerId: string;

    @IsBoolean()
    isOpponent: boolean;
}