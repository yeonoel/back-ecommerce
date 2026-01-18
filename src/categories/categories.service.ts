import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import slugify from 'slugify';
import { ResponseDto } from '../common/dto/responses/Response.dto';
import { generateSlug } from 'src/common/utils/slug.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>
  ) {}
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<ResponseDto> {
    const {name} = createCategoryDto;
    const slug = generateSlug(name);
    const existing = await this.categoriesRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException(`slug already exists`);
    }
    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      slug
    });
    const savedCategory = await this.categoriesRepository.save(category);
    return {
      success: true,
      message: 'Category created successfully',
      data: savedCategory
    };
  }

  findAllCategories(): Promise<Category[]> {
    return this.categoriesRepository.find(
      {where: {isActive: true}, order: {displayOrder: 'ASC'}}
    );
  }

  async findCategoryById(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto): Promise<ResponseDto> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    let slug = category.slug;
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      slug = slugify(updateCategoryDto.name, {lower: true});
      const existing = await this.categoriesRepository.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`slug already exists`);
      }
    }
    await this.categoriesRepository.update(id, {...updateCategoryDto, slug });
    const updatedCategory = await this.categoriesRepository.findOne({ where: { id } });
    return {
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    };
  }

  async removeCategory(id: string, ): Promise<ResponseDto> {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.categoriesRepository.remove(category);

    return {
      success: true,
      message: 'Category deleted successfully',
      data: null
    }
  }
}
