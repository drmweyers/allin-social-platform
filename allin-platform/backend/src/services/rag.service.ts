/**
 * RAG (Retrieval-Augmented Generation) Service
 *
 * Provides intelligent document retrieval and AI-powered response generation
 * for the AllIN platform support system.
 *
 * Features:
 * - Vector similarity search using pgvector
 * - Hybrid search (semantic + keyword)
 * - Context-aware response generation
 * - Query analytics and feedback tracking
 * - Security and permission filtering
 */

import { PrismaClient } from '@prisma/client'
import { OpenAI } from 'openai'
import { z } from 'zod'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

// Types and Schemas
export const RetrieveRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  k: z.number().int().min(1).max(20).default(5),
  category: z.string().optional(),
  minScore: z.number().min(0).max(1).default(0.7)
})

export const AnswerRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  userPlan: z.enum(['starter', 'professional', 'team', 'enterprise']).optional(),
  userRole: z.string().optional(),
  featureContext: z.string().optional()
})

export interface RetrievedChunk {
  id: string
  path: string
  title: string
  section?: string
  content: string
  category?: string
  score: number
  citations: string[]
}

export interface AIAnswer {
  answer: string
  confidence: number
  sources: RetrievedChunk[]
  escalateToHuman: boolean
  reasoning?: string
  responseTime: number
}

export interface UserTools {
  getUserPlan: (userId: string) => Promise<{ planTier: string; seats: number; limits: Record<string, any> }>
  getFeatureFlag: (flag: string, userId: string) => Promise<boolean>
  openTicket: (params: { userId: string; summary: string; context: string }) => Promise<{ ticketId: string }>
}

class RAGService {
  private readonly maxContextTokens = 16000 // Leave room for system prompt and response
  private readonly systemPrompt = `You are the internal support assistant for AllIN Platform, an AI-powered social media management platform.

CORE RULES:
1. ONLY answer using the provided CONTEXT from our documentation
2. If information is missing from context, clearly state what's missing and suggest next steps
3. Keep answers concise, actionable, and cite sources using [filename#section] format
4. NEVER expose internal file paths beyond citations
5. ALWAYS redact secrets, API keys, passwords, and internal URLs
6. Verify user permissions before sharing admin-only features

RESPONSE FORMAT:
- Provide step-by-step instructions when possible
- Cite relevant documentation using [path#section] format
- Include line numbers for code references: filename.ts:123
- Note any plan/permission requirements
- If confidence < 0.6, recommend escalation to human support

SECURITY:
- Redact any sensitive information (API keys, passwords, internal URLs)
- Only share features accessible to the user's plan and role
- Don't reveal internal system details beyond what's documented

When unsure or when confidence is low, err on the side of escalating to human support with a clear summary of what the user needs.`

  /**
   * Retrieve relevant document chunks for a query
   */
  async retrieve(params: z.infer<typeof RetrieveRequestSchema>): Promise<RetrievedChunk[]> {
    const { query, k, category, minScore } = RetrieveRequestSchema.parse(params)

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query)

      // Build SQL query with vector similarity search
      let whereClause = 'WHERE embedding IS NOT NULL'
      const queryParams: any[] = []

      if (category) {
        whereClause += ' AND category = $' + (queryParams.length + 1)
        queryParams.push(category)
      }

      // Use pgvector cosine similarity with threshold
      const similarityThreshold = minScore
      const sql = `
        SELECT
          id,
          path,
          title,
          section,
          content,
          category,
          citations,
          search_keywords,
          (1 - (embedding <=> $${queryParams.length + 1}::vector)) as similarity_score
        FROM ai_documents
        ${whereClause}
          AND (1 - (embedding <=> $${queryParams.length + 1}::vector)) >= $${queryParams.length + 2}
        ORDER BY embedding <=> $${queryParams.length + 1}::vector
        LIMIT $${queryParams.length + 3}
      `

      queryParams.push(`[${queryEmbedding.join(',')}]`, similarityThreshold, k)

      const results = await prisma.$queryRawUnsafe(sql, ...queryParams) as any[]

      // Also perform keyword search for hybrid results
      const keywordResults = await this.performKeywordSearch(query, k, category)

      // Combine and deduplicate results
      const combinedResults = this.combineSearchResults(results, keywordResults, k)

