import request from 'supertest';
import express from 'express';

// Mock the RAG service BEFORE importing routes
const mockRagService = {
  retrieve: jest.fn(),
  answer: jest.fn(),
  analyzeQuery: jest.fn(),
  getAnalytics: jest.fn()
};

jest.mock('../../../src/services/rag.service', () => ({
  ragService: mockRagService,
  RetrieveRequestSchema: {},
  AnswerRequestSchema: {}
}));

// Mock ResponseHandler
const mockResponseHandler = {
  success: jest.fn((res, data, message) => {
    res.json({ success: true, data, message });
  }),
  error: jest.fn((res, message, statusCode) => {
    res.status(statusCode || 500).json({ success: false, error: message });
  })
};

jest.mock('../../../src/utils/response', () => ({
  ResponseHandler: mockResponseHandler
}));

// Mock AppError
jest.mock('../../../src/utils/errors', () => ({
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number) {
      super(message);
    }
  }
}));

// Mock authentication middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'ADMIN'
    };
    next();
  },
  authorize: (..._roles: string[]) => (_req: any, _res: any, next: any) => {
    next();
  }
}));

// Mock rate limiter
jest.mock('../../../src/middleware/rateLimiter', () => ({
  rateLimiter: (_req: any, _res: any, next: any) => next()
}));

import aiSupportRoutes from '../../../src/routes/ai-support.routes';

const app = express();
app.use(express.json());

