import { Type } from "class-transformer";
import { IsBoolean, IsString } from "class-validator";

export class UpdateApproveStatusDto {
    @IsBoolean()
    @Type(() => Boolean)
    isApproved: boolean;
    @IsString()
    @Type(() => String)
    reviewId: string;
}