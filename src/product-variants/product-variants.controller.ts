import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('/:slugStore/product-variants')
@Roles('seller')
export class ProductVariantsController {
  constructor(private readonly productVariantsService: ProductVariantsService) { }

  @Post('/:productId/variants')
  async create(@Param('productId') productId: string, @Body() createProductVariantDto: CreateProductVariantDto, @Param('slugStore') storeSlug: string) {
    return this.productVariantsService.create(productId, createProductVariantDto, storeSlug);
  }

  @Get('/:productId/variants')
  async findAll(@Param('productId') productId: string, @Param('slugStore') storeSlug: string) {
    return this.productVariantsService.findAll(productId, storeSlug);
  }

  @Get('/:productId/variants/:idVariant')
  async findOne(@Param('idVariant') idVariant: string, @Param('slugStore') storeSlug: string) {
    return this.productVariantsService.findOne(idVariant, storeSlug);
  }

  @Patch('/:productId/variants/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductVariantDto, @Param('slugStore') storeSlug: string) {
    return this.productVariantsService.update(id, dto, storeSlug);
  }

  @Delete('/:productId/variants/:idVariant')
  async remove(@Param('idVariant') idVariant: string, @Param('slugStore') storeSlug: string) {
    return await this.productVariantsService.remove(idVariant, storeSlug);
  }
}
