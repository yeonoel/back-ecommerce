import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Store } from './entities/store.entity';
import { StoreStatus } from './enums/store-status.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enum/userRole.enum';
import { CreateStoreDto } from './dto/create-store.dto';
import { BuildWhatsappLink } from '../common/helpers/buildWhatssapLink';
import { generateUniqueSlug } from '../common/utils/slug.util';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UploadService } from '../upload/upload.service';
import { DataSource } from 'typeorm';
import { CreateStoreResponseDto } from './dto/response/store-reponse.dto';
import { first } from 'rxjs';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly uploadService: UploadService,
    private readonly dataSource: DataSource,
  ) { }


  /**
   * Crée une boutique avec un code d'invitation unique et un mot de passe temporaire.
   * Le code d'invitation et le mot de passe temporaire sont générés aléatoirement.
   * La boutique est créée avec le statut "pending".
   * L'invitation est créée avec le statut "pending".
   * Le lien WhatsApp est construit avec le mot de passe en CLAIR (avant hashage).
   * @param {CreateStoreDto} dto - Informations de la boutique.
   * @returns {Promise<storeResponseDto>}
   */
  async createStore(dto: CreateStoreDto, logo?: Express.Multer.File): Promise<CreateStoreResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      const userExists = await manager.findOne(User, { where: { phone: dto.whatsappNumber } });
      if (userExists) throw new ConflictException('Un utilisateur avec ce numéro existe déjà');

      const slug = await generateUniqueSlug(dto.name);
      const storeExists = await manager.findOne(Store, { where: { slug } });
      if (storeExists) throw new ConflictException('Le nom de cette boutique est déjà pris');

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const newUser = manager.create(User, {
        phone: dto.whatsappNumber,
        password: hashedPassword,
        firstName: dto.vendorName,
        role: UserRole.SELLER,
        isActive: true
      });
      const savedUser = await manager.save(newUser);

      let logoUrl: string | undefined;
      if (logo) {
        try {
          logoUrl = await this.uploadService.uploadImage(logo);
        } catch (error) {
          throw new BadRequestException(`Échec upload image : ${error.message}`);
        }
      }

      const store = manager.create(Store, {
        name: dto.name,
        slug: slug,
        description: dto.description,
        logoUrl: logoUrl,
        whatsappNumber: dto.whatsappNumber,
        status: StoreStatus.ACTIVE,
        owner: savedUser,
        createdBy: savedUser

      });
      const savedStore = await manager.save(store);

      // 6. Préparer le lien WhatsApp
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const whatsappLink = BuildWhatsappLink(
        dto.whatsappNumber,
        dto.vendorName,
        savedStore.name,
        dto.password,
        expiresAt,
      );

      return {
        success: true,
        message: 'Boutique et compte vendeur créés avec succès.',
        data: {
          store: {
            id: savedStore.id,
            name: savedStore.name,
            slug: savedStore.slug,
            description: savedStore.description,
            logoUrl: savedStore.logoUrl,
            whatsappNumber: savedStore.whatsappNumber
          },
          user: {
            id: savedUser.id,
            firstName: savedUser?.firstName ?? '',
            phone: savedUser.phone
          }
        }
      };
    });
  }


  /**
   * Update a store
   * @param slugStore The slug of the store to update
   * @param UpdateStoreDto The store to update
   * @returns A response with the updated store
   * @throws NotFoundException If the store is not found
   */
  async updateStore(id: string, dto: UpdateStoreDto, logo?: Express.Multer.File): Promise<CreateStoreResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      const store = await manager.findOne(Store, {
        where: { id },
        relations: ['owner']
      });
      if (!store) {
        throw new NotFoundException('Boutique introuvable');
      }
      if (logo) {
        try {
          const newImageUrl = await this.uploadService.uploadImage(logo);
          // On ne supprime l'ancien que si le nouvel upload a réussi
          if (store.logoUrl) {
            await this.uploadService.deleteImage(store.logoUrl);
          }
          store.logoUrl = newImageUrl;
        } catch (error) {
          throw new BadRequestException(`Échec de l'upload du nouveau logo: ${error.message}`);
        }
      }
      if (dto.name && dto.name !== store.name) {
        store.slug = await generateUniqueSlug(dto.name);
        store.name = dto.name;
      }


      if (dto.vendorName) {
        store.owner.firstName = dto.vendorName;
      }
      if (dto.whatsappNumber) {
        store.owner.phone = dto.whatsappNumber;
        store.whatsappNumber = dto.whatsappNumber;
      }
      // Sauvegarde des modifs du user
      await manager.save(User, store.owner);
      if (dto.description) store.description = dto.description;
      await manager.save(store);

      const updatedStore = await manager.findOne(Store, {
        where: { id: store.id },
        relations: ['owner']
      });

      if (!updatedStore) {
        throw new NotFoundException('Boutique introuvable');
      }

      return {
        success: true,
        message: 'Boutique mise à jour avec succès.',
        data: {
          store: {
            id: updatedStore.id,
            name: updatedStore.name,
            slug: updatedStore.slug,
            description: updatedStore.description,
            logoUrl: updatedStore.logoUrl,
            whatsappNumber: updatedStore.whatsappNumber
          },
          user: {
            id: updatedStore?.owner?.id,
            firstName: updatedStore.owner?.firstName ?? '',
            phone: updatedStore.owner.phone
          }
        }
      };
    });
  }

  async getAllStores(user: any): Promise<Store[]> {
    if (user.role === UserRole.SUPER_ADMIN) {
      return this.storeRepository.find({ where: { isDeleted: false } });
    }
    return this.storeRepository.find({ where: { createdBy: user.id, isDeleted: false } });
  }

  async deleteStore(slugStore: string): Promise<{ message: string }> {
    const store = await this.storeRepository.findOne({ where: { slug: slugStore } });
    if (!store) {
      throw new NotFoundException('Boutique introuvable');
    }
    store.isDeleted = true;
    await this.storeRepository.save(store);
    return {
      message: 'Boutique supprimée avec success'
    };
  }
}