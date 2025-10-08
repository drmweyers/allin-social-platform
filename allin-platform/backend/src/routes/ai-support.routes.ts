/**
 * AI Support Routes
 *
 * RESTful API endpoints for the AllIN Platform AI support system.
 * Provides RAG-powered document retrieval and intelligent Q&A capabilities.
 */

import { Router, Request, Response, NextFunction } from 'express'
import { body, query, validationResult } from 'express-validator'
import { ragService } from '../services/rag.service'
import { authenticate, authorize } from '../middleware/auth'
import { rateLimiter } from '../middleware/rateLimiter'
import { ResponseHandler } from '../utils/response'
import { AppError } from '../utils/errors'

const router = Router()

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array()
      }
    })
  }
  next()
}

// Mock user tools for RAG service (replace with real implementations)
const mockUserTools = {
  async getUserPlan(_userId: string) {
    // TODO: Implement real user plan lookup
    return {
      planTier: 'professional',
      seats: 3,
      limits: { aiCredits: 500, socialAccounts: 15 }
    }
  },

  async getFeatureFlag(_flag: string, _userId: string) {
    // TODO: Implement real feature flag system
    return true
  },

  async openTicket(_params: { userId: string; summary: string; context: string }) {
    // TODO: Implement real ticketing system
    return {
      ticketId: `TICKET-${Date.now()}`
    }
  }
}

/**
 * POST /api/ai/retrieve
 * Retrieve relevant document chunks for a query
 */
router.post('/retrieve', [
  body('query')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Query must be between 1 and 1000 characters'),
  body('k')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('k must be between 1 and 20'),
  body('category')
    .optional()
    .isString()
    .isIn(['architecture', 'glossary', 'user-journeys', 'features-apis', 'configuration', 'troubleshooting', 'faq', 'security-privacy', 'roadmap'])
    .withMessage('Invalid category'),
  body('minScore')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('minScore must be between 0 and 1')
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, k = 5, category, minScore = 0.7 } = req.body

    const results = await ragService.retrieve({
      query,
      k,
      category,
      minScore
    })

    return ResponseHandler.success(res, {
      results,
      query,
      count: results.length
    }, 'Document retrieval successful')

  } catch (error) {
    return next(error)
  }
})

/**
 * POST /api/ai/answer
 * Generate AI-powered answers using RAG
 */
router.post('/answer', [
  body('query')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Query must be between 1 and 1000 characters'),
  body('userId')
    .optional()
    .isString()
    .withMessage('userId must be a string'),
  body('sessionId')
    .optional()
    .isString()
    .withMessage('sessionId must be a string'),
  body('userPlan')
    .optional()
    .isIn(['starter', 'professional', 'team', 'enterprise'])
    .withMessage('Invalid user plan'),
  body('userRole')
    .optional()
    .isString()
    .withMessage('userRole must be a string'),
  body('featureContext')
    .optional()
    .isString()
    .withMessage('featureContext must be a string')
], handleValidationErrors, rateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestData = {
      query: req.body.query,
      userId: req.body.userId || req.user?.id,
      sessionId: req.body.sessionId,
      userPlan: req.body.userPlan,
      userRole: req.body.userRole || req.user?.role,
      featureContext: req.body.featureContext
    }

    const answer = await ragService.answer(requestData, mockUserTools)

    return ResponseHandler.success(res, answer, 'Answer generated successfully')

  } catch (error) {
    return next(error)
  }
})

/**
 * POST /api/ai/analyze-query
 * Analyze query intent and categorization
 */
router.post('/analyze-query', [
  body('query')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Query must be between 1 and 1000 characters')
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body

    const analysis = await ragService.analyzeQuery(query)

    return ResponseHandler.success(res, analysis, 'Query analysis completed')

  } catch (error) {
    return next(error)
  }
})

/**
 * GET /api/ai/analytics
 * Get support system analytics (admin only)
 */
router.get('/analytics', [
  query('timeframe')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Timeframe must be day, week, or month')
], authenticate, authorize('ADMIN', 'SUPER_ADMIN'), handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timeframe = req.query.timeframe as 'day' | 'week' | 'month' || 'week'

    const analytics = await ragService.getAnalytics(timeframe)

    return ResponseHandler.success(res, analytics, 'Analytics retrieved successfully')

  } catch (error) {
    return next(error)
  }
})

