import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    console.log(process.env.NODE_ENV);

  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  console.log('==========================================');
  console.log('🚀 NestJS Ecommerce API Started');
  console.log('📍 Environment:', process.env.NODE_ENV || 'development');
  console.log('🌐 Port:', port);
  console.log('==========================================');

  // CORS pour permettre à React (sur Vercel) d'appeler l'API
  app.enableCors({
    origin: '*', // On va le restreindre après le premier déploiement
    credentials: true,
    methods: 'GET,PUT,POST,DELETE',
  });

  // Validation globale
  app.useGlobalPipes(new ValidationPipe());

  // Toutes les routes commencent par /api
  app.setGlobalPrefix('api/');

  await app.listen(port);
  console.log(`✅ API listening on http://localhost:${port}/api`);
}
bootstrap();
