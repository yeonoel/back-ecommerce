// src/users/user.entity.ts

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
  password_hash: string;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];

  // first_name VARCHAR(100) NOT NULL
  @Column({ length: 100, nullable: false })
  first_name: string;

  // last_name VARCHAR(100) NOT NULL
  @Column({ length: 100, nullable: false })
  last_name: string;

  // phone VARCHAR(20)
  @Column({ length: 20, nullable: true })
  phone: string;

  // avatar_url VARCHAR(500)
  @Column({ length: 500, nullable: true })
  avatar_url: string;

  // email_verified BOOLEAN DEFAULT FALSE
  @Column({ default: false })
  email_verified: boolean;

  // is_active BOOLEAN DEFAULT TRUE
  @Column({ default: true })
  is_active: boolean;

  // role VARCHAR(20) DEFAULT 'customer'
  @Column({ length: 20, default: 'customer' })
  // @Index() // Index pour performance sur le rôle
  role: string;

  // created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  @CreateDateColumn()
  created_at: Date;

  // updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  @UpdateDateColumn()
  updated_at: Date;

  // last_login_at TIMESTAMP
  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;
}
