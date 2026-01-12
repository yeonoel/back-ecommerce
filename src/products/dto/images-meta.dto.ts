import { IsOptional, IsString } from "class-validator";

export class ImagesMetaDto {
    @IsOptional()
    @IsString()
    altText?: string;
    @IsOptional()
    @IsString()
    isPrimary?: boolean;
    @IsOptional()
    @IsString()
    displayOrder?: number;
}