/**
 * POST /api/ai/feedback
 * Submit feedback on AI response quality
 */
router.post('/feedback', [
  body('queryId')
    .isString()
    .withMessage('queryId is required'),
  body('helpful')
    .isBoolean()
    .withMessage('helpful must be a boolean'),
  body('feedback')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Feedback must be less than 1000 characters')
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queryId, helpful, feedback: _feedback } = req.body

    // Update the support query with feedback
    await (req as any).prisma.supportQuery.update({
      where: { id: queryId },
      data: {
        wasHelpful: helpful,
        // Store additional feedback in a separate field if needed
      }
    })

    return ResponseHandler.success(res, null, 'Feedback submitted successfully')

  } catch (error) {
    return next(error)
  }
})

/**
 * POST /api/ai/escalate
 * Escalate query to human support
 */
router.post('/escalate', [
  body('queryId')
    .isString()
    .withMessage('queryId is required'),
  body('reason')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters'),
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Urgency must be low, medium, or high')
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queryId, reason, urgency = 'medium' } = req.body
    const userId = req.user?.id || 'anonymous'

    // Get the original query
    const originalQuery = await (req as any).prisma.supportQuery.findUnique({
      where: { id: queryId }
    })

    if (!originalQuery) {
      throw new AppError('Query not found', 404)
    }

    // Create support ticket using mock tool (replace with real implementation)
    const ticket = await mockUserTools.openTicket({
      userId,
      summary: `AI Support Escalation: ${originalQuery.query.substring(0, 100)}...`,
      context: `Original Query: ${originalQuery.query}\n\nEscalation Reason: ${reason}\n\nUrgency: ${urgency}\n\nAI Response: ${originalQuery.response || 'No response generated'}`
    })

    // Update the query record
    await (req as any).prisma.supportQuery.update({
      where: { id: queryId },
      data: {
        escalatedToHuman: true,
        ticketId: ticket.ticketId
      }
    })

    return ResponseHandler.success(res, {
      ticketId: ticket.ticketId,
      message: 'Query escalated to human support successfully'
    })

  } catch (error) {
    return next(error)
  }
})

/**
 * GET /api/ai/knowledge-stats
 * Get knowledgebase statistics
 */
router.get('/knowledge-stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await (req as any).prisma.knowledgebaseStats.findFirst({
      where: { id: 'singleton' }
    })

    if (!stats) {
      return ResponseHandler.success(res, {
        totalDocuments: 0,
        totalChunks: 0,
        totalTokens: 0,
        lastIngestionAt: null
      }, 'No knowledgebase statistics available')
    }

    return ResponseHandler.success(res, {
      totalDocuments: stats.totalDocuments,
      totalChunks: stats.totalChunks,
      totalTokens: Number(stats.totalTokens), // Convert BigInt to number
      avgChunkSize: stats.avgChunkSize,
      lastIngestionAt: stats.lastIngestionAt,
      lastIngestionDuration: stats.lastIngestionDuration,
      documentsProcessed: stats.documentsProcessed,
      errorsCount: stats.errorsCount,
      schemaVersion: stats.schemaVersion
    }, 'Knowledgebase statistics retrieved successfully')

  } catch (error) {
    return next(error)
  }
})

/**
 * POST /api/ai/search-suggestions
 * Get search suggestions based on partial query
 */
router.post('/search-suggestions', [
  body('partial')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Partial query must be between 2 and 100 characters')
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partial } = req.body

    // Get common queries that start with the partial text
    const suggestions = await (req as any).prisma.supportQuery.findMany({
      where: {
        query: {
          contains: partial,
          mode: 'insensitive'
        }
      },
      select: {
        query: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      distinct: ['query']
    })

    const uniqueSuggestions = suggestions.map((s: any) => s.query)

    return ResponseHandler.success(res, {
      suggestions: uniqueSuggestions,
      count: uniqueSuggestions.length
    }, 'Search suggestions retrieved successfully')

  } catch (error) {
    return next(error)
  }
})

export default router