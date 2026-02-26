import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Controller('/:slugStore/product-variants')
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

  @Get(':id')
  async findOne(@Param('id') id: string, @Param('slugStore') storeSlug: string) {
    return this.productVariantsService.findOne(id, storeSlug);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductVariantDto, @Param('slugStore') storeSlug: string) {
    return this.productVariantsService.update(id, dto, storeSlug);
  }

  @Delete(':idVariant')
  async remove(@Param('idVariant') idVariant: string, @Param('slugStore') storeSlug: string) {
    return await this.productVariantsService.remove(idVariant, storeSlug);
  }
}
