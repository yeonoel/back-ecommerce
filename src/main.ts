import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';

async function bootstrap() {
    console.log(process.env.NODE_ENV);

  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  console.log('==========================================');
  console.log('🚀 NestJS Ecommerce API Started');
  console.log('📍 Environment:', process.env.NODE_ENV || 'development');
  console.log('🌐 Port:', port);
  console.log('==========================================');

  app.enableCors({
    // TODO: On va le restreindre après le premier déploiement
    origin: '*', 
    credentials: true,
    methods: 'GET,PUT,POST,DELETE',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // supprime les champs inconnus
      forbidNonWhitelisted: true,   // erreur si champ non prévu
      transform: true,              // transforme les types automatiquement
      validationError: {
        target: false,              // cache l’objet original
        value: false,               // cache la valeur invalide
      },
    }),
  );

  app.useGlobalFilters(new TypeOrmExceptionFilter());

  app.setGlobalPrefix('api/');

  // 📚 Swagger 
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('E-commerce API')
      .setDescription('Documentation de l’API E-commerce')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    console.log(`📘 Swagger disponible sur http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  console.log(`✅ API listening on http://localhost:${port}/api`);
}
bootstrap();
