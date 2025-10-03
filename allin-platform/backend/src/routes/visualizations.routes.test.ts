import request from 'supertest';
import express from 'express';
import visualizationsRoutes from './visualizations.routes';
import { authenticateToken } from '../middleware/auth';
import { analyticsService } from '../services/analytics.service';
import { engagementMonitoringService } from '../services/engagement-monitoring.service';

// Mock dependencies
jest.mock('../middleware/auth');
jest.mock('../services/analytics.service');
jest.mock('../services/engagement-monitoring.service');

// Master test credentials
const MASTER_CREDENTIALS = {
  admin: { email: 'admin@allin.demo', password: 'Admin123!@#' },
  agency: { email: 'agency@allin.demo', password: 'Agency123!@#' },
  manager: { email: 'manager@allin.demo', password: 'Manager123!@#' },
  creator: { email: 'creator@allin.demo', password: 'Creator123!@#' },
  client: { email: 'client@allin.demo', password: 'Client123!@#' },
  team: { email: 'team@allin.demo', password: 'Team123!@#' },
};

describe('Visualization Routes - Priority 2 Enhanced Features', () => {
  let app: express.Application;
  let mockAuthMiddleware: jest.MockedFunction<typeof authenticateToken>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/visualizations', visualizationsRoutes);

    // Mock authentication middleware
    mockAuthMiddleware = authenticateToken as jest.MockedFunction<typeof authenticateToken>;
    mockAuthMiddleware.mockImplementation((req: any, res: any, next: any) => {
      req.user = {
        id: 'test-user-id',
        email: MASTER_CREDENTIALS.admin.email,
        organizationId: 'test-org-id',
      };
      next();
    });
  });

  describe('GET /dashboard-charts - Comprehensive Chart Data', () => {
    it('should return complete dashboard chart data with all chart types', async () => {
      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: 'test-org-id', timeframe: '30d' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');

      // Verify all chart types are present
      const { data } = response.body;
      expect(data).toHaveProperty('engagementTrend');
      expect(data).toHaveProperty('platformPerformance');
      expect(data).toHaveProperty('followerGrowth');
      expect(data).toHaveProperty('contentHeatmap');
      expect(data).toHaveProperty('contentTypeEngagement');
      expect(data).toHaveProperty('sentimentTrend');
      expect(data).toHaveProperty('audienceDemographics');
      expect(data).toHaveProperty('realTimeMetrics');
      expect(data).toHaveProperty('competitorComparison');
    });

    it('should validate engagement trend chart structure', async () => {
      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: 'test-org-id' });

      const { engagementTrend } = response.body.data;
      
      expect(engagementTrend).toHaveProperty('labels');
      expect(engagementTrend).toHaveProperty('datasets');
      expect(engagementTrend.labels).toHaveLength(30);
      expect(engagementTrend.datasets).toHaveLength(4);
      
      // Verify dataset structure
      engagementTrend.datasets.forEach((dataset: any) => {
        expect(dataset).toHaveProperty('label');
        expect(dataset).toHaveProperty('data');
        expect(dataset).toHaveProperty('borderColor');
        expect(dataset).toHaveProperty('backgroundColor');
        expect(dataset.data).toHaveLength(30);
      });
    });

    it('should validate platform performance chart structure', async () => {
      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: 'test-org-id' });

      const { platformPerformance } = response.body.data;
      
      expect(platformPerformance.labels).toEqual(['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok']);
      expect(platformPerformance.datasets).toHaveLength(1);
      expect(platformPerformance.datasets[0].data).toHaveLength(5);
      expect(platformPerformance.datasets[0].backgroundColor).toHaveLength(5);
    });

    it('should validate audience demographics structure', async () => {
      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: 'test-org-id' });

      const { audienceDemographics } = response.body.data;
      
      expect(audienceDemographics).toHaveProperty('age');
      expect(audienceDemographics).toHaveProperty('gender');
      expect(audienceDemographics).toHaveProperty('location');
      
      // Validate age demographics
      expect(audienceDemographics.age.labels).toEqual(['18-24', '25-34', '35-44', '45-54', '55+']);
      expect(audienceDemographics.age.datasets[0].data).toHaveLength(5);
      
      // Validate gender demographics
      expect(audienceDemographics.gender.labels).toEqual(['Female', 'Male', 'Other']);
      expect(audienceDemographics.gender.datasets[0].data).toHaveLength(3);
    });

    it('should validate real-time metrics structure', async () => {
      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: 'test-org-id' });

      const { realTimeMetrics } = response.body.data;
      
      expect(realTimeMetrics).toHaveProperty('engagementRate');
      expect(realTimeMetrics).toHaveProperty('viralityScore');
      expect(realTimeMetrics).toHaveProperty('brandSentiment');
      
      // Validate gauge chart structure
      Object.values(realTimeMetrics).forEach((metric: any) => {
        expect(metric).toHaveProperty('value');
        expect(metric).toHaveProperty('max');
        expect(metric).toHaveProperty('thresholds');
        expect(Array.isArray(metric.thresholds)).toBe(true);
        expect(metric.thresholds).toHaveLength(3);
      });
    });

    it('should handle timeframe parameter variations', async () => {
      const timeframes = ['7d', '30d', '90d'];
      
      for (const timeframe of timeframes) {
        const response = await request(app)
          .get('/api/visualizations/dashboard-charts')
          .query({ organizationId: 'test-org-id', timeframe });

        expect(response.status).toBe(200);
        expect(response.body.metadata.timeframe).toBe(timeframe);
      }
    });

    it('should handle platform filter parameter', async () => {
      const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'];
      
      for (const platform of platforms) {
        const response = await request(app)
          .get('/api/visualizations/dashboard-charts')
          .query({ organizationId: 'test-org-id', platform });

        expect(response.status).toBe(200);
        expect(response.body.metadata.platform).toBe(platform);
      }
    });

    it('should require organization ID', async () => {
      const response = await request(app)
        .get('/api/visualizations/dashboard-charts');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Organization ID is required');
    });

    it('should include correct metadata structure', async () => {
      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: 'test-org-id', timeframe: '7d', platform: 'instagram' });

      const { metadata } = response.body;
      
      expect(metadata).toHaveProperty('timeframe', '7d');
      expect(metadata).toHaveProperty('platform', 'instagram');
      expect(metadata).toHaveProperty('generatedAt');
      expect(metadata).toHaveProperty('organizationId', 'test-org-id');
      expect(metadata).toHaveProperty('refreshInterval', 60000);
      expect(new Date(metadata.generatedAt)).toBeInstanceOf(Date);
    });

    it('should work with all master credential users', async () => {
      const users = Object.values(MASTER_CREDENTIALS);
      
      for (const user of users) {
        mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
          req.user = {
            id: 'test-user-id',
            email: user.email,
            organizationId: 'test-org-id',
          };
          next();
        });

        const response = await request(app)
          .get('/api/visualizations/dashboard-charts')
          .query({ organizationId: 'test-org-id' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('GET /stream-data - Real-time Data Streaming', () => {
    it('should establish SSE connection with correct headers', async () => {
      const response = await request(app)
        .get('/api/visualizations/stream-data')
        .query({ organizationId: 'test-org-id' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    it('should require organization ID for streaming', async () => {
      const response = await request(app)
        .get('/api/visualizations/stream-data');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Organization ID is required');
    });

    it('should send initial connection event', async () => {
      const response = await request(app)
        .get('/api/visualizations/stream-data')
        .query({ organizationId: 'test-org-id' });

      expect(response.text).toContain('event: connected');
      expect(response.text).toContain('data: {');
      expect(response.text).toContain('timestamp');
    });

    it('should work with user organization ID from auth token', async () => {
      mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
        req.user = {
          id: 'test-user-id',
          email: MASTER_CREDENTIALS.manager.email,
          organizationId: 'token-org-id',
        };
        next();
      });

      const response = await request(app)
        .get('/api/visualizations/stream-data');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/event-stream');
    });
  });

  describe('POST /custom-chart - Custom Chart Generation', () => {
    const validChartRequest = {
      organizationId: 'test-org-id',
      chartType: 'line',
      metrics: ['engagement', 'reach', 'impressions'],
      timeframe: '30d',
      filters: { platform: 'instagram' },
    };

    it('should generate custom chart with valid parameters', async () => {
      const response = await request(app)
        .post('/api/visualizations/custom-chart')
        .send(validChartRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      
      const { data, metadata } = response.body;
      expect(data).toHaveProperty('labels');
      expect(data).toHaveProperty('datasets');
      expect(data).toHaveProperty('config');
      
      expect(metadata.chartType).toBe('line');
      expect(metadata.metrics).toEqual(['engagement', 'reach', 'impressions']);
      expect(metadata.timeframe).toBe('30d');
    });

    it('should validate required parameters', async () => {
      const invalidRequests = [
        { organizationId: 'test-org-id' }, // Missing chartType and metrics
        { chartType: 'bar' }, // Missing organizationId and metrics
        { metrics: ['engagement'] }, // Missing organizationId and chartType
        {}, // Missing all required
      ];

      for (const request of invalidRequests) {
        const response = await request(app)
          .post('/api/visualizations/custom-chart')
          .send(request);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('required');
      }
    });

    it('should handle different chart types', async () => {
      const chartTypes = ['line', 'bar', 'doughnut', 'radar', 'area'];
      
      for (const chartType of chartTypes) {
        const response = await request(app)
          .post('/api/visualizations/custom-chart')
          .send({ ...validChartRequest, chartType });

        expect(response.status).toBe(200);
        expect(response.body.data.config.type).toBe(chartType);
      }
    });

    it('should handle multiple metrics correctly', async () => {
      const metrics = ['engagement', 'reach', 'impressions', 'clicks', 'shares'];
      
      const response = await request(app)
        .post('/api/visualizations/custom-chart')
        .send({ ...validChartRequest, metrics });

      expect(response.status).toBe(200);
      expect(response.body.data.datasets).toHaveLength(metrics.length);
      
      response.body.data.datasets.forEach((dataset: any, index: number) => {
        expect(dataset.label).toBe(metrics[index]);
        expect(dataset).toHaveProperty('data');
        expect(dataset).toHaveProperty('borderColor');
        expect(dataset).toHaveProperty('backgroundColor');
      });
    });

    it('should handle different timeframes', async () => {
      const timeframes = ['7d', '30d', '90d'];
      
      for (const timeframe of timeframes) {
        const response = await request(app)
          .post('/api/visualizations/custom-chart')
          .send({ ...validChartRequest, timeframe });

        expect(response.status).toBe(200);
        const expectedDataPoints = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
        expect(response.body.data.labels).toHaveLength(expectedDataPoints);
      }
    });

    it('should include proper chart configuration', async () => {
      const response = await request(app)
        .post('/api/visualizations/custom-chart')
        .send(validChartRequest);

      const { config } = response.body.data;
      expect(config).toHaveProperty('type', 'line');
      expect(config).toHaveProperty('options');
      expect(config.options).toHaveProperty('responsive', true);
      expect(config.options).toHaveProperty('maintainAspectRatio', false);
    });

    it('should work with organization ID from auth token', async () => {
      const requestWithoutOrgId = { ...validChartRequest };
      delete requestWithoutOrgId.organizationId;

      const response = await request(app)
        .post('/api/visualizations/custom-chart')
        .send(requestWithoutOrgId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /export - Chart Data Export', () => {
    const validExportRequest = {
      organizationId: 'test-org-id',
      chartId: 'engagement-trend',
      format: 'csv',
    };

    it('should generate export with valid parameters', async () => {
      const response = await request(app)
        .post('/api/visualizations/export')
        .send(validExportRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      
      const { data } = response.body;
      expect(data).toHaveProperty('downloadUrl');
      expect(data).toHaveProperty('format', 'csv');
      expect(data).toHaveProperty('fileName');
      expect(data).toHaveProperty('size');
      expect(data).toHaveProperty('expiresAt');
      
      expect(data.downloadUrl).toContain('/api/visualizations/download/');
      expect(data.fileName).toContain('engagement-trend');
      expect(data.fileName).toContain('.csv');
      expect(new Date(data.expiresAt)).toBeInstanceOf(Date);
    });

    it('should validate required parameters', async () => {
      const invalidRequests = [
        { organizationId: 'test-org-id' }, // Missing chartId
        { chartId: 'test-chart' }, // Missing organizationId
        {}, // Missing all required
      ];

      for (const request of invalidRequests) {
        const response = await request(app)
          .post('/api/visualizations/export')
          .send(request);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('required');
      }
    });

    it('should handle different export formats', async () => {
      const formats = ['csv', 'json', 'xlsx', 'pdf'];
      
      for (const format of formats) {
        const response = await request(app)
          .post('/api/visualizations/export')
          .send({ ...validExportRequest, format });

        expect(response.status).toBe(200);
        expect(response.body.data.format).toBe(format);
        expect(response.body.data.fileName).toContain(`.${format}`);
      }
    });

    it('should default to CSV format when not specified', async () => {
      const requestWithoutFormat = { ...validExportRequest };
      delete requestWithoutFormat.format;

      const response = await request(app)
        .post('/api/visualizations/export')
        .send(requestWithoutFormat);

      expect(response.status).toBe(200);
      expect(response.body.data.format).toBe('csv');
      expect(response.body.data.fileName).toContain('.csv');
    });

    it('should include proper expiration time (24 hours)', async () => {
      const response = await request(app)
        .post('/api/visualizations/export')
        .send(validExportRequest);

      const expiresAt = new Date(response.body.data.expiresAt);
      const now = new Date();
      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      expect(hoursUntilExpiry).toBeGreaterThan(23);
      expect(hoursUntilExpiry).toBeLessThan(25);
    });

    it('should generate unique file IDs', async () => {
      const response1 = await request(app)
        .post('/api/visualizations/export')
        .send(validExportRequest);

      const response2 = await request(app)
        .post('/api/visualizations/export')
        .send(validExportRequest);

      expect(response1.body.data.downloadUrl).not.toBe(response2.body.data.downloadUrl);
    });
  });

  describe('POST /drill-down - Interactive Data Exploration', () => {
    const validDrillDownRequest = {
      organizationId: 'test-org-id',
      chartType: 'platformPerformance',
      dataPoint: { label: 'Instagram', value: 1245 },
      filters: { timeframe: '30d' },
    };

    it('should generate drill-down data with valid parameters', async () => {
      const response = await request(app)
        .post('/api/visualizations/drill-down')
        .send(validDrillDownRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('metadata');
      
      const { data, metadata } = response.body;
      expect(data).toHaveProperty('labels');
      expect(data).toHaveProperty('datasets');
      expect(data).toHaveProperty('level');
      expect(data).toHaveProperty('breadcrumb');
      expect(data).toHaveProperty('canDrillDown');
      expect(data).toHaveProperty('actions');
      
      expect(metadata.chartType).toBe('platformPerformance');
      expect(metadata.dataPoint).toEqual({ label: 'Instagram', value: 1245 });
    });

    it('should validate required parameters', async () => {
      const invalidRequests = [
        { organizationId: 'test-org-id', chartType: 'test' }, // Missing dataPoint
        { organizationId: 'test-org-id', dataPoint: {} }, // Missing chartType
        { chartType: 'test', dataPoint: {} }, // Missing organizationId
        {}, // Missing all required
      ];

      for (const request of invalidRequests) {
        const response = await request(app)
          .post('/api/visualizations/drill-down')
          .send(request);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('required');
      }
    });

    it('should provide proper breadcrumb navigation', async () => {
      const response = await request(app)
        .post('/api/visualizations/drill-down')
        .send(validDrillDownRequest);

      const breadcrumb = response.body.data.breadcrumb;
      expect(Array.isArray(breadcrumb)).toBe(true);
      expect(breadcrumb).toContain('Overview');
      expect(breadcrumb).toContain('Instagram');
      expect(breadcrumb.length).toBeGreaterThan(1);
    });

    it('should indicate drill-down capabilities', async () => {
      const response = await request(app)
        .post('/api/visualizations/drill-down')
        .send(validDrillDownRequest);

      expect(response.body.data.canDrillDown).toBe(true);
      expect(Array.isArray(response.body.data.actions)).toBe(true);
      expect(response.body.data.actions).toContain('View Details');
      expect(response.body.data.actions).toContain('Compare');
      expect(response.body.data.actions).toContain('Export');
    });

    it('should handle different chart types for drill-down', async () => {
      const chartTypes = ['platformPerformance', 'contentTypeEngagement', 'audienceDemographics'];
      
      for (const chartType of chartTypes) {
        const response = await request(app)
          .post('/api/visualizations/drill-down')
          .send({ ...validDrillDownRequest, chartType });

        expect(response.status).toBe(200);
        expect(response.body.metadata.chartType).toBe(chartType);
      }
    });

    it('should include level information for nested drilling', async () => {
      const response = await request(app)
        .post('/api/visualizations/drill-down')
        .send(validDrillDownRequest);

      expect(typeof response.body.data.level).toBe('number');
      expect(response.body.data.level).toBeGreaterThan(0);
      expect(response.body.metadata.level).toBe(response.body.data.level);
    });

    it('should handle complex data points', async () => {
      const complexDataPoint = {
        label: 'Instagram Stories',
        value: 345,
        metadata: { type: 'story', engagement: 4.2 },
      };

      const response = await request(app)
        .post('/api/visualizations/drill-down')
        .send({ ...validDrillDownRequest, dataPoint: complexDataPoint });

      expect(response.status).toBe(200);
      expect(response.body.metadata.dataPoint).toEqual(complexDataPoint);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing authentication token', async () => {
      mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: 'test-org-id' });

      expect(response.status).toBe(401);
    });

    it('should handle server errors gracefully in dashboard-charts', async () => {
      mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: 'test-org-id' });

      expect(response.status).toBe(500);
    });

    it('should handle malformed request bodies', async () => {
      const malformedRequests = [
        'invalid json string',
        null,
        undefined,
      ];

      for (const body of malformedRequests) {
        const response = await request(app)
          .post('/api/visualizations/custom-chart')
          .send(body as any);

        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should validate organization ID format', async () => {
      const invalidOrgIds = ['', '   ', null, undefined, 123, {}];
      
      for (const orgId of invalidOrgIds) {
        const response = await request(app)
          .get('/api/visualizations/dashboard-charts')
          .query({ organizationId: orgId });

        if (orgId === null || orgId === undefined || orgId === '') {
          expect(response.status).toBe(400);
        }
      }
    });

    it('should handle concurrent requests properly', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .get('/api/visualizations/dashboard-charts')
          .query({ organizationId: 'test-org-id' })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle very large organization IDs', async () => {
      const largeOrgId = 'a'.repeat(500);
      
      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: largeOrgId });

      expect(response.status).toBe(200);
      expect(response.body.metadata.organizationId).toBe(largeOrgId);
    });
  });

  describe('Integration with Master Credentials', () => {
    it('should work correctly with all user roles', async () => {
      const endpoints = [
        { method: 'get', path: '/dashboard-charts', query: { organizationId: 'test-org-id' } },
        { method: 'post', path: '/custom-chart', body: { organizationId: 'test-org-id', chartType: 'line', metrics: ['engagement'] } },
        { method: 'post', path: '/export', body: { organizationId: 'test-org-id', chartId: 'test-chart' } },
        { method: 'post', path: '/drill-down', body: { organizationId: 'test-org-id', chartType: 'test', dataPoint: { label: 'test' } } },
      ];

      for (const [role, credentials] of Object.entries(MASTER_CREDENTIALS)) {
        mockAuthMiddleware.mockImplementation((req: any, res: any, next: any) => {
          req.user = {
            id: `${role}-user-id`,
            email: credentials.email,
            organizationId: `${role}-org-id`,
          };
          next();
        });

        for (const endpoint of endpoints) {
          let response;
          if (endpoint.method === 'get') {
            response = await request(app)
              .get(`/api/visualizations${endpoint.path}`)
              .query(endpoint.query);
          } else {
            response = await request(app)
              .post(`/api/visualizations${endpoint.path}`)
              .send(endpoint.body);
          }

          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        }
      }
    });

    it('should maintain data isolation between organizations', async () => {
      const orgIds = ['org-1', 'org-2', 'org-3'];
      
      for (const orgId of orgIds) {
        mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
          req.user = {
            id: 'test-user-id',
            email: MASTER_CREDENTIALS.admin.email,
            organizationId: orgId,
          };
          next();
        });

        const response = await request(app)
          .get('/api/visualizations/dashboard-charts');

        expect(response.status).toBe(200);
        expect(response.body.metadata.organizationId).toBe(orgId);
      }
    });

    it('should prioritize explicit organization ID over auth token', async () => {
      mockAuthMiddleware.mockImplementation((req: any, res: any, next: any) => {
        req.user = {
          id: 'test-user-id',
          email: MASTER_CREDENTIALS.admin.email,
          organizationId: 'token-org-id',
        };
        next();
      });

      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: 'explicit-org-id' });

      expect(response.status).toBe(200);
      expect(response.body.metadata.organizationId).toBe('explicit-org-id');
    });
  });

  describe('Performance and Data Quality', () => {
    it('should return data within reasonable response time', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: 'test-org-id' });

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should generate consistent data structures', async () => {
      const responses = await Promise.all([
        request(app).get('/api/visualizations/dashboard-charts').query({ organizationId: 'test-org-id' }),
        request(app).get('/api/visualizations/dashboard-charts').query({ organizationId: 'test-org-id' }),
        request(app).get('/api/visualizations/dashboard-charts').query({ organizationId: 'test-org-id' }),
      ]);

      const [response1, response2, response3] = responses;
      
      // All should have same structure
      expect(Object.keys(response1.body.data)).toEqual(Object.keys(response2.body.data));
      expect(Object.keys(response2.body.data)).toEqual(Object.keys(response3.body.data));
      
      // Data should vary (simulated random data)
      expect(response1.body.data.engagementTrend.datasets[0].data)
        .not.toEqual(response2.body.data.engagementTrend.datasets[0].data);
    });

    it('should validate chart data integrity', async () => {
      const response = await request(app)
        .get('/api/visualizations/dashboard-charts')
        .query({ organizationId: 'test-org-id' });

      const { data } = response.body;
      
      // Validate engagement trend data integrity
      const engagementData = data.engagementTrend.datasets[0].data;
      engagementData.forEach((value: number) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThan(1000000); // Reasonable upper bound
      });
      
      // Validate platform performance data
      const platformData = data.platformPerformance.datasets[0].data;
      expect(platformData.every((value: number) => typeof value === 'number' && value > 0)).toBe(true);
    });
  });
});