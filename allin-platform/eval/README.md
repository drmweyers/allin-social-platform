# AI Support System Evaluation Framework

This directory contains the evaluation framework for testing and measuring the quality of the AllIN Platform AI support system. The framework includes both retrieval quality evaluation and answer generation quality assessment.

## Overview

The evaluation framework provides:

- **Retrieval Quality Testing**: Measures how well the RAG system retrieves relevant documentation
- **Answer Quality Assessment**: Evaluates the quality, accuracy, and helpfulness of AI-generated responses
- **Automated Scoring**: Uses both rule-based heuristics and optional GPT-4 evaluation
- **Comprehensive Reporting**: Generates detailed reports with actionable recommendations

## Files Structure

```
eval/
├── README.md                           # This file
├── retrieval-tests.yaml                # Test cases for document retrieval quality
├── answer-quality.yaml                 # Test cases for answer generation quality
├── results/                            # Generated evaluation reports
│   ├── retrieval-evaluation-report.json
│   ├── retrieval-evaluation-summary.md
│   ├── answer-evaluation-report.json
│   └── answer-evaluation-summary.md
└── scripts/ (in backend/scripts/)
    ├── evaluate-retrieval.ts           # Retrieval evaluation script
    └── evaluate-answers.ts             # Answer quality evaluation script
```

## Running Evaluations

### Prerequisites

1. **Environment Setup**: Ensure your `.env` file has the required API keys:
   ```bash
   OPENAI_API_KEY="sk-your-openai-key"        # Required for embeddings and evaluation
   DATABASE_URL="postgresql://..."           # Required for vector database access
   ```

2. **Knowledge Base**: Ensure the knowledge base is ingested:
   ```bash
   npm run ingest:kb
   ```

3. **Dependencies**: Install required packages:
   ```bash
   npm install
   ```

### Running All Evaluations

```bash
# Run both retrieval and answer quality evaluations
npm run test:ai
```

### Running Individual Evaluations

```bash
# Test retrieval quality only
npm run eval:retrieval

# Test answer generation quality only
npm run eval:answers
```

### Custom Test Files

```bash
# Run with custom test files
npm run eval:retrieval -- /path/to/custom-retrieval-tests.yaml
npm run eval:answers -- /path/to/custom-answer-tests.yaml
```

## Test Configuration

### Retrieval Tests (`retrieval-tests.yaml`)

Tests the quality of document retrieval from the knowledge base.

**Key Sections:**
- `test_config`: Global configuration for all tests
- `tests`: Array of individual test cases
- `evaluation_criteria`: Metrics and targets for evaluation
- `reporting`: Output format and content configuration

**Test Case Structure:**
```yaml
- id: "unique_test_identifier"
  query: "User query to test"
  expected_docs: ["60-troubleshooting.md"]  # Expected document matches
  expected_sections: ["Login Problems"]      # Expected section matches
  expected_keywords: ["password", "reset"]   # Keywords that should appear
  min_score: 0.8                            # Minimum similarity score
  category: "troubleshooting"               # Expected category
  description: "Test description"
```

**Evaluation Metrics:**
- **Precision**: Percentage of retrieved docs that are relevant
- **Recall**: Percentage of relevant docs that are retrieved
- **F1 Score**: Harmonic mean of precision and recall
- **Score Accuracy**: Quality of similarity scoring
- **Response Time**: Speed of retrieval

### Answer Quality Tests (`answer-quality.yaml`)

Tests the quality of AI-generated answers using retrieved context.

**Key Sections:**
- `test_config`: AI model configuration and timeouts
- `tests`: Individual answer quality test cases
- `evaluation_rubric`: Scoring criteria (1-5 scale)
- `confidence_calibration`: Confidence score analysis
- `reporting`: Report generation settings

**Test Case Structure:**
```yaml
- id: "unique_test_identifier"
  query: "User question to answer"
  expected_answer_elements:              # Key elements that should be covered
    - "Check email address"
    - "Try password reset"
  evaluation_criteria:                   # Which rubric criteria to apply
    - accuracy
    - completeness
    - clarity
    - actionability
  min_confidence: 0.8                   # Minimum confidence threshold
  category: "troubleshooting"           # Context category
  gold_standard: |                     # Optional gold standard answer
    Complete reference answer for comparison...
```

**Evaluation Rubric:**
- **Accuracy** (1-5): Factual correctness of information
- **Completeness** (1-5): How thoroughly the answer addresses the question
- **Clarity** (1-5): How clear and understandable the answer is
- **Actionability** (1-5): How actionable and practical the guidance is
- **Appropriateness** (1-5): Whether tone and content are appropriate

## Understanding Results

### Retrieval Evaluation Results

**Key Metrics:**
- **Pass Rate**: Percentage of tests that meet quality thresholds
- **Average Precision**: How many retrieved docs are relevant
- **Average Recall**: How many relevant docs are found
- **Category Accuracy**: How well category filtering works

**Interpreting Scores:**
- **Precision ≥ 0.8**: Excellent - very few irrelevant results
- **Precision 0.6-0.8**: Good - some irrelevant results
- **Precision < 0.6**: Poor - many irrelevant results

- **Recall ≥ 0.8**: Excellent - finds most relevant docs
- **Recall 0.6-0.8**: Good - finds many relevant docs
- **Recall < 0.6**: Poor - misses many relevant docs

### Answer Quality Results

