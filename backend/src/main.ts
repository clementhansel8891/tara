import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Bootstrap the Zenvix Backend Application
 * 
 * Configuration:
 * - Global ValidationPipe with whitelist and transform enabled
 * - CORS enabled for frontend communication
 * - Port 3001 (to avoid conflict with Vite dev server)
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      transform: true, // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite and potential Next.js
    credentials: true,
  });

  // Start server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║   🚀 Zenvix Platform Backend - DEV_MOCK_MODE          ║');
  console.log('║                                                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║   Server running on: http://localhost:${port}           ║`);
  console.log('║   Mode: Development (Mock Repositories)                ║');
  console.log('║   Multi-Tenancy: ENABLED (x-tenant-id required)        ║');
  console.log('║                                                        ║');
  console.log('║   Available Endpoints:                                 ║');
  console.log('║   • GET  /finance/ledger                               ║');
  console.log('║   • POST /finance/transactions                         ║');
  console.log('║   • GET  /finance/balance                              ║');
  console.log('║   • GET  /finance/transactions/:id                     ║');
  console.log('║                                                        ║');
  console.log('║   Test Tenants:                                        ║');
  console.log('║   • tenant-001 (Tech Startup)                          ║');
  console.log('║   • tenant-002 (Retail Chain)                          ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
}

bootstrap();
