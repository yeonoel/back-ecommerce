import { Exclude } from 'class-transformer';
import { Address } from '../../addresses/entities/address.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from '../enum/userRole.enum';

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255, unique: true, nullable: false })
  email: string;

  @Column({ length: 255, nullable: false })
  @Exclude()
  password: string;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];

  @Column({name: 'first_name', length: 100, nullable: false })
  firstName: string;

  @Column({name: 'last_name', length: 100, nullable: false })
  lastName: string;

  @Column({ length: 20, nullable: true, unique: true })
  phone: string;

  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string;

  @Column({name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;
}