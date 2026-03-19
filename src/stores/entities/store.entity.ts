import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ShopInvitation } from '../../shop-invitation/entities/shop-invitation.entity';
import { StoreStatus } from '../enums/store-status.enum';

@Entity('stores')
@Index('idx_stores_slug', ['slug'])
@Index('idx_stores_status', ['status'])
export class Store {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'owner_id' })
    owner: User

    @Column({ length: 255 })
    name: string;

    @Column({ unique: true })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ name: 'logo_url', type: 'text', nullable: true })
    logoUrl?: string;

    @Column({ name: 'whatsapp_number', length: 20, nullable: true })
    whatsappNumber?: string;

    @Column({ type: 'enum', enum: StoreStatus, default: StoreStatus.PENDING, })
    status: StoreStatus;

    @Column({ name: 'is_deleted', default: false })
    isDeleted: boolean;

    @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    get isActive(): boolean {
        return this.status === StoreStatus.ACTIVE;
    }
}