import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus, HttpCode, UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ProductFiltersDto } from './dto/product-filters-dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductFormDataDto } from './dto/ProductFormData.dto';
import { ProductMapper } from './mapper/product-mapper';
import { Public } from '../common/decorators/public.decorator';
import { ProductUpdateFormDataDto } from './dto/ProductUpdateFormData.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) { }

  @Roles('admin')
  @Post()
  @UseInterceptors(FilesInterceptor('images', 3))
  async createProduct(@UploadedFiles() files: Express.Multer.File[], @Body() productFormDataDto: ProductFormDataDto) {
    const createProductDto = ProductMapper.toCreateProductDto(productFormDataDto, []);
    return this.productsService.createProduct(createProductDto, files);
  }

  @Get()
  @Public()
  findAllProducts(@Query() filters: ProductFiltersDto) {
    return this.productsService.findAllProducts(filters);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Roles('admin')
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('newImages', 3))
  updateProduct(
    @Param('id') id: string,
    @Body() productUpdateFormDataDto: ProductUpdateFormDataDto,
    @UploadedFiles() files?: Express.Multer.File[]) {
    console.log('files', productUpdateFormDataDto);
    const updateProductDto = ProductMapper.toUpdateProductDto(productUpdateFormDataDto, []);
    return this.productsService.updateProduct(id, updateProductDto, files);
  }

  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  removeProduct(@Param('id') id: string) {
    return this.productsService.removeProduct(id);
  }
}
