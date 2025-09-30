import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting AllIN Platform Test Suite Teardown...');

  try {
    // Clean up any test data
    console.log('🗑️ Cleaning up test data...');

    // You can add cleanup logic here, such as:
    // - Deleting test accounts
    // - Cleaning up uploaded files
    // - Resetting database state
    // - Clearing cache

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here to allow tests to continue
  }
}

export default globalTeardown;