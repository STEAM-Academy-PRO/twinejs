import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as bodyParser from 'body-parser';
import { existsSync } from 'fs';

const PORT = process.env.PORT || 3010;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure body parser to handle large payloads (for story publishing)
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Dirname here is /home/symunona/dev/robot/twinejs/backend/dist !
  // In DEV and PROD (package), paths are slightly different:
  // DEV: uses the '../../dist/web' directory (where the frontend build puts files)
  // PROD: uses the '../../web' directory (where the deploy script puts the files)
  const distWebPath = join(__dirname, '..', '..', 'dist', 'web');
  const webPath = existsSync(distWebPath) ? distWebPath : join(__dirname, '..', '..', 'web');

  // Set API prefix for all routes
  // app.setGlobalPrefix('api');

  // Serve static files from the '../web/' directory
  // This serves the TwineJS web application
  app.useStaticAssets(webPath);

  // Serve index.html for all non-API routes (SPA routing)
  console.log('Serving Static dir as root: ' + webPath)
  console.log('Server Staring on port ' + PORT);

  await app.listen(PORT);
}
bootstrap();
