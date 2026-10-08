import { IsInt, IsString, Max, Min } from "class-validator";


export default class SelectedTargetDto {
    @IsString()
    instanceId: string;
}