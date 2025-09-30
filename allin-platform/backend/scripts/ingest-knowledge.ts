#!/usr/bin/env ts-node

/**
 * AllIN Platform Knowledge Base Ingestion Pipeline
 *
 * This script processes markdown documentation files and creates vector embeddings
 * for RAG (Retrieval-Augmented Generation) support functionality.
 *
 * Features:
 * - Scans all markdown files in docs/ai-knowledgebase/
 * - Chunks content optimally (800 tokens with 120 overlap)
 * - Generates OpenAI embeddings
 * - Stores in PostgreSQL with pgvector
 * - Handles incremental updates based on file modification times
 *
 * Usage:
 *   npm run ingest:kb
 *   npm run ingest:kb -- --force  # Force re-ingestion of all files
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import fastGlob from 'fast-glob'
import MarkdownIt from 'markdown-it'
import { PrismaClient } from '@prisma/client'
import { OpenAI } from 'openai'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Initialize clients
const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

const md = new MarkdownIt()

interface ChunkData {
  content: string
  title: string
  section?: string
  category?: string
  tags: string[]
  citations: string[]
  searchKeywords: string[]
  tokenCount: number
}

interface DocumentStats {
  totalDocuments: number
  totalChunks: number
  totalTokens: number
  documentsProcessed: number
  errorsCount: number
}

class KnowledgebaseIngester {
  private readonly docsPath: string
  private readonly forceReindex: boolean
  private readonly chunkSize: number = 800 // Target tokens per chunk
  private readonly chunkOverlap: number = 120 // Overlap between chunks
  private readonly batchSize: number = 10 // Embedding batch size

  constructor(docsPath: string, forceReindex: boolean = false) {
    this.docsPath = docsPath
    this.forceReindex = forceReindex
  }

  async run(): Promise<void> {
    console.log('🚀 Starting AllIN Knowledge Base ingestion...')
    console.log(`📁 Source path: ${this.docsPath}`)
    console.log(`🔄 Force reindex: ${this.forceReindex}`)

    const startTime = Date.now()
    let stats: DocumentStats = {
      totalDocuments: 0,
      totalChunks: 0,
      totalTokens: 0,
      documentsProcessed: 0,
      errorsCount: 0
    }

    try {
      // Ensure pgvector extension is enabled
      await this.enablePgVectorExtension()

      // Find all markdown files
      const markdownFiles = await this.findMarkdownFiles()
      console.log(`📄 Found ${markdownFiles.length} markdown files`)

      stats.totalDocuments = markdownFiles.length

      // Process files in batches to avoid overwhelming OpenAI API
      for (let i = 0; i < markdownFiles.length; i += this.batchSize) {
        const batch = markdownFiles.slice(i, i + this.batchSize)
        console.log(`\n📦 Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(markdownFiles.length / this.batchSize)}`)

        for (const filePath of batch) {
          try {
            const fileStats = await this.processFile(filePath)
            stats.totalChunks += fileStats.totalChunks
            stats.totalTokens += fileStats.totalTokens
            stats.documentsProcessed++

            console.log(`  ✅ ${path.basename(filePath)}: ${fileStats.totalChunks} chunks, ${fileStats.totalTokens} tokens`)
          } catch (error) {
            console.error(`  ❌ Error processing ${filePath}:`, error)
            stats.errorsCount++
          }
        }

        // Rate limiting delay to respect OpenAI API limits
        if (i + this.batchSize < markdownFiles.length) {
          console.log('⏸️  Pausing for rate limiting...')
          await this.sleep(2000) // 2 second delay between batches
        }
      }

      // Update statistics
      await this.updateStats(stats, Date.now() - startTime)

      console.log('\\n🎉 Ingestion completed successfully!')
      console.log(`📊 Stats: ${stats.documentsProcessed}/${stats.totalDocuments} documents, ${stats.totalChunks} chunks, ${stats.totalTokens} tokens`)
      if (stats.errorsCount > 0) {
        console.log(`⚠️  Errors: ${stats.errorsCount}`)
      }

    } catch (error) {
      console.error('💥 Ingestion failed:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async enablePgVectorExtension(): Promise<void> {
    try {
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`
      console.log('✅ pgvector extension enabled')
    } catch (error) {
      console.error('❌ Failed to enable pgvector extension:', error)
      throw error
    }
  }

  private async findMarkdownFiles(): Promise<string[]> {
    const pattern = path.join(this.docsPath, '**/*.md').replace(/\\/g, '/')
    return await fastGlob(pattern, {
      ignore: ['**/node_modules/**', '**/.*/**'],
      absolute: true
    })
  }

  private async processFile(filePath: string): Promise<{ totalChunks: number; totalTokens: number }> {
    const relativePath = path.relative(this.docsPath, filePath)
    const stats = await fs.stat(filePath)
    const lastModified = stats.mtime

    // Check if file needs reprocessing
    if (!this.forceReindex) {
      const existingDoc = await prisma.document.findFirst({
        where: { path: relativePath },
        orderBy: { lastModified: 'desc' },
        select: { lastModified: true }
      })

      if (existingDoc && existingDoc.lastModified >= lastModified) {
        const existingChunks = await prisma.document.count({
          where: { path: relativePath }
        })
        console.log(`  ⏭️  Skipping ${path.basename(filePath)} (up to date, ${existingChunks} chunks)`)
        return { totalChunks: existingChunks, totalTokens: 0 }
      }
    }

    // Read and process file
    const content = await fs.readFile(filePath, 'utf-8')
    const contentHash = crypto.createHash('md5').update(content).digest('hex')

    // Extract document metadata
    const title = this.extractTitle(content, relativePath)
    const category = this.extractCategory(relativePath)

    // Chunk the content
    const chunks = await this.chunkContent(content, title, category, relativePath)

    // Delete existing chunks for this document
    await prisma.document.deleteMany({
      where: { path: relativePath }
    })

    // Generate embeddings and store chunks
    let totalTokens = 0
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      try {
        // Generate embedding
        const embedding = await this.generateEmbedding(chunk.content)

        // Store in database
        await prisma.document.create({
          data: {
            path: relativePath,
            title: chunk.title,
            section: chunk.section,
            content: chunk.content,
            rawContent: i === 0 ? content : undefined, // Store raw content only for first chunk
            embedding: `[${embedding.join(',')}]`, // pgvector format
            chunkIndex: i,
            chunkCount: chunks.length,
            tokenCount: chunk.tokenCount,
            category: chunk.category,
            tags: chunk.tags,
            contentHash: contentHash,
            lastModified: lastModified,
            searchKeywords: chunk.searchKeywords,
            citations: chunk.citations
          }
        })

        totalTokens += chunk.tokenCount
      } catch (error) {
        console.error(`    ❌ Failed to process chunk ${i + 1}/${chunks.length}:`, error)
        throw error
      }
    }

    return { totalChunks: chunks.length, totalTokens }
  }

  private extractTitle(content: string, filePath: string): string {
    // Try to extract title from first H1 heading
    const h1Match = content.match(/^#\\s+(.+)$/m)
    if (h1Match) {
      return h1Match[1].trim()
    }

    // Fallback to filename
    return path.basename(filePath, '.md')
      .replace(/-/g, ' ')
      .replace(/\\b\\w/g, l => l.toUpperCase())
  }

  private extractCategory(filePath: string): string {
    const filename = path.basename(filePath, '.md')

    // Extract category from filename prefix
    if (filename.startsWith('10-')) return 'architecture'
    if (filename.startsWith('20-')) return 'glossary'
    if (filename.startsWith('30-')) return 'user-journeys'
    if (filename.startsWith('40-')) return 'features-apis'
    if (filename.startsWith('50-')) return 'configuration'
    if (filename.startsWith('60-')) return 'troubleshooting'
    if (filename.startsWith('70-')) return 'faq'
    if (filename.startsWith('80-')) return 'security-privacy'
    if (filename.startsWith('90-')) return 'roadmap'

    return 'general'
  }

  private async chunkContent(content: string, title: string, category: string, filePath: string): Promise<ChunkData[]> {
    const chunks: ChunkData[] = []

    // Parse markdown and extract sections
    const sections = this.extractSections(content)

    for (const section of sections) {
      const sectionChunks = await this.chunkSection(section, title, category, filePath)
      chunks.push(...sectionChunks)
    }

    return chunks
  }

  private extractSections(content: string): Array<{ title?: string; content: string }> {
    const sections: Array<{ title?: string; content: string }> = []
    const lines = content.split('\\n')

    let currentSection: { title?: string; content: string } = { content: '' }

    for (const line of lines) {
      if (line.match(/^#{1,6}\\s+/)) {
        // New heading found
        if (currentSection.content.trim()) {
          sections.push(currentSection)
        }

        currentSection = {
          title: line.replace(/^#{1,6}\\s+/, '').trim(),
          content: line + '\\n'
        }
      } else {
        currentSection.content += line + '\\n'
      }
    }

    // Add final section
    if (currentSection.content.trim()) {
      sections.push(currentSection)
    }

    return sections
  }

  private async chunkSection(
    section: { title?: string; content: string },
    docTitle: string,
    category: string,
    filePath: string
  ): Promise<ChunkData[]> {
    const chunks: ChunkData[] = []
    const content = section.content.trim()

    if (!content) return chunks

    // Estimate token count (rough approximation: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(content.length / 4)

    if (estimatedTokens <= this.chunkSize) {
      // Content fits in one chunk
      chunks.push({
        content,
        title: docTitle,
        section: section.title,
        category,
        tags: this.extractTags(content, filePath),
        citations: this.extractCitations(content),
        searchKeywords: this.extractKeywords(content),
        tokenCount: estimatedTokens
      })
    } else {
      // Split into multiple chunks
      const splitChunks = this.splitLongContent(content, this.chunkSize, this.chunkOverlap)

      for (let i = 0; i < splitChunks.length; i++) {
        const chunkContent = splitChunks[i]
        chunks.push({
          content: chunkContent,
          title: docTitle,
          section: section.title ? `${section.title} (Part ${i + 1})` : undefined,
          category,
          tags: this.extractTags(chunkContent, filePath),
          citations: this.extractCitations(chunkContent),
          searchKeywords: this.extractKeywords(chunkContent),
          tokenCount: Math.ceil(chunkContent.length / 4)
        })
      }
    }

    return chunks
  }

  private splitLongContent(content: string, maxTokens: number, overlap: number): string[] {
    const chunks: string[] = []
    const maxChars = maxTokens * 4 // Rough token-to-char conversion
    const overlapChars = overlap * 4

    let start = 0

    while (start < content.length) {
      let end = Math.min(start + maxChars, content.length)

      // Try to find a good breaking point (sentence or paragraph)
      if (end < content.length) {
        const breakPoints = [
          content.lastIndexOf('\\n\\n', end), // Paragraph break
          content.lastIndexOf('. ', end),     // Sentence break
          content.lastIndexOf('\\n', end),    // Line break
          content.lastIndexOf(' ', end)       // Word break
        ]

        for (const breakPoint of breakPoints) {
          if (breakPoint > start + maxChars * 0.7) { // Don't break too early
            end = breakPoint
            break
          }
        }
      }

      chunks.push(content.slice(start, end).trim())
      start = end - overlapChars

      if (start >= content.length) break
    }

    return chunks.filter(chunk => chunk.length > 0)
  }

  private extractTags(content: string, filePath: string): string[] {
    const tags: string[] = []

    // Add category-based tags
    const category = this.extractCategory(filePath)
    tags.push(category)

    // Extract technology/platform tags
    const techPatterns = [
      /\\b(React|Next\\.js|TypeScript|JavaScript|Node\\.js|Express|Prisma|PostgreSQL|Redis)\\b/gi,
      /\\b(OpenAI|GPT-4|Claude|Anthropic|AI|Machine Learning)\\b/gi,
      /\\b(Facebook|Instagram|Twitter|LinkedIn|TikTok|YouTube|Pinterest)\\b/gi,
      /\\b(OAuth|JWT|Authentication|Authorization|RBAC)\\b/gi
    ]

    for (const pattern of techPatterns) {
      const matches = content.match(pattern) || []
      tags.push(...matches.map(match => match.toLowerCase()))
    }

    // Remove duplicates and limit
    return [...new Set(tags)].slice(0, 10)
  }

  private extractCitations(content: string): string[] {
    const citations: string[] = []

    // Extract file references like src/services/auth.service.ts:123
    const fileRefPattern = /\\b([a-zA-Z0-9._/-]+\\.(ts|js|tsx|jsx|md))(?::(\\d+))?\\b/g
    let match
    while ((match = fileRefPattern.exec(content)) !== null) {
      citations.push(match[0])
    }

    // Extract internal links like [text](./other-file.md)
    const internalLinkPattern = /\\[([^\\]]+)\\]\\(\\.\\/([^)]+\\.md)(?:#([^)]+))?\\)/g
    while ((match = internalLinkPattern.exec(content)) !== null) {
      citations.push(match[2])
    }

    return [...new Set(citations)]
  }

  private extractKeywords(content: string): string[] {
    const keywords: string[] = []

    // Extract important technical terms
    const keywordPatterns = [
      /\\b[A-Z][a-zA-Z]{3,}\\b/g,           // Camel case terms
      /\\b[A-Z_]{3,}\\b/g,                  // Constants
      /\\b\\w+Error\\b/gi,                  // Error types
      /\\b\\w+(Service|Controller|Model|API)\\b/gi, // Architecture terms
    ]

    for (const pattern of keywordPatterns) {
      const matches = content.match(pattern) || []
      keywords.push(...matches)
    }

    // Remove duplicates, filter short words, limit count
    return [...new Set(keywords)]
      .filter(keyword => keyword.length >= 3)
      .slice(0, 20)
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Failed to generate embedding:', error)
      throw error
    }
  }

  private async updateStats(stats: DocumentStats, duration: number): Promise<void> {
    await prisma.knowledgebaseStats.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        totalDocuments: stats.totalDocuments,
        totalChunks: stats.totalChunks,
        totalTokens: BigInt(stats.totalTokens),
        avgChunkSize: stats.totalChunks > 0 ? stats.totalTokens / stats.totalChunks : 0,
        lastIngestionAt: new Date(),
        lastIngestionDuration: duration,
        documentsProcessed: stats.documentsProcessed,
        errorsCount: stats.errorsCount
      },
      update: {
        totalDocuments: stats.totalDocuments,
        totalChunks: stats.totalChunks,
        totalTokens: BigInt(stats.totalTokens),
        avgChunkSize: stats.totalChunks > 0 ? stats.totalTokens / stats.totalChunks : 0,
        lastIngestionAt: new Date(),
        lastIngestionDuration: duration,
        documentsProcessed: stats.documentsProcessed,
        errorsCount: stats.errorsCount
      }
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const forceReindex = args.includes('--force')

  // Determine docs path
  const docsPath = path.resolve(__dirname, '../../docs/ai-knowledgebase')

  try {
    // Check if docs directory exists
    await fs.access(docsPath)
  } catch (error) {
    console.error(`❌ Documentation directory not found: ${docsPath}`)
    console.error('Please ensure the ai-knowledgebase directory exists')
    process.exit(1)
  }

  // Check environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required')
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  const ingester = new KnowledgebaseIngester(docsPath, forceReindex)

  try {
    await ingester.run()
    console.log('✅ Knowledge base ingestion completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Knowledge base ingestion failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { KnowledgebaseIngester }