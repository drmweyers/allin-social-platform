import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * PERSISTENT DEV LOGIN CREDENTIALS SEEDER
 *
 * This script automatically seeds a development user account that NEVER changes.
 * It runs on every server startup in development mode to ensure login credentials
 * are always available, regardless of database state or code changes.
 *
 * IMPORTANT: This is DEVELOPMENT ONLY - never runs in production
 */

export async function seedDevUser() {
  // Safety check - only run in development
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Dev seeding skipped - production environment detected');
    return;
  }

  try {
    const devEmail = 'dev@example.com';
    const devPassword = 'DevPassword123!';

    // Hash password for security
    const hashedPassword = await bcrypt.hash(devPassword, 10);

    // Upsert dev user - creates if doesn't exist, updates if exists
    // This makes the operation idempotent (safe to run multiple times)
    const devUser = await prisma.user.upsert({
      where: { email: devEmail },
      update: {
        password: hashedPassword,
        emailVerified: new Date(),
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      create: {
        email: devEmail,
        password: hashedPassword,
        name: 'Dev User',
        emailVerified: new Date(),
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Clear, visible console output with dev credentials
    console.log('\n' + '='.repeat(60));
    console.log('✓ DEV USER SEEDED');
    console.log('  Email: dev@example.com');
    console.log('  Password: DevPassword123!');
    console.log('  Role: ADMIN');
    console.log('  Status: ACTIVE');
    console.log('='.repeat(60) + '\n');

    return devUser;
  } catch (error) {
    console.error('❌ Error seeding dev user:', error);
    // Don't throw - allow server to continue even if seeding fails
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow direct execution for testing: node -r ts-node/register prisma/dev-seed.ts
if (require.main === module) {
  seedDevUser()
    .then(() => {
      console.log('✅ Dev seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Dev seeding failed:', error);
      process.exit(1);
    });
}
