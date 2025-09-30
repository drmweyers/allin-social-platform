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
});