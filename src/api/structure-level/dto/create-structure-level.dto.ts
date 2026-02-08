import { IsEnum, IsNotEmpty, IsOptional } from "class-validator"
import { StructureStatusEnum } from "src/utils/enums/structure.enum"

export class CreateStructureLevelDto {
    @IsNotEmpty()
    name:string

    @IsNotEmpty()
    code:string

    @IsOptional()
    @IsEnum(StructureStatusEnum)
    status: StructureStatusEnum

    @IsOptional()
    description:string
}
