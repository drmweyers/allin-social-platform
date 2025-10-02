/**
 * LinkedIn Mock Server Test Setup
 * 
 * This module provides utilities for setting up and managing the LinkedIn mock server
 * during test execution. It integrates with Jest's setup/teardown lifecycle.
 */

import LinkedInMockServer from '../mocks/linkedin-mock-server';

let mockServer: LinkedInMockServer | null = null;

/**
 * Start LinkedIn mock server for testing
 */
export async function startLinkedInMockServer(): Promise<LinkedInMockServer> {
  if (mockServer) {
    return mockServer;
  }

  mockServer = new LinkedInMockServer({
    port: 8080,
    baseUrl: 'http://localhost:8080',
    rateLimitWindow: 60000,
    rateLimitMax: 1000, // Higher limit for testing
    enableLogging: process.env.NODE_ENV !== 'test'
  });

  await mockServer.start();
  
  // Update environment variables to use mock server
  process.env.LINKEDIN_API_BASE_URL = 'http://localhost:8080';
  process.env.LINKEDIN_CLIENT_ID = 'test_client_id';
  process.env.LINKEDIN_CLIENT_SECRET = 'test_client_secret';
  process.env.LINKEDIN_REDIRECT_URI = 'http://localhost:3001/api/social/callback/linkedin';

  return mockServer;
}

/**
 * Stop LinkedIn mock server
 */
export async function stopLinkedInMockServer(): Promise<void> {
  if (mockServer) {
    await mockServer.stop();
    mockServer = null;
  }
}

/**
 * Reset mock server data between tests
 */
export function resetLinkedInMockServer(): void {
  if (mockServer) {
    mockServer.clearData();
  }
}

/**
 * Get mock server instance
 */
export function getLinkedInMockServer(): LinkedInMockServer | null {
  return mockServer;
}

/**
 * Jest setup for LinkedIn mock server
 */
export async function setupLinkedInMockForJest(): Promise<void> {
  // Start mock server before all tests
  beforeAll(async () => {
    await startLinkedInMockServer();
  });

  // Reset data before each test
  beforeEach(() => {
    resetLinkedInMockServer();
  });

  // Stop server after all tests
  afterAll(async () => {
    await stopLinkedInMockServer();
  });
}

/**
 * Playwright setup for LinkedIn mock server
 */
export async function setupLinkedInMockForPlaywright(): Promise<void> {
  await startLinkedInMockServer();
}

/**
 * Helper to configure LinkedIn OAuth service to use mock server
 */
export function configureLinkedInOAuthForTesting() {
  // Mock the LinkedIn OAuth service to use our mock server
  jest.mock('../../src/services/oauth/linkedin.oauth', () => {
    const originalModule = jest.requireActual('../../src/services/oauth/linkedin.oauth');
    
    return {
      ...originalModule,
      LinkedInOAuthService: class MockLinkedInOAuthService extends originalModule.LinkedInOAuthService {
        constructor() {
          super();
          // Override base URLs to use mock server
          this.baseUrl = 'http://localhost:8080';
          this.authUrl = 'http://localhost:8080';
        }
      }
    };
  });
}