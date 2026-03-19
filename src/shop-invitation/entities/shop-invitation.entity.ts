import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../users/entities/user.entity';
import { InvitationStatus } from '../enums/invitation-status.enum';

@Entity('shop_invitations')
@Index('idx_shop_invitations_invite_code', ['inviteCode'])
@Index('idx_shop_invitations_status', ['status'])
@Index('idx_shop_invitations_phone', ['phoneNumber'])
export class ShopInvitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'accepted_by' })
    acceptedBy?: User;

    // Numéro WhatsApp du vendeur invité (ex: 225XXXXXXXXX)
    @Column({ name: 'phone_number', length: 20 })
    phoneNumber: string;

    // Nom du vendeur pour personnaliser le message WhatsApp
    @Column({ name: 'vendor_name', length: 255, nullable: true })
    vendorName?: string;

    // Code unique envoyé au vendeur via wa.me
    @Column({ name: 'invite_code', unique: true, length: 20 })
    inviteCode: string;

    // Mot de passe temporaire (hashé en base)
    @Column({ name: 'temp_password', length: 255, nullable: true })
    tempPassword?: string;

    @Column({ type: 'enum', enum: InvitationStatus, default: InvitationStatus.PENDING, })
    status: InvitationStatus;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;

    @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
    acceptedAt?: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    get isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    get isPending(): boolean {
        return this.status === InvitationStatus.PENDING && !this.isExpired;
    }
}