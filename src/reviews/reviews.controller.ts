import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateApproveStatusDto } from './dto/update-approve-status.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('products/:productId/reviews')
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @Param('productId') productId: string,@Body() createReviewDto: CreateReviewDto,@Req() req: any,) {
    const userId = req.user.id;
    return this.reviewsService.create(productId, userId, createReviewDto);
  }

  @Get('products/:productId/reviews')
  async getProductReviews(@Param('productId') productId: string,@Query() queryDto: QueryReviewsDto,) {
    return this.reviewsService.findByProduct(productId, queryDto);
  }

  @Get('products/:productId/reviews/can-review')
  async canReview(@Param('productId') productId: string, @Req() req: any,) {
    const userId = req.user.id;
    const canReview = await this.reviewsService.canUserReview(userId, productId);
    return { canReview };
  }

  @Get('reviews/:id')
  async getReview(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch('reviews/:id')
  async updateReview( @Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto, @Req() req: any) {
    const userId = req.user.id;
    return this.reviewsService.update(id, userId, updateReviewDto);
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReview(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    return this.reviewsService.remove(id, userId, isAdmin);
  }

  @Get('admin/reviews/pending')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getPendingReviews(@Query() pagination: PaginationDto) {
    return this.reviewsService.findPendingReviews(pagination);
  }

  @Patch('admin/reviews/:id/approve')
  @Roles('admin')
  async approveReview(@Param('id') id: string, @Body() body: UpdateApproveStatusDto) {
    return this.reviewsService.updateApprovalStatus(id, body.isApproved);
  }
}