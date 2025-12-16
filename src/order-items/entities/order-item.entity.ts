import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../product-variants/entities/product-variant.entity';

@Entity('order_items')
@Index('idx_order_items_order_id', ['order'])
@Index('idx_order_items_product_id', ['product'])
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id' })
  variant?: ProductVariant;

  @Column({ name: 'product_name', length: 255 })
  productName: string;

  @Column({ name: 'product_sku', length: 100, nullable: true })
  productSku?: string;

  @Column({ name: 'variant_name', length: 100, nullable: true })
  variantName?: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
