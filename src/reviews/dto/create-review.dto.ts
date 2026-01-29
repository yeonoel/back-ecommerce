import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Length, Max, Min, min } from "class-validator";

export class CreateReviewDto {
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  @Type(() => Number)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @Length(5, 200, { message: 'Title must be between 5 and 200 characters' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 2000, { message: 'Comment must be between 10 and 2000 characters' })
  comment: string;
}