import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { ResponseDto } from 'src/common/dto/ResponseDto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepoisitory: Repository<Product>,

  ) {}
  async createProduct(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }

  async findAllProducts(): Promise<ResponseDto> {
    const products: Product[] = await this.productRepoisitory.find({where: {isActive: true}});
    if (!products) {
      throw new NotFoundException('product not found');
    }
    return {
      success: true,
      message: 'Products found successfully',
      data: products
    };
  }

  findById(id: string) {
    return `This action returns a #${id} product`;
  }

  updateProduct(id: string, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  removeProduct(id: string) {
    return `This action removes a #${id} product`;
  }
}
