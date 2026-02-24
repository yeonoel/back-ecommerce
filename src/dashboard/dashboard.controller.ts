
import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from 'src/common/guards/roles.gaurds';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("/overview")
  async getStats() {
    return this.dashboardService.getStats();
  }

    @Get('admin/stats')
    @Roles('admin')
    getProductsStats() {
      return this.dashboardService.getProductsStats();
    }
}

