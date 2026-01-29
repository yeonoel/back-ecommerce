import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { PaymentMethodType } from '../enums/payment-method-type.enum';
import { currencyTypes } from '../../common/enums/currency-type.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

@Entity('payments')
@Index('idx_payments_order_id', ['order'])
@Index('idx_payments_status', ['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, order => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({type: 'enum', enum: currencyTypes, default: currencyTypes.EUR })
  currency: currencyTypes;

  @Column({name: 'payment_method', type: 'enum', enum: PaymentMethodType, })
  paymentMethod: PaymentMethodType;

  @Column({name: 'payment_provider', length: 50, nullable: true })
  paymentProvider?: string;

  @Column({name: 'transaction_id', length: 255, nullable: true })
  transactionId?: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING_PAYMENT })
  status: PaymentStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
