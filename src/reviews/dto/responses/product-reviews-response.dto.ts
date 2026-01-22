import { ReviewResponseDto } from "./review-response.dto";

export class ProductReviewsResponseDto {
  data: ReviewResponseDto[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  page: number;
  limit: number;
  totalPages: number;
}