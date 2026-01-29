import { ReviewAuthorDto } from "../review-author.dto";

export class ReviewResponseDto {
  id: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  author: ReviewAuthorDto;
  createdAt: Date;
  updatedAt: Date;
}