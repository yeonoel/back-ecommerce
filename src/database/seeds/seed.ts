import { seedUsers } from './user.seed';
import { seedProducts } from './product.seed';
import { seedVariants } from './seedVariants.seed';
import AppDataSource from '../data-source';

async function seed() {
  try {
    // Initialiser la connexion
    await AppDataSource.initialize();

    // Désactiver temporairement les contraintes FK (si nécessaire, dépend de votre SGBD)
    // await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Exécuter les seeds dans l'ordre avec gestion des dépendances
    console.log('\n🌱 Seeding users...');
    await seedUsers(AppDataSource);


    console.log('\n🌱 Seeding products...');
    await seedProducts(AppDataSource);
    await seedVariants(AppDataSource);

    // Réactiver les contraintes FK
    // await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();