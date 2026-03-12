import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// ✅ En prod dotenv ne fait rien si le fichier n'existe pas
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',

  // ✅ En prod (Railway) on utilise DATABASE_URL, en local les variables séparées
  ...(process.env.DATABASE_URL
    ? {
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
    : {
      host: process.env.BD_HOST,
      port: parseInt(process.env.BD_PORT || '5432'),
      username: process.env.BD_USER,
      password: process.env.BD_PASSWORD,
      database: process.env.BD_NAME,
    }),

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],

  synchronize: false,
  logging: process.env.NODE_ENV !== 'production', // logs seulement en local
  migrationsTableName: 'migrations',
  migrationsRun: true, // ✅ migrations auto au démarrage en prod
};

// DataSource pour les migrations CLI
export const AppDataSource = new DataSource(typeOrmConfig);

