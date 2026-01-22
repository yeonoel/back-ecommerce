import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post('orders/:id/shipments')
  @HttpCode(HttpStatus.CREATED)
  async createShipment(@Param('id') orderId: string,@Body() createShipmentDto: CreateShipmentDto,) {
    return this.shipmentsService.createShipment(orderId, createShipmentDto);
  }

  @Patch('shipments/:id')
  async updateShipment(@Param('id') shipmentId: string,@Body() updateShipmentDto: UpdateShipmentDto,) {
    return this.shipmentsService.updateShipment(
      shipmentId,
      updateShipmentDto,
    );
  }

  @Post('shipments/webhook/meto')
  @HttpCode(HttpStatus.OK)
  async carrierWebhook(@Body() payload: any) {
    await this.shipmentsService.handleCarrierWebhook(payload);
    return { received: true };
  }
}
