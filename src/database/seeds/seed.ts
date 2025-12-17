import { seedUsers } from './user.seed';
import { seedCategories } from './category.seed';
import { seedProducts } from './product.seed';
import { seedVariants } from './seedVariants.seed';
import AppDataSource from '../data-source';
import { seedCarts } from './cart.seed';

async function seed() {
  try {
    console.log('🚀 Starting database seeding...');
    
    // Initialiser la connexion
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    // Désactiver temporairement les contraintes FK (si nécessaire, dépend de votre SGBD)
    // await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Exécuter les seeds dans l'ordre avec gestion des dépendances
    console.log('\n🌱 Seeding users...');
    await seedUsers(AppDataSource);
    
    console.log('\n🌱 Seeding categories...');
    await seedCategories(AppDataSource);
    
    console.log('\n🌱 Seeding products...');
    await seedProducts(AppDataSource);
    
    console.log('\n🌱 Seeding variants...');
    await seedVariants(AppDataSource);
    
    console.log('\n🌱 Seeding carts...');
    await seedCarts(AppDataSource);

    // Réactiver les contraintes FK
    // await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();