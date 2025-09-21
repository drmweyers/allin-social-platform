import OpenAI from 'openai';
import { prisma } from '../lib/prisma';

interface ContentGenerationOptions {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  topic: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'humorous' | 'informative';
  length?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  targetAudience?: string;
  keywords?: string[];
}

interface GeneratedContent {
  content: string;
  hashtags: string[];
  suggestions: string[];
  characterCount: number;
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  template: string;
  variables: string[];
}

export class AIService {
  private openai: OpenAI | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your-openai-api-key-here') {
      this.openai = new OpenAI({
        apiKey,
      });
      this.isInitialized = true;
    }
  }

  private getPlatformCharacterLimits() {
    return {
      facebook: { post: 63206, optimal: 80 },
      instagram: { caption: 2200, optimal: 125, bio: 150 },
      twitter: { post: 280, thread: 25 * 280 },
      linkedin: { post: 3000, article: 110000, optimal: 150 },
      tiktok: { caption: 2200, optimal: 150 },
    };
  }

  private getPlatformBestPractices(platform: string): string {
    const practices = {
      facebook: `
        - Use engaging questions to encourage comments
        - Include relevant images or videos
        - Post during peak hours (1-4 PM)
        - Keep posts concise for mobile readers
        - Use Facebook-specific features like polls or events
      `,
      instagram: `
        - Start with a hook in the first line
        - Use 3-5 relevant hashtags
        - Include a call-to-action
        - Break text into short paragraphs
        - Add location tags when relevant
      `,
      twitter: `
        - Be concise and punchy
        - Use 1-2 hashtags maximum
        - Include visuals when possible
        - Thread longer thoughts
        - Engage with replies
      `,
      linkedin: `
        - Share professional insights
        - Use industry-specific keywords
        - Format with bullet points or numbered lists
        - Include a clear takeaway
        - Encourage professional discussion
      `,
      tiktok: `
        - Hook viewers in first 3 seconds
        - Use trending sounds and hashtags
        - Keep captions conversational
        - Include a strong CTA
        - Use emojis to add personality
      `,
    };
    return practices[platform] || '';
  }

  async generateContent(options: ContentGenerationOptions): Promise<GeneratedContent> {
    if (!this.isInitialized || !this.openai) {
      // Return a mock response if OpenAI is not configured
      return this.getMockContent(options);
    }

    try {
      const limits = this.getPlatformCharacterLimits();
      const platformLimit = limits[options.platform];
      const bestPractices = this.getPlatformBestPractices(options.platform);

      const systemPrompt = `You are an expert social media content creator specializing in ${options.platform} content.
      Platform best practices: ${bestPractices}
      Character limits: ${JSON.stringify(platformLimit)}
      Always optimize for engagement and the platform's algorithm.`;

      const userPrompt = this.buildUserPrompt(options);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content || '';
      return this.parseAIResponse(response, options.platform);
    } catch (error) {
      console.error('Error generating content with OpenAI:', error);
      // Fallback to mock content on error
      return this.getMockContent(options);
    }
  }

  private buildUserPrompt(options: ContentGenerationOptions): string {
    let prompt = `Create a ${options.platform} post about "${options.topic}".\n\n`;

    if (options.tone) {
      prompt += `Tone: ${options.tone}\n`;
    }
    if (options.length) {
      const lengthGuide = {
        short: 'Keep it brief (1-2 sentences)',
        medium: 'Medium length (3-5 sentences)',
        long: 'Detailed post (6+ sentences)',
      };
      prompt += `Length: ${lengthGuide[options.length]}\n`;
    }
    if (options.targetAudience) {
      prompt += `Target audience: ${options.targetAudience}\n`;
    }
    if (options.keywords && options.keywords.length > 0) {
      prompt += `Include keywords: ${options.keywords.join(', ')}\n`;
    }
    if (options.includeHashtags) {
      prompt += `Include relevant hashtags\n`;
    }
    if (options.includeEmojis) {
      prompt += `Include appropriate emojis\n`;
    }

    prompt += `\nFormat the response as:\nCONTENT: [the post content]\nHASHTAGS: [list of hashtags]\nSUGGESTIONS: [3 tips to improve engagement]`;

    return prompt;
  }

  private parseAIResponse(response: string, platform: string): GeneratedContent {
    const contentMatch = response.match(/CONTENT:\s*([^\n]+(?:\n(?!HASHTAGS:|SUGGESTIONS:)[^\n]+)*)/i);
    const hashtagsMatch = response.match(/HASHTAGS:\s*([^\n]+(?:\n(?!SUGGESTIONS:)[^\n]+)*)/i);
    const suggestionsMatch = response.match(/SUGGESTIONS:\s*([\s\S]*)/i);

    const content = contentMatch ? contentMatch[1].trim() : response;
    const hashtagsText = hashtagsMatch ? hashtagsMatch[1].trim() : '';
    const suggestionsText = suggestionsMatch ? suggestionsMatch[1].trim() : '';

    // Parse hashtags
    const hashtags = hashtagsText
      .split(/[,\s]+/)
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.trim());

    // Parse suggestions
    const suggestions = suggestionsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim())
      .slice(0, 3);

    return {
      content,
      hashtags,
      suggestions,
      characterCount: content.length,
    };
  }

  private getMockContent(options: ContentGenerationOptions): GeneratedContent {
    const mockTemplates = {
      facebook: {
        professional: `Excited to share insights on ${options.topic}! This represents a significant step forward in our industry. What are your thoughts on this development? 🚀`,
        casual: `Just discovered something amazing about ${options.topic}! Can't wait to share more details with you all. Who else is interested in this? 😊`,
        friendly: `Hey friends! Let's talk about ${options.topic} today. I've been learning so much and would love to hear your experiences too! 💡`,
      },
      instagram: {
        professional: `Diving deep into ${options.topic} 📊\n\nKey insights that matter to your business:\n✨ Innovation drives growth\n✨ Consistency is key\n✨ Community matters\n\nWhat's your take on this?`,
        casual: `${options.topic} vibes only! ✨\n\nSwipe for the full story →\n\nDrop a 💙 if you're with me!`,
        friendly: `Let's chat about ${options.topic}! 🌟\n\nI've been exploring this lately and wow, mind = blown 🤯\n\nTell me your thoughts below! 👇`,
      },
      twitter: {
        professional: `Key insight on ${options.topic}:\n\nThe future belongs to those who adapt quickly and embrace change.\n\nThread below 🧵`,
        casual: `ok but why is nobody talking about ${options.topic}?? this is actually huge 👀`,
        friendly: `Friendly reminder about ${options.topic} 💫\n\nSmall steps lead to big changes. You've got this!`,
      },
      linkedin: {
        professional: `Reflecting on ${options.topic}:\n\nIn today's rapidly evolving landscape, understanding this topic is crucial for strategic decision-making.\n\nThree key takeaways:\n1. Innovation drives competitive advantage\n2. Data-informed decisions yield better outcomes\n3. Continuous learning is non-negotiable\n\nWhat strategies are you implementing?`,
        casual: `Thoughts on ${options.topic}?\n\nBeen diving into this lately and it's fascinating how much the landscape has changed.\n\nWould love to hear different perspectives from my network!`,
        friendly: `Happy to share some insights on ${options.topic}!\n\nAfter working in this space for years, I've learned that collaboration and knowledge-sharing accelerate everyone's growth.\n\nWhat has your journey taught you?`,
      },
      tiktok: {
        professional: `POV: You just learned about ${options.topic} 🤯 Save this for later! #education #learning`,
        casual: `${options.topic} explained in 30 seconds ⏰ You're welcome 😎 #fyp #trending`,
        friendly: `Hey bestie! Let's talk ${options.topic} 💕 Comment your thoughts! #community #letstalk`,
      },
    };

    const platformTemplates = mockTemplates[options.platform] || mockTemplates.facebook;
    const tone = options.tone || 'professional';
    const content = platformTemplates[tone] || platformTemplates.professional;

    const hashtagSets = {
      facebook: ['#Innovation', '#Business', '#Growth', '#Community'],
      instagram: ['#InstaDaily', '#Motivation', '#Success', '#Entrepreneur', '#DigitalMarketing'],
      twitter: ['#Tech', '#Trending'],
      linkedin: ['#ProfessionalDevelopment', '#Leadership', '#Innovation', '#BusinessStrategy'],
      tiktok: ['#FYP', '#ForYou', '#Viral', '#LearnOnTikTok', '#TikTokTips'],
    };

    const hashtags = options.includeHashtags
      ? hashtagSets[options.platform].slice(0, 3)
      : [];

    const suggestions = [
      `Post at optimal times for ${options.platform} (check analytics for your audience)`,
      `Include a clear call-to-action to boost engagement`,
      `Use high-quality visuals to increase visibility`,
    ];

    return {
      content,
      hashtags,
      suggestions,
      characterCount: content.length,
    };
  }

  async generateHashtags(content: string, platform: string, count: number = 5): Promise<string[]> {
    if (!this.isInitialized || !this.openai) {
      return this.getMockHashtags(platform, count);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Generate ${count} relevant hashtags for ${platform} based on the content provided. Return only the hashtags, separated by spaces.`,
          },
          { role: 'user', content },
        ],
        temperature: 0.5,
        max_tokens: 100,
      });

      const response = completion.choices[0]?.message?.content || '';
      return response
        .split(/\s+/)
        .filter(tag => tag.startsWith('#'))
        .slice(0, count);
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return this.getMockHashtags(platform, count);
    }
  }

  private getMockHashtags(platform: string, count: number): string[] {
    const hashtags = {
      facebook: ['#FacebookMarketing', '#SocialMedia', '#DigitalStrategy', '#ContentCreation', '#Engagement', '#Community', '#BrandAwareness'],
      instagram: ['#InstaMarketing', '#ContentCreator', '#SocialMediaTips', '#InstagramGrowth', '#DigitalMarketing', '#BrandStrategy', '#CreativeContent'],
      twitter: ['#TwitterMarketing', '#SocialStrategy', '#DigitalTrends', '#ContentMarketing', '#BrandVoice', '#Engagement', '#TwitterTips'],
      linkedin: ['#LinkedInMarketing', '#B2BMarketing', '#ProfessionalGrowth', '#ThoughtLeadership', '#BusinessStrategy', '#Networking', '#CareerDevelopment'],
      tiktok: ['#TikTokMarketing', '#ContentStrategy', '#ViralContent', '#TikTokGrowth', '#CreatorEconomy', '#SocialMediaTrends', '#TikTokTips'],
    };

    return (hashtags[platform] || hashtags.facebook).slice(0, count);
  }

  async improveContent(content: string, platform: string, goal: string): Promise<string> {
    if (!this.isInitialized || !this.openai) {
      return content; // Return original if AI is not available
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert social media copywriter. Improve the given ${platform} content to achieve the goal: ${goal}. Maintain the original message intent while optimizing for engagement.`,
          },
          { role: 'user', content: `Improve this content: ${content}` },
        ],
        temperature: 0.6,
        max_tokens: 500,
      });

      return completion.choices[0]?.message?.content || content;
    } catch (error) {
      console.error('Error improving content:', error);
      return content;
    }
  }

  // Template Management
  async getTemplates(userId: string, platform?: string): Promise<ContentTemplate[]> {
    // In a real implementation, these would be stored in the database
    const templates: ContentTemplate[] = [
      {
        id: '1',
        name: 'Product Launch',
        description: 'Announce a new product or feature',
        platforms: ['facebook', 'instagram', 'linkedin'],
        template: '🚀 Exciting news! We're thrilled to introduce {product_name}!\n\n{key_features}\n\nLearn more: {link}',
        variables: ['product_name', 'key_features', 'link'],
      },
      {
        id: '2',
        name: 'Customer Testimonial',
        description: 'Share customer success stories',
        platforms: ['facebook', 'instagram', 'linkedin', 'twitter'],
        template: '"{testimonial}"\n\n- {customer_name}, {customer_title}\n\n{cta}',
        variables: ['testimonial', 'customer_name', 'customer_title', 'cta'],
      },
      {
        id: '3',
        name: 'Educational Post',
        description: 'Share tips or educational content',
        platforms: ['linkedin', 'facebook', 'instagram'],
        template: '💡 {hook_question}\n\nHere are {number} tips:\n\n{tips_list}\n\nWhich one will you try first?',
        variables: ['hook_question', 'number', 'tips_list'],
      },
      {
        id: '4',
        name: 'Event Promotion',
        description: 'Promote upcoming events or webinars',
        platforms: ['facebook', 'linkedin', 'twitter'],
        template: '📅 Mark your calendars!\n\n{event_name}\n📍 {location}\n🗓️ {date}\n⏰ {time}\n\n{description}\n\nRegister now: {registration_link}',
        variables: ['event_name', 'location', 'date', 'time', 'description', 'registration_link'],
      },
      {
        id: '5',
        name: 'Behind the Scenes',
        description: 'Share behind-the-scenes content',
        platforms: ['instagram', 'tiktok', 'facebook'],
        template: 'Behind the scenes at {company_name}! 👀\n\n{description}\n\n{fun_fact}\n\nFollow for more insider content!',
        variables: ['company_name', 'description', 'fun_fact'],
      },
    ];

    if (platform) {
      return templates.filter(t => t.platforms.includes(platform));
    }

    return templates;
  }

  async applyTemplate(templateId: string, variables: Record<string, string>): Promise<string> {
    const templates = await this.getTemplates('');
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    let content = template.template;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    return content;
  }

  // Draft Management
  async saveDraft(userId: string, draft: {
    content: string;
    platforms: string[];
    mediaUrls?: string[];
    scheduledFor?: Date;
  }) {
    // Save draft to database
    // This would be implemented with Prisma
    return {
      id: `draft_${Date.now()}`,
      ...draft,
      userId,
      createdAt: new Date(),
      status: 'draft',
    };
  }

  async getDrafts(userId: string) {
    // Fetch drafts from database
    // This would be implemented with Prisma
    return [];
  }

  // Analytics and Optimization
  async analyzeContent(content: string, platform: string): Promise<{
    readabilityScore: number;
    sentimentScore: number;
    engagementPrediction: string;
    improvements: string[];
  }> {
    // In a real implementation, this could use various NLP APIs
    // For now, return mock analysis
    return {
      readabilityScore: 85,
      sentimentScore: 0.7,
      engagementPrediction: 'high',
      improvements: [
        'Add a question to encourage comments',
        'Include 2-3 relevant emojis',
        'Consider adding a call-to-action',
      ],
    };
  }
}

// Export singleton instance
export const aiService = new AIService();