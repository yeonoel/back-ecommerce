import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, Unique, } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('shop_customers')
@Unique('uq_shop_customer', ['user', 'store'])
export class ShopCustomer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => Store, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'store_id' })
    store: Store;

    @Column({ name: 'store_id' })
    storeId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}