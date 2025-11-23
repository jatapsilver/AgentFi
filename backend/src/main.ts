// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      callback(null, origin || '*');
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    exposedHeaders: '*',
    maxAge: 86400,
  });

  // Seguridad (desactivamos CSP porque rompe Swagger)
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  // Compresión
  app.use(compression());

  // Filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptor de logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 📘 Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('DeFi Edu API')
    .setDescription('API para la plataforma educativa de DeFi')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Endpoint para el JSON de Swagger
  app.use('/api-json', (req, res) => {
    res.send(document);
  });

  // UI de Swagger en /api
  SwaggerModule.setup('/api', app, document, {
    swaggerOptions: {
      url: '/api-json',
      persistAuthorization: true,
    },
    customSiteTitle: 'DeFi Edu API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // importante para Docker
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api`);
}

bootstrap();
