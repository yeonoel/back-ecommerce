import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { cloudinaryConfig } from '../config/cloudinary.config';

cloudinary.config(cloudinaryConfig);

@Injectable()
export class UploadService {
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  /**
   * Upload une image vers Cloudinary avec optimisation
   */
  async uploadImage(file: Express.Multer.File): Promise<string> {
    // Valider le fichier
    this.validateFile(file);

    try {
      // Optimiser l'image avec Sharp
      const optimizedBuffer = await this.optimizeImage(file.buffer);
      // Upload vers Cloudinary
      const result = await this.uploadToCloudinary(
        optimizedBuffer,
        file.originalname,
      );
      return result.secure_url;
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload plusieurs images
   * @param files Les fichiers à uploader
   * @returns Un tableau d'URLs publiques des images uploadées
   * @throws Une exception si l'upload échoue
   */
  async uploadMultipleImages(files: Express.Multer.File[]): Promise<string[]> {
    if (!files || files.length === 0) {
      return [];
    }
    const uploadPromises = files.map((file) => this.uploadImage(file));
    console.log(uploadPromises);

    return await Promise.all(uploadPromises);
  }

  /**
   * Delete an image from Cloudinary
   * @param image_url The public URL of the image to delete
   * @returns A promise which resolves when the image is deleted
   * @throws An error if the deletion fails
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extraire le public_id depuis l'URL
      const publicId = this.extractPublicId(imageUrl);
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Ne pas throw pour éviter de bloquer le flow
    }
  }

  /**
   * Valider le fichier
   */
  private validateFile(file: Express.Multer.File): void {
    // Vérifier le type MIME
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Vérifier la taille
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Max size: ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }
  }

  /**
   * Optimiser l'image avec Sharp
   */
  private async optimizeImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(1200, 1200, {
        fit: 'inside', // Garde les proportions
        withoutEnlargement: true, // Ne pas agrandir si plus petit
      })
      .jpeg({ quality: 85 }) // Compression JPEG
      .toBuffer();
  }

  /**
   * Upload vers Cloudinary
   */
  private uploadToCloudinary(buffer: Buffer, filename: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'products', // Dossier dans Cloudinary
          public_id: `${Date.now()}-${filename}`,
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      // Pipe le buffer vers le stream
      uploadStream.end(buffer);
    });
  }

  /**
   * Extraire le public_id depuis l'URL Cloudinary
   */
  private extractPublicId(imageUrl: string): string {
    // URL format: https://res.cloudinary.com/.../products/123456-image.jpg
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    return `products/${publicId}`;
  }
}