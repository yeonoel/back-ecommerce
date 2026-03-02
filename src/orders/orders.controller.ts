import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpCode, Session } from '@nestjs/common';
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
import { OrderFilterParams } from './dto/order-filter-params.dto';
import { SessionId } from 'src/common/decorators/session.decorator';

@ApiTags('/orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async createOrder(@SessionId() sessionId: string, @Body() createOrderDto: CreateOrderDto, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.createOrder(sessionId, createOrderDto, storeSlug);
  }

  @Get('/:storeSlug/get-order/:id')
  async getOrder(@CurrentUser() user: any, @Param('id') orderId: string, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.getOrderById(user?.id, orderId, storeSlug);
  }

  @Delete('/:storeSlug//cancel-order/:idUser/:id')
  @ApiOperation({ summary: 'Cancel an order' })
  @HttpCode(HttpStatus.OK)
  async cancelOrderByClient(@CurrentUser() user: any, @Param('idUser') idUser: string, @Param('id') orderId: string, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.cancelOrder(idUser, orderId, storeSlug);
  }

  @Get('/:storeSlug/my-orders/all')
  @ApiOperation({ summary: 'Get my orders (paginated)' })
  async getMyOrders(@CurrentUser() user: any, @Query() paginationDto: PaginationDto, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    return await this.ordersService.getUserOrders(user?.id, paginationDto, storeSlug);
  }

  @Patch('/:storeSlug/:orderId/status')
  @ApiOperation({ summary: 'Update order status (admin)' })
  async updateOrderStatusByCustomer(@Param('orderId') orderId: string, @Body() updateStatusDto: UpdateOrderStatusDto, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.updateOrderStatusByCustomer(orderId, updateStatusDto.status, storeSlug);
  }

  /** ********************************* ADMIN SELLER ORDERS ************************************ */

  @Patch('dashboard/:storeSlug/:orderId/status')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update order status (admin)' })
  @Roles('seller')
  async updateOrderStatusBySeller(@Param('orderId') orderId: string, @Body() updateStatusDto: UpdateOrderStatusDto, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.updateOrderStatusBySeller(orderId, updateStatusDto.status, storeSlug);
  }

  @Get('dashboard/:storeSlug/all')
  @UseGuards(RolesGuard)
  @Roles('seller')
  async getAllOrders(@Query() orderFilterParams: OrderFilterParams, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    return await this.ordersService.getAllOrders(orderFilterParams, storeSlug);
  }

  /** *********************************TODO: A supprimer dans la version finale************************************ */

  @Patch('dashboard/canceled-payment/:idUser/:id')
  @Roles('seller')
  async canceledPayment(@Param('id') id: string, @Param('storeSlug') storeSlug: string) {
    return await this.ordersService.cancelOrderBySeller(id, storeSlug);
  }
}