import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting AllIN Platform Test Suite Setup...');

  // Create a browser instance for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3001';

    // Health check - wait for the application to be available
    console.log('🔍 Checking application health...');
    let healthCheckAttempts = 0;
    const maxAttempts = 30;

    while (healthCheckAttempts < maxAttempts) {
      try {
        await page.goto(baseURL, { timeout: 5000 });
        console.log('✅ Application is responding');
        break;
      } catch (error) {
        healthCheckAttempts++;
        if (healthCheckAttempts === maxAttempts) {
          throw new Error(`❌ Application failed to respond after ${maxAttempts} attempts`);
        }
        console.log(`⏳ Application not ready, attempt ${healthCheckAttempts}/${maxAttempts}`);
        await page.waitForTimeout(2000);
      }
    }

    // Create test accounts and data if needed
    console.log('🔧 Setting up test data...');

    // Store test credentials in browser storage
    await page.goto(`${baseURL}/auth/login`);
    await page.evaluate(() => {
      // Store test user credentials for easy access during tests
      localStorage.setItem('test-credentials', JSON.stringify({
        admin: { email: 'admin@allin.demo', password: 'Admin123!@#' },
        user: { email: 'user@allin.demo', password: 'User123!@#' },
        editor: { email: 'editor@allin.demo', password: 'Editor123!@#' },
        viewer: { email: 'viewer@allin.demo', password: 'Viewer123!@#' }
      }));

      // Store test configuration
      localStorage.setItem('test-config', JSON.stringify({
        skipOnboarding: true,
        enableDebugMode: true,
        testEnvironment: true
      }));
    });

    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;