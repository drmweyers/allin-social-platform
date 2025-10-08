import { PrismaClient, PostStatus, ScheduleStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create super admin user
  const adminPassword = await bcrypt.hash('AdminPass123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@allin.demo' },
    update: {
      password: adminPassword,
      emailVerified: new Date(),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    create: {
      email: 'admin@allin.demo',
      password: adminPassword,
      name: 'Super Administrator',
      emailVerified: new Date(),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created super admin user:', adminUser.email);

  // Create additional test accounts
  const testAccounts = [
    { email: 'agency@allin.demo', password: 'AgencyPass123', name: 'Agency Owner', role: 'ADMIN' },
    { email: 'manager@allin.demo', password: 'ManagerPass123', name: 'Content Manager', role: 'ADMIN' },
    { email: 'creator@allin.demo', password: 'CreatorPass123', name: 'Content Creator', role: 'USER' },
    { email: 'client@allin.demo', password: 'ClientPass123', name: 'Client Viewer', role: 'USER' },
    { email: 'team@allin.demo', password: 'TeamPass123', name: 'Team Member', role: 'USER' },
  ];

  for (const account of testAccounts) {
    const hashedPassword = await bcrypt.hash(account.password, 10);
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        password: hashedPassword,
        emailVerified: new Date(),
        role: account.role as any,
        status: 'ACTIVE',
      },
      create: {
        email: account.email,
        password: hashedPassword,
        name: account.name,
        emailVerified: new Date(),
        role: account.role as any,
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Created test account: ${user.email} (${account.role})`);
  }

  // Create demo user
  const demoPassword = await bcrypt.hash('DemoPassword123!', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@allin.com' },
    update: {
      password: demoPassword,
      emailVerified: new Date(),
      role: 'USER',
      status: 'ACTIVE',
    },
    create: {
      email: 'demo@allin.com',
      password: demoPassword,
      name: 'Demo User',
      emailVerified: new Date(),
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create sample social accounts for demo user
  const platforms = [
    { name: 'FACEBOOK', displayName: 'Demo Facebook' },
    { name: 'TWITTER', displayName: 'Demo Twitter' },
    { name: 'INSTAGRAM', displayName: 'Demo Instagram' },
    { name: 'LINKEDIN', displayName: 'Demo LinkedIn' }
  ];

  const socialAccounts = [];
  for (const platform of platforms) {
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: demoUser.id,
        platform: platform.name as any,
        platformId: `demo_${platform.name.toLowerCase()}`,
      },
    });

    if (!existingAccount) {
      const account = await prisma.socialAccount.create({
        data: {
          userId: demoUser.id,
          platform: platform.name as any,
          platformId: `demo_${platform.name.toLowerCase()}`,
          username: `demo_${platform.name.toLowerCase()}`,
          displayName: platform.displayName,
          accessToken: 'demo_token',
          refreshToken: 'demo_refresh_token',
          status: 'ACTIVE',
          scope: ['read', 'write'],
        },
      });
      socialAccounts.push(account);
      console.log(`✅ Created social account: ${platform.displayName}`);
    } else {
      socialAccounts.push(existingAccount);
      console.log(`✓ Social account already exists: ${platform.displayName}`);
    }
  }

  // Create sample posts (only if we have social accounts)
  if (socialAccounts.length > 0) {
    const samplePosts = [
      {
        content: 'Welcome to AllIN! 🚀 Manage all your social media from one place.',
        socialAccountId: socialAccounts[0].id, // Facebook
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      {
        content: 'Schedule your posts, analyze performance, and grow your audience.',
        socialAccountId: socialAccounts[2].id, // Instagram
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      {
        content: 'AI-powered content generation is here! Create engaging posts in seconds.',
        socialAccountId: socialAccounts[1].id, // Twitter
        status: PostStatus.DRAFT,
      },
    ];

    for (const postData of samplePosts) {
      const existingPost = await prisma.post.findFirst({
        where: {
          content: postData.content,
          userId: demoUser.id,
        },
      });

      if (!existingPost) {
        await prisma.post.create({
          data: {
            ...postData,
            userId: demoUser.id,
            hashtags: [],
            mentions: [],
          },
        });
      }
    }

    console.log('✅ Created sample posts');
  }

  // Create sample scheduled posts
  if (socialAccounts.length > 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Create posts for scheduling
    const scheduledPost1 = await prisma.post.create({
      data: {
        userId: demoUser.id,
        content: 'Coming soon: New features for team collaboration!',
        socialAccountId: socialAccounts[0].id, // Facebook
        status: PostStatus.SCHEDULED,
        hashtags: ['teamwork', 'collaboration'],
        mentions: [],
      },
    });

    await prisma.scheduledPost.create({
      data: {
        postId: scheduledPost1.id,
        userId: demoUser.id,
        socialAccountId: socialAccounts[0].id,
        scheduledFor: tomorrow,
        status: ScheduleStatus.PENDING,
      },
    });

    const scheduledPost2 = await prisma.post.create({
      data: {
        userId: demoUser.id,
        content: 'Weekly tip: Use hashtags strategically to increase your reach.',
        socialAccountId: socialAccounts[2].id, // Instagram
        status: PostStatus.SCHEDULED,
        hashtags: ['socialmediatips', 'growyouraudience'],
        mentions: [],
      },
    });

    await prisma.scheduledPost.create({
      data: {
        postId: scheduledPost2.id,
        userId: demoUser.id,
        socialAccountId: socialAccounts[2].id,
        scheduledFor: nextWeek,
        status: ScheduleStatus.PENDING,
      },
    });

    console.log('✅ Created scheduled posts');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });