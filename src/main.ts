import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TypeOrmExceptionFilter } from './common/filters/typeorm-exception.filter';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(cookieParser());
  const port = process.env.PORT || 3000;

  console.log('==========================================');
  console.log(' NestJS Ecommerce API Started');
  console.log(' Environment:', process.env.NODE_ENV || 'development');
  console.log(' Port:', port);
  console.log('==========================================');

  app.enableCors({
    // TODO: On va le restreindre après le premier déploiement
    origin: [
      "https://kernelhub-store.vercel.app/",
      "https://kernelswip-store.vercel.app/",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
    methods: 'GET,PUT,POST,DELETE, PATCH',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  app.useGlobalFilters(new TypeOrmExceptionFilter());
  app.setGlobalPrefix('api');
  // Pour lagestion des erreurs
  app.useGlobalFilters(new HttpExceptionFilter()); // 👈


  //  Swagger 
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('E-commerce API')
      .setDescription('Documentation de l’API E-commerce')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    console.log(` Swagger disponible sur http://localhost:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');
  console.log(`API listening on http://localhost:${port}/api`);
}
bootstrap();
