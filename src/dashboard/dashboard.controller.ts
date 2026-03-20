
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from 'src/common/guards/roles.gaurds';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';

@Controller('dashboard/:slugStore/')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('seller')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get("overview")
  @UseGuards(JwtAuthGuard)
  @Roles('seller')
  async getStats(@Param('slugStore') slugStore: string, @CurrentUser() user: any) {
    return this.dashboardService.getStats(slugStore, user.id);
  }

  @Get('products/stats')
  @Roles('seller')
  getProductsStats(@CurrentUser() user: any, @Param('slugStore') slugStore: string) {
    return this.dashboardService.getProductsStats(slugStore, user.id);
  }
}