// Mock Prisma client
const mockPrisma = {
  supportQuery: {
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  knowledgebaseStats: {
    findFirst: jest.fn()
  }
};

// Add prisma to request
app.use((req: any, _res, next) => {
  req.user = { id: 'user-123', email: 'test@example.com', role: 'ADMIN' };
  req.prisma = mockPrisma;
  next();
});

app.use('/api/ai', aiSupportRoutes);

describe('AI Support Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ai/retrieve', () => {
    it('should retrieve relevant documents successfully', async () => {
      const mockResults = [
        {
          content: 'Test document content',
          score: 0.85,
          category: 'faq',
          metadata: { source: 'faq.md' }
        }
      ];

      mockRagService.retrieve.mockResolvedValue(mockResults);

      const response = await request(app)
        .post('/api/ai/retrieve')
        .send({
          query: 'How do I schedule posts?',
          k: 5,
          minScore: 0.7
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toEqual(mockResults);
      expect(response.body.data.count).toBe(1);
      expect(mockRagService.retrieve).toHaveBeenCalledWith({
        query: 'How do I schedule posts?',
        k: 5,
        category: undefined,
        minScore: 0.7
      });
    });

    it('should retrieve with category filter', async () => {
      mockRagService.retrieve.mockResolvedValue([]);

      await request(app)
        .post('/api/ai/retrieve')
        .send({
          query: 'Test query',
          k: 3,
          category: 'troubleshooting',
          minScore: 0.8
        })
        .expect(200);

      expect(mockRagService.retrieve).toHaveBeenCalledWith({
        query: 'Test query',
        k: 3,
        category: 'troubleshooting',
        minScore: 0.8
      });
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(app)
        .post('/api/ai/retrieve')
        .send({
          query: 'Test query',
          category: 'invalid-category'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for empty query', async () => {
      const response = await request(app)
        .post('/api/ai/retrieve')
        .send({ query: '' })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for query too long', async () => {
      const response = await request(app)
        .post('/api/ai/retrieve')
        .send({ query: 'a'.repeat(1001) })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/ai/answer', () => {
    it('should generate AI answer successfully', async () => {
      const mockAnswer = {
        answer: 'To schedule posts, go to the content calendar...',
        sources: ['faq.md', 'features.md'],
        confidence: 0.92
      };

      mockRagService.answer.mockResolvedValue(mockAnswer);

      const response = await request(app)
        .post('/api/ai/answer')
        .send({
          query: 'How do I schedule posts?',
          userId: 'user-123',
          userPlan: 'professional'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnswer);
      expect(mockRagService.answer).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'How do I schedule posts?',
          userId: 'user-123',
          userPlan: 'professional'
        }),
        expect.any(Object)
      );
    });

    it('should use authenticated user data when not provided', async () => {
      mockRagService.answer.mockResolvedValue({ answer: 'Test answer' });

      await request(app)
        .post('/api/ai/answer')
        .send({ query: 'Test question' })
        .expect(200);

      expect(mockRagService.answer).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          userRole: 'ADMIN'
        }),
        expect.any(Object)
      );
    });

    it('should return 400 for invalid user plan', async () => {
      const response = await request(app)
        .post('/api/ai/answer')
        .send({
          query: 'Test question',
          userPlan: 'invalid-plan'
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle service errors', async () => {
      mockRagService.answer.mockRejectedValue(new Error('Service unavailable'));

      await request(app)
        .post('/api/ai/answer')
        .send({ query: 'Test question' })
        .expect(500);
    });
  });

  describe('POST /api/ai/analyze-query', () => {
    it('should analyze query successfully', async () => {
      const mockAnalysis = {
        intent: 'how-to',
        category: 'features-apis',
        confidence: 0.88,
        suggestedCategories: ['features-apis', 'faq']
      };

      mockRagService.analyzeQuery.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/ai/analyze-query')
        .send({ query: 'How do I integrate with Instagram?' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalysis);
      expect(mockRagService.analyzeQuery).toHaveBeenCalledWith('How do I integrate with Instagram?');
    });

    it('should return 400 for empty query', async () => {
      await request(app)
        .post('/api/ai/analyze-query')
        .send({ query: '' })
        .expect(400);
    });
  });

  describe('GET /api/ai/analytics', () => {
    it('should get analytics successfully', async () => {
      const mockAnalytics = {
        totalQueries: 1250,
        avgResponseTime: 1.2,
        satisfactionRate: 0.87,
        topQueries: ['How to schedule?', 'Connect Instagram?']
      };

      mockRagService.getAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/api/ai/analytics')
        .query({ timeframe: 'week' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalytics);
      expect(mockRagService.getAnalytics).toHaveBeenCalledWith('week');
    });

    it('should use default timeframe when not provided', async () => {
      mockRagService.getAnalytics.mockResolvedValue({});

      await request(app)
        .get('/api/ai/analytics')
        .expect(200);

      expect(mockRagService.getAnalytics).toHaveBeenCalledWith('week');
    });

    it('should return 400 for invalid timeframe', async () => {
      await request(app)
        .get('/api/ai/analytics')
        .query({ timeframe: 'invalid' })
        .expect(400);
    });
  });

  describe('POST /api/ai/feedback', () => {
    it('should submit feedback successfully', async () => {
      mockPrisma.supportQuery.update.mockResolvedValue({
        id: 'query-123',
        wasHelpful: true
      });

      const response = await request(app)
        .post('/api/ai/feedback')
        .send({
          queryId: 'query-123',
          helpful: true,
          feedback: 'Very helpful answer'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.supportQuery.update).toHaveBeenCalledWith({
        where: { id: 'query-123' },
        data: { wasHelpful: true }
      });
    });

    it('should submit negative feedback', async () => {
      mockPrisma.supportQuery.update.mockResolvedValue({
        id: 'query-123',
        wasHelpful: false
      });

      await request(app)
        .post('/api/ai/feedback')
        .send({
          queryId: 'query-123',
          helpful: false,
          feedback: 'Did not answer my question'
        })
        .expect(200);

      expect(mockPrisma.supportQuery.update).toHaveBeenCalledWith({
        where: { id: 'query-123' },
        data: { wasHelpful: false }
      });
    });

    it('should return 400 when queryId is missing', async () => {
      await request(app)
        .post('/api/ai/feedback')
        .send({ helpful: true })
        .expect(400);
    });

    it('should return 400 when helpful is not boolean', async () => {
      await request(app)
        .post('/api/ai/feedback')
        .send({
          queryId: 'query-123',
          helpful: 'yes'
        })
        .expect(400);
    });
  });

  describe('POST /api/ai/escalate', () => {
    it('should escalate query to human support', async () => {
      const mockQuery = {
        id: 'query-123',
        query: 'I cannot connect my Instagram account',
        response: 'Try checking your credentials...'
      };

      mockPrisma.supportQuery.findUnique.mockResolvedValue(mockQuery);
      mockPrisma.supportQuery.update.mockResolvedValue({
        ...mockQuery,
        escalatedToHuman: true,
        ticketId: expect.any(String)
      });

      const response = await request(app)
        .post('/api/ai/escalate')
        .send({
          queryId: 'query-123',
          reason: 'AI answer did not resolve my issue',
          urgency: 'high'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ticketId).toBeDefined();
      expect(mockPrisma.supportQuery.findUnique).toHaveBeenCalledWith({
        where: { id: 'query-123' }
      });
      expect(mockPrisma.supportQuery.update).toHaveBeenCalledWith({
        where: { id: 'query-123' },
        data: {
          escalatedToHuman: true,
          ticketId: expect.any(String)
        }
      });
    });

    it('should use default medium urgency', async () => {
      mockPrisma.supportQuery.findUnique.mockResolvedValue({
        id: 'query-123',
        query: 'Test query'
      });
      mockPrisma.supportQuery.update.mockResolvedValue({});

      await request(app)
        .post('/api/ai/escalate')
        .send({
          queryId: 'query-123',
          reason: 'Need human help'
        })
        .expect(200);
    });

    it('should return 404 when query not found', async () => {
      mockPrisma.supportQuery.findUnique.mockResolvedValue(null);

      await request(app)
        .post('/api/ai/escalate')
        .send({
          queryId: 'non-existent',
          reason: 'Test reason'
        })
        .expect(500);
    });

    it('should return 400 for invalid urgency', async () => {
      await request(app)
        .post('/api/ai/escalate')
        .send({
          queryId: 'query-123',
          reason: 'Test reason',
          urgency: 'critical'
        })
        .expect(400);
    });
  });

  describe('GET /api/ai/knowledge-stats', () => {
    it('should get knowledgebase statistics', async () => {
      const mockStats = {
        id: 'singleton',
        totalDocuments: 150,
        totalChunks: 2500,
        totalTokens: BigInt(125000),
        avgChunkSize: 50.5,
        lastIngestionAt: new Date('2024-01-20T10:00:00Z'),
        lastIngestionDuration: 45.2,
        documentsProcessed: 150,
        errorsCount: 2,
        schemaVersion: '1.0'
      };

      mockPrisma.knowledgebaseStats.findFirst.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/ai/knowledge-stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalDocuments).toBe(150);
      expect(response.body.data.totalChunks).toBe(2500);
      expect(response.body.data.totalTokens).toBe(125000);
      expect(response.body.data.avgChunkSize).toBe(50.5);
    });

    it('should handle no statistics available', async () => {
      mockPrisma.knowledgebaseStats.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/ai/knowledge-stats')
        .expect(200);

      expect(response.body.data.totalDocuments).toBe(0);
      expect(response.body.data.totalChunks).toBe(0);
      expect(response.body.data.lastIngestionAt).toBeNull();
    });
  });

  describe('POST /api/ai/search-suggestions', () => {
    it('should get search suggestions', async () => {
      const mockSuggestions = [
        { query: 'How do I schedule posts?' },
        { query: 'How do I connect Instagram?' },
        { query: 'How do I add team members?' }
      ];

      mockPrisma.supportQuery.findMany.mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .post('/api/ai/search-suggestions')
        .send({ partial: 'How do' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toHaveLength(3);
      expect(response.body.data.count).toBe(3);
      expect(mockPrisma.supportQuery.findMany).toHaveBeenCalledWith({
        where: {
          query: {
            contains: 'How do',
            mode: 'insensitive'
          }
        },
        select: { query: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        distinct: ['query']
      });
    });

    it('should return empty suggestions when none found', async () => {
      mockPrisma.supportQuery.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/ai/search-suggestions')
        .send({ partial: 'xyz' })
        .expect(200);

      expect(response.body.data.suggestions).toHaveLength(0);
      expect(response.body.data.count).toBe(0);
    });

    it('should return 400 for partial query too short', async () => {
      await request(app)
        .post('/api/ai/search-suggestions')
        .send({ partial: 'a' })
        .expect(400);
    });

    it('should return 400 for partial query too long', async () => {
      await request(app)
        .post('/api/ai/search-suggestions')
        .send({ partial: 'a'.repeat(101) })
        .expect(400);
    });
  });
});
