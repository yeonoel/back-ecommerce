import { DataSource } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Category } from '../../categories/entities/category.entity';

export async function seedProducts(ds: DataSource) {
  const productRepo = ds.getRepository(Product);
  const categoryRepo = ds.getRepository(Category);

  const categories = await categoryRepo.find();
  
  if (categories.length === 0) {
    throw new Error('Categories not found. Run category seed first.');
  }

  const products = [
    {
      name: 'T-shirt blanc',
      slug: 't-shirt-blanc',
      price: 15.99,
      stockQuantity: 100,
      category: categories[0],
    },
    {
      name: 'Basket sport',
      slug: 'basket-sport',
      price: 79.99,
      stockQuantity: 50,
      category: categories[1],
    },
  ];

  for (const productData of products) {
    const existing = await productRepo.findOne({ 
      where: { slug: productData.slug } 
    });
    
    if (!existing) {
      await productRepo.save(productData);
      console.log(`✅ Product "${productData.name}" created`);
    } else {
      // Mettre à jour si nécessaire
      await productRepo.update(existing.id, productData);
      console.log(`ℹ️  Product "${productData.name}" updated`);
    }
  }

  return productRepo.find();
}