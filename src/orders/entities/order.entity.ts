import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Address } from '../../addresses/entities/address.entity';
import { OrderItem } from '../../order-items/entities/order-item.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { User } from '../../users/entities/user.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentStatus } from '../../payments/enums/payment-status.enum';
import { Shipment } from '../../shipments/entities/shipment.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('orders')
@Index('idx_orders_order_number', ['orderNumber'])
@Index('idx_orders_status', ['status'])
@Index('idx_orders_created_at', ['createdAt'])
@Index('idx_orders_user_id', ['user'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_number', length: 50, unique: true })
  orderNumber: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Store, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store

  @OneToMany(() => Payment, payment => payment.order)
  payments: Payment[];

  @OneToMany(() => Shipment, shipment => shipment.order)
  shipments: Shipment[];

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  items: OrderItem[];

  @Column({ default: OrderStatus.PENDING_CONFIRMATION, type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @Column({ name: 'payment_status', type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING_PAYMENT })
  paymentStatus: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ name: 'shipping_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'coupon_code', length: 50, nullable: true, type: 'varchar' })
  couponCode?: string | null;

  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'shipping_address_id' })
  shippingAddress?: Address;

  @ManyToOne(() => Address, { nullable: true })
  @JoinColumn({ name: 'billing_address_id' })
  billingAddress?: Address;

  @Column({ name: 'shipping_address_snapshot', type: 'jsonb', nullable: true })
  shippingAddressSnapshot?: Record<string, any>;

  @Column({ name: 'billing_address_snapshot', type: 'jsonb', nullable: true })
  billingAddressSnapshot?: Record<string, any>;

  @Column({ name: 'customer_note', type: 'text', nullable: true })
  customerNote?: string;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  // confirmed by client
  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  // approved by seller
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  shippedAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  getLocation(): string {
    return `${this.shippingAddress?.city}, ${this.shippingAddress?.neighborhood}`;
  }
}
