import { Product } from '../../products/entities/product.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';


@Entity('product_images')
@Index('idx_product_images_product_id', ['product'])
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, product => product.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;

  @Column({ name: 'alt_text', length: 255, nullable: true })
  altText?: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
