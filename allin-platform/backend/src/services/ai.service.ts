const OpenAI = require('openai');

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
  private drafts: Array<{
    id: string;
    userId: string;
    content: string;
    platforms: string[];
    mediaUrls?: string[];
    scheduledFor?: Date;
    createdAt: Date;
    status: string;
  }> = [];

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
    const practices: Record<string, string> = {
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
    return (practices as any)[platform] || '';
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

  private parseAIResponse(response: string, _platform: string): GeneratedContent {
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
    const mockTemplates: Record<string, Record<string, string>> = {
      facebook: {
        professional: `Excited to share insights on ${options.topic}! This represents a significant step forward in our industry. What are your thoughts on this development? 🚀`,
        casual: `Just discovered something amazing about ${options.topic}! Can't wait to share more details with you all. Who else is interested in this? 😊`,
        friendly: `Hey friends! Let's talk about ${options.topic} today. I've been learning so much and would love to hear your experiences too! 💡`,
        humorous: `So ${options.topic} walks into a bar... Just kidding! But seriously, this is pretty cool stuff. 😄`,
        informative: `Here's what you need to know about ${options.topic}: Key facts and insights that matter. 📚`,
      },
      instagram: {
        professional: `Diving deep into ${options.topic} 📊\n\nKey insights that matter to your business:\n✨ Innovation drives growth\n✨ Consistency is key\n✨ Community matters\n\nWhat's your take on this?`,
        casual: `${options.topic} vibes only! ✨\n\nSwipe for the full story →\n\nDrop a 💙 if you're with me!`,
        friendly: `Let's chat about ${options.topic}! 🌟\n\nI've been exploring this lately and wow, mind = blown 🤯\n\nTell me your thoughts below! 👇`,
        humorous: `${options.topic} but make it fun! 😂\n\nWho else relates? Double tap if you get it! 💯`,
        informative: `Everything about ${options.topic} explained 📖\n\n1️⃣ What it is\n2️⃣ Why it matters\n3️⃣ How to use it\n\nSave this post! 📌`,
      },
      twitter: {
        professional: `Key insight on ${options.topic}:\n\nThe future belongs to those who adapt quickly and embrace change.\n\nThread below 🧵`,
        casual: `ok but why is nobody talking about ${options.topic}?? this is actually huge 👀`,
        friendly: `Friendly reminder about ${options.topic} 💫\n\nSmall steps lead to big changes. You've got this!`,
        humorous: `${options.topic} is trending and I'm here for it 😎\n\nRT if you agree!`,
        informative: `Quick facts about ${options.topic} 📊\n\n• Point 1\n• Point 2\n• Point 3\n\nMore in thread 👇`,
      },
      linkedin: {
        professional: `Reflecting on ${options.topic}:\n\nIn today's rapidly evolving landscape, understanding this topic is crucial for strategic decision-making.\n\nThree key takeaways:\n1. Innovation drives competitive advantage\n2. Data-informed decisions yield better outcomes\n3. Continuous learning is non-negotiable\n\nWhat strategies are you implementing?`,
        casual: `Thoughts on ${options.topic}?\n\nBeen diving into this lately and it's fascinating how much the landscape has changed.\n\nWould love to hear different perspectives from my network!`,
        friendly: `Happy to share some insights on ${options.topic}!\n\nAfter working in this space for years, I've learned that collaboration and knowledge-sharing accelerate everyone's growth.\n\nWhat has your journey taught you?`,
        humorous: `${options.topic} explained with coffee analogies ☕\n\nBecause everything makes more sense with caffeine!\n\nWho else agrees? 😄`,
        informative: `Comprehensive overview of ${options.topic}:\n\n📈 Current trends\n🔍 Key challenges\n💡 Solutions\n🎯 Action items\n\nFull analysis in the comments.`,
      },
      tiktok: {
        professional: `POV: You just learned about ${options.topic} 🤯 Save this for later! #education #learning`,
        casual: `${options.topic} explained in 30 seconds ⏰ You're welcome 😎 #fyp #trending`,
        friendly: `Hey bestie! Let's talk ${options.topic} 💕 Comment your thoughts! #community #letstalk`,
        humorous: `Me trying to explain ${options.topic} to my friends 🤪 #relatable #funny`,
        informative: `${options.topic} facts you didn't know! Part 1 📚 Follow for more! #educational #facts`,
      },
    };

    const platformTemplates = mockTemplates[options.platform] || mockTemplates.facebook;
    const tone = options.tone || 'professional';
    const content = (platformTemplates as any)[tone] || platformTemplates.professional;

    const hashtagSets = {
      facebook: ['#Innovation', '#Business', '#Growth', '#Community'],
      instagram: ['#InstaDaily', '#Motivation', '#Success', '#Entrepreneur', '#DigitalMarketing'],
      twitter: ['#Tech', '#Trending'],
      linkedin: ['#ProfessionalDevelopment', '#Leadership', '#Innovation', '#BusinessStrategy'],
      tiktok: ['#FYP', '#ForYou', '#Viral', '#LearnOnTikTok', '#TikTokTips'],
    };

    const hashtags = options.includeHashtags
      ? (hashtagSets as any)[options.platform].slice(0, 3)
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
        .filter((tag: string) => tag.startsWith('#'))
        .slice(0, count);
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return this.getMockHashtags(platform, count);
    }
  }

  private getMockHashtags(platform: string, count: number): string[] {
    const hashtags: Record<string, string[]> = {
      facebook: ['#FacebookMarketing', '#SocialMedia', '#DigitalStrategy', '#ContentCreation', '#Engagement', '#Community', '#BrandAwareness'],
      instagram: ['#InstaMarketing', '#ContentCreator', '#SocialMediaTips', '#InstagramGrowth', '#DigitalMarketing', '#BrandStrategy', '#CreativeContent'],
      twitter: ['#TwitterMarketing', '#SocialStrategy', '#DigitalTrends', '#ContentMarketing', '#BrandVoice', '#Engagement', '#TwitterTips'],
      linkedin: ['#LinkedInMarketing', '#B2BMarketing', '#ProfessionalGrowth', '#ThoughtLeadership', '#BusinessStrategy', '#Networking', '#CareerDevelopment'],
      tiktok: ['#TikTokMarketing', '#ContentStrategy', '#ViralContent', '#TikTokGrowth', '#CreatorEconomy', '#SocialMediaTrends', '#TikTokTips'],
    };

    return ((hashtags as any)[platform] || hashtags.facebook).slice(0, count);
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
  async getTemplates(_userId: string, platform?: string): Promise<ContentTemplate[]> {
    // In a real implementation, these would be stored in the database
    const templates: ContentTemplate[] = [
      {
        id: '1',
        name: 'Product Launch',
        description: 'Announce a new product or feature',
        platforms: ['facebook', 'instagram', 'linkedin'],
        template: 'Exciting news! We\'re thrilled to introduce {product_name}!\n\n{key_features}\n\nLearn more: {link}',
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
        template: '{hook_question}\n\nHere are {number} tips:\n\n{tips_list}\n\nWhich one will you try first?',
        variables: ['hook_question', 'number', 'tips_list'],
      },
      {
        id: '4',
        name: 'Event Promotion',
        description: 'Promote upcoming events or webinars',
        platforms: ['facebook', 'linkedin', 'twitter'],
        template: 'Mark your calendars!\n\n{event_name}\nLocation: {location}\nDate: {date}\nTime: {time}\n\n{description}\n\nRegister now: {registration_link}',
        variables: ['event_name', 'location', 'date', 'time', 'description', 'registration_link'],
      },
      {
        id: '5',
        name: 'Behind the Scenes',
        description: 'Share behind-the-scenes content',
        platforms: ['instagram', 'tiktok', 'facebook'],
        template: 'Behind the scenes at {company_name}!\n\n{description}\n\n{fun_fact}\n\nFollow for more insider content!',
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
    // Save draft to in-memory store (would be database in real implementation)
    const savedDraft = {
      id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...draft,
      userId,
      createdAt: new Date(),
      status: 'draft',
    };
    
    this.drafts.push(savedDraft);
    return savedDraft;
  }

  async getDrafts(userId: string) {
    // Fetch drafts from in-memory store (would be database in real implementation)
    return this.drafts
      .filter(draft => draft.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Analytics and Optimization
  async analyzeContent(_content: string, _platform: string): Promise<{
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

  // Marketing Advice for Chat
  async generateMarketingAdvice(prompt: string): Promise<string> {
    if (!this.isInitialized || !this.openai) {
      return this.getMockMarketingAdvice(prompt);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert social media marketing consultant with deep knowledge of:
            - Content strategy and creation
            - Platform-specific best practices (Facebook, Instagram, Twitter, LinkedIn, TikTok)
            - Audience engagement and growth strategies
            - Analytics and performance optimization
            - Social media trends and algorithms
            - Brand building and community management

            Provide actionable, specific advice that users can implement immediately. Always include concrete examples and practical tips.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return completion.choices[0]?.message?.content || this.getMockMarketingAdvice(prompt);
    } catch (error) {
      console.error('Error generating marketing advice:', error);
      return this.getMockMarketingAdvice(prompt);
    }
  }

  private getMockMarketingAdvice(prompt: string): string {
    const defaultAdvice = `Based on current social media best practices, here are some key recommendations:

**Content Strategy:**
- Create value-driven content that educates, entertains, or inspires your audience
- Use the 80/20 rule: 80% valuable content, 20% promotional content
- Maintain consistent posting schedule and brand voice

**Engagement Tips:**
- Respond to comments within 2-4 hours when possible
- Ask questions to encourage audience interaction
- Use relevant hashtags (3-5 for most platforms)
- Share behind-the-scenes content to build authenticity

**Platform-Specific Advice:**
- **Instagram**: Focus on high-quality visuals and Stories
- **LinkedIn**: Share industry insights and professional achievements
- **Twitter**: Engage in conversations and share timely updates
- **Facebook**: Use native video and community-building content
- **TikTok**: Create entertaining, trend-based content

**Analytics Focus:**
- Track engagement rate over follower count
- Monitor reach and impressions for content performance
- A/B test posting times and content formats

Would you like me to elaborate on any of these strategies?`;

    // Simple keyword matching for more relevant responses
    if (prompt.toLowerCase().includes('instagram')) {
      return `**Instagram Marketing Strategy:**

**Content Tips:**
- Post high-quality, visually appealing images and videos
- Use Instagram Stories daily for behind-the-scenes content
- Create Reels to increase reach (Instagram prioritizes video content)
- Write engaging captions with clear calls-to-action

**Hashtag Strategy:**
- Use 3-5 highly relevant hashtags rather than the maximum 30
- Mix popular and niche hashtags for better discoverability
- Create a branded hashtag for your community

**Optimal Posting:**
- Best times: 11 AM - 1 PM and 7 PM - 9 PM
- Post consistently (1-2 times per day)
- Use Instagram Insights to find your audience's active hours

**Engagement Tactics:**
- Respond to comments and DMs promptly
- Use interactive stickers in Stories (polls, questions, sliders)
- Collaborate with other accounts in your niche
- Share user-generated content to build community

Would you like specific advice for any particular aspect of Instagram marketing?`;
    }

    if (prompt.toLowerCase().includes('content')) {
      return `**Content Creation Strategy:**

**Content Planning:**
- Develop a content calendar with themes for each day
- Create evergreen content that remains relevant over time
- Plan seasonal and trending content in advance

**Content Types That Perform Well:**
- Educational posts (how-to guides, tips, tutorials)
- Behind-the-scenes content (process, team, workspace)
- User-generated content and testimonials
- Interactive content (polls, Q&As, challenges)

**Content Creation Tips:**
- Use templates for consistent visual branding
- Repurpose content across multiple platforms
- Create series or themes to keep audience engaged
- Always include a clear call-to-action

**Visual Guidelines:**
- Maintain consistent color scheme and fonts
- Use high-quality images and videos
- Add your logo or watermark for brand recognition
- Optimize image sizes for each platform

**Content Optimization:**
- Write compelling headlines and captions
- Include relevant keywords naturally
- Use storytelling to create emotional connections
- Add value in every piece of content

Need help with any specific type of content creation?`;
    }

    return defaultAdvice;
  }
}

// Export singleton instance
export const aiService = new AIService();