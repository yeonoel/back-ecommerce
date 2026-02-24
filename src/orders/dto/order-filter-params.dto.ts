import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";

export class OrderFilterParams extends PartialType(PaginationDto) {
    @IsOptional()
    @Type(() => String)
    @IsString()
    status?: string;
    @IsOptional()
    @Type(() => Date)
    date?: Date;
}