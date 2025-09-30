import { FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  try {
    // Clean up authentication files
    const authDir = path.join(__dirname, '../test-data/auth');
    if (fs.existsSync(authDir)) {
      const authFiles = fs.readdirSync(authDir);
      for (const file of authFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(authDir, file);
          fs.unlinkSync(filePath);
          console.log(`🗑️  Cleaned up auth file: ${file}`);
        }
      }
    }

    // Clean up temporary test files
    const tempDirs = [
      path.join(__dirname, '../reports/temp'),
      path.join(__dirname, '../test-data/uploads'),
      path.join(__dirname, '../test-data/temp')
    ];

    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🗑️  Cleaned up directory: ${dir}`);
      }
    }

    // Generate test summary report
    const reportsDir = path.join(__dirname, '../reports');
    if (fs.existsSync(reportsDir)) {
      const summary = {
        timestamp: new Date().toISOString(),
        testSuite: 'BMAD E2E Tests',
        platform: 'AllIN Social Media Management',
        cleanup: 'completed'
      };

      const summaryFile = path.join(reportsDir, 'test-summary.json');
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
      console.log('📊 Test summary report generated');
    }

    console.log('✅ Global teardown completed successfully');

  } catch (error) {
    console.error('❌ Error during global teardown:', error);
    throw error;
  }
}

export default globalTeardown;