import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ResponseDto } from 'src/common/dto/responses/Response.dto';
import { OrderDto } from './dto/response/order-dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.gaurds';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponseDto } from 'src/common/dto/responses/paginated-response.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@CurrentUser() user: any,@Body() createOrderDto: CreateOrderDto): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.createOrder(user.id, createOrderDto);
  }

  @Get()
  async getMyOrders(@CurrentUser() user: any, @Query() paginationDto: PaginationDto): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    return await this.ordersService.getUserOrders(user.id, paginationDto);
  }

  @Get(':id')
  async getOrder(@CurrentUser() user: any, @Param('id') orderId: string,): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.getOrderById(user.id, orderId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@CurrentUser() user: any, @Param('id') orderId: string,): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.cancelOrder(user.id, orderId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateOrderStatus(@Param('id') orderId: string,@Body() updateStatusDto: UpdateOrderStatusDto): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.updateOrderStatus(orderId,updateStatusDto.status);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllOrders(@Query() paginationDto: PaginationDto): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    return await this.ordersService.getAllOrders(paginationDto);
  }
}