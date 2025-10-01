const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Master test credentials from MASTER_TEST_CREDENTIALS.md (Production-safe)
// Note: Using available UserRole enum values (SUPER_ADMIN, ADMIN, USER)
const MASTER_ACCOUNTS = [
  {
    email: 'admin@allin.demo',
    password: 'Admin123!@#',
    name: 'Admin User',
    role: 'ADMIN'
  },
  {
    email: 'agency@allin.demo', 
    password: 'Agency123!@#',
    name: 'Agency Owner',
    role: 'ADMIN'  // Map to ADMIN role
  },
  {
    email: 'manager@allin.demo',
    password: 'Manager123!@#', 
    name: 'Content Manager',
    role: 'USER'   // Map to USER role
  },
  {
    email: 'creator@allin.demo',
    password: 'Creator123!@#',
    name: 'Content Creator', 
    role: 'USER'   // Map to USER role
  },
  {
    email: 'client@allin.demo',
    password: 'Client123!@#',
    name: 'Client User',
    role: 'USER'   // Map to USER role
  },
  {
    email: 'team@allin.demo',
    password: 'Team123!@#',
    name: 'Team Member',
    role: 'USER'   // Map to USER role
  }
];

async function seedMasterAccounts() {
  console.log('🌱 Seeding master test accounts...');
  
  try {
    for (const account of MASTER_ACCOUNTS) {
      // Check if account already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email }
      });
      
      if (existingUser) {
        console.log(`✅ Account ${account.email} already exists - updating password...`);
        
        // Update existing account with new password
        const hashedPassword = await bcrypt.hash(account.password, 10);
        await prisma.user.update({
          where: { email: account.email },
          data: {
            password: hashedPassword,
            name: account.name,
            role: account.role,
            status: 'ACTIVE',
            emailVerified: new Date()
          }
        });
      } else {
        console.log(`🆕 Creating new account: ${account.email}`);
        
        // Create new account
        const hashedPassword = await bcrypt.hash(account.password, 10);
        await prisma.user.create({
          data: {
            email: account.email,
            password: hashedPassword,
            name: account.name,
            role: account.role,
            status: 'ACTIVE',
            emailVerified: new Date()
          }
        });
      }
    }
    
    console.log('✅ Master test accounts seeded successfully!');
    console.log('\n📋 Master Test Credentials:');
    MASTER_ACCOUNTS.forEach(account => {
      console.log(`   ${account.role}: ${account.email} / ${account.password}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding master accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedMasterAccounts()
    .then(() => {
      console.log('\n🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedMasterAccounts, MASTER_ACCOUNTS };