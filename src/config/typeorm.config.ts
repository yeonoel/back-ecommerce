import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.BD_HOST,
  port: parseInt(process.env.BD_PORT || '5432'),
  username: process.env.BD_USER,
  password: process.env.BD_PASSWORD, // Valeur par défaut
  database: process.env.BD_NAME,

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],

  synchronize: false,
  logging: true,
  migrationsTableName: 'migrations',

};

// DataSource pour les migrations CLI
export const AppDataSource = new DataSource(typeOrmConfig);