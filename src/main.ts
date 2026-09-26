// https://www.freecodecamp.org/news/build-web-apis-with-nestjs-beginners-guide/
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = Number(configService.get('PORT') || 4000);

  // app.useGlobalFilters(
  //   new HttpExceptionsFilter(),
  //   new TypeORMExceptionFilter(),
  // );
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-token', 'x-api-key'],
  });

  // http://localhost:4000/docs/#/
  const options = new DocumentBuilder()
    .setTitle('Bazaar')
    .setDescription('Store API for the shop, checkout, and third-party integrations')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
