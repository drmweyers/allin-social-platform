#!/usr/bin/env tsx

/**
 * Retrieval Evaluation Script
 *
 * Evaluates the quality of document retrieval against gold standard test cases.
 * Measures precision, recall, and relevance scoring accuracy.
 */

import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'
import { PrismaClient } from '@prisma/client'
import { RAGService } from '../src/services/rag.service'

const prisma = new PrismaClient()

interface RetrievalTest {
  id: string
  query: string
  expected_docs: string[]
  expected_sections?: string[]
  expected_keywords?: string[]
  min_score: number
  category?: string
  description: string
  expect_low_confidence?: boolean
}

interface RetrievalTestSuite {
  description: string
  version: string
  test_config: {
    vector_similarity_threshold: number
    max_results_to_evaluate: number
    timeout_seconds: number
  }
  tests: RetrievalTest[]
  evaluation_criteria: Record<string, any>
  reporting: {
    formats: string[]
    include_failed_queries: boolean
    include_score_distribution: boolean
    include_category_breakdown: boolean
  }
}

interface TestResult {
  test_id: string
  query: string
  expected_docs: string[]
  retrieved_docs: string[]
  precision: number
  recall: number
  f1_score: number
  avg_score: number
  min_score_met: boolean
  category_match: boolean
  keywords_found: string[]
  keywords_missing: string[]
  response_time_ms: number
  passed: boolean
  errors: string[]
}

interface EvaluationReport {
  summary: {
    total_tests: number
    passed_tests: number
    failed_tests: number
    pass_rate: number
    avg_precision: number
    avg_recall: number
    avg_f1: number
    avg_response_time: number
  }
  test_results: TestResult[]
  category_breakdown: Record<string, {
    tests: number
    passed: number
    avg_precision: number
    avg_recall: number
  }>
  recommendations: string[]
}

class RetrievalEvaluator {
  private ragService: RAGService
  private testSuite: RetrievalTestSuite

  constructor() {
    this.ragService = new RAGService()
  }

  async loadTestSuite(testFile: string): Promise<void> {
    try {
      const testContent = await fs.readFile(testFile, 'utf-8')
      this.testSuite = yaml.load(testContent) as RetrievalTestSuite
      console.log(`📋 Loaded ${this.testSuite.tests.length} retrieval tests`)
    } catch (error) {
      throw new Error(`Failed to load test suite: ${error.message}`)
    }
  }

