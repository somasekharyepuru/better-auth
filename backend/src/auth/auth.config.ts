import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { emailOTP, admin, twoFactor, organization } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';

const prisma = new PrismaClient();

// Create access control for organization permissions
const statement = {
  user: ['create', 'read', 'update', 'delete'],
  organization: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
} as const;

const ac = createAccessControl(statement);

// Define roles with permissions
const owner = ac.newRole({
  user: ['create', 'read', 'update', 'delete'],
  organization: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
});

const adminRole = ac.newRole({
  user: ['create', 'read', 'update'],
  organization: ['update'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
});

const member = ac.newRole({
  user: ['read'],
  organization: [],
  member: [],
  invitation: [],
});

// Custom role example: Manager
const manager = ac.newRole({
  user: ['read', 'update'],
  organization: ['update'],
  member: ['create', 'update'],
  invitation: ['create', 'cancel'],
});

// Custom role example: Viewer (read-only)
const viewer = ac.newRole({
  user: ['read'],
  organization: [],
  member: [],
  invitation: [],
});

// Lazy-load MailService to avoid initialization issues
// We'll use a simple fetch-based approach to avoid circular dependencies
async function sendEmailViaWebhook(email: string, otp: string, type: string): Promise<boolean> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('N8N_WEBHOOK_URL environment variable is required');
  }

  const maxRetries = Number(process.env.MAIL_MAX_RETRIES || 3);
  const timeoutMs = Number(process.env.MAIL_TIMEOUT_MS || 10000);
  let attempt = 0;
  let lastErr: Error | null = null;

  while (attempt < maxRetries) {
    attempt += 1;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error('Mail webhook timeout')), timeoutMs);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, otp, email, timestamp: new Date().toISOString() }),
        signal: controller.signal as any,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }

      return true;
    } catch (error) {
      lastErr = error as Error;
      const backoff = Math.pow(2, attempt - 1) * 500;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  throw lastErr || new Error('Failed to send email');
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3002',
  basePath: '/api/auth',
  trustedOrigins: process.env.CORS_ORIGIN
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
    ],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-add new users to default organization
          try {
            // Find or create default organization
            let defaultOrg = await prisma.organization.findFirst({
              where: { slug: 'default' },
            });

            if (!defaultOrg) {
              defaultOrg = await prisma.organization.create({
                data: {
                  id: `org_${Date.now()}`,
                  name: 'Default Organization',
                  slug: 'default',
                  createdAt: new Date(),
                },
              });
            }

            // Add user as member with 'member' role
            await prisma.member.create({
              data: {
                id: `member_${Date.now()}`,
                userId: user.id,
                organizationId: defaultOrg.id,
                role: 'member',
                createdAt: new Date(),
              },
            });

            console.log(`Auto-added user ${user.email} to default organization`);
          } catch (error) {
            console.error('Failed to add user to default organization:', error);
            // Don't throw - user creation should still succeed
          }
        },
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false,
        returned: true,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    }),
    ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET && {
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      },
    }),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        try {
          // Map Better Auth types to email types
          const emailTypeMap: Record<string, string> = {
            'email-verification': 'email-verification',
            'sign-up': 'signup-email',
            'forgot-password': 'forgot-password',
            'reset-password': 'reset-password',
          };

          const emailType = emailTypeMap[type] || type;
          await sendEmailViaWebhook(email, otp, emailType);
        } catch (error) {
          console.error('Failed to send email:', error);
          throw error;
        }
      },
      sendVerificationOnSignUp: true,
      otpLength: 6,
    }),
    admin(),
    twoFactor({
      issuer: process.env.APP_NAME || 'Auth Service',
    }),
    organization({
      ac,
      roles: {
        owner,
        admin: adminRole,
        member,
        manager,  // Custom role
        viewer,   // Custom role
      },
      // Single organization approach - allow admins to create
      allowUserToCreateOrganization: async (user) => {
        // Only allow users with admin role to create organizations
        return user.role === 'admin' || user.role === 'owner';
      },
      // Send invitation emails via webhook
      async sendInvitationEmail(data) {
        try {
          // Use the email service to send invitation
          await sendEmailViaWebhook(
            data.email,
            data.id, // Use invitation ID as identifier
            'organization-invitation'
          );

          console.log(`Invitation email sent to ${data.email} for organization ${data.organization.name}`);
        } catch (error) {
          console.error('Failed to send invitation email:', error);
          throw error;
        }
      },
      // Auto-add users to default organization on signup
      organizationHooks: {
        afterCreateOrganization: async ({ organization, user }) => {
          // Log organization creation
          console.log(`Organization ${organization.name} created by ${user.email}`);
        },
        // Auto-add new users to the first available organization
        afterAddMember: async ({ member, user, organization }) => {
          console.log(`User ${user.email} added to organization ${organization.name} with role ${member.role}`);
        },
        afterAcceptInvitation: async ({ member, user, organization }) => {
          console.log(`User ${user.email} accepted invitation and joined ${organization.name} as ${member.role}`);
        },
      },
    }),
  ],
});

