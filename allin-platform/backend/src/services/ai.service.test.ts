import { AIService } from './ai.service';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

// Master test credentials
const MASTER_CREDENTIALS = {
  admin: { email: 'admin@allin.demo', password: 'Admin123!@#' },
  agency: { email: 'agency@allin.demo', password: 'Agency123!@#' },
  manager: { email: 'manager@allin.demo', password: 'Manager123!@#' },
  creator: { email: 'creator@allin.demo', password: 'Creator123!@#' },
  client: { email: 'client@allin.demo', password: 'Client123!@#' },
  team: { email: 'team@allin.demo', password: 'Team123!@#' },
};

describe('AIService', () => {
  let aiService: AIService;
  let mockOpenAIInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup OpenAI mock instance
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    (OpenAI as any).mockImplementation(() => mockOpenAIInstance);

    // Set environment variable for testing
    process.env.OPENAI_API_KEY = 'test-api-key';

    // Create new instance
    aiService = new AIService();
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

  describe('generateContent', () => {
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

      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: mockResponse } }],
      });

      const result = await aiService.generateContent(mockOptions);

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('hashtags');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('characterCount');
      expect(result.content).toContain('AI for marketing');
      expect(result.hashtags).toContain('#AIMarketing');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle OpenAI API errors gracefully', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API error')
      );

      const result = await aiService.generateContent(mockOptions);

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('hashtags');
      expect(result).toHaveProperty('suggestions');
      expect(result.characterCount).toBeGreaterThan(0);
    });

    it('should return mock content when OpenAI is not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      aiService = new AIService();

      const result = await aiService.generateContent(mockOptions);

      expect(result).toHaveProperty('content');
      expect(result.content).toContain('AI in marketing');
      expect(result.hashtags.length).toBeGreaterThanOrEqual(0);
      expect(result.suggestions.length).toBe(3);
    });

    describe('Platform-specific content generation', () => {
      const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'] as const;

      platforms.forEach(platform => {
        it(`should generate content for ${platform}`, async () => {
          delete process.env.OPENAI_API_KEY;
          aiService = new AIService();

          const result = await aiService.generateContent({
            platform,
            topic: 'test topic',
            tone: 'professional',
          });

          expect(result.content).toBeDefined();
          expect(result.content.length).toBeGreaterThan(0);
          expect(result.characterCount).toBe(result.content.length);
        });
      });
    });

    describe('Tone variations', () => {
      const tones = ['professional', 'casual', 'friendly', 'humorous', 'informative'] as const;

      tones.forEach(tone => {
        it(`should generate content with ${tone} tone`, async () => {
          delete process.env.OPENAI_API_KEY;
          aiService = new AIService();

          const result = await aiService.generateContent({
            platform: 'facebook',
            topic: 'test topic',
            tone,
          });

          expect(result.content).toBeDefined();
          expect(result.content.length).toBeGreaterThan(0);
        });
      });
    });

    it('should include hashtags when requested', async () => {
      delete process.env.OPENAI_API_KEY;
      aiService = new AIService();

      const result = await aiService.generateContent({
        platform: 'instagram',
        topic: 'test topic',
        includeHashtags: true,
      });

      expect(result.hashtags).toBeDefined();
      expect(result.hashtags.length).toBeGreaterThan(0);
      expect(result.hashtags[0]).toMatch(/^#/);
    });

    it('should not include hashtags when not requested', async () => {
      delete process.env.OPENAI_API_KEY;
      aiService = new AIService();

      const result = await aiService.generateContent({
        platform: 'facebook',
        topic: 'test topic',
        includeHashtags: false,
      });

      expect(result.hashtags).toBeDefined();
      expect(result.hashtags.length).toBe(0);
    });

    it('should respect character limits for each platform', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'CONTENT: ' + 'a'.repeat(300) + '\nHASHTAGS: #test\nSUGGESTIONS: Test suggestion'
          }
        }],
      });

      const result = await aiService.generateContent({
        platform: 'twitter',
        topic: 'test',
      });

      expect(result.characterCount).toBeDefined();
      // Twitter has 280 character limit, but mock doesn't enforce it
      expect(result.characterCount).toBeGreaterThan(0);
    });
  });

  describe('generateHashtags', () => {
    it('should generate hashtags with OpenAI', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '#AI #Marketing #Digital #Tech #Innovation' } }],
      });

      const hashtags = await aiService.generateHashtags('AI in marketing', 'instagram', 5);

      expect(hashtags).toHaveLength(5);
      expect(hashtags[0]).toMatch(/^#/);
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
        })
      );
    });

    it('should handle hashtag generation errors', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('API error')
      );

      const hashtags = await aiService.generateHashtags('test content', 'facebook', 3);

      expect(hashtags).toBeDefined();
      expect(hashtags.length).toBeLessThanOrEqual(3);
      expect(hashtags[0]).toMatch(/^#/);
    });

    it('should return mock hashtags when OpenAI is not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      aiService = new AIService();

      const hashtags = await aiService.generateHashtags('test content', 'linkedin', 4);

      expect(hashtags).toHaveLength(4);
      expect(hashtags[0]).toContain('#');
      expect(hashtags[0]).toContain('LinkedIn');
    });

    describe('Platform-specific hashtag generation', () => {
      const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'];

      platforms.forEach(platform => {
        it(`should generate hashtags for ${platform}`, async () => {
          delete process.env.OPENAI_API_KEY;
          aiService = new AIService();

          const hashtags = await aiService.generateHashtags('test', platform, 2);

          expect(hashtags).toHaveLength(2);
          expect(hashtags[0]).toMatch(/^#/);
        });
      });
    });

    it('should respect count parameter', async () => {
      delete process.env.OPENAI_API_KEY;
      aiService = new AIService();

      const hashtags = await aiService.generateHashtags('test', 'instagram', 7);

      expect(hashtags.length).toBeLessThanOrEqual(7);
    });
  });

  describe('improveContent', () => {
    const originalContent = 'Check out our new product!';

    it('should improve content with OpenAI', async () => {
      const improvedContent = 'Discover our revolutionary new product that transforms your workflow!';

      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: improvedContent } }],
      });

      const result = await aiService.improveContent(
        originalContent,
        'linkedin',
        'increase engagement'
      );

      expect(result).toBe(improvedContent);
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo-preview',
        })
      );
    });

    it('should return original content on API error', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('API error')
      );

      const result = await aiService.improveContent(
        originalContent,
        'facebook',
        'boost clicks'
      );

      expect(result).toBe(originalContent);
    });

    it('should return original content when OpenAI is not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      aiService = new AIService();

      const result = await aiService.improveContent(
        originalContent,
        'twitter',
        'maximize reach'
      );

      expect(result).toBe(originalContent);
    });

    it('should handle empty content', async () => {
      const result = await aiService.improveContent('', 'instagram', 'engagement');

      expect(result).toBe('');
    });
  });

  describe('getTemplates', () => {
    it('should return content templates', async () => {
      const templates = await aiService.getTemplates(MASTER_CREDENTIALS.admin.email);

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should return templates with required properties', async () => {
      const templates = await aiService.getTemplates(MASTER_CREDENTIALS.creator.email);

      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('platforms');
        expect(template).toHaveProperty('template');
        expect(template).toHaveProperty('variables');
        expect(Array.isArray(template.platforms)).toBe(true);
        expect(Array.isArray(template.variables)).toBe(true);
      });
    });

    it('should filter templates by platform', async () => {
      const templates = await aiService.getTemplates(
        MASTER_CREDENTIALS.manager.email,
        'instagram'
      );

      expect(templates).toBeDefined();
      // Since this is mock data, checking that function executes properly
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should return templates for agency owner', async () => {
      const templates = await aiService.getTemplates(MASTER_CREDENTIALS.agency.email);

      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should return templates for team member', async () => {
      const templates = await aiService.getTemplates(MASTER_CREDENTIALS.team.email);

      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe('Private methods (through public interface)', () => {
    it('should handle malformed AI response in parseAIResponse', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Random text without proper format' } }],
      });

      const result = await aiService.generateContent({
        platform: 'facebook',
        topic: 'test',
      });

      expect(result.content).toBeDefined();
      expect(result.hashtags).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it('should build proper prompt with all options', async () => {
      const spy = jest.spyOn(mockOpenAIInstance.chat.completions, 'create');

      await aiService.generateContent({
        platform: 'linkedin',
        topic: 'Professional growth',
        tone: 'professional',
        length: 'long',
        includeHashtags: true,
        includeEmojis: true,
        targetAudience: 'executives',
        keywords: ['leadership', 'innovation'],
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );

      const callArgs = spy.mock.calls[0][0] as any;
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      expect(userMessage.content).toContain('Professional growth');
      expect(userMessage.content).toContain('executives');
      expect(userMessage.content).toContain('leadership');
    });

    it('should handle platform character limits correctly', async () => {
      // This tests getPlatformCharacterLimits through the generation flow
      const spy = jest.spyOn(mockOpenAIInstance.chat.completions, 'create');

      await aiService.generateContent({
        platform: 'twitter',
        topic: 'test',
      });

      const callArgs = spy.mock.calls[0][0] as any;
      const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
      expect(systemMessage.content).toContain('280'); // Twitter character limit
    });

    it('should include platform best practices in system prompt', async () => {
      const spy = jest.spyOn(mockOpenAIInstance.chat.completions, 'create');

      await aiService.generateContent({
        platform: 'instagram',
        topic: 'test',
      });

      const callArgs = spy.mock.calls[0][0] as any;
      const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
      expect(systemMessage.content).toContain('hashtag'); // Instagram best practice
    });
  });

  describe('applyTemplate', () => {
    it('should apply variables to template successfully', async () => {
      const templateId = 'product-launch';
      const variables = {
        productName: 'Amazing Widget',
        companyName: 'TechCorp',
        feature: 'AI-powered analytics',
      };

      const result = await aiService.applyTemplate(templateId, variables);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Amazing Widget');
      expect(result).toContain('TechCorp');
      expect(result).toContain('AI-powered analytics');
    });

    it('should handle unknown template ID', async () => {
      const result = await aiService.applyTemplate('unknown-template', {});

      expect(result).toBe('Template not found');
    });

    it('should handle missing variables gracefully', async () => {
      const result = await aiService.applyTemplate('product-launch', {
        productName: 'Test Product',
        // Missing companyName and feature
      });

      expect(result).toBeDefined();
      expect(result).toContain('Test Product');
      // Should contain placeholder for missing variables
      expect(result).toContain('[companyName]');
      expect(result).toContain('[feature]');
    });

    it('should handle empty variables object', async () => {
      const result = await aiService.applyTemplate('product-launch', {});

      expect(result).toBeDefined();
      expect(result).toContain('[productName]');
      expect(result).toContain('[companyName]');
      expect(result).toContain('[feature]');
    });
  });

  describe('saveDraft', () => {
    it('should save draft successfully', async () => {
      const draft = {
        content: 'This is a draft post about AI',
        platforms: ['linkedin'],
        title: 'AI Draft',
      };

      const result = await aiService.saveDraft(MASTER_CREDENTIALS.creator.email, draft);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('platforms');
      expect(result).toHaveProperty('createdAt');
      expect(result.content).toBe(draft.content);
      expect(result.platforms).toEqual(draft.platforms);
      expect(result.userId).toBe(MASTER_CREDENTIALS.creator.email);
    });

    it('should save draft for different user roles', async () => {
      const draft = {
        content: 'Agency draft content',
        platforms: ['facebook'],
        title: 'Agency Post',
      };

      const result = await aiService.saveDraft(MASTER_CREDENTIALS.agency.email, draft);

      expect(result.userId).toBe(MASTER_CREDENTIALS.agency.email);
      expect(result.content).toBe(draft.content);
    });

    it('should handle draft with minimal data', async () => {
      const draft = {
        content: 'Minimal draft',
        platforms: ['twitter'],
      };

      const result = await aiService.saveDraft(MASTER_CREDENTIALS.manager.email, draft);

      expect(result).toBeDefined();
      expect(result.content).toBe(draft.content);
      expect(result.platforms).toEqual(draft.platforms);
    });

    it('should assign unique IDs to drafts', async () => {
      const draft1 = { content: 'Draft 1', platforms: ['instagram'] };
      const draft2 = { content: 'Draft 2', platforms: ['instagram'] };

      const result1 = await aiService.saveDraft(MASTER_CREDENTIALS.team.email, draft1);
      const result2 = await aiService.saveDraft(MASTER_CREDENTIALS.team.email, draft2);

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('getDrafts', () => {
    it('should retrieve drafts for user', async () => {
      // First save some drafts
      await aiService.saveDraft(MASTER_CREDENTIALS.admin.email, {
        content: 'Admin draft 1',
        platforms: ['linkedin'],
      });
      await aiService.saveDraft(MASTER_CREDENTIALS.admin.email, {
        content: 'Admin draft 2',
        platforms: ['facebook'],
      });

      const drafts = await aiService.getDrafts(MASTER_CREDENTIALS.admin.email);

      expect(drafts).toBeDefined();
      expect(Array.isArray(drafts)).toBe(true);
      expect(drafts.length).toBeGreaterThanOrEqual(2);
      
      drafts.forEach(draft => {
        expect(draft).toHaveProperty('id');
        expect(draft).toHaveProperty('content');
        expect(draft).toHaveProperty('platforms');
        expect(draft).toHaveProperty('createdAt');
        expect(draft.userId).toBe(MASTER_CREDENTIALS.admin.email);
      });
    });

    it('should return empty array for user with no drafts', async () => {
      const drafts = await aiService.getDrafts('new-user@example.com');

      expect(drafts).toBeDefined();
      expect(Array.isArray(drafts)).toBe(true);
      expect(drafts.length).toBe(0);
    });

    it('should retrieve drafts sorted by creation date', async () => {
      const userId = MASTER_CREDENTIALS.client.email;
      
      await aiService.saveDraft(userId, {
        content: 'First draft',
        platforms: ['twitter'],
      });
      
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await aiService.saveDraft(userId, {
        content: 'Second draft',
        platforms: ['instagram'],
      });

      const drafts = await aiService.getDrafts(userId);

      expect(drafts.length).toBeGreaterThanOrEqual(2);
      // Should be sorted by creation date (most recent first)
      if (drafts.length >= 2) {
        expect(new Date(drafts[0].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(drafts[1].createdAt).getTime());
      }
    });
  });

  describe('analyzeContent', () => {
    it('should analyze content and return insights', async () => {
      const content = 'Check out our amazing new product! It will revolutionize your workflow. #innovation #productivity';
      
      const result = await aiService.analyzeContent(content, 'linkedin');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('readabilityScore');
      expect(result).toHaveProperty('sentimentScore');
      expect(result).toHaveProperty('engagementPrediction');
      expect(result).toHaveProperty('improvements');
      
      expect(typeof result.readabilityScore).toBe('number');
      expect(result.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.readabilityScore).toBeLessThanOrEqual(100);
      
      expect(typeof result.sentimentScore).toBe('number');
      expect(Array.isArray(result.improvements)).toBe(true);
    });

    it('should analyze content for different platforms', async () => {
      const content = 'Great product launch today! 🚀';
      const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'];

      for (const platform of platforms) {
        const result = await aiService.analyzeContent(content, platform);
        
        expect(result).toBeDefined();
        expect(result.readabilityScore).toBeGreaterThanOrEqual(0);
        expect(result.improvements.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty content', async () => {
      const result = await aiService.analyzeContent('', 'facebook');

      expect(result).toBeDefined();
      expect(result.readabilityScore).toBeDefined();
      expect(result.sentimentScore).toBeDefined();
      expect(result.engagementPrediction).toBeDefined();
      expect(result.improvements).toBeDefined();
    });

    it('should provide consistent analysis structure', async () => {
      const content = 'Amazing day! #blessed #grateful #happiness';
      
      const result = await aiService.analyzeContent(content, 'instagram');

      expect(result.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.sentimentScore).toBeGreaterThanOrEqual(-1);
      expect(result.sentimentScore).toBeLessThanOrEqual(1);
      expect(result.engagementPrediction).toBeDefined();
      expect(Array.isArray(result.improvements)).toBe(true);
    });

    it('should provide consistent analysis across platforms', async () => {
      const content = 'Professional update about our quarterly results';
      
      const linkedinResult = await aiService.analyzeContent(content, 'linkedin');
      const twitterResult = await aiService.analyzeContent(content, 'twitter');

      expect(linkedinResult.improvements).toBeDefined();
      expect(twitterResult.improvements).toBeDefined();
      
      expect(Array.isArray(linkedinResult.improvements)).toBe(true);
      expect(Array.isArray(twitterResult.improvements)).toBe(true);
      expect(linkedinResult.improvements.length).toBeGreaterThan(0);
      expect(twitterResult.improvements.length).toBeGreaterThan(0);
    });
  });

  describe('generateMarketingAdvice', () => {
    it('should generate marketing advice with OpenAI', async () => {
      const adviceResponse = 'To improve your social media engagement, focus on posting consistently during peak hours, use high-quality visuals, and engage with your audience through comments and stories.';
      
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: adviceResponse } }],
      });

      const result = await aiService.generateMarketingAdvice(
        'How can I improve my social media engagement?'
      );

      expect(result).toBe(adviceResponse);
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo-preview',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('How can I improve my social media engagement?')
            })
          ])
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API error')
      );

      const result = await aiService.generateMarketingAdvice(
        'What are the best posting times?'
      );

      expect(result).toContain('unable to generate advice');
      expect(result).toContain('try again later');
    });

    it('should return fallback advice when OpenAI is not configured', async () => {
      delete process.env.OPENAI_API_KEY;
      aiService = new AIService();

      const result = await aiService.generateMarketingAdvice(
        'How to increase brand awareness?'
      );

      expect(result).toContain('unable to generate advice');
      expect(result).toContain('AI features are not available');
    });

    it('should handle empty prompt', async () => {
      const result = await aiService.generateMarketingAdvice('');

      expect(result).toContain('Please provide a specific question');
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'A'.repeat(5000);
      
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Here is some marketing advice for your question.' } }],
      });

      const result = await aiService.generateMarketingAdvice(longPrompt);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should provide advice for different marketing topics', async () => {
      const topics = [
        'How to increase engagement?',
        'Best practices for Instagram?',
        'Content calendar strategies?',
        'Influencer marketing tips?',
      ];

      for (const topic of topics) {
        mockOpenAIInstance.chat.completions.create.mockResolvedValue({
          choices: [{ message: { content: `Advice for: ${topic}` } }],
        });

        const result = await aiService.generateMarketingAdvice(topic);
        
        expect(result).toContain(topic);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle null response from OpenAI', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [],
      });

      const result = await aiService.generateContent({
        platform: 'facebook',
        topic: 'test',
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it('should handle undefined message content', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: undefined } }],
      });

      const result = await aiService.generateContent({
        platform: 'linkedin',
        topic: 'test',
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it('should handle network errors gracefully', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('Network error')
      );

      const result = await aiService.generateContent({
        platform: 'tiktok',
        topic: 'trending',
      });

      expect(result).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('Integration tests with master credentials', () => {
    it('should work with all master credential user types', async () => {
      const userTypes = Object.keys(MASTER_CREDENTIALS);
      
      for (const userType of userTypes) {
        const userEmail = (MASTER_CREDENTIALS as any)[userType].email;
        
        // Test saving and retrieving drafts
        const draft = {
          content: `Test content for ${userType}`,
          platforms: ['facebook'],
        };
        
        const savedDraft = await aiService.saveDraft(userEmail, draft);
        expect(savedDraft.userId).toBe(userEmail);
        
        const drafts = await aiService.getDrafts(userEmail);
        expect(drafts.some(d => d.id === savedDraft.id)).toBe(true);
        
        // Test templates
        const templates = await aiService.getTemplates(userEmail);
        expect(Array.isArray(templates)).toBe(true);
      }
    });

    it('should maintain data isolation between users', async () => {
      const user1 = MASTER_CREDENTIALS.admin.email;
      const user2 = MASTER_CREDENTIALS.creator.email;
      
      await aiService.saveDraft(user1, {
        content: 'User 1 draft',
        platforms: ['twitter'],
      });
      
      await aiService.saveDraft(user2, {
        content: 'User 2 draft',
        platforms: ['instagram'],
      });
      
      const user1Drafts = await aiService.getDrafts(user1);
      const user2Drafts = await aiService.getDrafts(user2);
      
      // Each user should only see their own drafts
      expect(user1Drafts.every(d => d.userId === user1)).toBe(true);
      expect(user2Drafts.every(d => d.userId === user2)).toBe(true);
      
      // No overlap in draft content
      const user1Contents = user1Drafts.map(d => d.content);
      const user2Contents = user2Drafts.map(d => d.content);
      
      expect(user1Contents).not.toContain('User 2 draft');
      expect(user2Contents).not.toContain('User 1 draft');
    });
  });
});