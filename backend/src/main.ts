import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure body parser to handle large payloads (for story publishing)
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Set API prefix for all routes
  // app.setGlobalPrefix('api');

  // Serve static files from the 'static' directory
  // In production, this will be the built frontend
  const staticPath = join(__dirname, '..', '..', 'static');
  app.useStaticAssets(staticPath);

  // Serve index.html for all non-API routes (SPA routing)
  app.setBaseViewsDir(staticPath);
  app.setViewEngine('html');

  await app.listen(process.env.PORT || 3010);
}
bootstrap();
