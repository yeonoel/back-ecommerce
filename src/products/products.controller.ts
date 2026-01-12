import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpCode, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ProductFiltersDto } from './dto/ProductFiltersDto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateProductFormDataDto } from './dto/CreateProductFormDataDto';
import { UploadService } from '../upload/upload.service';
import { ProductMapper } from './mapper/ProductMapper';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly iploadService: UploadService
  ) {}

  @Roles('admin')
  @Post()
  @UseInterceptors(FilesInterceptor('files', 9))
  createProduct(@UploadedFiles() files : Express.Multer.File[], @Body() CreateProductFormDataDto: CreateProductFormDataDto) {
    const imagesUrls = files?.length ? await this.uploadService.uploadMultipleImages(files) : [];
    const createProductDto = ProductMapper.toCreateProductDto(CreateProductFormDataDto, imagesUrls);

    return this.productsService.createProduct(createProductDto);
  }

  @Get()
  findAllProducts(@Query() filters: ProductFiltersDto) {
    return this.productsService.findAllProducts(filters);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Roles('admin')
  @Patch(':id')
  updateProduct(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  removeProduct(@Param('id') id: string) {
    return this.productsService.removeProduct(id);
  }
}
