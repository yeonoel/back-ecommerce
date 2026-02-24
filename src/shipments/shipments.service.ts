import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { Shipment } from './entities/shipment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { MailService } from '../mail/mail.service';
import { ShipmentStatus } from './enums/shipment-status';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly mailService: MailService,
  ) {}
  
   /**
   * Créer une expédition
   */
  async createShipment(orderId: string, dto: CreateShipmentDto): Promise<Shipment> {
    const order = await this.orderRepository.findOne({where: { id: orderId }, relations: ['user']});
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const shipment = this.shipmentRepository.create({
      orderId,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      trackingUrl: dto.trackingUrl,
      status: ShipmentStatus.PENDING,
    });
    const savedShipment = await this.shipmentRepository.save(shipment);
    // Email si tracking déjà disponible
    if (dto.trackingNumber) {
      await this.mailService.sendShipmentTrackingEmail(order.user.email, orderId, dto.trackingNumber, dto.trackingUrl);
    }
    return savedShipment;
  }

  /**
   * Mettre à jour le suivi / statut
   * @param shipmentId : ID de l'expédition
   * @param dto
   * @returns
   */
  async updateShipment(shipmentId: string, dto: UpdateShipmentDto): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({where: { id: shipmentId }, relations: ['order.user']});
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    const previousStatus = shipment.status;
    Object.assign(shipment, dto);
    // Gestion automatique des dates
    if (dto.status === ShipmentStatus.IN_TRANSIT &&previousStatus !== ShipmentStatus.IN_TRANSIT) {
      shipment.shippedAt = new Date();
    }
    if (dto.status === ShipmentStatus.DELIVERED && previousStatus !== ShipmentStatus.DELIVERED) {
      shipment.deliveredAt = new Date();
    }
    const updatedShipment = await this.shipmentRepository.save(shipment);
    // Notification client
    if (dto.status === ShipmentStatus.IN_TRANSIT || dto.status === ShipmentStatus.DELIVERED) {
      await this.mailService.sendShipmentStatusEmail(shipment.order.user.email,shipment.orderId,shipment.status,shipment.trackingNumber,shipment.trackingUrl);    
    } 
    return updatedShipment;
}

  /**
   * Webhook transporteur (Moto)
   * @param payload
   * @returns
   */
  async handleCarrierWebhook(payload: {trackingNumber: string;status: ShipmentStatus;
  }): Promise<void> {
    const shipment = await this.shipmentRepository.findOne({
      where: { trackingNumber: payload.trackingNumber },
    });
    if (!shipment) return;
    shipment.status = payload.status;
    if (payload.status === ShipmentStatus.DELIVERED) {
      shipment.deliveredAt = new Date();
    }
    await this.shipmentRepository.save(shipment);
  }
}
