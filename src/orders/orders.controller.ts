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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { OrderFilterParams } from './dto/order-filter-params.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async createOrder(@CurrentUser() user: any,@Body() createOrderDto: CreateOrderDto): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.createOrder(user?.id, createOrderDto);
  }

  @Get('/get-order/:id')
  async getOrder(@CurrentUser() user: any, @Param('id') orderId: string,): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.getOrderById(user?.id, orderId);
  }

  @Delete('/cancel-order/:id')
  @ApiOperation({ summary: 'Cancel an order' })
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@CurrentUser() user: any, @Param('id') orderId: string,): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.cancelOrder(user?.id, orderId);
  }

  @Get('/my-orders/all')
  @ApiOperation({ summary: 'Get my orders (paginated)' })
  async getMyOrders(@CurrentUser() user: any, @Query() paginationDto: PaginationDto): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    return await this.ordersService.getUserOrders(user?.id, paginationDto);
  }

  @Patch('admin/:id/status')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update order status (admin)' })
  @Roles('admin')
  async updateOrderStatus(@Param('id') orderId: string,@Body() updateStatusDto: UpdateOrderStatusDto): Promise<ResponseDto<OrderDto>> {
    console.log("================================================-------------------------------------------------")
    console.log("tttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt")
    console.log(orderId, 'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', updateStatusDto.status)
    return await this.ordersService.updateOrderStatus(orderId,updateStatusDto.status);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllOrders(@Query() orderFilterParams: OrderFilterParams): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    return await this.ordersService.getAllOrders(orderFilterParams);
  }


  /** *********************************TODO: A supprimer dans la version finale************************************ */
  
  @Get('admin/orders/confirmed-payment/:id')
  async confirmedPayment(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.ordersService.confirmPayment( id, user?.id);
  }

  @Get('admin/orders/failed-payment/:id')
  async failedPayment(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.ordersService.FailedPayment( id, user?.id);

  }

  @Get('admin/orders/canceled-payment/:id')
  async canceledPayment(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.ordersService.cancelPayment( id, user?.id);

  }
}