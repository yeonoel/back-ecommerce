import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AddressType } from '../enums/adress-type.enum';

@Entity('addresses')
@Index('idx_addresses_user_id', ['user'])
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({length: 20, name: 'address_type' })
  addressType: AddressType;

  @Column({name: 'is_default',default: false })
  isDefault: boolean;

  @Column({name: 'street_address', type: 'varchar', length: 255,nullable: false})
  streetAddress: string;

  @Column({length: 100,nullable: true })
  apartment: string;

  @Column({length: 100,nullable: false})
  city: string;

  @Column({length: 100,nullable: true})
  state: string;

  @Column({name: 'postal_code',length: 20,nullable: false})
  postalCode: string;

  @Column({length: 100,nullable: false})
  country: string;

  @CreateDateColumn({name: 'created_at',type: 'timestamp',default: () => 'CURRENT_TIMESTAMP'})
  createdAt: Date;

  @UpdateDateColumn({name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}