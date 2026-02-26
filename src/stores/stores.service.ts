import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth, Repository } from 'typeorm';
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
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto } from '../auth/dto/Users-response';
import { UpdateStoreDto } from './dto/update-store.dto';
import { mapToOrderDto } from 'src/orders/mapper/map-to-order.dto';
import { mapToUserDto } from 'src/auth/mapper/map-To-user-dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(ShopInvitation)
    private readonly invitationRepository: Repository<ShopInvitation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
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

    // Expiration dans 7 jours
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Créer l'invitation
    const invitation = this.invitationRepository.create({
      store,
      phoneNumber: dto.phoneNumber,
      vendorName: dto.vendorName,
      inviteCode,
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
   * Update a store
   * @param slugStore The slug of the store to update
   * @param UpdateStoreDto The store to update
   * @returns A response with the updated store
   * @throws NotFoundException If the store is not found
   */
  async updateStore(slugStore: string, dto: UpdateStoreDto): Promise<storeResponseDto> {
    const store = await this.storeRepository.findOne({ where: { slug: slugStore } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    Object.assign(store, {
      ...(dto.name && { name: dto.name }),
      ...(dto.description && { description: dto.description }),
      ...(dto.logoUrl && { logoUrl: dto.logoUrl }),
      ...(dto.phoneNumber && { whatsappNumber: dto.phoneNumber }),
    });

    await this.storeRepository.save(store);

    return {
      message: 'Store updated successfully',
      storeId: store.id,
      storeName: store.name,
    };
  }

  async getAllStores(user: any): Promise<Store[]> {
    if (user.role === UserRole.SUPER_ADMIN) {
      return this.storeRepository.find({ where: { isDeleted: false } });
    }
    return this.storeRepository.find({ where: { createdBy: user.id, isDeleted: false } });
  }

  async deleteStore(slugStore: string): Promise<storeResponseDto> {
    const store = await this.storeRepository.findOne({ where: { slug: slugStore } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    store.isDeleted = true;
    await this.storeRepository.save(store);
    return {
      message: 'Store deleted successfully',
      storeId: store.id,
      storeName: store.name,
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
   * @returns {Promise<AuthResponseDto>} - Le compte vendeur créé et le token JWT.
   */
  async onboardVendor(dto: OnboardingDto): Promise<AuthResponseDto> {

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


    // Créer le compte vendeur
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    const vendor = this.userRepository.create({
      password: hashedPassword,
      phone: dto.phoneNumber,
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

    const token = this.jwtService.sign({
      sub: vendor.id,
      phone: vendor.phone,
      role: vendor.role,
      storeId: invitation.store.id,
      storeSlug: invitation.store.slug,
    });

    return {
      success: true,
      data: mapToUserDto(vendor),
      token,
    }
  }
}