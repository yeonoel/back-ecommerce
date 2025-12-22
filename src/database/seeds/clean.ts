// clean.seed.ts
import { DataSource } from 'typeorm';
import { Cart } from '../../carts/entities/cart.entity';
import { ProductVariant } from '../../product-variants/entities/product-variant.entity';
import { Product } from '../../products/entities/product.entity';
import { Category } from '../../categories/entities/category.entity';
import { User } from 'src/users/entities/user.entity';

export async function cleanDatabase(ds: DataSource) {
  // Désactiver les contraintes FK
  await ds.query('SET FOREIGN_KEY_CHECKS = 0;');
  
  // Vider les tables dans l'ordre inverse des dépendances
  await ds.getRepository(Cart).clear();
  await ds.getRepository(ProductVariant).clear();
  await ds.getRepository(Product).clear();
  await ds.getRepository(Category).clear();
  await ds.getRepository(User).clear();
  
  // Réactiver les contraintes FK
  await ds.query('SET FOREIGN_KEY_CHECKS = 1;');
  
  console.log('🗑️  Database cleaned');
}