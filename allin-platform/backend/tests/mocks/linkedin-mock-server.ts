/**
 * LinkedIn API Mock Server for Testing
 * 
 * This mock server simulates LinkedIn's OAuth and API endpoints for comprehensive testing
 * without requiring actual LinkedIn API credentials or making external API calls.
 * 
 * Features:
 * - Complete OAuth 2.0 flow simulation
 * - Realistic API response structures
 * - Error scenario simulation
 * - Rate limiting simulation
 * - Token management
 * - Performance testing support
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface LinkedInMockServerConfig {
  port: number;
  baseUrl: string;
  rateLimitWindow: number;
  rateLimitMax: number;
  enableLogging: boolean;
}

export class LinkedInMockServer {
  private app: Application;
  private server: any;
  private config: LinkedInMockServerConfig;
  private requestCount: Map<string, number> = new Map();
  private tokenStore: Map<string, any> = new Map();
  private userDatabase: Map<string, any> = new Map();
  private organizationDatabase: Map<string, any> = new Map();

  constructor(config: Partial<LinkedInMockServerConfig> = {}) {
    this.config = {
      port: 8080,
      baseUrl: 'http://localhost:8080',
      rateLimitWindow: 60000, // 1 minute
      rateLimitMax: 100,
      enableLogging: true,
      ...config
    };

    this.app = express();
    this.setupMiddleware();
    this.setupTestData();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    if (this.config.enableLogging) {
      this.app.use((req, res, next) => {
        console.log(`[LinkedIn Mock] ${req.method} ${req.path}`);
        next();
      });
    }

    // Rate limiting simulation
    this.app.use((req, res, next) => {
      const clientId = req.ip || 'unknown';
      const now = Date.now();
      const windowStart = now - this.config.rateLimitWindow;

      // Clean old entries
      for (const [key, timestamp] of this.requestCount.entries()) {
        if (timestamp < windowStart) {
          this.requestCount.delete(key);
        }
      }

      // Count requests in current window
      const requestsInWindow = Array.from(this.requestCount.values())
        .filter(timestamp => timestamp > windowStart).length;

      if (requestsInWindow >= this.config.rateLimitMax) {
        return res.status(429).json({
          error: 'rate_limit_exceeded',
          error_description: 'API rate limit exceeded. Please try again later.',
          retry_after: Math.ceil(this.config.rateLimitWindow / 1000)
        });
      }

      this.requestCount.set(`${clientId}-${now}`, now);
      next();
    });
  }

  private setupTestData(): void {
    // Setup test users
    this.userDatabase.set('linkedin_user_test_123', {
      sub: 'linkedin_user_test_123',
      name: 'Test LinkedIn User',
      given_name: 'Test',
      family_name: 'User',
      email: 'test.linkedin@allin.demo',
      picture: 'https://media.licdn.com/dms/image/test-profile.jpg',
      email_verified: true,
      locale: {
        country: 'US',
        language: 'en'
      }
    });

    this.userDatabase.set('admin_linkedin_123', {
      sub: 'admin_linkedin_123',
      name: 'Admin LinkedIn Account',
      given_name: 'Admin',
      family_name: 'Account',
      email: 'admin.linkedin@allin.demo',
      picture: 'https://media.licdn.com/dms/image/admin-profile.jpg',
      email_verified: true,
      locale: {
        country: 'US',
        language: 'en'
      }
    });

    // Setup test organizations
    this.organizationDatabase.set('12345678', {
      id: 12345678,
      name: 'AllIN Test Company',
      description: 'Test company for LinkedIn integration testing',
      logo: {
        originalImageUrl: 'https://media.licdn.com/company-logo-test.jpg'
      },
      website: 'https://allin-test.demo',
      followerCount: 1500
    });

    this.organizationDatabase.set('87654321', {
      id: 87654321,
      name: 'LinkedIn Testing Corp',
      description: 'Another test company for comprehensive testing',
      logo: {
        originalImageUrl: 'https://media.licdn.com/company-logo-test2.jpg'
      },
      website: 'https://linkedin-testing.demo',
      followerCount: 2500
    });
  }

  private setupRoutes(): void {
    // OAuth Authorization endpoint
    this.app.get('/oauth/v2/authorization', this.handleOAuthAuthorization.bind(this));
    
    // OAuth Token exchange endpoint
    this.app.post('/oauth/v2/accessToken', this.handleTokenExchange.bind(this));
    
    // OAuth Token refresh endpoint
    this.app.post('/oauth/v2/accessToken', this.handleTokenRefresh.bind(this));
    
    // OAuth Token revocation endpoint
    this.app.post('/oauth/v2/revoke', this.handleTokenRevocation.bind(this));

    // User info endpoint (OpenID Connect)
    this.app.get('/v2/userinfo', this.handleUserInfo.bind(this));
    
    // Organization ACLs endpoint
    this.app.get('/v2/organizationAcls', this.handleOrganizationAcls.bind(this));
    
    // Organization info endpoint
    this.app.get('/v2/organizations/:id', this.handleOrganizationInfo.bind(this));
    
    // Organization statistics endpoint
    this.app.get('/v2/organizationalEntityStatistics', this.handleOrganizationStatistics.bind(this));
    
    // UGC Posts endpoint (publishing)
    this.app.post('/v2/ugcPosts', this.handleUgcPosts.bind(this));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        requests_handled: this.requestCount.size
      });
    });

    // Mock endpoint to simulate errors
    this.app.get('/test/error/:type', this.handleTestError.bind(this));
    
    // Mock endpoint to simulate delays
    this.app.get('/test/delay/:ms', this.handleTestDelay.bind(this));
  }

  private handleOAuthAuthorization(req: Request, res: Response): void {
    const { response_type, client_id, redirect_uri, state, scope } = req.query;

    // Validate required parameters
    if (!response_type || !client_id || !redirect_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters'
      });
    }

    if (response_type !== 'code') {
      return res.status(400).json({
        error: 'unsupported_response_type',
        error_description: 'Only authorization code flow is supported'
      });
    }

    // Simulate user consent page
    const authorizationCode = `mock_auth_code_${Date.now()}_${uuidv4().substr(0, 8)}`;
    
    // Store authorization details for token exchange
    this.tokenStore.set(authorizationCode, {
      client_id,
      redirect_uri,
      scope,
      state,
      created_at: Date.now(),
      expires_at: Date.now() + 600000 // 10 minutes
    });

    // Simulate redirect to callback with authorization code
    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.set('code', authorizationCode);
    if (state) {
      redirectUrl.searchParams.set('state', state as string);
    }

    // Return HTML page that simulates LinkedIn's authorization page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LinkedIn Mock Authorization</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 500px; margin: 0 auto; }
            .linkedin-logo { color: #0077b5; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .auth-form { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
            button { background: #0077b5; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
            button.deny { background: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="linkedin-logo">LinkedIn Mock Server</div>
            <div class="auth-form">
              <h3>Authorize Application</h3>
              <p>The application is requesting access to your LinkedIn profile.</p>
              <p><strong>Client ID:</strong> ${client_id}</p>
              <p><strong>Requested Permissions:</strong> ${scope || 'basic profile'}</p>
              <div>
                <button onclick="authorize()">Allow</button>
                <button class="deny" onclick="deny()">Deny</button>
              </div>
            </div>
          </div>
          <script>
            function authorize() {
              window.location.href = '${redirectUrl.toString()}';
            }
            function deny() {
              const denyUrl = new URL('${redirect_uri}');
              denyUrl.searchParams.set('error', 'access_denied');
              denyUrl.searchParams.set('error_description', 'User denied authorization');
              ${state ? `denyUrl.searchParams.set('state', '${state}');` : ''}
              window.location.href = denyUrl.toString();
            }
            
            // Auto-approve for testing (can be disabled)
            if (window.location.search.includes('auto_approve=true')) {
              setTimeout(authorize, 1000);
            }
          </script>
        </body>
      </html>
    `);
  }

  private handleTokenExchange(req: Request, res: Response): void {
    const { grant_type, code, client_id, client_secret, redirect_uri, refresh_token } = req.body;

    // Handle refresh token flow
    if (grant_type === 'refresh_token') {
      return this.handleTokenRefresh(req, res);
    }

    if (grant_type !== 'authorization_code') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code grant type is supported for this endpoint'
      });
    }

    // Validate authorization code
    const authData = this.tokenStore.get(code);
    if (!authData) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code'
      });
    }

    // Validate client credentials
    if (!client_id || !client_secret) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    // Validate redirect URI
    if (redirect_uri !== authData.redirect_uri) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Redirect URI mismatch'
      });
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(client_id, authData.scope);
    const refreshToken = this.generateRefreshToken(client_id);

    // Store tokens
    this.tokenStore.set(accessToken, {
      client_id,
      scope: authData.scope,
      user_id: 'linkedin_user_test_123',
      created_at: Date.now(),
      expires_at: Date.now() + 5184000000 // 60 days
    });

    this.tokenStore.set(refreshToken, {
      client_id,
      access_token: accessToken,
      created_at: Date.now(),
      expires_at: Date.now() + 31536000000 // 1 year
    });

    // Clean up authorization code
    this.tokenStore.delete(code);

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 5184000, // 60 days in seconds
      scope: authData.scope
    });
  }

  private handleTokenRefresh(req: Request, res: Response): void {
    const { grant_type, refresh_token, client_id, client_secret } = req.body;

    if (grant_type !== 'refresh_token') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Invalid grant type for token refresh'
      });
    }

    // Validate refresh token
    const refreshData = this.tokenStore.get(refresh_token);
    if (!refreshData) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid or expired refresh token'
      });
    }

    // Validate client
    if (client_id !== refreshData.client_id) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client ID mismatch'
      });
    }

    // Generate new access token
    const newAccessToken = this.generateAccessToken(client_id, 'openid profile email');
    
    // Store new token
    this.tokenStore.set(newAccessToken, {
      client_id,
      scope: 'openid profile email',
      user_id: 'linkedin_user_test_123',
      created_at: Date.now(),
      expires_at: Date.now() + 5184000000 // 60 days
    });

    // Update refresh token reference
    refreshData.access_token = newAccessToken;

    res.json({
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: 5184000
    });
  }

  private handleTokenRevocation(req: Request, res: Response): void {
    const { token, client_id, client_secret } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Token parameter is required'
      });
    }

    // Remove token from store
    this.tokenStore.delete(token);

    // Find and remove associated refresh tokens
    for (const [key, data] of this.tokenStore.entries()) {
      if (data.access_token === token) {
        this.tokenStore.delete(key);
      }
    }

    res.status(200).json({ status: 'revoked' });
  }

  private handleUserInfo(req: Request, res: Response): void {
    const token = this.extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Missing or invalid access token'
      });
    }

    const tokenData = this.tokenStore.get(token);
    if (!tokenData) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Token not found or expired'
      });
    }

    const user = this.userDatabase.get(tokenData.user_id);
    if (!user) {
      return res.status(404).json({
        error: 'user_not_found',
        error_description: 'User profile not found'
      });
    }

    res.json(user);
  }

  private handleOrganizationAcls(req: Request, res: Response): void {
    const token = this.extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Missing or invalid access token'
      });
    }

    // Mock organization ACLs response
    res.json({
      elements: [
        {
          organization: 'urn:li:organization:12345678',
          organizationalTarget: 'urn:li:organization:12345678',
          role: 'ADMINISTRATOR',
          state: 'APPROVED'
        },
        {
          organization: 'urn:li:organization:87654321',
          organizationalTarget: 'urn:li:organization:87654321',
          role: 'MEMBER',
          state: 'APPROVED'
        }
      ]
    });
  }

  private handleOrganizationInfo(req: Request, res: Response): void {
    const { id } = req.params;
    const token = this.extractBearerToken(req);
    
    if (!token) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Missing or invalid access token'
      });
    }

    const organization = this.organizationDatabase.get(id);
    if (!organization) {
      return res.status(404).json({
        error: 'organization_not_found',
        error_description: 'Organization not found'
      });
    }

    res.json(organization);
  }

  private handleOrganizationStatistics(req: Request, res: Response): void {
    const token = this.extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Missing or invalid access token'
      });
    }

    // Mock analytics/statistics response
    res.json({
      elements: [
        {
          totalShareStatistics: {
            impressionCount: Math.floor(Math.random() * 10000) + 1000,
            shareCount: Math.floor(Math.random() * 500) + 50,
            commentCount: Math.floor(Math.random() * 100) + 10,
            likeCount: Math.floor(Math.random() * 1000) + 100,
            clickCount: Math.floor(Math.random() * 200) + 20
          },
          dateRange: {
            start: req.query.since || '2024-01-01',
            end: req.query.until || new Date().toISOString().split('T')[0]
          }
        }
      ]
    });
  }

  private handleUgcPosts(req: Request, res: Response): void {
    const token = this.extractBearerToken(req);
    if (!token) {
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'Missing or invalid access token'
      });
    }

    const { author, specificContent, visibility } = req.body;

    if (!author || !specificContent) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required fields: author and specificContent'
      });
    }

    // Generate mock post ID
    const postId = `urn:li:share:${Date.now()}_${uuidv4().substr(0, 8)}`;

    // Simulate processing delay
    setTimeout(() => {
      res.set('x-restli-id', postId);
      res.status(201).json({
        id: postId,
        created: new Date().toISOString(),
        author,
        visibility
      });
    }, Math.random() * 500 + 100); // Random delay 100-600ms
  }

  private handleTestError(req: Request, res: Response): void {
    const { type } = req.params;

    switch (type) {
      case 'rate_limit':
        res.status(429).json({
          error: 'rate_limit_exceeded',
          error_description: 'API rate limit exceeded'
        });
        break;
      case 'server_error':
        res.status(500).json({
          error: 'internal_server_error',
          error_description: 'An internal server error occurred'
        });
        break;
      case 'unauthorized':
        res.status(401).json({
          error: 'unauthorized',
          error_description: 'Invalid or expired access token'
        });
        break;
      case 'forbidden':
        res.status(403).json({
          error: 'forbidden',
          error_description: 'Insufficient permissions'
        });
        break;
      default:
        res.status(400).json({
          error: 'bad_request',
          error_description: 'Invalid error type'
        });
    }
  }

  private handleTestDelay(req: Request, res: Response): void {
    const { ms } = req.params;
    const delay = Math.min(parseInt(ms) || 1000, 10000); // Max 10 seconds

    setTimeout(() => {
      res.json({
        message: 'Delayed response',
        delay_ms: delay,
        timestamp: new Date().toISOString()
      });
    }, delay);
  }

  private extractBearerToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  private generateAccessToken(clientId: string, scope: string): string {
    return `linkedin_access_token_${Date.now()}_${clientId}_${uuidv4().substr(0, 16)}`;
  }

  private generateRefreshToken(clientId: string): string {
    return `linkedin_refresh_token_${Date.now()}_${clientId}_${uuidv4().substr(0, 16)}`;
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        console.log(`LinkedIn Mock Server running on port ${this.config.port}`);
        console.log(`Base URL: ${this.config.baseUrl}`);
        console.log(`Health check: ${this.config.baseUrl}/health`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('LinkedIn Mock Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public getStats() {
    return {
      activeTokens: this.tokenStore.size,
      requestsHandled: this.requestCount.size,
      uptime: process.uptime()
    };
  }

  public clearData(): void {
    this.tokenStore.clear();
    this.requestCount.clear();
    this.setupTestData();
  }
}

// Export for use in tests
export default LinkedInMockServer;