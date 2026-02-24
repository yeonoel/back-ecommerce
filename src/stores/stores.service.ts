import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { Store } from './entities/store.entity';
import { ShopInvitation } from '../shop-invitation/entities/shop-invitation.entity';
import { StoreStatus } from './enums/store-status.enum';
import { InvitationStatus } from '../shop-invitation/enums/invitation-status.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enum/userRole.enum';
import { CreateStoreDto } from './dto/create-store.dto';
import { OnboardingDto } from './dto/onboarding.dto';
import { storeResponseDto } from './dto/response/store-reponse.dto';
import { BuildWhatsappLink } from 'src/common/helpers/buildWhatssapLink';
import { generateUniqueSlug } from 'src/common/utils/slug.util';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(ShopInvitation)
    private readonly invitationRepository: Repository<ShopInvitation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService
  ) { }


  /**
   * Crée une boutique avec un code d'invitation unique et un mot de passe temporaire.
   * Le code d'invitation et le mot de passe temporaire sont générés aléatoirement.
   * La boutique est créée avec le statut "pending".
   * L'invitation est créée avec le statut "pending".
   * Le lien WhatsApp est construit avec le mot de passe en CLAIR (avant hashage).
   * @param {CreateStoreDto} dto - Informations de la boutique.
   * @param {User} superAdmin - L'utilisateur qui crée la boutique.
   * @returns {Promise<storeResponseDto>}
   */
  async createStoreWithInvitation(dto: CreateStoreDto, superAdmin: User,): Promise<storeResponseDto> {

    // Générer un slug unique à partir du nom
    const slug = await generateUniqueSlug(dto.name);

    // Verifier si la boutique existe
    const storeExists = await this.storeRepository.findOne({ where: { slug } });
    if (storeExists) throw new ConflictException('Store already exists');

    // Créer la boutique
    const store = this.storeRepository.create({
      name: dto.name,
      slug,
      description: dto.description,
      logoUrl: dto.logoUrl,
      whatsappNumber: dto.phoneNumber,
      status: StoreStatus.PENDING,
      createdBy: superAdmin,
    });
    await this.storeRepository.save(store);

    // Générer le code d'invitation et le mot de passe temporaire
    const inviteCode = nanoid(10).toUpperCase();
    const tempPasswordPlain = nanoid(12);
    const tempPasswordHashed = await bcrypt.hash(tempPasswordPlain, 10);

    // Expiration dans 7 jours
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Créer l'invitation
    const invitation = this.invitationRepository.create({
      store,
      phoneNumber: dto.phoneNumber,
      vendorName: dto.vendorName,
      inviteCode,
      tempPassword: tempPasswordHashed,
      status: InvitationStatus.PENDING,
      expiresAt,
    });
    await this.invitationRepository.save(invitation);

    // Construire le lien WhatsApp avec le mot de passe en CLAIR (avant hashage)
    const whatsappLink = BuildWhatsappLink(
      dto.phoneNumber,
      dto.vendorName ?? '',
      store.name,
      inviteCode,
      tempPasswordPlain,
      expiresAt,
    );

    return {
      message: 'Store created successfully. Send the WhatsApp link to the vendor.',
      storeId: store.id,
      storeName: store.name,
      inviteCode: invitation.inviteCode,
      whatsappLink: whatsappLink,
    };
  }


  /**
   * Crée un compte vendeur à partir d'un code d'invitation et d'un mot de passe temporaire.
   * Vérifie que l'invitation est valide et non expirée.
   * Vérifie que le mot de passe temporaire est correct.
   * Vérifie que l'email n'est pas déjà enregistré.
   * Crée le compte vendeur.
   * Marque l'invitation comme acceptée.
   * Activer la boutique.
   * @param {OnboardingDto} dto - Informations pour la création du compte vendeur.
   * @returns {Promise<User>} - Le compte vendeur créé.
   */
  async onboardVendor(dto: OnboardingDto, sessionId: string): Promise<User> {

    // Trouver l'invitation
    const invitation = await this.invitationRepository.findOne({
      where: { inviteCode: dto.inviteCode, status: InvitationStatus.PENDING },
      relations: ['store'],
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or already used invitation code');
    }

    // Vérifier expiration
    if (invitation.isExpired) {
      await this.invitationRepository.update(invitation.id, { status: InvitationStatus.EXPIRED });
      throw new BadRequestException('This invitation has expired');
    }

    // Vérifier le mot de passe temporaire
    const isPasswordValid = await bcrypt.compare(dto.tempPassword, invitation.tempPassword);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid temporary password');
    }

    // Créer le compte vendeur
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    const vendor = this.userRepository.create({
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.SELLER,
      isActive: true,
      emailVerified: false,
    });
    await this.userRepository.save(vendor);

    // Marquer l'invitation comme acceptée
    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
      acceptedBy: vendor,
      acceptedAt: new Date(),
    });

    // Activer la boutique
    await this.storeRepository.update(invitation.store.id, {
      status: StoreStatus.ACTIVE,
    });

    await this.authService.login(vendor, sessionId, invitation.store.id);
    return vendor;
  }
}