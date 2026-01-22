import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ShipmentStatus } from "../enums/shipment-status";
import { Order } from "../../orders/entities/order.entity";

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ nullable: true })
  carrier?: string; // DHL, FedEx, La Poste…

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber?: string;

  @Column({ name: 'tracking_url', length: 500, nullable: true })
  trackingUrl?: string;

  @Column({type: 'enum',enum: ShipmentStatus,default: ShipmentStatus.PENDING,})
  status: ShipmentStatus;

  @Column({ name: 'shipped_at', nullable: true })
  shippedAt?: Date;

  @Column({ name: 'estimated_delivery_at', nullable: true })
  estimatedDeliveryAt?: Date;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Order, (order) => order.shipments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