**Key Metrics:**
- **Pass Rate**: Percentage of answers meeting quality standards
- **Average Score**: Overall quality score (1-5 scale)
- **Confidence Calibration**: How well confidence matches actual quality
- **Rubric Breakdown**: Performance on each evaluation criterion

**Interpreting Scores:**
- **Score ≥ 4.0**: Excellent answer quality
- **Score 3.0-4.0**: Good quality with room for improvement
- **Score < 3.0**: Poor quality, needs significant improvement

**Confidence Calibration:**
- **Good**: Confidence score closely matches actual quality
- **Overconfident**: High confidence but low quality answers
- **Underconfident**: Low confidence but high quality answers

## Common Issues and Solutions

### Low Retrieval Quality

**Problem**: Low precision (many irrelevant results)
**Solutions:**
- Review and improve document chunking strategy
- Enhance relevance scoring algorithm
- Clean up knowledge base content

**Problem**: Low recall (missing relevant docs)
**Solutions:**
- Expand knowledge base coverage
- Improve embedding quality
- Adjust similarity thresholds

### Poor Answer Quality

**Problem**: Low accuracy scores
**Solutions:**
- Improve knowledge base accuracy
- Enhance source citation methods
- Update system prompts for better fact-checking

**Problem**: Low completeness scores
**Solutions:**
- Increase context window size
- Improve retrieval to get more relevant context
- Enhance prompt engineering for comprehensive answers

**Problem**: Poor confidence calibration
**Solutions:**
- Review confidence scoring algorithm
- Analyze patterns in over/under-confident responses
- Adjust confidence calculation based on answer quality factors

### Performance Issues

**Problem**: Slow response times
**Solutions:**
- Optimize vector search indexes
- Implement response caching
- Consider model/embedding optimizations

**Problem**: High failure rates
**Solutions:**
- Review error logs for common failure patterns
- Improve error handling and fallback mechanisms
- Validate environment configuration

## Customizing Evaluations

### Adding New Test Cases

1. **For Retrieval Tests**: Add new test cases to `retrieval-tests.yaml`
   ```yaml
   - id: "new_test_case"
     query: "Your test query"
     expected_docs: ["relevant-file.md"]
     min_score: 0.8
     category: "your-category"
     description: "What this test validates"
   ```

2. **For Answer Quality**: Add to `answer-quality.yaml`
   ```yaml
   - id: "new_answer_test"
     query: "Question to test"
     expected_answer_elements:
       - "Key point 1"
       - "Key point 2"
     evaluation_criteria: ["accuracy", "clarity"]
     min_confidence: 0.8
     category: "test-category"
   ```

### Modifying Evaluation Criteria

1. **Adjust Thresholds**: Modify `min_score`, `min_confidence`, or pass/fail criteria
2. **Add New Rubric Items**: Extend the evaluation rubric with custom criteria
3. **Custom Scoring**: Modify the scoring algorithms in the evaluation scripts

### Advanced Configuration

**GPT-4 Evaluation**: Enable detailed GPT-4 evaluation for answer quality
```bash
export ENABLE_GPT4_EVALUATION=true
npm run eval:answers
```

**Custom Output**: Modify reporting formats and content in the test configuration files

## Continuous Integration

The evaluation framework integrates with GitHub Actions CI/CD:

- **On PR**: Runs basic retrieval tests
- **On Main Branch**: Runs full evaluation suite
- **Scheduled**: Weekly full evaluation runs

### CI Configuration

See `.github/workflows/ai-support-ci.yml` for the complete CI setup including:
- Automated knowledge base ingestion testing
- Retrieval quality validation
- Answer generation testing (without external API calls in CI)

## Best Practices

### Test Development
1. **Start Small**: Begin with a few high-confidence test cases
2. **Cover Edge Cases**: Include ambiguous queries and error scenarios
3. **Regular Updates**: Update tests as the knowledge base evolves
4. **Category Coverage**: Ensure all knowledge base categories are tested

### Quality Maintenance
1. **Regular Evaluation**: Run evaluations after knowledge base updates
2. **Trend Analysis**: Monitor quality trends over time
3. **Threshold Tuning**: Adjust quality thresholds based on user feedback
4. **Error Analysis**: Investigate and address systematic failures

### Performance Optimization
1. **Baseline Measurement**: Establish baseline metrics before optimizations
2. **Incremental Testing**: Test changes with small evaluation sets first
3. **A/B Testing**: Compare different approaches using evaluation metrics
4. **User Feedback Integration**: Correlate evaluation results with real user feedback

## Troubleshooting

### Common Error Messages

**"Failed to load test suite"**
- Check YAML syntax in test files
- Verify file paths are correct

**"Retrieval failed"**
- Ensure database is running and accessible
- Check OpenAI API key is valid
- Verify knowledge base is ingested

**"Answer generation failed"**
- Check OpenAI API rate limits
- Verify model permissions
- Review API key quotas

**"Evaluation timed out"**
- Increase timeout values in test configuration
- Check system resource availability
- Consider reducing test scope for debugging

### Debug Mode

Run evaluations with detailed logging:
```bash
DEBUG=true npm run eval:retrieval
DEBUG=true npm run eval:answers
```

### Validation Scripts

Validate test file format before running:
```bash
npx js-yaml eval/retrieval-tests.yaml
npx js-yaml eval/answer-quality.yaml
```

## Support

For issues with the evaluation framework:
1. Check the troubleshooting section above
2. Review error logs in the console output
3. Consult the main AI support system documentation
4. Contact the development team via internal support channels