import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductVariantsService } from './product-variants.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Controller('product-variants')
export class ProductVariantsController {
  constructor(private readonly productVariantsService: ProductVariantsService) {}

  @Post()
  async create(@Param('productId') productId: string, @Body() createProductVariantDto: CreateProductVariantDto) {
    return this.productVariantsService.create(productId, createProductVariantDto);
  }

  @Get()
  async findAll(@Param('productId') productId: string) {
    return this.productVariantsService.findAll(productId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productVariantsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductVariantDto) {
    return this.productVariantsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('idVariant') idVariant: string) {
    return await this.productVariantsService.remove(idVariant);
  }
}
