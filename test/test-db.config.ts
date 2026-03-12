import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { resolve, join } from 'path';

const envPath = resolve(process.cwd(), '.env.test');

config({ path: envPath });

const password = process.env.TEST_DB_PASSWORD;

export const testDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TEST_DB_HOST,
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USERNAME,
  password: process.env.TEST_DB_PASSWORD,
  database: process.env.TEST_DB_NAME,

  // Chercher les entités
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],

  synchronize: true,
  dropSchema: true,// Pour les tests, on réinitialise le schéma à chaque fois
  logging: false,
};