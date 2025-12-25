import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("categories") 
@Index("idx_categories_slug", ["slug"])
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id: string;
    
    @Column({length: 100, unique: true, nullable: false})
    name: string;

    @Column({length: 255, nullable: false})
    slug: string;

    @Column({length: 255, nullable: false})
    description: string;

    @Column({name: 'image_url', length: 500, nullable: true})
    imageUrl?: string;

    @Column({name: 'parent_id', nullable: true})
    parentId?: string;

    @Column({name: 'is_active', default: true})
    isActive: boolean;

    @Column({name: 'display_order', default: 0})
    displayOrder: number;

    @Column({name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date

    @Column({name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt: Date
}
