import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth/auth.config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const helmet = require('helmet');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Required for Better Auth
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug'],
  });

  // Get Express instance for manual middleware registration
  const expressApp = app.getHttpAdapter().getInstance();

  // Security middleware - apply before CORS
  if (process.env.NODE_ENV === 'production') {
    expressApp.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding from trusted origins
    }));
    logger.log('Helmet security headers enabled');
  }

  // Compression middleware
  expressApp.use(compression());
  logger.log('Response compression enabled');

  // Enable CORS with environment-specific origins - MUST be before Better Auth handler

  // Enable CORS with environment-specific origins - MUST be before Better Auth handler
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : process.env.NODE_ENV === 'production'
      ? [] // No default origins in production
      : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:4173',
        'http://127.0.0.1:8080',
      ];
  // Add CORS middleware BEFORE Better Auth handler
  expressApp.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    if (corsOrigins.includes(origin) || corsOrigins.length === 0) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
      res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  });

  // Register Better Auth handler AFTER CORS middleware
  const betterAuthHandler = toNodeHandler(auth);
  expressApp.use('/api/auth', betterAuthHandler);
  logger.log('Better Auth handler registered on /api/auth');

  // Also enable NestJS CORS for other routes
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Global validation pipe with enhanced security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Auth backend is running on: http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`CORS Origins: ${corsOrigins.length > 0 ? corsOrigins.join(', ') : 'None configured'}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});