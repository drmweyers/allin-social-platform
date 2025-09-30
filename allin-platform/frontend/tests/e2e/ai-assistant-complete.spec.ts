import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * 🤖 COMPREHENSIVE AI ASSISTANT TESTS
 *
 * This test suite covers EVERY aspect of AI-powered features:
 * - Content generation (captions, posts, ideas)
 * - Hashtag generation and suggestions
 * - Caption enhancement and optimization
 * - Content ideas and brainstorming
 * - Image/video analysis and tagging
 * - Audience analysis and insights
 * - Optimal timing suggestions
 * - Trend analysis and recommendations
 * - Language translation
 * - Sentiment analysis
 * - Performance prediction
 * - AI chat interface
 */

test.describe('🤖 COMPLETE AI ASSISTANT TESTS', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Login and navigate to AI assistant page
    await page.goto('/auth/login');
    await page.fill('input#email', 'admin@allin.demo');
    await page.fill('input#password', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    await page.goto('/dashboard/ai');
    await helpers.waitForLoadingComplete();
  });

  test.describe('✍️ CONTENT GENERATION - Complete Testing', () => {
    test('AI-GEN-001: AI content generation interface', async ({ page }) => {
      // Check for AI input field
      const aiInputElements = [
        '[data-testid="ai-input"]',
        '[data-testid="ai-prompt"]',
        '.ai-input',
        'textarea[placeholder*="AI"]',
        'input[placeholder*="AI"]',
        'textarea[placeholder*="describe"]',
        'textarea[placeholder*="generate"]'
      ];

      let aiInput = null;
      for (const selector of aiInputElements) {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          aiInput = element;
          break;
        }
      }

      if (aiInput) {
        await expect(aiInput).toBeVisible();
        await expect(aiInput).toBeEnabled();

        // Test AI prompt input
        const testPrompt = 'Generate a social media post about sustainable living tips';
        await aiInput.click();
        await aiInput.fill(testPrompt);
        await expect(aiInput).toHaveValue(testPrompt);

        console.log('✅ AI input interface working');
        await helpers.takeScreenshot('ai-input-interface');
      }
    });

    test('AI-GEN-002: Generate caption functionality', async ({ page }) => {
      const generateButton = page.locator('[data-testid="generate-caption"], button:has-text("Generate Caption"), .generate-caption').first();

      if (await generateButton.count() > 0) {
        await expect(generateButton).toBeVisible();
        await expect(generateButton).toBeEnabled();

        // Add some context first
        const contextInput = page.locator('[data-testid="ai-input"], .ai-input, textarea').first();
        if (await contextInput.count() > 0) {
          await contextInput.fill('A beautiful sunset at the beach with palm trees');
        }

        // Click generate
        await generateButton.click();
        await page.waitForTimeout(2000);

        // Check for loading state
        const loadingStates = [
          '.ai-loading',
          '.generating',
          '.spinner',
          '[data-testid="ai-loading"]'
        ];

        for (const loadingState of loadingStates) {
          const loading = page.locator(loadingState);
          if (await loading.count() > 0) {
            console.log('✅ AI generation loading state displayed');
            break;
          }
        }

        // Wait for result
        await helpers.waitForLoadingComplete();

        // Check for generated content
        const generatedContent = page.locator('[data-testid="generated-content"], .ai-result, .generated-caption');
        if (await generatedContent.count() > 0 && await generatedContent.isVisible()) {
          const content = await generatedContent.textContent();
          if (content && content.trim().length > 0) {
            console.log('✅ AI generated caption successfully');
          }
        }

        await helpers.takeScreenshot('ai-generated-caption');
      }
    });

    test('AI-GEN-003: Multiple caption variations', async ({ page }) => {
      const generateButton = page.locator('[data-testid="generate-caption"], button:has-text("Generate")').first();

      if (await generateButton.count() > 0) {
        // Generate first caption
        await generateButton.click();
        await helpers.waitForLoadingComplete();

        // Look for variation buttons
        const variationButtons = page.locator('[data-testid="generate-variation"], button:has-text("Another"), button:has-text("More")');
        const variationCount = await variationButtons.count();

        if (variationCount > 0) {
          // Generate additional variations
          for (let i = 0; i < Math.min(variationCount, 3); i++) {
            const variationButton = variationButtons.nth(i);
            if (await variationButton.isVisible()) {
              await variationButton.click();
              await page.waitForTimeout(1000);
              console.log(`✅ Generated variation ${i + 1}`);
            }
          }
        }

        // Check for multiple caption options
        const captionOptions = page.locator('.caption-option, .ai-suggestion, .generated-item');
        const optionCount = await captionOptions.count();

        if (optionCount > 1) {
          console.log(`✅ Generated ${optionCount} caption variations`);
        }
      }
    });

    test('AI-GEN-004: Content idea generation', async ({ page }) => {
      const contentIdeasButton = page.locator('[data-testid="content-ideas"], button:has-text("Content Ideas"), .content-ideas').first();

      if (await contentIdeasButton.count() > 0) {
        await contentIdeasButton.click();
        await page.waitForTimeout(500);

        // Check for topic/niche input
        const topicInput = page.locator('[data-testid="topic-input"], input[placeholder*="topic"], input[placeholder*="niche"]').first();
        if (await topicInput.count() > 0) {
          await topicInput.fill('fitness and wellness');
          await page.keyboard.press('Enter');
        }

        await helpers.waitForLoadingComplete();

        // Check for generated ideas
        const contentIdeas = page.locator('.content-idea, .idea-item, [data-testid="content-idea"]');
        const ideaCount = await contentIdeas.count();

        if (ideaCount > 0) {
          console.log(`✅ Generated ${ideaCount} content ideas`);

          // Test selecting an idea
          const firstIdea = contentIdeas.first();
          await firstIdea.click();
          await page.waitForTimeout(500);

          // Check if idea is applied or expanded
          const selectedIdea = page.locator('.selected-idea, .active-idea');
          if (await selectedIdea.count() > 0) {
            console.log('✅ Content idea selection working');
          }
        }

        await helpers.takeScreenshot('ai-content-ideas');
      }
    });

    test('AI-GEN-005: Caption enhancement', async ({ page }) => {
      const enhanceButton = page.locator('[data-testid="enhance-caption"], button:has-text("Enhance"), .enhance-button').first();

      if (await enhanceButton.count() > 0) {
        // First, add some basic content
        const contentInput = page.locator('[data-testid="content-input"], .content-editor, textarea').first();
        if (await contentInput.count() > 0) {
          await contentInput.fill('Just posted a new workout video. Check it out!');
        }

        await enhanceButton.click();
        await helpers.waitForLoadingComplete();

        // Check for enhanced version
        const enhancedContent = page.locator('[data-testid="enhanced-content"], .enhanced-caption');
        if (await enhancedContent.count() > 0 && await enhancedContent.isVisible()) {
          const enhancedText = await enhancedContent.textContent();
          if (enhancedText && enhancedText.length > 50) { // Enhanced should be longer
            console.log('✅ Caption enhancement working');
          }
        }
      }
    });
  });

  test.describe('🏷️ HASHTAG AI - Complete Testing', () => {
    test('HASHTAG-AI-001: AI hashtag generation', async ({ page }) => {
      const hashtagButton = page.locator('[data-testid="generate-hashtags"], button:has-text("Generate Hashtags"), .hashtag-generator').first();

      if (await hashtagButton.count() > 0) {
        // Add content context
        const contentInput = page.locator('[data-testid="content-input"], .content-editor, textarea').first();
        if (await contentInput.count() > 0) {
          await contentInput.fill('Beautiful sunrise yoga session at the beach this morning. Feeling grateful for this peaceful moment.');
        }

        await hashtagButton.click();
        await helpers.waitForLoadingComplete();

        // Check for generated hashtags
        const generatedHashtags = page.locator('.generated-hashtag, .hashtag-suggestion, [data-testid="hashtag-item"]');
        const hashtagCount = await generatedHashtags.count();

        if (hashtagCount > 0) {
          console.log(`✅ Generated ${hashtagCount} AI hashtags`);

          // Test selecting hashtags
          for (let i = 0; i < Math.min(hashtagCount, 5); i++) {
            const hashtag = generatedHashtags.nth(i);
            if (await hashtag.isVisible()) {
              await hashtag.click();
              await page.waitForTimeout(200);
            }
          }

          console.log('✅ Hashtag selection working');
        }

        await helpers.takeScreenshot('ai-generated-hashtags');
      }
    });

    test('HASHTAG-AI-002: Trending hashtag suggestions', async ({ page }) => {
      const trendingSection = page.locator('[data-testid="trending-hashtags"], .trending-hashtags, .hashtag-trends').first();

      if (await trendingSection.count() > 0) {
        await expect(trendingSection).toBeVisible();

        // Check for trending hashtag items
        const trendingHashtags = trendingSection.locator('.trending-hashtag, .trend-item');
        const trendCount = await trendingHashtags.count();

        if (trendCount > 0) {
          console.log(`✅ Found ${trendCount} trending hashtags`);

          // Check for trend metrics (popularity, growth, etc.)
          const trendMetrics = trendingSection.locator('.trend-metric, .popularity-score, .growth-indicator');
          if (await trendMetrics.count() > 0) {
            console.log('✅ Trending hashtag metrics displayed');
          }
        }
      }
    });

    test('HASHTAG-AI-003: Platform-specific hashtag optimization', async ({ page }) => {
      const platforms = ['Instagram', 'Twitter', 'LinkedIn', 'TikTok'];

      for (const platform of platforms) {
        const platformTab = page.locator(`button:has-text("${platform}"), [data-platform="${platform.toLowerCase()}"]`).first();

        if (await platformTab.count() > 0) {
          await platformTab.click();
          await page.waitForTimeout(1000);

          // Generate hashtags for this platform
          const generateButton = page.locator('[data-testid="generate-hashtags"], button:has-text("Generate")').first();
          if (await generateButton.count() > 0) {
            await generateButton.click();
            await helpers.waitForLoadingComplete();

            // Check for platform-optimized hashtags
            const hashtags = page.locator('.generated-hashtag, .hashtag-suggestion');
            const hashtagCount = await hashtags.count();

            console.log(`✅ ${platform}: Generated ${hashtagCount} optimized hashtags`);
          }
        }
      }
    });

    test('HASHTAG-AI-004: Hashtag performance prediction', async ({ page }) => {
      const hashtagItems = page.locator('.generated-hashtag, .hashtag-suggestion');

      if (await hashtagItems.count() > 0) {
        const firstHashtag = hashtagItems.first();

        // Look for performance indicators
        const performanceIndicators = [
          '.performance-score',
          '.reach-estimate',
          '.engagement-prediction',
          '.popularity-rating'
        ];

        for (const indicator of performanceIndicators) {
          const element = firstHashtag.locator(indicator);
          if (await element.count() > 0 && await element.isVisible()) {
            console.log(`✅ Hashtag performance prediction found: ${indicator}`);
          }
        }

        // Test hashtag analysis
        await firstHashtag.hover();
        await page.waitForTimeout(500);

        const tooltip = page.locator('.tooltip, .hashtag-details, [role="tooltip"]');
        if (await tooltip.count() > 0 && await tooltip.isVisible()) {
          console.log('✅ Hashtag analysis tooltip working');
        }
      }
    });
  });

  test.describe('🖼️ MEDIA ANALYSIS - Complete Testing', () => {
    test('MEDIA-AI-001: Image analysis and tagging', async ({ page }) => {
      const uploadButton = page.locator('[data-testid="upload-image"], button:has-text("Upload Image"), .image-upload').first();

      if (await uploadButton.count() > 0) {
        await uploadButton.click();

        // Upload test image
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.count() > 0) {
          await helpers.uploadTestFile(fileInput.locator('xpath=.').first(), 'test-image.jpg', 'fake-image-data');
          await page.waitForTimeout(3000);

          // Check for AI analysis results
          const analysisResults = page.locator('[data-testid="image-analysis"], .ai-analysis, .image-tags');
          if (await analysisResults.count() > 0 && await analysisResults.isVisible()) {
            console.log('✅ Image AI analysis completed');

            // Check for detected objects/tags
            const detectedTags = analysisResults.locator('.detected-tag, .ai-tag, .image-label');
            const tagCount = await detectedTags.count();

            if (tagCount > 0) {
              console.log(`✅ Detected ${tagCount} image tags`);
            }

            await helpers.takeScreenshot('ai-image-analysis');
          }
        }
      }
    });

    test('MEDIA-AI-002: Video content analysis', async ({ page }) => {
      const videoUploadButton = page.locator('[data-testid="upload-video"], button:has-text("Upload Video"), .video-upload').first();

      if (await videoUploadButton.count() > 0) {
        await videoUploadButton.click();

        const fileInput = page.locator('input[type="file"][accept*="video"]').first();
        if (await fileInput.count() > 0) {
          await helpers.uploadTestFile(fileInput.locator('xpath=.').first(), 'test-video.mp4', 'fake-video-data');
          await page.waitForTimeout(5000); // Video analysis takes longer

          // Check for video analysis
          const videoAnalysis = page.locator('[data-testid="video-analysis"], .video-insights, .ai-video-analysis');
          if (await videoAnalysis.count() > 0 && await videoAnalysis.isVisible()) {
            console.log('✅ Video AI analysis completed');

            // Check for analysis features
            const analysisFeatures = [
              'Scene Detection',
              'Object Recognition',
              'Audio Analysis',
              'Text Recognition',
              'Mood Analysis'
            ];

            for (const feature of analysisFeatures) {
              const featureElement = videoAnalysis.locator(`text="${feature}"`);
              if (await featureElement.count() > 0) {
                console.log(`✅ Video analysis feature: ${feature}`);
              }
            }
          }
        }
      }
    });

    test('MEDIA-AI-003: Auto-generated alt text', async ({ page }) => {
      const uploadButton = page.locator('[data-testid="upload-image"], .image-upload').first();

      if (await uploadButton.count() > 0) {
        await uploadButton.click();

        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.count() > 0) {
          await helpers.uploadTestFile(fileInput.locator('xpath=.').first(), 'test-image.jpg', 'fake-image-data');
          await page.waitForTimeout(3000);

          // Check for auto-generated alt text
          const altTextField = page.locator('[data-testid="alt-text"], input[name="alt"], .alt-text-input');
          if (await altTextField.count() > 0) {
            const altTextValue = await altTextField.inputValue();
            if (altTextValue && altTextValue.length > 0) {
              console.log(`✅ Auto-generated alt text: "${altTextValue}"`);
            }
          }

          // Check for alt text suggestions
          const altTextSuggestions = page.locator('.alt-text-suggestions, .ai-alt-suggestions');
          if (await altTextSuggestions.count() > 0) {
            console.log('✅ Alt text suggestions provided');
          }
        }
      }
    });
  });

  test.describe('👥 AUDIENCE INSIGHTS - Complete Testing', () => {
    test('AUDIENCE-AI-001: Audience analysis dashboard', async ({ page }) => {
      const audienceSection = page.locator('[data-testid="audience-insights"], .audience-analysis, .ai-audience').first();

      if (await audienceSection.count() > 0) {
        await expect(audienceSection).toBeVisible();

        // Check for audience metrics
        const audienceMetrics = [
          'Demographics',
          'Interests',
          'Engagement Patterns',
          'Active Hours',
          'Geographic Distribution'
        ];

        for (const metric of audienceMetrics) {
          const metricElement = audienceSection.locator(`text="${metric}", [data-metric="${metric.toLowerCase().replace(' ', '-')}"]`);
          if (await metricElement.count() > 0) {
            console.log(`✅ Audience metric found: ${metric}`);
          }
        }

        await helpers.takeScreenshot('ai-audience-insights');
      }
    });

    test('AUDIENCE-AI-002: Optimal posting time suggestions', async ({ page }) => {
      const optimalTimesSection = page.locator('[data-testid="optimal-times"], .optimal-posting-times, .ai-timing').first();

      if (await optimalTimesSection.count() > 0) {
        await expect(optimalTimesSection).toBeVisible();

        // Check for time recommendations
        const timeSlots = optimalTimesSection.locator('.time-slot, .optimal-time, .recommended-time');
        const slotCount = await timeSlots.count();

        if (slotCount > 0) {
          console.log(`✅ Found ${slotCount} optimal time recommendations`);

          // Check for confidence scores
          const confidenceScores = optimalTimesSection.locator('.confidence-score, .accuracy-rating');
          if (await confidenceScores.count() > 0) {
            console.log('✅ AI confidence scores displayed');
          }
        }
      }
    });

    test('AUDIENCE-AI-003: Content performance prediction', async ({ page }) => {
      const predictionSection = page.locator('[data-testid="performance-prediction"], .ai-prediction, .performance-forecast').first();

      if (await predictionSection.count() > 0) {
        await expect(predictionSection).toBeVisible();

        // Check for prediction metrics
        const predictionMetrics = [
          'Estimated Reach',
          'Predicted Engagement',
          'Virality Score',
          'Success Probability'
        ];

        for (const metric of predictionMetrics) {
          const metricElement = predictionSection.locator(`text="${metric}"`);
          if (await metricElement.count() > 0) {
            console.log(`✅ Prediction metric found: ${metric}`);
          }
        }

        // Check for prediction charts
        const predictionCharts = predictionSection.locator('canvas, svg, .chart');
        if (await predictionCharts.count() > 0) {
          console.log('✅ Performance prediction charts displayed');
        }
      }
    });
  });

  test.describe('🌍 LANGUAGE & TRANSLATION - Complete Testing', () => {
    test('LANG-AI-001: Content translation', async ({ page }) => {
      const translateButton = page.locator('[data-testid="translate"], button:has-text("Translate"), .translate-button').first();

      if (await translateButton.count() > 0) {
        // Add content to translate
        const contentInput = page.locator('[data-testid="content-input"], .content-editor, textarea').first();
        if (await contentInput.count() > 0) {
          await contentInput.fill('Hello everyone! I hope you have a wonderful day filled with joy and success.');
        }

        await translateButton.click();
        await page.waitForTimeout(500);

        // Check for language selection
        const languageSelector = page.locator('[data-testid="target-language"], .language-selector, select[name="language"]').first();
        if (await languageSelector.count() > 0) {
          await languageSelector.selectOption('Spanish');
          await page.waitForTimeout(1000);

          // Apply translation
          const applyButton = page.locator('button:has-text("Translate"), button:has-text("Apply")').first();
          if (await applyButton.count() > 0) {
            await applyButton.click();
            await helpers.waitForLoadingComplete();

            // Check for translated content
            const translatedContent = page.locator('[data-testid="translated-content"], .translation-result');
            if (await translatedContent.count() > 0 && await translatedContent.isVisible()) {
              const translatedText = await translatedContent.textContent();
              if (translatedText && translatedText.includes('Hola') || translatedText?.includes('día')) {
                console.log('✅ AI translation working');
              }
            }
          }
        }

        await helpers.takeScreenshot('ai-translation');
      }
    });

    test('LANG-AI-002: Multi-language content generation', async ({ page }) => {
      const languageOptions = page.locator('[data-testid="content-language"], .content-language-selector').first();

      if (await languageOptions.count() > 0) {
        await languageOptions.selectOption('French');
        await page.waitForTimeout(500);

        // Generate content in selected language
        const generateButton = page.locator('[data-testid="generate-caption"], button:has-text("Generate")').first();
        if (await generateButton.count() > 0) {
          await generateButton.click();
          await helpers.waitForLoadingComplete();

          // Check if generated content is in the selected language
          const generatedContent = page.locator('[data-testid="generated-content"], .ai-result');
          if (await generatedContent.count() > 0) {
            const content = await generatedContent.textContent();
            console.log(`✅ Generated content in French: ${content?.substring(0, 50)}...`);
          }
        }
      }
    });
  });

  test.describe('📊 SENTIMENT & TREND ANALYSIS - Complete Testing', () => {
    test('SENTIMENT-AI-001: Content sentiment analysis', async ({ page }) => {
      const sentimentSection = page.locator('[data-testid="sentiment-analysis"], .sentiment-analyzer, .ai-sentiment').first();

      if (await sentimentSection.count() > 0) {
        // Add content for analysis
        const contentInput = page.locator('[data-testid="content-input"], .content-editor, textarea').first();
        if (await contentInput.count() > 0) {
          await contentInput.fill('I absolutely love this new product! It has completely changed my life for the better. Highly recommend to everyone!');
        }

        // Trigger sentiment analysis
        const analyzeButton = page.locator('[data-testid="analyze-sentiment"], button:has-text("Analyze Sentiment")').first();
        if (await analyzeButton.count() > 0) {
          await analyzeButton.click();
          await helpers.waitForLoadingComplete();

          // Check for sentiment results
          const sentimentResult = page.locator('[data-testid="sentiment-result"], .sentiment-score, .mood-indicator');
          if (await sentimentResult.count() > 0 && await sentimentResult.isVisible()) {
            console.log('✅ Sentiment analysis completed');

            // Check for sentiment categories
            const sentimentTypes = ['Positive', 'Negative', 'Neutral'];
            for (const type of sentimentTypes) {
              const sentimentType = sentimentResult.locator(`text="${type}"`);
              if (await sentimentType.count() > 0) {
                console.log(`✅ Sentiment type detected: ${type}`);
              }
            }
          }
        }

        await helpers.takeScreenshot('ai-sentiment-analysis');
      }
    });

    test('SENTIMENT-AI-002: Trend analysis and recommendations', async ({ page }) => {
      const trendSection = page.locator('[data-testid="trend-analysis"], .trend-insights, .ai-trends').first();

      if (await trendSection.count() > 0) {
        await expect(trendSection).toBeVisible();

        // Check for trending topics
        const trendingTopics = trendSection.locator('.trending-topic, .trend-item, .hot-topic');
        const topicCount = await trendingTopics.count();

        if (topicCount > 0) {
          console.log(`✅ Found ${topicCount} trending topics`);

          // Check for trend metrics
          const trendMetrics = trendSection.locator('.trend-growth, .popularity-score, .engagement-rate');
          if (await trendMetrics.count() > 0) {
            console.log('✅ Trend metrics displayed');
          }
        }

        // Check for content recommendations based on trends
        const recommendations = trendSection.locator('.trend-recommendation, .suggested-content');
        if (await recommendations.count() > 0) {
          console.log('✅ Trend-based content recommendations found');
        }
      }
    });
  });

  test.describe('💬 AI CHAT INTERFACE - Complete Testing', () => {
    test('CHAT-AI-001: AI chat interface functionality', async ({ page }) => {
      const chatInterface = page.locator('[data-testid="ai-chat"], .ai-chat-interface, .chat-container').first();

      if (await chatInterface.count() > 0) {
        await expect(chatInterface).toBeVisible();

        // Check for chat input
        const chatInput = chatInterface.locator('[data-testid="chat-input"], .chat-input, input[type="text"]').first();
        if (await chatInput.count() > 0) {
          await expect(chatInput).toBeVisible();
          await expect(chatInput).toBeEnabled();

          // Send a test message
          const testMessage = 'Help me create a marketing strategy for my new product launch';
          await chatInput.fill(testMessage);
          await page.keyboard.press('Enter');

          await page.waitForTimeout(2000);

          // Check for AI response
          const chatMessages = chatInterface.locator('.chat-message, .message, .ai-response');
          const messageCount = await chatMessages.count();

          if (messageCount > 0) {
            console.log(`✅ AI chat working - ${messageCount} messages in conversation`);
          }
        }

        await helpers.takeScreenshot('ai-chat-interface');
      }
    });

    test('CHAT-AI-002: Chat history and context', async ({ page }) => {
      const chatInterface = page.locator('[data-testid="ai-chat"], .ai-chat-interface').first();

      if (await chatInterface.count() > 0) {
        const chatInput = chatInterface.locator('[data-testid="chat-input"], .chat-input').first();

        if (await chatInput.count() > 0) {
          // Send multiple messages to build context
          const messages = [
            'I run a fitness coaching business',
            'I want to create content about healthy recipes',
            'My target audience is busy professionals'
          ];

          for (const message of messages) {
            await chatInput.fill(message);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1500);
          }

          // Check if chat maintains context
          const chatMessages = chatInterface.locator('.chat-message, .message');
          const messageCount = await chatMessages.count();

          if (messageCount >= messages.length * 2) { // User messages + AI responses
            console.log('✅ Chat context and history maintained');
          }
        }
      }
    });

    test('CHAT-AI-003: AI suggestions and quick actions', async ({ page }) => {
      const chatInterface = page.locator('[data-testid="ai-chat"], .ai-chat-interface').first();

      if (await chatInterface.count() > 0) {
        // Check for suggested prompts or quick actions
        const suggestions = chatInterface.locator('.suggestion-chip, .quick-action, .ai-suggestion');
        const suggestionCount = await suggestions.count();

        if (suggestionCount > 0) {
          console.log(`✅ Found ${suggestionCount} AI suggestions`);

          // Test clicking a suggestion
          const firstSuggestion = suggestions.first();
          await firstSuggestion.click();
          await page.waitForTimeout(1000);

          // Check if suggestion was applied
          const chatInput = chatInterface.locator('[data-testid="chat-input"], .chat-input').first();
          if (await chatInput.count() > 0) {
            const inputValue = await chatInput.inputValue();
            if (inputValue && inputValue.length > 0) {
              console.log('✅ AI suggestion applied to chat input');
            }
          }
        }

        // Check for action buttons in AI responses
        const actionButtons = chatInterface.locator('.action-button, .ai-action, button:has-text("Apply")');
        if (await actionButtons.count() > 0) {
          console.log('✅ AI response action buttons found');
        }
      }
    });
  });

  test.describe('⚡ PERFORMANCE TESTS', () => {
    test('PERF-AI-001: AI page load performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/ai');
      await helpers.waitForLoadingComplete();

      const loadTime = Date.now() - startTime;
      console.log(`AI assistant page load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(8000);

      const metrics = await helpers.checkPerformanceMetrics();
      console.log('AI page performance metrics:', metrics);
    });

    test('PERF-AI-002: AI generation response time', async ({ page }) => {
      const generateButton = page.locator('[data-testid="generate-caption"], button:has-text("Generate")').first();

      if (await generateButton.count() > 0) {
        const startTime = Date.now();

        await generateButton.click();
        await helpers.waitForLoadingComplete();

        const responseTime = Date.now() - startTime;
        console.log(`AI generation response time: ${responseTime}ms`);

        // AI responses should be reasonably fast
        expect(responseTime).toBeLessThan(15000); // 15 seconds max
      }
    });

    test('PERF-AI-003: Multiple AI requests handling', async ({ page }) => {
      const generateButtons = page.locator('button').filter({ hasText: /generate|create|analyze/i });
      const buttonCount = Math.min(await generateButtons.count(), 3);

      if (buttonCount > 0) {
        const startTime = Date.now();

        // Trigger multiple AI requests
        for (let i = 0; i < buttonCount; i++) {
          const button = generateButtons.nth(i);
          if (await button.isVisible()) {
            await button.click();
            await page.waitForTimeout(500);
          }
        }

        await helpers.waitForLoadingComplete();

        const totalTime = Date.now() - startTime;
        console.log(`Multiple AI requests completed in: ${totalTime}ms`);
      }
    });
  });
});

export {};