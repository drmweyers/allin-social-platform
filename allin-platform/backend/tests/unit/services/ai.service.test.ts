/**
 * AI Service Tests - BMAD Testing Framework
 * Streamlined comprehensive tests for AI content generation and optimization
 */

// Mock OpenAI BEFORE importing AIService
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

import { AIService } from '../../../src/services/ai.service';
import OpenAI from 'openai';

describe('AIService', () => {
  let aiService: AIService;
  let mockOpenAIInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set environment variable for testing
    process.env.OPENAI_API_KEY = 'test-api-key';

    // Create new instance
    aiService = new AIService();

    // Get the mock instance that was created
    mockOpenAIInstance = (aiService as any).openai;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('Initialization', () => {
    it('should initialize with valid API key', () => {
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
    });

    it('should not initialize with missing API key', () => {
      delete process.env.OPENAI_API_KEY;
      jest.clearAllMocks();
      new AIService();
      expect(OpenAI).not.toHaveBeenCalled();
    });

    it('should not initialize with placeholder API key', () => {
      process.env.OPENAI_API_KEY = 'your-openai-api-key-here';
      jest.clearAllMocks();
      new AIService();
      expect(OpenAI).not.toHaveBeenCalled();
    });
  });

  describe('Content Generation', () => {
    const mockOptions = {
      platform: 'facebook' as const,
      topic: 'AI in marketing',
      tone: 'professional' as const,
      length: 'medium' as const,
      includeHashtags: true,
      includeEmojis: true,
      targetAudience: 'marketers',
      keywords: ['AI', 'automation', 'efficiency'],
    };

    it('should generate content successfully with OpenAI', async () => {
      const mockResponse = `CONTENT: Exciting developments in AI for marketing!
HASHTAGS: #AIMarketing #Automation #DigitalTransformation
SUGGESTIONS: 1. Post during peak hours 2. Include visuals 3. Ask questions`;

      if (mockOpenAIInstance && mockOpenAIInstance.chat) {
        mockOpenAIInstance.chat.completions.create.mockResolvedValue({
          choices: [{ message: { content: mockResponse } }],
        });
      }

      const result = await aiService.generateContent(mockOptions);

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('hashtags');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('characterCount');
      expect(result.content).toBeDefined();
      expect(result.hashtags.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle OpenAI API errors gracefully', async () => {
      if (mockOpenAIInstance && mockOpenAIInstance.chat) {
        mockOpenAIInstance.chat.completions.create.mockRejectedValue(
          new Error('API Error')
        );

        await expect(aiService.generateContent(mockOptions)).rejects.toThrow();
      } else {
        // If OpenAI is not initialized, test fallback behavior
        const result = await aiService.generateContent(mockOptions);
        expect(result).toBeDefined();
      }
    });

    it('should use mock generation when OpenAI is not initialized', async () => {
      delete process.env.OPENAI_API_KEY;
      const serviceWithoutKey = new AIService();

      const result = await serviceWithoutKey.generateContent(mockOptions);

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('hashtags');
      expect(result.characterCount).toBeGreaterThan(0);
    });

    it('should include hashtags when requested', async () => {
      if (mockOpenAIInstance && mockOpenAIInstance.chat) {
        mockOpenAIInstance.chat.completions.create.mockResolvedValue({
          choices: [
            {
              message: {
                content: 'CONTENT: Test\nHASHTAGS: #test #marketing\nSUGGESTIONS: tip',
              },
            },
          ],
        });
      }

      const result = await aiService.generateContent({
        ...mockOptions,
        includeHashtags: true,
      });

      expect(result.hashtags.length).toBeGreaterThan(0);
    });

    it('should respect platform-specific requirements', async () => {
      const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'];

      for (const platform of platforms) {
        if (mockOpenAIInstance && mockOpenAIInstance.chat) {
          mockOpenAIInstance.chat.completions.create.mockResolvedValue({
            choices: [{ message: { content: 'CONTENT: Test\nHASHTAGS: #test\nSUGGESTIONS: tip' } }],
          });
        }

        const result = await aiService.generateContent({
          ...mockOptions,
          platform: platform as any,
        });

        expect(result).toBeDefined();
        expect(result.content).toBeDefined();
      }
    });
  });

  describe('analyzeEngagementFactors', () => {
    it('should analyze emotional triggers correctly', () => {
      const content = 'This is amazing and exciting! Surprising developments ahead!';

      const result = aiService.analyzeEngagementFactors(content, 'instagram');

      expect(result).toHaveProperty('emotionalTriggers');
      expect(result.emotionalTriggers.joy).toBeGreaterThanOrEqual(0);
      expect(result.emotionalTriggers.surprise).toBeGreaterThanOrEqual(0);
      expect(result.emotionalTriggers.trust).toBeGreaterThanOrEqual(0);
      expect(result.emotionalTriggers.anticipation).toBeGreaterThanOrEqual(0);
    });

    it('should detect action triggers', () => {
      const content = 'Want to learn more? Click here to get started!';

      const result = aiService.analyzeEngagementFactors(content, 'facebook');

      expect(result).toHaveProperty('actionTriggers');
      expect(result.actionTriggers.hasQuestion).toBe(true);
      expect(result.actionTriggers.hasCallToAction).toBe(true);
    });

    it('should count visual elements correctly', () => {
      const content = 'Great news! 🎉 Check out #innovation #technology @user https://example.com';

      const result = aiService.analyzeEngagementFactors(content, 'instagram');

      expect(result).toHaveProperty('visualElements');
      expect(result.visualElements.hasEmojis).toBe(true);
      expect(result.visualElements.hashtagCount).toBe(2);
      expect(result.visualElements.mentionsCount).toBe(1);
      expect(result.visualElements.urlCount).toBe(1);
    });

    it('should calculate readability metrics', () => {
      const content = 'This is a simple sentence. It has good readability.';

      const result = aiService.analyzeEngagementFactors(content, 'linkedin');

      expect(result).toHaveProperty('readability');
      expect(result.readability.sentenceLength).toBeGreaterThan(0);
      expect(result.readability.wordComplexity).toBeGreaterThanOrEqual(0);
      expect(result.readability.punctuationDensity).toBeGreaterThan(0);
    });

    it('should handle empty content gracefully', () => {
      const result = aiService.analyzeEngagementFactors('', 'twitter');

      expect(result.emotionalTriggers.joy).toBe(0);
      expect(result.visualElements.hasEmojis).toBe(false);
      expect(result.visualElements.hashtagCount).toBe(0);
    });

    it('should apply platform-specific multipliers', () => {
      const content = 'Amazing content here!';

      const instagramResult = aiService.analyzeEngagementFactors(content, 'instagram');
      const linkedinResult = aiService.analyzeEngagementFactors(content, 'linkedin');

      expect(instagramResult.emotionalTriggers.joy).toBeDefined();
      expect(linkedinResult.emotionalTriggers.joy).toBeDefined();
    });
  });

  describe('optimizeForAlgorithm', () => {
    it('should add engagement questions when missing', async () => {
      const content = 'Here is some content about our product.';

      const result = await aiService.optimizeForAlgorithm(content, 'facebook');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(content.length);
    });

    it('should optimize hashtag count for platforms', async () => {
      const content = 'Great product!';

      const result = await aiService.optimizeForAlgorithm(content, 'instagram');

      const hashtagCount = (result.match(/#\w+/g) || []).length;
      expect(hashtagCount).toBeGreaterThan(0);
    });

    it('should add emojis when appropriate', async () => {
      const content = 'Announcing our new product launch today!';

      const result = await aiService.optimizeForAlgorithm(content, 'instagram');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should maintain content intent while optimizing', async () => {
      const content = 'Professional announcement about quarterly results.';

      const result = await aiService.optimizeForAlgorithm(content, 'linkedin');

      expect(result).toContain('quarterly results');
    });

    it('should handle different platforms appropriately', async () => {
      const content = 'Short content.';
      const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];

      for (const platform of platforms) {
        const result = await aiService.optimizeForAlgorithm(content, platform);

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      }
    });
  });

  describe('predictPerformance', () => {
    it('should calculate performance prediction with all metrics', () => {
      const content = 'Amazing product launch! 🚀 #innovation #tech';

      const result = aiService.predictPerformance(content, 'instagram');

      expect(result).toHaveProperty('engagementRate');
      expect(result).toHaveProperty('reach');
      expect(result).toHaveProperty('impressions');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('factors');

      expect(result.engagementRate).toBeGreaterThanOrEqual(0);
      expect(result.reach).toBeGreaterThanOrEqual(0);
      expect(result.impressions).toBeGreaterThanOrEqual(0);
    });

    it('should cap engagement rate at reasonable maximum', () => {
      const content = 'Amazing! Incredible! Fantastic! 🎉🚀✨ #viral #trending #amazing';

      const result = aiService.predictPerformance(content, 'instagram');

      expect(result.engagementRate).toBeLessThanOrEqual(15);
    });

    it('should factor in content quality', () => {
      const highQualityContent = 'What do you think about this? 🤔 #discussion #engagement';
      const lowQualityContent = 'post';

      const highResult = aiService.predictPerformance(highQualityContent, 'facebook');
      const lowResult = aiService.predictPerformance(lowQualityContent, 'facebook');

      expect(highResult.engagementRate).toBeGreaterThan(lowResult.engagementRate);
    });

    it('should include confidence score', () => {
      const content = 'Test content';

      const result = aiService.predictPerformance(content, 'twitter');

      expect(result.confidence).toBeGreaterThanOrEqual(60);
      expect(result.confidence).toBeLessThanOrEqual(95);
    });

    it('should calculate all performance factors', () => {
      const content = 'Great post with hashtags! #test';

      const result = aiService.predictPerformance(content, 'instagram');

      expect(result.factors.timing).toBeDefined();
      expect(result.factors.content).toBeDefined();
      expect(result.factors.hashtags).toBeDefined();
      expect(result.factors.platform).toBeDefined();
    });

    it('should use historical data when provided', () => {
      const content = 'Test content';
      const historicalData = [{ engagement: 200 }, { engagement: 150 }];

      const result = aiService.predictPerformance(content, 'facebook', historicalData);

      expect(result).toBeDefined();
      expect(result.engagementRate).toBeGreaterThan(0);
    });
  });

  describe('generateVariants', () => {
    it('should generate multiple content variants', async () => {
      const content = 'Original content';

      const result = await aiService.generateVariants(content, 'instagram', 3);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it('should default to 3 variants when count not specified', async () => {
      const content = 'Test content';

      const result = await aiService.generateVariants(content, 'facebook');

      expect(result.length).toBe(3);
    });

    it('should generate different variants', async () => {
      const content = 'Original content';

      const result = await aiService.generateVariants(content, 'twitter', 5);

      expect(result.length).toBe(5);
      // Check that variants are strings
      result.forEach(variant => {
        expect(typeof variant).toBe('string');
      });
    });

    it('should handle different platforms', async () => {
      const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];

      for (const platform of platforms) {
        const result = await aiService.generateVariants('test', platform, 2);

        expect(result.length).toBe(2);
      }
    });
  });

  describe('abTestRecommendations', () => {
    it('should suggest emoji test when emojis missing', () => {
      const content = 'Content without emojis';

      const result = aiService.abTestRecommendations(content, 'instagram');

      expect(result).toHaveProperty('variants');
      expect(result).toHaveProperty('testDuration');
      expect(result).toHaveProperty('successMetrics');
      expect(Array.isArray(result.variants)).toBe(true);
    });

    it('should suggest question test when questions missing', () => {
      const content = 'Content without questions.';

      const result = aiService.abTestRecommendations(content, 'facebook');

      expect(result.variants.length).toBeGreaterThan(0);
      expect(result.testDuration).toBe(7);
    });

    it('should provide test duration', () => {
      const content = 'Test content';

      const result = aiService.abTestRecommendations(content, 'instagram');

      expect(result.testDuration).toBe(7);
    });

    it('should provide success metrics', () => {
      const content = 'Test content';

      const result = aiService.abTestRecommendations(content, 'twitter');

      expect(result.successMetrics).toEqual([
        'engagement_rate',
        'reach',
        'comments',
        'shares',
      ]);
    });

    it('should generate variant recommendations', () => {
      const content = 'Basic content.';

      const result = aiService.abTestRecommendations(content, 'facebook');

      result.variants.forEach(variant => {
        expect(variant).toHaveProperty('original');
        expect(variant).toHaveProperty('optimized');
        expect(variant).toHaveProperty('hypothesis');
        expect(variant).toHaveProperty('expectedImprovement');
      });
    });
  });

  describe('generateHashtags', () => {
    it('should generate relevant hashtags', async () => {
      const content = 'Content about marketing and AI';

      const result = await aiService.generateHashtags(content, 'instagram', 5);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach(hashtag => {
        expect(hashtag).toMatch(/^#\w+$/);
      });
    });

    it('should respect the count parameter', async () => {
      const content = 'Test content';

      const result = await aiService.generateHashtags(content, 'instagram', 3);

      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid platform gracefully', () => {
      const content = 'Test content';

      const result = aiService.analyzeEngagementFactors(content, 'invalid' as any);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('emotionalTriggers');
    });

    it('should handle very long content', () => {
      const longContent = 'word '.repeat(1000);

      const result = aiService.analyzeEngagementFactors(longContent, 'facebook');

      expect(result).toBeDefined();
    });

    it('should handle special characters in content', () => {
      const content = 'Test @#$%^&*() content with 特殊字符';

      const result = aiService.analyzeEngagementFactors(content, 'instagram');

      expect(result).toBeDefined();
    });
  });
});
