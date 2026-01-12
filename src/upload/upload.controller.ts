// src/upload/upload.controller.ts

import {Controller, Post, UseInterceptors, UploadedFile, UploadedFiles, UseGuards, BadRequestException} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.gaurds';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const imageUrl = await this.uploadService.uploadImage(file);
    return {
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
      },
    };
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    const imageUrls = await this.uploadService.uploadMultipleImages(files);
    return {
      success: true,
      message: `${imageUrls.length} images uploaded successfully`,
      data: {
        urls: imageUrls,
      },
    };
  }
}