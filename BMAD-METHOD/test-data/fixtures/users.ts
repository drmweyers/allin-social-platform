import { UserRole, UserStatus } from '@prisma/client';

// Master test credentials from CLAUDE.md - DO NOT CHANGE
export const MASTER_TEST_CREDENTIALS = {
  admin: {
    email: 'admin@allin.demo',
    password: 'Admin123!@#',
    role: 'ADMIN' as UserRole,
    accessLevel: 'Full system access'
  },
  agency: {
    email: 'agency@allin.demo',
    password: 'Agency123!@#',
    role: 'USER' as UserRole,
    accessLevel: 'Manage all clients'
  },
  manager: {
    email: 'manager@allin.demo',
    password: 'Manager123!@#',
    role: 'USER' as UserRole,
    accessLevel: 'Create & schedule content'
  },
  creator: {
    email: 'creator@allin.demo',
    password: 'Creator123!@#',
    role: 'USER' as UserRole,
    accessLevel: 'Content creation only'
  },
  client: {
    email: 'client@allin.demo',
    password: 'Client123!@#',
    role: 'USER' as UserRole,
    accessLevel: 'Read-only view'
  },
  team: {
    email: 'team@allin.demo',
    password: 'Team123!@#',
    role: 'USER' as UserRole,
    accessLevel: 'Limited team access'
  }
};

// Test user fixtures for unit tests
export const testUsers = {
  validUser: {
    email: 'test.user@example.com',
    name: 'Test User',
    password: 'Password123!',
    role: 'USER' as UserRole,
    status: 'ACTIVE' as UserStatus,
  },

  adminUser: {
    email: 'admin.test@example.com',
    name: 'Admin Test User',
    password: 'AdminPass123!',
    role: 'ADMIN' as UserRole,
    status: 'ACTIVE' as UserStatus,
  },

  superAdmin: {
    email: 'superadmin@example.com',
    name: 'Super Admin',
    password: 'SuperAdmin123!',
    role: 'SUPER_ADMIN' as UserRole,
    status: 'ACTIVE' as UserStatus,
  },

  pendingUser: {
    email: 'pending@example.com',
    name: 'Pending User',
    password: 'Password123!',
    role: 'USER' as UserRole,
    status: 'PENDING' as UserStatus,
  },

  suspendedUser: {
    email: 'suspended@example.com',
    name: 'Suspended User',
    password: 'Password123!',
    role: 'USER' as UserRole,
    status: 'SUSPENDED' as UserStatus,
  },

  // Invalid data for validation tests
  invalidUsers: {
    noEmail: {
      name: 'No Email User',
      password: 'Password123!',
      role: 'USER' as UserRole,
      status: 'ACTIVE' as UserStatus,
    },

    invalidEmail: {
      email: 'invalid-email',
      name: 'Invalid Email',
      password: 'Password123!',
      role: 'USER' as UserRole,
      status: 'ACTIVE' as UserStatus,
    },

    shortPassword: {
      email: 'short@example.com',
      name: 'Short Password',
      password: '123',
      role: 'USER' as UserRole,
      status: 'ACTIVE' as UserStatus,
    },

    weakPassword: {
      email: 'weak@example.com',
      name: 'Weak Password',
      password: 'password',
      role: 'USER' as UserRole,
      status: 'ACTIVE' as UserStatus,
    },

    longName: {
      email: 'longname@example.com',
      name: 'A'.repeat(256), // Too long
      password: 'Password123!',
      role: 'USER' as UserRole,
      status: 'ACTIVE' as UserStatus,
    }
  }
};

// User registration test data
export const registrationData = {
  valid: {
    email: 'newuser@example.com',
    name: 'New User',
    password: 'NewPassword123!'
  },

  withoutName: {
    email: 'noname@example.com',
    password: 'Password123!'
  },

  duplicateEmail: {
    email: 'test.user@example.com', // Same as testUsers.validUser
    name: 'Duplicate Email',
    password: 'Password123!'
  }
};

// Login test data
export const loginData = {
  valid: {
    email: 'test.user@example.com',
    password: 'Password123!',
    rememberMe: false
  },

  validWithRememberMe: {
    email: 'test.user@example.com',
    password: 'Password123!',
    rememberMe: true
  },

  invalidEmail: {
    email: 'nonexistent@example.com',
    password: 'Password123!',
    rememberMe: false
  },

  invalidPassword: {
    email: 'test.user@example.com',
    password: 'WrongPassword',
    rememberMe: false
  },

  suspendedUser: {
    email: 'suspended@example.com',
    password: 'Password123!',
    rememberMe: false
  },

  pendingUser: {
    email: 'pending@example.com',
    password: 'Password123!',
    rememberMe: false
  }
};

// Password reset test data
export const passwordResetData = {
  validEmail: 'test.user@example.com',
  invalidEmail: 'nonexistent@example.com',
  newPassword: 'NewPassword123!',
  weakNewPassword: 'weak'
};

// User update test data
export const userUpdateData = {
  validUpdate: {
    name: 'Updated Name',
    email: 'updated@example.com'
  },

  nameOnly: {
    name: 'Name Only Update'
  },

  invalidEmail: {
    email: 'invalid-email-format'
  }
};

// Helper functions for test data
export const createTestUserData = (overrides: Partial<any> = {}) => ({
  ...testUsers.validUser,
  ...overrides,
  id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
});

export const createMasterTestUser = (role: keyof typeof MASTER_TEST_CREDENTIALS) => ({
  ...MASTER_TEST_CREDENTIALS[role],
  id: `master_${role}_${Date.now()}`,
  name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
  status: 'ACTIVE' as UserStatus,
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});