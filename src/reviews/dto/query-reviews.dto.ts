import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { SortOrder } from "src/common/enums/sort-order.enum";
import { ReviewSortBy } from "src/common/enums/review-sort-by.enum";

export class QueryReviewsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ReviewSortBy)
  sortBy?: ReviewSortBy = ReviewSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  filterByRating?: number;
}