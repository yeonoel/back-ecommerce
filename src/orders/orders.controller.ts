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

@ApiTags('/:storeSlug/orders')
@Controller('/:storeSlug/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async createOrder(@CurrentUser() user: any, @Body() createOrderDto: CreateOrderDto, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.createOrder(user?.id, createOrderDto, storeSlug);
  }

  @Get('/get-order/:id')
  async getOrder(@CurrentUser() user: any, @Param('id') orderId: string, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.getOrderById(user?.id, orderId, storeSlug);
  }

  @Delete('/cancel-order/:idUser/:id')
  @ApiOperation({ summary: 'Cancel an order' })
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@CurrentUser() user: any, @Param('idUser') idUser: string, @Param('id') orderId: string, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.cancelOrder(idUser, orderId, storeSlug);
  }

  @Get('/my-orders/all')
  @ApiOperation({ summary: 'Get my orders (paginated)' })
  async getMyOrders(@CurrentUser() user: any, @Query() paginationDto: PaginationDto, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    return await this.ordersService.getUserOrders(user?.id, paginationDto, storeSlug);
  }

  @Patch('dashboard/:id/status')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update order status (admin)' })
  @Roles('admin')
  async updateOrderStatus(@Param('id') orderId: string, @Body() updateStatusDto: UpdateOrderStatusDto, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<OrderDto>> {
    return await this.ordersService.updateOrderStatus(orderId, updateStatusDto.status, storeSlug);
  }

  @Get('dashboard/all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAllOrders(@Query() orderFilterParams: OrderFilterParams, @Param('storeSlug') storeSlug: string): Promise<ResponseDto<PaginatedResponseDto<OrderDto>>> {
    return await this.ordersService.getAllOrders(orderFilterParams, storeSlug);
  }


  /** *********************************TODO: A supprimer dans la version finale************************************ */

  @Get('dashboard/confirmed-purchase-by-customer/idUser/:id')
  async confirmedPurchase(@Param('id') id: string, @Param('idUser') idUser: string, @Param('storeSlug') storeSlug: string) {
    return await this.ordersService.confirmPurchase(id, storeSlug, idUser);
  }

  @Get('dashboard/Approuved-order-by-seller/:idUser/:id')
  async approvedOrder(@Param('id') id: string, @Param('storeSlug') storeSlug: string) {
    return await this.ordersService.OrderAprouvedBySeller(id, storeSlug);

  }

  @Get('dashboard/canceled-payment/:idUser/:id')
  async canceledPayment(@Param('id') id: string, @Param('storeSlug') storeSlug: string) {
    return await this.ordersService.cancelOrderBySeller(id, storeSlug);
  }
}