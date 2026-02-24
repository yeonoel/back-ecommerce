import { User } from '../../users/entities/user.entity';
import { CartItem } from '../../cart-items/entities/cart-item.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn, OneToMany, Unique } from 'typeorm';
import { Store } from 'src/stores/entities/store.entity';


@Entity('carts')
@Unique(['user', 'store'])
@Unique(['sessionId', 'store'])
@Index('idx_carts_user_id', ['user'])
@Index('idx_carts_session_id', ['sessionId'])
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @ManyToOne(() => Store, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @OneToMany(() => CartItem, cartItem => cartItem.cart)
  items: CartItem[];

  @Column({ name: 'session_id', length: 255, nullable: true, type: 'varchar' })
  sessionId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ name: 'coupon_code', length: 50, nullable: true, type: 'varchar' })
  couponCode: string | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
