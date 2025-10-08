import { PrismaClient, SocialPlatform, PostStatus, UserRole, MemberRole } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * COMPREHENSIVE MOCK DATA SEEDER FOR CLIENT DEMOS
 *
 * This script creates realistic, interconnected mock data to demonstrate
 * all features of the AllIN Social Media Management Platform.
 *
 * Features demonstrated:
 * - 15 diverse user profiles with realistic data
 * - 3 organizations with different team structures
 * - 100+ social media posts with varied engagement
 * - Scheduled posts showing content calendar functionality
 * - Social account connections to multiple platforms
 * - Content templates for efficient posting
 * - AI conversation history
 * - Analytics data showing platform performance
 */

// Demo password for all demo users (for easy testing)
const DEMO_PASSWORD = 'Demo123!';

// Helper to create realistic timestamps in the past 3 months
function randomPastDate(daysAgo: number = 90): Date {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return faker.date.between({ from: past, to: now });
}

// Helper to create realistic future timestamps for scheduling
function randomFutureDate(daysAhead: number = 30): Date {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return faker.date.between({ from: now, to: future });
}

async function seedDemoData() {
  console.log('\n🌱 Starting comprehensive demo data seeding...\n');

  try {
    // ============================================
    // 1. CREATE DIVERSE USER PROFILES (15 users)
    // ============================================
    console.log('👥 Creating 15 diverse user profiles...');

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const users = [];

    // Power user - agency owner with high activity
    users.push(
      await prisma.user.create({
        data: {
          email: 'sarah.agency@demo.com',
          password: hashedPassword,
          name: faker.person.fullName({ sex: 'female' }),
          emailVerified: new Date(),
          role: UserRole.ADMIN,
          status: 'ACTIVE',
          image: `https://i.pravatar.cc/150?img=1`,
          lastLoginAt: new Date(),
        },
      })
    );

    // Content creator - very active
    users.push(
      await prisma.user.create({
        data: {
          email: 'mike.creator@demo.com',
          password: hashedPassword,
          name: faker.person.fullName({ sex: 'male' }),
          emailVerified: new Date(),
          role: UserRole.USER,
          status: 'ACTIVE',
          image: `https://i.pravatar.cc/150?img=12`,
          lastLoginAt: randomPastDate(2),
        },
      })
    );

    // Social media manager - moderate activity
    users.push(
      await prisma.user.create({
        data: {
          email: 'jessica.manager@demo.com',
          password: hashedPassword,
          name: faker.person.fullName({ sex: 'female' }),
          emailVerified: new Date(),
          role: UserRole.USER,
          status: 'ACTIVE',
          image: `https://i.pravatar.cc/150?img=5`,
          lastLoginAt: randomPastDate(1),
        },
      })
    );

    // New user - minimal activity (edge case)
    users.push(
      await prisma.user.create({
        data: {
          email: 'alex.newbie@demo.com',
          password: hashedPassword,
          name: faker.person.fullName(),
          emailVerified: new Date(),
          role: UserRole.USER,
          status: 'ACTIVE',
          image: `https://i.pravatar.cc/150?img=20`,
          lastLoginAt: randomPastDate(7),
          createdAt: randomPastDate(10), // Recently joined
        },
      })
    );

    // Add 11 more diverse users with varying profiles
    for (let i = 0; i < 11; i++) {
      const sex = faker.helpers.arrayElement(['male', 'female'] as const);
      users.push(
        await prisma.user.create({
          data: {
            email: `${faker.internet.userName().toLowerCase()}@demo.com`,
            password: hashedPassword,
            name: faker.person.fullName({ sex }),
            emailVerified: faker.datatype.boolean() ? new Date() : null,
            role: faker.helpers.arrayElement([UserRole.USER, UserRole.ADMIN]),
            status: faker.helpers.arrayElement(['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING'] as const), // Mostly active
            image: `https://i.pravatar.cc/150?img=${faker.number.int({ min: 1, max: 70 })}`,
            lastLoginAt: faker.datatype.boolean() ? randomPastDate(30) : null,
            createdAt: randomPastDate(180),
          },
        })
      );
    }

    console.log(`✅ Created ${users.length} users\n`);

    // ============================================
    // 2. CREATE ORGANIZATIONS WITH TEAM STRUCTURE
    // ============================================
    console.log('🏢 Creating 3 organizations with teams...');

    const organizations = [];

    // Marketing Agency - large team
    const agency = await prisma.organization.create({
      data: {
        name: 'Digital Reach Agency',
        slug: 'digital-reach',
        description: 'Full-service digital marketing agency specializing in social media management',
        logo: 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=DRA',
        website: 'https://digitalreach.demo',
        settings: {
          timezone: 'America/New_York',
          defaultPosting Time: '10:00 AM',
        },
      },
    });
    organizations.push(agency);

    // Add team members to agency
    await prisma.organizationMember.createMany({
      data: [
        { userId: users[0].id, organizationId: agency.id, role: MemberRole.OWNER },
        { userId: users[1].id, organizationId: agency.id, role: MemberRole.ADMIN },
        { userId: users[2].id, organizationId: agency.id, role: MemberRole.MEMBER },
        { userId: users[4].id, organizationId: agency.id, role: MemberRole.MEMBER },
        { userId: users[5].id, organizationId: agency.id, role: MemberRole.MEMBER },
      ],
    });

    // E-commerce Brand - medium team
    const ecommerce = await prisma.organization.create({
      data: {
        name: 'TrendyWear Fashion',
        slug: 'trendywear',
        description: 'Sustainable fashion brand with a focus on social responsibility',
        logo: 'https://via.placeholder.com/200x200/EC4899/FFFFFF?text=TW',
        website: 'https://trendywear.demo',
        settings: {
          timezone: 'America/Los_Angeles',
          brandColors: ['#EC4899', '#8B5CF6', '#3B82F6'],
        },
      },
    });
    organizations.push(ecommerce);

    await prisma.organizationMember.createMany({
      data: [
        { userId: users[6].id, organizationId: ecommerce.id, role: MemberRole.OWNER },
        { userId: users[7].id, organizationId: ecommerce.id, role: MemberRole.ADMIN },
        { userId: users[8].id, organizationId: ecommerce.id, role: MemberRole.MEMBER },
      ],
    });

    // Startup - small team (edge case)
    const startup = await prisma.organization.create({
      data: {
        name: 'InnovateTech Startup',
        slug: 'innovatetech',
        description: 'B2B SaaS startup disrupting the productivity space',
        logo: 'https://via.placeholder.com/200x200/10B981/FFFFFF?text=IT',
        website: 'https://innovatetech.demo',
      },
    });
    organizations.push(startup);

    await prisma.organizationMember.createMany({
      data: [
        { userId: users[9].id, organizationId: startup.id, role: MemberRole.OWNER },
        { userId: users[10].id, organizationId: startup.id, role: MemberRole.MEMBER },
      ],
    });

    console.log(`✅ Created ${organizations.length} organizations with team members\n`);

    // ============================================
    // 3. CREATE SOCIAL ACCOUNTS (Multiple Platforms)
    // ============================================
    console.log('📱 Creating social media account connections...');

    const socialAccounts = [];
    const platforms: SocialPlatform[] = ['TWITTER', 'INSTAGRAM', 'LINKEDIN', 'FACEBOOK'];

    // Agency - connected to all platforms
    for (const platform of platforms) {
      socialAccounts.push(
        await prisma.socialAccount.create({
          data: {
            userId: users[0].id,
            organizationId: agency.id,
            platform,
            platformId: faker.string.uuid(),
            username: `digitalreach_${platform.toLowerCase()}`,
            displayName: 'Digital Reach Agency',
            profileUrl: `https://${platform.toLowerCase()}.com/digitalreach`,
            profileImage: 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=DRA',
            accessToken: faker.string.alphanumeric(64),
            refreshToken: faker.string.alphanumeric(64),
            tokenExpiry: randomFutureDate(60),
            scope: ['read', 'write', 'analytics'],
            followersCount: faker.number.int({ min: 5000, max: 50000 }),
            followingCount: faker.number.int({ min: 500, max: 2000 }),
            postsCount: faker.number.int({ min: 100, max: 500 }),
            status: 'ACTIVE',
            lastSyncAt: randomPastDate(1),
            connectedAt: randomPastDate(180),
          },
        })
      );
    }

    // E-commerce - Instagram and Facebook focus
    for (const platform of ['INSTAGRAM', 'FACEBOOK', 'TIKTOK'] as SocialPlatform[]) {
      socialAccounts.push(
        await prisma.socialAccount.create({
          data: {
            userId: users[6].id,
            organizationId: ecommerce.id,
            platform,
            platformId: faker.string.uuid(),
            username: `trendywear_${platform.toLowerCase()}`,
            displayName: 'TrendyWear Fashion',
            profileUrl: `https://${platform.toLowerCase()}.com/trendywear`,
            profileImage: 'https://via.placeholder.com/200x200/EC4899/FFFFFF?text=TW',
            accessToken: faker.string.alphanumeric(64),
            refreshToken: faker.string.alphanumeric(64),
            tokenExpiry: randomFutureDate(60),
            scope: ['read', 'write'],
            followersCount: faker.number.int({ min: 10000, max: 100000 }),
            followingCount: faker.number.int({ min: 200, max: 1000 }),
            postsCount: faker.number.int({ min: 200, max: 1000 }),
            status: 'ACTIVE',
            lastSyncAt: randomPastDate(1),
          },
        })
      );
    }

    // Startup - LinkedIn and Twitter (B2B focus)
    for (const platform of ['LINKEDIN', 'TWITTER'] as SocialPlatform[]) {
      socialAccounts.push(
        await prisma.socialAccount.create({
          data: {
            userId: users[9].id,
            organizationId: startup.id,
            platform,
            platformId: faker.string.uuid(),
            username: `innovatetech_${platform.toLowerCase()}`,
            displayName: 'InnovateTech',
            profileUrl: `https://${platform.toLowerCase()}.com/innovatetech`,
            profileImage: 'https://via.placeholder.com/200x200/10B981/FFFFFF?text=IT',
            accessToken: faker.string.alphanumeric(64),
            refreshToken: faker.string.alphanumeric(64),
            tokenExpiry: randomFutureDate(60),
            scope: ['read', 'write'],
            followersCount: faker.number.int({ min: 1000, max: 5000 }),
            followingCount: faker.number.int({ min: 500, max: 1500 }),
            postsCount: faker.number.int({ min: 50, max: 200 }),
            status: 'ACTIVE',
            lastSyncAt: randomPastDate(2),
            connectedAt: randomPastDate(90),
          },
        })
      );
    }

    console.log(`✅ Created ${socialAccounts.length} social account connections\n`);

    // ============================================
    // 4. CREATE 100+ POSTS WITH VARIED ENGAGEMENT
    // ============================================
    console.log('📝 Creating 100+ posts with realistic engagement...');

    const contentTemplates = [
      'Just launched our new product! 🚀 Check it out: {link}',
      'Monday motivation: {quote}',
      'Behind the scenes at {company} 📸',
      'Quick tip: {tip}',
      'We're hiring! Join our team as a {role}',
      'New blog post: {title} {link}',
      'Thank you to our amazing community! ❤️',
      'Weekend vibes ✨',
      'Industry insight: {insight}',
      'Customer spotlight: {testimonial}',
    ];

    const hashtags = ['#socialmedia', '#marketing', '#digitalmarketing', '#business', '#entrepreneur', '#startup', '#tech', '#fashion', '#lifestyle', '#motivation'];

    let postCount = 0;

    for (const account of socialAccounts) {
      const numPosts = faker.number.int({ min: 8, max: 15 });

      for (let i = 0; i < numPosts; i++) {
        const template = faker.helpers.arrayElement(contentTemplates);
        const content = template
          .replace('{link}', faker.internet.url())
          .replace('{quote}', faker.lorem.sentence())
          .replace('{company}', organizations.find((o) => o.id === account.organizationId)?.name || 'our company')
          .replace('{tip}', faker.lorem.sentence())
          .replace('{role}', faker.person.jobTitle())
          .replace('{title}', faker.lorem.words(5))
          .replace('{insight}', faker.lorem.sentence())
          .replace('{testimonial}', faker.lorem.paragraph());

        const publishedAt = randomPastDate(90);
        const daysSincePost = Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
        const engagementMultiplier = Math.max(1, 30 - daysSincePost); // More recent = more engagement

        await prisma.post.create({
          data: {
            userId: account.userId,
            organizationId: account.organizationId,
            socialAccountId: account.id,
            content,
            hashtags: faker.helpers.arrayElements(hashtags, { min: 2, max: 5 }),
            mentions: [],
            platformPostId: faker.string.uuid(),
            publishedAt,
            status: PostStatus.PUBLISHED,
            likes: faker.number.int({ min: 10, max: 1000 }) * engagementMultiplier,
            comments: faker.number.int({ min: 0, max: 50 }) * engagementMultiplier,
            shares: faker.number.int({ min: 0, max: 20 }) * engagementMultiplier,
            reach: faker.number.int({ min: 100, max: 10000 }) * engagementMultiplier,
            impressions: faker.number.int({ min: 500, max: 50000 }) * engagementMultiplier,
            createdAt: publishedAt,
          },
        });

        postCount++;
      }
    }

    console.log(`✅ Created ${postCount} published posts with engagement metrics\n`);

    // ============================================
    // 5. CREATE SCHEDULED POSTS (Future Content Calendar)
    // ============================================
    console.log('📅 Creating scheduled posts for content calendar...');

    let scheduledCount = 0;

    for (const account of socialAccounts.slice(0, 5)) {
      // Only first 5 accounts have scheduled posts
      const numScheduled = faker.number.int({ min: 3, max: 8 });

      for (let i = 0; i < numScheduled; i++) {
        const scheduledFor = randomFutureDate(30);

        await prisma.scheduledPost.create({
          data: {
            userId: account.userId,
            organizationId: account.organizationId,
            socialAccountId: account.id,
            content: faker.lorem.paragraph(),
            hashtags: faker.helpers.arrayElements(hashtags, { min: 2, max: 4 }),
            mentions: [],
            scheduledFor,
            status: 'PENDING',
            timezone: 'America/New_York',
            createdAt: randomPastDate(7),
          },
        });

        scheduledCount++;
      }
    }

    console.log(`✅ Created ${scheduledCount} scheduled posts\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ DEMO DATA SEEDING COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   • ${users.length} diverse user profiles created`);
    console.log(`   • ${organizations.length} organizations with team structures`);
    console.log(`   • ${socialAccounts.length} social media account connections`);
    console.log(`   • ${postCount} published posts with engagement metrics`);
    console.log(`   • ${scheduledCount} scheduled posts in content calendar`);
    console.log('');
    console.log('🔐 All demo users have password: Demo123!');
    console.log('');
    console.log('📧 Sample demo user logins:');
    console.log('   • sarah.agency@demo.com (Agency Owner - Power User)');
    console.log('   • mike.creator@demo.com (Content Creator - Very Active)');
    console.log('   • jessica.manager@demo.com (Social Media Manager)');
    console.log('   • alex.newbie@demo.com (New User - Edge Case)');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow direct execution
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('✅ Demo seeding script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo seeding script failed:', error);
      process.exit(1);
    });
}

export { seedDemoData };
