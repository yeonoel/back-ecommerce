import { Product } from '../../products/entities/product.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn, Unique, RelationId } from 'typeorm';


@Entity('product_variants')
@Unique('uq_variant_sku_product', ['sku', 'product'])
@Index('idx_product_variants_product_id', ['product'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, product => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @RelationId((variant: ProductVariant) => variant.product)
  productId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true, nullable: true })
  sku?: string;

  @Column({ length: 50, nullable: true })
  color?: string;

  @Column({ length: 50, nullable: true })
  size?: string;

  @Column({ length: 100, nullable: true })
  material?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ name: 'reserved_quantity', type: 'int', default: 0 })
  reservedQuantity: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  f
  get availabledQuantity(): number {
    // Calcule la quantité disponible
    return this.stockQuantity - this.reservedQuantity;
  }
}
