#!/usr/bin/env tsx

/**
 * Answer Quality Evaluation Script
 *
 * Evaluates the quality of AI-generated answers against gold standard responses.
 * Uses both automated metrics and GPT-4 based evaluation.
 */

import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'
import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import { RAGService } from '../src/services/rag.service'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface AnswerTest {
  id: string
  query: string
  expected_answer_elements: string[]
  evaluation_criteria: string[]
  min_confidence: number
  category: string
  context_should_include?: string[]
  gold_standard?: string
  expect_clarification_request?: boolean
}

interface AnswerTestSuite {
  description: string
  version: string
  test_config: {
    model: string
    max_tokens: number
    temperature: number
    timeout_seconds: number
    evaluation_model: string
  }
  tests: AnswerTest[]
  evaluation_rubric: Record<string, any>
  confidence_calibration: any
  response_time_targets: Record<string, string>
  reporting: any
}

interface AnswerTestResult {
  test_id: string
  query: string
  generated_answer: string
  confidence: number
  rubric_scores: Record<string, number>
  overall_score: number
  elements_covered: string[]
  elements_missing: string[]
  confidence_calibrated: boolean
  response_time_ms: number
  passed: boolean
  gpt4_evaluation?: {
    score: number
    feedback: string
    strengths: string[]
    weaknesses: string[]
  }
  errors: string[]
}

interface AnswerEvaluationReport {
  summary: {
    total_tests: number
    passed_tests: number
    failed_tests: number
    pass_rate: number
    avg_overall_score: number
    avg_confidence: number
    confidence_calibration_score: number
    avg_response_time: number
  }
  rubric_analysis: Record<string, {
    avg_score: number
    distribution: Record<number, number>
  }>
  test_results: AnswerTestResult[]
  category_breakdown: Record<string, any>
  recommendations: string[]
}

class AnswerEvaluator {
  private ragService: RAGService
  private testSuite: AnswerTestSuite

  constructor() {
    this.ragService = new RAGService()
  }

  async loadTestSuite(testFile: string): Promise<void> {
    try {
      const testContent = await fs.readFile(testFile, 'utf-8')
      this.testSuite = yaml.load(testContent) as AnswerTestSuite
      console.log(`📋 Loaded ${this.testSuite.tests.length} answer quality tests`)
    } catch (error) {
      throw new Error(`Failed to load test suite: ${error.message}`)
    }
  }

  async runEvaluation(): Promise<AnswerEvaluationReport> {
    console.log('\n💬 Starting Answer Quality Evaluation...\n')

    const results: AnswerTestResult[] = []

    for (const test of this.testSuite.tests) {
      console.log(`Testing: ${test.id}`)
      const result = await this.runSingleTest(test)
      results.push(result)

      const status = result.passed ? '✅' : '❌'
      console.log(`${status} ${test.id}: Score=${result.overall_score.toFixed(2)} Conf=${result.confidence.toFixed(2)}`)
    }

    return this.generateReport(results)
  }

  private async runSingleTest(test: AnswerTest): Promise<AnswerTestResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // Generate answer using RAG service
      const mockUserTools = {
        escalateToHuman: async () => ({ escalated: true, ticketId: 'mock' }),
        createSupportTicket: async () => ({ ticketId: 'mock', status: 'created' }),
        logSupportQuery: async () => ({ logged: true })
      }

      const answerResponse = await this.ragService.answer({
        query: test.query,
        userId: 'eval-test-user',
        userRole: 'ADMIN',
        featureContext: test.category
      }, mockUserTools)

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // Evaluate answer against rubric
      const rubricScores = await this.evaluateAgainstRubric(test, answerResponse.answer)

      // Check element coverage
      const { covered, missing } = this.checkElementCoverage(
        test.expected_answer_elements,
        answerResponse.answer
      )

      // Calculate overall score
      const overallScore = Object.values(rubricScores).reduce((sum, score) => sum + score, 0) / Object.keys(rubricScores).length

      // Check confidence calibration
      const confidenceCalibrated = this.checkConfidenceCalibration(
        answerResponse.confidence,
        overallScore,
        test.min_confidence
      )

      // Determine if test passed
      const passed = overallScore >= 3.5 && // 3.5/5 minimum score
                   answerResponse.confidence >= test.min_confidence &&
                   covered.length >= test.expected_answer_elements.length * 0.7 // Cover at least 70% of elements

      if (!passed) {
        if (overallScore < 3.5) errors.push(`Low overall score: ${overallScore.toFixed(2)}`)
        if (answerResponse.confidence < test.min_confidence) errors.push(`Low confidence: ${answerResponse.confidence.toFixed(2)}`)
        if (covered.length < test.expected_answer_elements.length * 0.7) {
          errors.push(`Missing key elements: ${missing.join(', ')}`)
        }
      }

