import { DataSource } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

export async function seedCategories(ds: DataSource) {
  const repo = ds.getRepository(Category);
  
  const categories = [
  { 
    name: 'Vêtements', 
    slug: 'vetements', 
    description: 'T-shirts, pantalons, vestes et autres vêtements pour hommes et femmes.' 
  },
  { 
    name: 'Chaussures', 
    slug: 'chaussures', 
    description: 'Chaussures de sport, bottes, sandales et chaussures élégantes.' 
  },
];

  for (const categoryData of categories) {
    const existing = await repo.findOne({ 
      where: { slug: categoryData.slug } 
    });
    
    if (!existing) {
      await repo.save(categoryData);
      console.log(`✅ Category "${categoryData.name}" created`);
    } else {
      console.log(`ℹ️  Category "${categoryData.name}" already exists`);
    }
  }

  return repo.find();
}