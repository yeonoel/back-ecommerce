// src/users/user.entity.ts

import { Exclude } from 'class-transformer';
import { Address } from '../../addresses/entities/address.entity';
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity("users") // Nom de la table dans PostgreSQL
export class User {
  // id UUID PRIMARY KEY DEFAULT gen_random_uuid()
  // Utilise TypeORM pour gérer l'UUID généré côté DB (Postgres)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // email VARCHAR(255) UNIQUE NOT NULL
  @Column({ length: 255, unique: true, nullable: false })
  // @Index() // Vous pouvez ajouter un index ici ou le laisser générer par la migration
  email: string;

  // password_hash VARCHAR(255) NOT NULL
  @Column({ length: 255, nullable: false })
  @Exclude()
  password: string;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];

  // first_name VARCHAR(100) NOT NULL
  @Column({name: 'first_name', length: 100, nullable: false })
  firstName: string;

  // last_name VARCHAR(100) NOT NULL
  @Column({name: 'last_name', length: 100, nullable: false })
  lastName: string;

  // phone VARCHAR(20)
  @Column({ length: 20, nullable: true })
  phone: string;

  // avatar_url VARCHAR(500)
  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string;

  // email_verified BOOLEAN DEFAULT FALSE
  @Column({name: 'email_verified', default: false })
  emailVerified: boolean;

  // is_active BOOLEAN DEFAULT TRUE
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // role VARCHAR(20) DEFAULT 'customer'
  @Column({ length: 20, default: 'customer' })
  // @Index() // Index pour performance sur le rôle
  role: string;

  // created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  @CreateDateColumn({ name: 'created_at' })
  createAt: Date;

  // updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // last_login_at TIMESTAMP
  @Column({name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;
}
