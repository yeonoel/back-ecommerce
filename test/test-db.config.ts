import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { resolve, join } from 'path';
import * as fs from 'fs';

const envPath = resolve(process.cwd(), '.env.test');
console.log('🔍 Looking for .env.test at:', envPath);
console.log('🔍 File exists?', fs.existsSync(envPath));

config({ path: envPath });

console.log('📋 Loaded environment variables:');
console.log('TEST_DB_HOST:', process.env.TEST_DB_HOST);
console.log('TEST_DB_PORT:', process.env.TEST_DB_PORT);
console.log('TEST_DB_USERNAME:', process.env.TEST_DB_USERNAME);
console.log('TEST_DB_PASSWORD:', process.env.TEST_DB_PASSWORD);
console.log('TEST_DB_NAME:', process.env.TEST_DB_NAME);

const password = process.env.TEST_DB_PASSWORD;
console.log('🔐 Password type:', typeof password);
console.log('🔐 Password value:', password ? '***' : 'UNDEFINED');

export const testDbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TEST_DB_HOST,
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USERNAME,
  password: process.env.TEST_DB_PASSWORD,
  database: process.env.TEST_DB_NAME,
  
  // Chercher les entités
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  
  synchronize: true, // Synchronisation automatique des schémas
  dropSchema: true,// Pour les tests, on réinitialise le schéma à chaque fois
  logging: ['error']
};