      return combinedResults.map(result => ({
        id: result.id,
        path: result.path,
        title: result.title,
        section: result.section,
        content: result.content,
        category: result.category,
        score: result.similarity_score || result.keyword_score || 0,
        citations: Array.isArray(result.citations) ? result.citations : []
      }))

    } catch (error) {
      console.error('RAG retrieval failed:', error)
      throw new Error('Failed to retrieve relevant documentation')
    }
  }

  /**
   * Generate AI answer using retrieved context
   */
  async answer(
    params: z.infer<typeof AnswerRequestSchema>,
    tools?: UserTools
  ): Promise<AIAnswer> {
    const startTime = Date.now()
    const { query, userId, sessionId, userPlan, userRole, featureContext } = AnswerRequestSchema.parse(params)

    try {
      // Retrieve relevant context
      const retrievedChunks = await this.retrieve({
        query,
        k: 8, // Get more chunks for better context
        minScore: 0.6
      })

      if (retrievedChunks.length === 0) {
        return {
          answer: "I couldn't find relevant information in our documentation to answer your question. Please provide more specific details or contact our support team for assistance.",
          confidence: 0,
          sources: [],
          escalateToHuman: true,
          reasoning: "No relevant context found in documentation",
          responseTime: Date.now() - startTime
        }
      }

      // Build context from retrieved chunks
      const context = this.buildContext(retrievedChunks, userPlan, userRole)

      // Enhance prompt with user context
      const enhancedSystemPrompt = this.buildSystemPrompt(userPlan, userRole, featureContext)

      // Generate response using OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          {
            role: 'user',
            content: `Context from AllIN Platform documentation:

${context}

User question: ${query}

Provide a helpful response following the guidelines above. Include relevant citations and indicate if escalation is needed.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })

      const answer = completion.choices[0].message.content || ''
      const confidence = this.calculateConfidence(answer, retrievedChunks, query)

      // Determine if escalation is needed
      const escalateToHuman = confidence < 0.6 ||
                             answer.toLowerCase().includes('escalate') ||
                             answer.toLowerCase().includes('contact support')

      // Store query and response for analytics
      await this.storeQuery({
        query,
        userId,
        sessionId,
        retrievedChunks,
        response: answer,
        responseTime: Date.now() - startTime,
        confidenceScore: confidence,
        escalatedToHuman,
        userPlan,
        userRole,
        featureContext
      })

      return {
        answer,
        confidence,
        sources: retrievedChunks,
        escalateToHuman,
        reasoning: confidence < 0.6 ? 'Low confidence in answer accuracy' : undefined,
        responseTime: Date.now() - startTime
      }

    } catch (error) {
      console.error('RAG answer generation failed:', error)

      return {
        answer: "I'm experiencing technical difficulties. Please try again or contact our support team for immediate assistance.",
        confidence: 0,
        sources: [],
        escalateToHuman: true,
        reasoning: "Technical error during response generation",
        responseTime: Date.now() - startTime
      }
    }
  }

  /**
   * Analyze query for insights and suggestions
   */
  async analyzeQuery(query: string): Promise<{
    intent: string
    category: string
    suggestedQueries: string[]
    urgency: 'low' | 'medium' | 'high'
  }> {
    try {
      const analysisPrompt = `Analyze this user support query and categorize it:

Query: "${query}"

Provide a JSON response with:
1. intent: What is the user trying to do? (e.g., "troubleshoot_login", "learn_feature", "get_pricing")
2. category: Which documentation category is most relevant? (architecture, troubleshooting, faq, features-apis, etc.)
3. suggestedQueries: Array of 3 alternative ways to ask this question
4. urgency: How urgent is this query? (low/medium/high)

Consider urgency high for: account locked, payment failures, service outages
Consider urgency medium for: feature not working, unexpected behavior
Consider urgency low for: how-to questions, general information`

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.1,
        max_tokens: 300
      })

      const response = completion.choices[0].message.content || '{}'
      return JSON.parse(response)

    } catch (error) {
      console.error('Query analysis failed:', error)
      return {
        intent: 'general_inquiry',
        category: 'general',
        suggestedQueries: [],
        urgency: 'medium'
      }
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    })

    return response.data[0].embedding
  }

  private async performKeywordSearch(
    query: string,
    k: number,
    category?: string
  ): Promise<any[]> {
    // Simple keyword search using PostgreSQL full-text search
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2)

    if (keywords.length === 0) return []

    let whereClause = 'WHERE (title ILIKE ANY($1) OR content ILIKE ANY($1) OR search_keywords::text ILIKE ANY($1))'
    const queryParams: any[] = [keywords.map(k => `%${k}%`)]

    if (category) {
      whereClause += ' AND category = $2'
      queryParams.push(category)
    }

    const sql = `
      SELECT
        id, path, title, section, content, category, citations, search_keywords,
        0.5 as keyword_score
      FROM ai_documents
      ${whereClause}
      ORDER BY
        CASE
          WHEN title ILIKE ANY($1) THEN 1
          WHEN section ILIKE ANY($1) THEN 2
          ELSE 3
        END
      LIMIT $${queryParams.length + 1}
    `

    queryParams.push(Math.min(k, 5)) // Limit keyword results

    return await prisma.$queryRawUnsafe(sql, ...queryParams) as any[]
  }

  private combineSearchResults(
    vectorResults: any[],
    keywordResults: any[],
    k: number
  ): any[] {
    const seen = new Set<string>()
    const combined: any[] = []

    // Add vector results first (usually higher quality)
    for (const result of vectorResults) {
      if (!seen.has(result.id) && combined.length < k) {
        seen.add(result.id)
        combined.push(result)
      }
    }

    // Add keyword results that weren't already included
    for (const result of keywordResults) {
      if (!seen.has(result.id) && combined.length < k) {
        seen.add(result.id)
        combined.push(result)
      }
    }

    return combined
  }

  private buildContext(
    chunks: RetrievedChunk[],
    userPlan?: string,
    userRole?: string
  ): string {
    let context = ''
    let tokenCount = 0

    for (const chunk of chunks) {
      // Estimate token count (rough approximation)
      const chunkTokens = Math.ceil(chunk.content.length / 4)

      if (tokenCount + chunkTokens > this.maxContextTokens) {
        break
      }

      // Filter content based on user permissions
      const filteredContent = this.filterContentByPermissions(chunk.content, userPlan, userRole)

      context += `[${chunk.path}${chunk.section ? `#${chunk.section}` : ''}]\n`
      context += filteredContent + '\n\n'

      tokenCount += chunkTokens
    }

    return context
  }

  private filterContentByPermissions(
    content: string,
    userPlan?: string,
    userRole?: string
  ): string {
    // Remove admin-only sections for non-admin users
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      content = content.replace(/\*\*Admin only\*\*:.*$/gm, '[Admin feature - upgrade required]')
      content = content.replace(/```sql[\s\S]*?```/g, '[Database query - admin access required]')
    }

    // Filter plan-specific features
    if (userPlan === 'starter') {
      content = content.replace(/\*\*Professional\+\*\*:.*$/gm, '[Professional plan feature]')
      content = content.replace(/\*\*Team\+\*\*:.*$/gm, '[Team plan feature]')
      content = content.replace(/\*\*Enterprise\*\*:.*$/gm, '[Enterprise plan feature]')
    } else if (userPlan === 'professional') {
      content = content.replace(/\*\*Team\+\*\*:.*$/gm, '[Team plan feature]')
      content = content.replace(/\*\*Enterprise\*\*:.*$/gm, '[Enterprise plan feature]')
    } else if (userPlan === 'team') {
      content = content.replace(/\*\*Enterprise\*\*:.*$/gm, '[Enterprise plan feature]')
    }

    // Redact sensitive information
    content = content.replace(/sk-[a-zA-Z0-9-_]{32,}/g, '[API_KEY_REDACTED]')
    content = content.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
    content = content.replace(/https?:\/\/localhost:\d+/g, '[LOCAL_URL]')

    return content
  }

  private buildSystemPrompt(
    userPlan?: string,
    userRole?: string,
    featureContext?: string
  ): string {
    let prompt = this.systemPrompt

    if (userPlan) {
      prompt += `\n\nUSER CONTEXT:
- Plan: ${userPlan}
- Role: ${userRole || 'user'}
${featureContext ? `- Current feature: ${featureContext}` : ''}

When recommending features, ensure they're available in the user's plan. If suggesting an upgrade, mention the specific plan tier required.`
    }

    return prompt
  }

  private calculateConfidence(
    answer: string,
    sources: RetrievedChunk[],
    query: string
  ): number {
    let confidence = 0.5 // Base confidence

    // Higher confidence if we have good sources
    if (sources.length >= 3) confidence += 0.2
    if (sources.some(s => s.score > 0.8)) confidence += 0.2

    // Lower confidence for vague answers
    if (answer.includes('I don\'t know') || answer.includes('not sure')) confidence -= 0.3
    if (answer.includes('contact support') || answer.includes('escalate')) confidence -= 0.2

    // Higher confidence for specific answers with citations
    const citationCount = (answer.match(/\[[\w.-]+#?[\w-]*\]/g) || []).length
    confidence += Math.min(citationCount * 0.1, 0.3)

    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence))
  }

  private async storeQuery(params: {
    query: string
    userId?: string
    sessionId?: string
    retrievedChunks: RetrievedChunk[]
    response: string
    responseTime: number
    confidenceScore: number
    escalatedToHuman: boolean
    userPlan?: string
    userRole?: string
    featureContext?: string
  }): Promise<void> {
    try {
      // Generate query embedding for analytics
      const queryEmbedding = await this.generateEmbedding(params.query)

      await prisma.supportQuery.create({
        data: {
          query: params.query,
          userId: params.userId,
          sessionId: params.sessionId,
          queryEmbedding: `[${queryEmbedding.join(',')}]`,
          retrievedChunks: params.retrievedChunks.map(chunk => ({
            id: chunk.id,
            path: chunk.path,
            title: chunk.title,
            section: chunk.section,
            score: chunk.score
          })),
          response: params.response,
          responseTime: params.responseTime,
          confidenceScore: params.confidenceScore,
          escalatedToHuman: params.escalatedToHuman,
          userPlan: params.userPlan,
          userRole: params.userRole,
          featureContext: params.featureContext
        }
      })
    } catch (error) {
      console.error('Failed to store query analytics:', error)
      // Don't throw error - analytics failure shouldn't break the main flow
    }
  }

  /**
   * Get analytics on support queries
   */
  async getAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalQueries: number
    avgConfidence: number
    escalationRate: number
    responseTime: number
    topCategories: Array<{ category: string; count: number }>
    commonQueries: Array<{ query: string; count: number }>
  }> {
    const since = new Date()
    switch (timeframe) {
      case 'day':
        since.setDate(since.getDate() - 1)
        break
      case 'week':
        since.setDate(since.getDate() - 7)
        break
      case 'month':
        since.setMonth(since.getMonth() - 1)
        break
    }

    const queries = await prisma.supportQuery.findMany({
      where: {
        createdAt: { gte: since }
      },
      select: {
        confidenceScore: true,
        escalatedToHuman: true,
        responseTime: true,
        query: true,
        retrievedChunks: true
      }
    })

    const totalQueries = queries.length
    const avgConfidence = queries.reduce((sum, q) => sum + (q.confidenceScore || 0), 0) / totalQueries
    const escalationRate = queries.filter(q => q.escalatedToHuman).length / totalQueries
    const avgResponseTime = queries.reduce((sum, q) => sum + (q.responseTime || 0), 0) / totalQueries

    // Extract categories from retrieved chunks
    const categoryCount = new Map<string, number>()
    queries.forEach(q => {
      const chunks = Array.isArray(q.retrievedChunks) ? q.retrievedChunks : []
      chunks.forEach((chunk: any) => {
        if (chunk.category) {
          categoryCount.set(chunk.category, (categoryCount.get(chunk.category) || 0) + 1)
        }
      })
    })

    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Find common query patterns
    const queryCount = new Map<string, number>()
    queries.forEach(q => {
      const normalizedQuery = q.query.toLowerCase().trim()
      queryCount.set(normalizedQuery, (queryCount.get(normalizedQuery) || 0) + 1)
    })

    const commonQueries = Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalQueries,
      avgConfidence,
      escalationRate,
      responseTime: avgResponseTime,
      topCategories,
      commonQueries
    }
  }
}

export const ragService = new RAGService()
export { RAGService }