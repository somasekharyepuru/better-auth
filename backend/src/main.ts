import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { createChildLogger } from './common/logger.service';

const logger = createChildLogger('bootstrap');

async function bootstrap() {
    // Validate required environment variables
    const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
    if (!betterAuthSecret) {
        logger.error('BETTER_AUTH_SECRET is not set!');
        logger.error('This is required for session security. Please set it before starting the server.');
        logger.error('Generate one with: openssl rand -base64 32');
        process.exit(1);
    }

    if (betterAuthSecret.length < 32) {
        logger.error(`BETTER_AUTH_SECRET is too short! Current length: ${betterAuthSecret.length} characters. Minimum required: 32 characters.`);
        logger.error('Generate one with: openssl rand -base64 32');
        process.exit(1);
    }

    const weakSecrets = ['secret', 'password', '12345678', 'changeme', 'better-auth-secret'];
    if (weakSecrets.some(weak => betterAuthSecret.toLowerCase().includes(weak))) {
        logger.error('BETTER_AUTH_SECRET appears to be weak!');
        logger.error('Please use a strong, randomly generated secret.');
        logger.error('Generate one with: openssl rand -base64 32');
        process.exit(1);
    }

    logger.info('BETTER_AUTH_SECRET validated successfully');

    const mobileApiKey = process.env.MOBILE_API_KEY;
    if (mobileApiKey) {
        if (mobileApiKey.length < 32) {
            logger.error(`MOBILE_API_KEY is too short! Current length: ${mobileApiKey.length} characters. Minimum required: 32 characters.`);
            logger.error('Generate one with: openssl rand -base64 32');
            process.exit(1);
        }
        logger.info('MOBILE_API_KEY validated successfully');
    } else {
        logger.warn('MOBILE_API_KEY not set. Mobile clients will use CSRF tokens.');
    }

    // Create app with bodyParser disabled (required for Better Auth)
    const app = await NestFactory.create(AppModule, {
        bodyParser: false,
    });

    // Configure proxy trust for accurate IP addresses
    // Only trust X-Forwarded-For from known proxies
    const trustProxy = process.env.TRUST_PROXY;
    if (trustProxy) {
        app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);
        logger.info(`Trust proxy set to: ${trustProxy}`);
    } else {
        // In development without proxy, don't trust any headers
        // In production, configure based on your infrastructure
        if (process.env.NODE_ENV === 'production') {
            logger.warn('Running in production without TRUST_PROXY set. IP address detection may be inaccurate.');
        }
    }

    // CORS configuration
    const corsOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
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

    // Security warning for production
    if (!process.env.CORS_ORIGIN && process.env.NODE_ENV === 'production') {
        logger.warn('CORS_ORIGIN not set in production. Using default localhost origins is insecure!');
        logger.warn('Please set CORS_ORIGIN environment variable with your production origins.');
    }

    app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'X-Mobile-Auth'],
        exposedHeaders: ['Set-Cookie'],
    });

    // Security headers middleware
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"],
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            },
            noSniff: true,
            xssFilter: true,
            frameguard: { action: 'deny' },
        })
    );

    // Global input validation pipeline
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,              // Strip unknown properties
        forbidNonWhitelisted: true,   // Throw error on unknown properties
        transform: true,              // Auto-transform payloads to DTO types
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));

    if (process.env.NODE_ENV !== 'production') {
        // Swagger Documentation
        const config = new DocumentBuilder()
            .setTitle('Auth Service API')
            .setDescription(`Complete authentication and authorization service API.

## Authentication Methods
- **Email/Password**: Traditional username and password
- **Email OTP**: Passwordless authentication with one-time codes
- **Social OAuth**: Google and Microsoft login
- **Two-Factor**: TOTP authenticator app with backup codes

## Organization Management
- Multi-tenant organization support with custom roles
- Team-based permissions within organizations
- Invitation system with email delivery
- Ownership transfer workflow

## Security Features
- Rate limiting (database-backed)
- Comprehensive audit logging
- Device tracking for new login detection
- Password policies with history tracking
- GDPR-compliant account deletion

## Session Management
- 7-day session expiration
- Device tracking
- Multi-session management
- Active organization context

## Authentication
Most endpoints require authentication. Use session cookies or Bearer token.

**Better Auth Endpoints**: \`/api/auth/*\` endpoints are handled by Better Auth and include sign-up, sign-in, email verification, password reset, and 2FA operations.`)
            .setVersion('2.0.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'Session Token',
                    description: 'Enter the session token from login',
                    in: 'header',
                },
                'bearerAuth',
            )
            .addCookieAuth(
                'better-auth.session_token',
                {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'better-auth.session_token',
                    description: 'Session cookie (HTTP-only)',
                },
                'cookieAuth',
            )
            .addTag('Health', 'Health check and monitoring endpoints')
            .addTag('Sessions', 'Session management endpoints')
            .addTag('Admin', 'Administrator-only operations')
            .addTag('Audit', 'Audit log viewing and statistics')
            .addTag('Organizations', 'Organization management')
            .addTag('Organization Members', 'Organization member operations')
            .addTag('Organization Roles', 'Custom role management')
            .addTag('Account Deletion', 'GDPR account deletion requests')
            .addTag('Password Policy', 'Password policy configuration')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                tagsSorter: 'alpha',
                operationsSorter: 'alpha',
            },
            customSiteTitle: 'Auth Service API Docs',
        });

        logger.info('Swagger documentation available at /api/docs');
    } else {
        logger.info('Swagger documentation disabled in production');
    }

    const port = process.env.PORT || 3002;
    await app.listen(port);

    logger.info(`Daymark Backend listening on port ${port}`);
    logger.info(`Auth API available at http://localhost:${port}/api/auth`);
    logger.info(`Rate limiting: 100 req/60s (stricter for sensitive endpoints)`);
    logger.info(`${mobileApiKey ? 'Mobile auth: ENABLED (API key required)' : 'Mobile auth: DISABLED (CSRF tokens required)'}`);
    logger.debug(`CORS Origins: ${corsOrigins.join(', ')}`);
}

bootstrap().catch(error => {
    logger.error('Failed to start server', { error });
    process.exit(1);
});
