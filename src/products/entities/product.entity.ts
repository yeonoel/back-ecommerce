import { Category } from '../../categories/entities/category.entity';
import { ProductVariant } from '../../product-variants/entities/product-variant.entity';
import { ProductImage } from '../../products-images/entities/products-image.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';


@Entity('products')
@Index('idx_products_slug', ['slug'])
@Index('idx_products_category_id', ['category'])
@Index('idx_products_is_active', ['isActive'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => ProductImage, images => images.product)
  images: ProductImage[];

  @OneToMany(() => ProductVariant, variant => variant.product)
  variants: ProductVariant[];

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'short_description', length: 500, nullable: true })
  shortDescription?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'compare_at_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  compareAtPrice?: number;

  @Column({name: 'cost_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice?: number;

  @Column({ length: 100, unique: true, nullable: true })
  sku?: string;

  @Column({name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({name: 'low_stock_threshold', default: 5 })
  lowStockThreshold: number;

  @Column({name: 'is_active', default: true })
  isActive: boolean;

  @Column({name: 'is_featured', default: false })
  isFeatured: boolean;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @Column({name: 'meta_title', length: 255, nullable: true })
  metaTitle?: string;

  @Column({name: 'meta_description', type: 'text', nullable: true })
  metaDescription?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height?: number;

  @CreateDateColumn({name: 'created_at'})
  created_at: Date;

  @UpdateDateColumn({name: 'updated_at'})
  updated_at: Date;
}

