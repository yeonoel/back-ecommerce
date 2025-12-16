import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

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

  @Column({ length: 3, default: 'EUR' })
  currency: string;

  @Column({ length: 50 })
  paymentMethod: string;

  @Column({ length: 50, nullable: true })
  paymentProvider?: string;

  @Column({ length: 255, nullable: true })
  transactionId?: string;

  @Column({ length: 50, default: 'pending' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