  async runEvaluation(): Promise<EvaluationReport> {
    console.log('\n🔍 Starting Retrieval Evaluation...\n')

    const results: TestResult[] = []

    for (const test of this.testSuite.tests) {
      console.log(`Testing: ${test.id}`)
      const result = await this.runSingleTest(test)
      results.push(result)

      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${test.id}: P=${result.precision.toFixed(2)} R=${result.recall.toFixed(2)} F1=${result.f1_score.toFixed(2)}`)
    }

    return this.generateReport(results)
  }

  private async runSingleTest(test: RetrievalTest): Promise<TestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // Perform retrieval
      const retrieved = await this.ragService.retrieve({
        query: test.query,
        k: this.testSuite.test_config.max_results_to_evaluate,
        category: test.category,
        minScore: this.testSuite.test_config.vector_similarity_threshold
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // Extract document paths from results
      const retrievedDocs = retrieved.map(chunk => {
        // Extract filename from path
        const filename = chunk.path.split('/').pop() || chunk.path
        return filename
      })

      // Calculate metrics
      const precision = this.calculatePrecision(test.expected_docs, retrievedDocs)
      const recall = this.calculateRecall(test.expected_docs, retrievedDocs)
      const f1Score = this.calculateF1(precision, recall)

      // Check minimum score requirement
      const avgScore = retrieved.length > 0
        ? retrieved.reduce((sum, chunk) => sum + chunk.score, 0) / retrieved.length
        : 0
      const minScoreMet = avgScore >= test.min_score

      // Check category matching
      const categoryMatch = !test.category || retrieved.some(chunk =>
        chunk.category === test.category
      )

      // Check keyword presence
      const { found: keywordsFound, missing: keywordsMissing } =
        this.checkKeywords(test.expected_keywords || [], retrieved)

      // Determine if test passed
      const passed = precision >= 0.6 && recall >= 0.5 && minScoreMet && categoryMatch

      if (!passed) {
        if (precision < 0.6) errors.push(`Low precision: ${precision.toFixed(2)}`)
        if (recall < 0.5) errors.push(`Low recall: ${recall.toFixed(2)}`)
        if (!minScoreMet) errors.push(`Min score not met: ${avgScore.toFixed(2)}`)
        if (!categoryMatch) errors.push(`Category mismatch`)
      }

      return {
        test_id: test.id,
        query: test.query,
        expected_docs: test.expected_docs,
        retrieved_docs: retrievedDocs,
        precision,
        recall,
        f1_score: f1Score,
        avg_score: avgScore,
        min_score_met: minScoreMet,
        category_match: categoryMatch,
        keywords_found: keywordsFound,
        keywords_missing: keywordsMissing,
        response_time_ms: responseTime,
        passed,
        errors
      }

    } catch (error) {
      errors.push(`Retrieval failed: ${error.message}`)

      return {
        test_id: test.id,
        query: test.query,
        expected_docs: test.expected_docs,
        retrieved_docs: [],
        precision: 0,
        recall: 0,
        f1_score: 0,
        avg_score: 0,
        min_score_met: false,
        category_match: false,
        keywords_found: [],
        keywords_missing: test.expected_keywords || [],
        response_time_ms: Date.now() - startTime,
        passed: false,
        errors
      }
    }
  }

  private calculatePrecision(expected: string[], retrieved: string[]): number {
    if (retrieved.length === 0) return 0

    const relevantRetrieved = retrieved.filter(doc =>
      expected.some(expectedDoc => doc.includes(expectedDoc) || expectedDoc.includes(doc))
    )

    return relevantRetrieved.length / retrieved.length
  }

  private calculateRecall(expected: string[], retrieved: string[]): number {
    if (expected.length === 0) return 1

    const foundExpected = expected.filter(expectedDoc =>
      retrieved.some(doc => doc.includes(expectedDoc) || expectedDoc.includes(doc))
    )

    return foundExpected.length / expected.length
  }

  private calculateF1(precision: number, recall: number): number {
    if (precision + recall === 0) return 0
    return 2 * (precision * recall) / (precision + recall)
  }

  private checkKeywords(expectedKeywords: string[], retrieved: any[]): {
    found: string[]
    missing: string[]
  } {
    const content = retrieved.map(chunk => chunk.content.toLowerCase()).join(' ')

    const found = expectedKeywords.filter(keyword =>
      content.includes(keyword.toLowerCase())
    )

    const missing = expectedKeywords.filter(keyword =>
      !content.includes(keyword.toLowerCase())
    )

    return { found, missing }
  }

  private generateReport(results: TestResult[]): EvaluationReport {
    const totalTests = results.length
    const passedTests = results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests

    const avgPrecision = results.reduce((sum, r) => sum + r.precision, 0) / totalTests
    const avgRecall = results.reduce((sum, r) => sum + r.recall, 0) / totalTests
    const avgF1 = results.reduce((sum, r) => sum + r.f1_score, 0) / totalTests
    const avgResponseTime = results.reduce((sum, r) => sum + r.response_time_ms, 0) / totalTests

    // Category breakdown
    const categoryBreakdown: Record<string, any> = {}

    for (const test of this.testSuite.tests) {
      const category = test.category || 'general'
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          tests: 0,
          passed: 0,
          precisions: [],
          recalls: []
        }
      }

      const result = results.find(r => r.test_id === test.id)
      if (result) {
        categoryBreakdown[category].tests++
        if (result.passed) categoryBreakdown[category].passed++
        categoryBreakdown[category].precisions.push(result.precision)
        categoryBreakdown[category].recalls.push(result.recall)
      }
    }

    // Calculate averages for each category
    for (const category in categoryBreakdown) {
      const data = categoryBreakdown[category]
      data.avg_precision = data.precisions.reduce((a: number, b: number) => a + b, 0) / data.precisions.length
      data.avg_recall = data.recalls.reduce((a: number, b: number) => a + b, 0) / data.recalls.length
      delete data.precisions
      delete data.recalls
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(results, avgPrecision, avgRecall)

    return {
      summary: {
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: failedTests,
        pass_rate: passedTests / totalTests,
        avg_precision: avgPrecision,
        avg_recall: avgRecall,
        avg_f1: avgF1,
        avg_response_time: avgResponseTime
      },
      test_results: results,
      category_breakdown: categoryBreakdown,
      recommendations
    }
  }

  private generateRecommendations(results: TestResult[], avgPrecision: number, avgRecall: number): string[] {
    const recommendations: string[] = []

    if (avgPrecision < 0.7) {
      recommendations.push("Consider improving document chunking strategy to reduce irrelevant retrievals")
      recommendations.push("Review and enhance the relevance scoring algorithm")
    }

    if (avgRecall < 0.6) {
      recommendations.push("Expand the knowledge base with more comprehensive documentation")
      recommendations.push("Review embedding quality - consider fine-tuning or different embedding models")
    }

    const highResponseTime = results.filter(r => r.response_time_ms > 2000).length
    if (highResponseTime > results.length * 0.2) {
      recommendations.push("Optimize vector search performance - consider indexing improvements")
    }

    const categoryFailures = results.filter(r => !r.category_match).length
    if (categoryFailures > 0) {
      recommendations.push("Improve category classification in document ingestion")
    }

    return recommendations
  }

  async saveReport(report: EvaluationReport, outputDir: string): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true })

    // Save JSON report
    await fs.writeFile(
      path.join(outputDir, 'retrieval-evaluation-report.json'),
      JSON.stringify(report, null, 2)
    )

    // Save markdown summary
    const markdown = this.generateMarkdownReport(report)
    await fs.writeFile(
      path.join(outputDir, 'retrieval-evaluation-summary.md'),
      markdown
    )

    console.log(`\n📊 Reports saved to ${outputDir}`)
  }

  private generateMarkdownReport(report: EvaluationReport): string {
    const { summary, category_breakdown, recommendations } = report

    return `# Retrieval Evaluation Report

## Summary
- **Total Tests**: ${summary.total_tests}
- **Passed**: ${summary.passed_tests} (${(summary.pass_rate * 100).toFixed(1)}%)
- **Failed**: ${summary.failed_tests}
- **Average Precision**: ${summary.avg_precision.toFixed(3)}
- **Average Recall**: ${summary.avg_recall.toFixed(3)}
- **Average F1 Score**: ${summary.avg_f1.toFixed(3)}
- **Average Response Time**: ${summary.avg_response_time.toFixed(0)}ms

## Category Breakdown
${Object.entries(category_breakdown).map(([category, data]: [string, any]) => `
### ${category}
- Tests: ${data.tests}
- Passed: ${data.passed} (${((data.passed / data.tests) * 100).toFixed(1)}%)
- Avg Precision: ${data.avg_precision.toFixed(3)}
- Avg Recall: ${data.avg_recall.toFixed(3)}
`).join('')}

## Recommendations
${recommendations.map(rec => `- ${rec}`).join('\n')}

## Failed Tests
${report.test_results.filter(r => !r.passed).map(result => `
### ${result.test_id}
- **Query**: ${result.query}
- **Precision**: ${result.precision.toFixed(3)}
- **Recall**: ${result.recall.toFixed(3)}
- **Errors**: ${result.errors.join(', ')}
`).join('')}
`
  }
}

async function main() {
  const evaluator = new RetrievalEvaluator()

  try {
    // Load test suite
    const testFile = process.argv[2] || path.join(__dirname, '../../eval/retrieval-tests.yaml')
    await evaluator.loadTestSuite(testFile)

    // Run evaluation
    const report = await evaluator.runEvaluation()

    // Save results
    const outputDir = path.join(__dirname, '../../eval/results')
    await evaluator.saveReport(report, outputDir)

    // Print summary
    console.log('\n📊 Evaluation Complete!')
    console.log(`Pass Rate: ${(report.summary.pass_rate * 100).toFixed(1)}%`)
    console.log(`Avg Precision: ${report.summary.avg_precision.toFixed(3)}`)
    console.log(`Avg Recall: ${report.summary.avg_recall.toFixed(3)}`)

    if (report.summary.pass_rate < 0.8) {
      console.log('\n⚠️  Consider reviewing failed tests and improving the knowledge base')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Evaluation failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}