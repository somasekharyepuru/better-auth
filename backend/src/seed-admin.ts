/**
 * Admin User Seed Script
 * 
 * Creates a default admin user on first startup using ADMIN_EMAIL and ADMIN_PASSWORD
 * environment variables. This script is idempotent - it checks if the admin exists
 * before creating.
 * 
 * Run: npx ts-node --transpile-only src/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();


async function seedAdmin(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Skip if credentials not provided
    if (!adminEmail || !adminPassword) {
        console.log('⏭️  Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set');
        return;
    }

    console.log(`🔍 Checking for existing admin user: ${adminEmail}`);

    try {
        // Check if admin user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail },
        });

        if (existingUser) {
            console.log(`✅ Admin user already exists: ${adminEmail}`);

            // Ensure user has admin role
            if (existingUser.role !== 'admin') {
                await prisma.user.update({
                    where: { email: adminEmail },
                    data: { role: 'admin' },
                });
                console.log(`🔧 Updated existing user to admin role`);
            }
            return;
        }

        // Create admin user
        const userId = randomUUID();
        const hashedPassword = await hashPassword(adminPassword);
        const now = new Date();

        // Create user record
        const user = await prisma.user.create({
            data: {
                id: userId,
                name: 'Admin',
                email: adminEmail,
                emailVerified: true, // Skip email verification for admin
                role: 'admin',
                createdAt: now,
                updatedAt: now,
            },
        });

        // Create account record (for email/password auth)
        await prisma.account.create({
            data: {
                id: randomUUID(),
                accountId: userId, // Use user ID as account ID for credential accounts
                providerId: 'credential',
                userId: userId,
                password: hashedPassword,
                createdAt: now,
                updatedAt: now,
            },
        });

        console.log(`🎉 Admin user created successfully!`);
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Role: admin`);
        console.log(`   Email Verified: true`);

    } catch (error) {
        console.error('❌ Failed to seed admin user:', error);
        // Don't throw - allow application to start even if seeding fails
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seed
seedAdmin().catch((error) => {
    console.error('❌ Admin seed script error:', error);
    process.exit(1);
});
