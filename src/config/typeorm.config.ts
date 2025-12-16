import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// ⚠️ CHARGER dotenv AVANT d'utiliser process.env
// Déterminer le chemin du fichier .env
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
const envPath = path.resolve(process.cwd(), envFile);

console.log('Chargement du fichier env:', envPath);
dotenv.config({ path: envPath });

// Debug: afficher les valeurs
console.log('BD_HOST:', process.env.BD_HOST);
console.log('BD_USER:', process.env.BD_USER);
console.log('BD_PASSWORD:', process.env.BD_PASSWORD ? '***' : 'UNDEFINED');

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.BD_HOST,
  port: parseInt(process.env.BD_PORT || '5432'),
  username: process.env.BD_USER ,
  password: process.env.BD_PASSWORD , // Valeur par défaut
  database: process.env.BD_NAME ,

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  migrationsTableName: 'migrations',
};

// DataSource pour les migrations CLI
export const AppDataSource = new DataSource(typeOrmConfig);