      // Optional GPT-4 evaluation for detailed feedback
      let gpt4Evaluation
      if (test.gold_standard && process.env.ENABLE_GPT4_EVALUATION === 'true') {
        gpt4Evaluation = await this.runGPT4Evaluation(test, answerResponse.answer)
      }

      return {
        test_id: test.id,
        query: test.query,
        generated_answer: answerResponse.answer,
        confidence: answerResponse.confidence,
        rubric_scores: rubricScores,
        overall_score: overallScore,
        elements_covered: covered,
        elements_missing: missing,
        confidence_calibrated: confidenceCalibrated,
        response_time_ms: responseTime,
        passed,
        gpt4_evaluation,
        errors
      }

    } catch (error) {
      errors.push(`Answer generation failed: ${error.message}`)

      return {
        test_id: test.id,
        query: test.query,
        generated_answer: '',
        confidence: 0,
        rubric_scores: {},
        overall_score: 0,
        elements_covered: [],
        elements_missing: test.expected_answer_elements,
        confidence_calibrated: false,
        response_time_ms: Date.now() - startTime,
        passed: false,
        errors
      }
    }
  }

  private async evaluateAgainstRubric(test: AnswerTest, answer: string): Promise<Record<string, number>> {
    const scores: Record<string, number> = {}

    for (const criterion of test.evaluation_criteria) {
      if (this.testSuite.evaluation_rubric[criterion]) {
        scores[criterion] = await this.scoreCriterion(criterion, answer, test)
      }
    }

    return scores
  }

  private async scoreCriterion(criterion: string, answer: string, test: AnswerTest): Promise<number> {
    // Automated scoring based on heuristics
    switch (criterion) {
      case 'accuracy':
        return this.scoreAccuracy(answer, test)
      case 'completeness':
        return this.scoreCompleteness(answer, test)
      case 'clarity':
        return this.scoreClarity(answer)
      case 'actionability':
        return this.scoreActionability(answer)
      case 'appropriateness':
        return this.scoreAppropriateness(answer, test)
      default:
        return 3 // Default neutral score
    }
  }

  private scoreAccuracy(answer: string, test: AnswerTest): number {
    // Check for factual accuracy indicators
    const accuracyIndicators = [
      'specific steps',
      'correct procedure',
      'proper method',
      'accurate information'
    ]

    const inaccuracyWarnings = [
      'might work',
      'possibly',
      'uncertain',
      'not sure'
    ]

    const hasAccuracyIndicators = accuracyIndicators.some(indicator =>
      answer.toLowerCase().includes(indicator)
    )

    const hasInaccuracyWarnings = inaccuracyWarnings.some(warning =>
      answer.toLowerCase().includes(warning)
    )

    if (hasAccuracyIndicators && !hasInaccuracyWarnings) return 5
    if (hasAccuracyIndicators || !hasInaccuracyWarnings) return 4
    if (!hasInaccuracyWarnings) return 3
    return 2
  }

  private scoreCompleteness(answer: string, test: AnswerTest): number {
    const elementsCovered = test.expected_answer_elements.filter(element =>
      answer.toLowerCase().includes(element.toLowerCase())
    ).length

    const coverageRatio = elementsCovered / test.expected_answer_elements.length

    if (coverageRatio >= 0.9) return 5
    if (coverageRatio >= 0.7) return 4
    if (coverageRatio >= 0.5) return 3
    if (coverageRatio >= 0.3) return 2
    return 1
  }

  private scoreClarity(answer: string): number {
    // Heuristics for clarity
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = answer.length / sentences.length

    const hasStructure = answer.includes('\n') || answer.includes('1.') || answer.includes('-')
    const hasNumbers = /\d+\./.test(answer) // Numbered lists
    const hasBullets = answer.includes('- ') || answer.includes('• ')

    let score = 3 // Base score

    if (hasStructure) score += 1
    if (hasNumbers || hasBullets) score += 0.5
    if (avgSentenceLength < 100) score += 0.5 // Not too verbose

    return Math.min(5, Math.max(1, Math.round(score)))
  }

  private scoreActionability(answer: string): number {
    const actionableIndicators = [
      'step',
      'click',
      'go to',
      'navigate',
      'select',
      'enter',
      'follow these',
      'do this',
      'try',
      'check'
    ]

    const actionableCount = actionableIndicators.filter(indicator =>
      answer.toLowerCase().includes(indicator)
    ).length

    if (actionableCount >= 5) return 5
    if (actionableCount >= 3) return 4
    if (actionableCount >= 2) return 3
    if (actionableCount >= 1) return 2
    return 1
  }

  private scoreAppropriateness(answer: string, test: AnswerTest): number {
    // Check for appropriate tone and content
    const professionalTone = !answer.toLowerCase().includes('whatever') &&
                           !answer.toLowerCase().includes('just figure it out') &&
                           !answer.toLowerCase().includes('i don\'t know')

    const contextAppropriate = test.category === 'security' ?
      answer.toLowerCase().includes('security') || answer.toLowerCase().includes('safe') :
      true

    if (professionalTone && contextAppropriate) return 5
    if (professionalTone) return 4
    return 2
  }

  private checkElementCoverage(expectedElements: string[], answer: string): {
    covered: string[]
    missing: string[]
  } {
    const answerLower = answer.toLowerCase()

    const covered = expectedElements.filter(element =>
      answerLower.includes(element.toLowerCase())
    )

    const missing = expectedElements.filter(element =>
      !answerLower.includes(element.toLowerCase())
    )

    return { covered, missing }
  }

  private checkConfidenceCalibration(confidence: number, actualScore: number, minConfidence: number): boolean {
    // Good calibration means high confidence correlates with high quality
    const scoreRatio = actualScore / 5 // Normalize to 0-1
    const confidenceDiff = Math.abs(confidence - scoreRatio)

    return confidenceDiff < 0.3 && confidence >= minConfidence
  }

  private async runGPT4Evaluation(test: AnswerTest, answer: string): Promise<{
    score: number
    feedback: string
    strengths: string[]
    weaknesses: string[]
  }> {
    try {
      const prompt = `
Evaluate this AI-generated answer against the gold standard response.

Query: ${test.query}

Generated Answer:
${answer}

Gold Standard:
${test.gold_standard}

Please evaluate on a scale of 1-5 and provide:
1. Overall score (1-5)
2. Brief feedback paragraph
3. 2-3 strengths
4. 2-3 areas for improvement

Format your response as JSON:
{
  "score": number,
  "feedback": "string",
  "strengths": ["string1", "string2"],
  "weaknesses": ["string1", "string2"]
}
`

      const response = await openai.chat.completions.create({
        model: this.testSuite.test_config.evaluation_model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1000
      })

      const evaluation = JSON.parse(response.choices[0].message.content || '{}')
      return evaluation

    } catch (error) {
      console.warn(`GPT-4 evaluation failed for ${test.id}:`, error.message)
      return {
        score: 0,
        feedback: 'Evaluation failed',
        strengths: [],
        weaknesses: ['Evaluation error']
      }
    }
  }

  private generateReport(results: AnswerTestResult[]): AnswerEvaluationReport {
    const totalTests = results.length
    const passedTests = results.filter(r => r.passed).length
    const failedTests = totalTests - passedTests

    const avgOverallScore = results.reduce((sum, r) => sum + r.overall_score, 0) / totalTests
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalTests
    const avgResponseTime = results.reduce((sum, r) => sum + r.response_time_ms, 0) / totalTests

    // Confidence calibration analysis
    const calibratedResults = results.filter(r => r.confidence_calibrated).length
    const confidenceCalibrationScore = calibratedResults / totalTests

    // Rubric analysis
    const rubricAnalysis: Record<string, any> = {}
    const allCriteria = [...new Set(results.flatMap(r => Object.keys(r.rubric_scores)))]

    for (const criterion of allCriteria) {
      const scores = results
        .filter(r => r.rubric_scores[criterion] !== undefined)
        .map(r => r.rubric_scores[criterion])

      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

      const distribution: Record<number, number> = {}
      for (let i = 1; i <= 5; i++) {
        distribution[i] = scores.filter(score => Math.round(score) === i).length
      }

      rubricAnalysis[criterion] = {
        avg_score: avgScore,
        distribution
      }
    }

    // Category breakdown
    const categoryBreakdown: Record<string, any> = {}
    for (const test of this.testSuite.tests) {
      const category = test.category
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          tests: 0,
          passed: 0,
          scores: []
        }
      }

      const result = results.find(r => r.test_id === test.id)
      if (result) {
        categoryBreakdown[category].tests++
        if (result.passed) categoryBreakdown[category].passed++
        categoryBreakdown[category].scores.push(result.overall_score)
      }
    }

    // Calculate averages for each category
    for (const category in categoryBreakdown) {
      const data = categoryBreakdown[category]
      data.avg_score = data.scores.reduce((a: number, b: number) => a + b, 0) / data.scores.length
      data.pass_rate = data.passed / data.tests
      delete data.scores
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(results, rubricAnalysis, avgOverallScore)

    return {
      summary: {
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: failedTests,
        pass_rate: passedTests / totalTests,
        avg_overall_score: avgOverallScore,
        avg_confidence: avgConfidence,
        confidence_calibration_score: confidenceCalibrationScore,
        avg_response_time: avgResponseTime
      },
      rubric_analysis: rubricAnalysis,
      test_results: results,
      category_breakdown: categoryBreakdown,
      recommendations
    }
  }

  private generateRecommendations(
    results: AnswerTestResult[],
    rubricAnalysis: Record<string, any>,
    avgScore: number
  ): string[] {
    const recommendations: string[] = []

    if (avgScore < 4.0) {
      recommendations.push("Overall answer quality needs improvement - consider enhancing the RAG system prompts")
    }

    // Analyze specific rubric weaknesses
    for (const [criterion, analysis] of Object.entries(rubricAnalysis)) {
      if (analysis.avg_score < 3.5) {
        switch (criterion) {
          case 'accuracy':
            recommendations.push("Improve factual accuracy by enhancing knowledge base content and citations")
            break
          case 'completeness':
            recommendations.push("Increase answer completeness by improving context retrieval and prompt engineering")
            break
          case 'clarity':
            recommendations.push("Enhance answer clarity with better structuring and formatting in responses")
            break
          case 'actionability':
            recommendations.push("Make answers more actionable by including specific steps and procedures")
            break
        }
      }
    }

    // Response time analysis
    const slowResponses = results.filter(r => r.response_time_ms > 8000).length
    if (slowResponses > results.length * 0.2) {
      recommendations.push("Optimize response times - consider caching strategies or model optimization")
    }

    // Confidence calibration
    const calibrationScore = results.filter(r => r.confidence_calibrated).length / results.length
    if (calibrationScore < 0.7) {
      recommendations.push("Improve confidence calibration - review confidence scoring algorithm")
    }

    return recommendations
  }

  async saveReport(report: AnswerEvaluationReport, outputDir: string): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true })

    // Save JSON report
    await fs.writeFile(
      path.join(outputDir, 'answer-evaluation-report.json'),
      JSON.stringify(report, null, 2)
    )

    // Save markdown summary
    const markdown = this.generateMarkdownReport(report)
    await fs.writeFile(
      path.join(outputDir, 'answer-evaluation-summary.md'),
      markdown
    )

    console.log(`\n📊 Reports saved to ${outputDir}`)
  }

  private generateMarkdownReport(report: AnswerEvaluationReport): string {
    const { summary, rubric_analysis, category_breakdown, recommendations } = report

    return `# Answer Quality Evaluation Report

## Summary
- **Total Tests**: ${summary.total_tests}
- **Passed**: ${summary.passed_tests} (${(summary.pass_rate * 100).toFixed(1)}%)
- **Failed**: ${summary.failed_tests}
- **Average Score**: ${summary.avg_overall_score.toFixed(2)}/5
- **Average Confidence**: ${summary.avg_confidence.toFixed(2)}
- **Confidence Calibration**: ${(summary.confidence_calibration_score * 100).toFixed(1)}%
- **Average Response Time**: ${summary.avg_response_time.toFixed(0)}ms

## Rubric Analysis
${Object.entries(rubric_analysis).map(([criterion, data]: [string, any]) => `
### ${criterion}
- Average Score: ${data.avg_score.toFixed(2)}/5
- Distribution: ${Object.entries(data.distribution).map(([score, count]) => `${score}⭐:${count}`).join(' ')}
`).join('')}

## Category Breakdown
${Object.entries(category_breakdown).map(([category, data]: [string, any]) => `
### ${category}
- Tests: ${data.tests}
- Passed: ${data.passed} (${(data.pass_rate * 100).toFixed(1)}%)
- Avg Score: ${data.avg_score.toFixed(2)}/5
`).join('')}

## Recommendations
${recommendations.map(rec => `- ${rec}`).join('\n')}

## Failed Tests
${report.test_results.filter(r => !r.passed).map(result => `
### ${result.test_id}
- **Query**: ${result.query}
- **Score**: ${result.overall_score.toFixed(2)}/5
- **Missing Elements**: ${result.elements_missing.join(', ')}
- **Errors**: ${result.errors.join(', ')}
`).join('')}
`
  }
}

async function main() {
  const evaluator = new AnswerEvaluator()

  try {
    // Load test suite
    const testFile = process.argv[2] || path.join(__dirname, '../../eval/answer-quality.yaml')
    await evaluator.loadTestSuite(testFile)

    // Run evaluation
    const report = await evaluator.runEvaluation()

    // Save results
    const outputDir = path.join(__dirname, '../../eval/results')
    await evaluator.saveReport(report, outputDir)

    // Print summary
    console.log('\n📊 Answer Quality Evaluation Complete!')
    console.log(`Pass Rate: ${(report.summary.pass_rate * 100).toFixed(1)}%`)
    console.log(`Avg Score: ${report.summary.avg_overall_score.toFixed(2)}/5`)
    console.log(`Confidence Calibration: ${(report.summary.confidence_calibration_score * 100).toFixed(1)}%`)

    if (report.summary.pass_rate < 0.8 || report.summary.avg_overall_score < 4.0) {
      console.log('\n⚠️  Consider reviewing failed tests and improving answer generation')
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