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

  // CORS (permisivo: permite cualquier origen y credenciales)
  // Nota: origin '*' + credentials true no funciona en navegadores; usamos callback dinámico.
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

  // Seguridad
  app.use(helmet());

  // Compresión
  app.use(compression());

  // Filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptor de logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('DeFi Edu API')
    .setDescription('API para la plataforma educativa de DeFi')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api`);
}
bootstrap();
