import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Address } from '../../addresses/entities/address.entity';
import { OrderItem } from '../../order-items/entities/order-item.entity';
import { Payment } from '../../payments/entities/payment.entity';

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

  @OneToMany(() => Payment, payment => payment.order)
  payments: Payment[];

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  items: OrderItem[];

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ name: 'payment_status', length: 50, default: 'pending' })
  paymentStatus: string;

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

  @Column({ name: 'coupon_code', length: 50, nullable: true })
  couponCode?: string;

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

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  shippedAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date;
}
