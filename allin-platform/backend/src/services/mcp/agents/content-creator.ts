import { BaseAgent } from './base-agent';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { logger } from '../../../utils/logger';

const prisma = new PrismaClient();

export class ContentCreatorAgent extends BaseAgent {
  private openai: OpenAI | null;

  constructor() {
    super('content-creator', 'AI agent specialized in creating engaging social media content');

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async generateContent(params: {
    prompt: string;
    platforms: string[];
    tone: string;
    keywords?: string[];
    hashtags?: boolean;
  }): Promise<any> {
    try {
      const platformRequirements = this.getPlatformRequirements(params.platforms);

      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: `You are a social media content expert. Create engaging content that:
                - Matches the ${params.tone} tone
                - Is optimized for ${params.platforms.join(', ')}
                - Follows platform-specific best practices
                - Includes relevant hashtags if requested
                - Stays within character limits`,
            },
            {
              role: 'user',
              content: params.prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        const content = response.choices[0].message.content;

        return {
          success: true,
          data: {
            content,
            platforms: params.platforms,
            tone: params.tone,
            characterCount: content?.length,
            requirements: platformRequirements,
          },
        };
      } else {
        // Fallback to template-based generation
        return this.generateTemplateContent(params);
      }
    } catch (error) {
      logger.error('Error generating content:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async generateIdeas(params: {
    topic: string;
    count: number;
    platforms: string[];
    audience?: string;
  }): Promise<any> {
    const ideas = [];
    const templates = [
      'How-to guide about {topic}',
      'Top 10 tips for {topic}',
      'Common mistakes in {topic}',
      'Success story about {topic}',
      'Behind the scenes of {topic}',
      'Q&A about {topic}',
      'Myth-busting {topic}',
      'Case study on {topic}',
      'Beginner\'s guide to {topic}',
      'Advanced strategies for {topic}',
    ];

    for (let i = 0; i < params.count; i++) {
      const template = templates[i % templates.length];
      const idea = {
        title: template.replace('{topic}', params.topic),
        description: `Create engaging content about ${params.topic} for ${params.audience || 'general audience'}`,
        platforms: params.platforms,
        contentType: this.determineContentType(params.platforms),
        estimatedEngagement: Math.floor(Math.random() * 1000) + 100,
        hashtags: this.generateHashtags(params.topic),
      };
      ideas.push(idea);
    }

    return {
      success: true,
      data: { ideas },
    };
  }

  async enhanceContent(params: {
    content: string;
    improvements: string[];
  }): Promise<any> {
    let enhanced = params.content;

    for (const improvement of params.improvements) {
      switch (improvement) {
        case 'add_emojis':
          enhanced = this.addEmojis(enhanced);
          break;
        case 'add_hashtags':
          enhanced = this.addHashtags(enhanced);
          break;
        case 'improve_readability':
          enhanced = this.improveReadability(enhanced);
          break;
        case 'add_cta':
          enhanced = this.addCallToAction(enhanced);
          break;
      }
    }

    return {
      success: true,
      data: {
        original: params.content,
        enhanced,
        improvements: params.improvements,
      },
    };
  }

  async processCommand(command: string): Promise<any> {
    // Parse natural language command
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('create') || lowerCommand.includes('write')) {
      const platforms = this.extractPlatforms(command);
      const tone = this.extractTone(command);

      return this.generateContent({
        prompt: command,
        platforms: platforms.length > 0 ? platforms : ['facebook', 'twitter'],
        tone: tone || 'professional',
      });
    } else if (lowerCommand.includes('ideas') || lowerCommand.includes('suggest')) {
      const topicMatch = command.match(/about (.+?)(?:\s+for|\s*$)/i);
      const topic = topicMatch ? topicMatch[1] : 'general content';

      return this.generateIdeas({
        topic,
        count: 5,
        platforms: this.extractPlatforms(command),
      });
    }

    return {
      success: false,
      error: 'Could not understand the command',
    };
  }

  async generateAutomatedContent(context: any): Promise<any> {
    // Generate content based on schedule and past performance
    const topPerformingPosts = await prisma.post.findMany({
      where: {
        metrics: {
          path: '$.engagement',
          gte: 100,
        },
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Analyze what worked well
    const successPatterns = this.analyzeSuccessPatterns(topPerformingPosts);

    // Generate new content based on patterns
    return this.generateContent({
      prompt: `Create content similar to successful posts about ${successPatterns.topics.join(', ')}`,
      platforms: successPatterns.platforms,
      tone: successPatterns.tone,
    });
  }

  private getPlatformRequirements(platforms: string[]): any {
    const requirements: any = {};

    for (const platform of platforms) {
      switch (platform.toLowerCase()) {
        case 'twitter':
          requirements[platform] = {
            maxLength: 280,
            mediaSupport: true,
            hashtagLimit: 3,
          };
          break;
        case 'facebook':
          requirements[platform] = {
            maxLength: 63206,
            mediaSupport: true,
            hashtagLimit: 10,
          };
          break;
        case 'instagram':
          requirements[platform] = {
            maxLength: 2200,
            mediaSupport: true,
            hashtagLimit: 30,
          };
          break;
        case 'linkedin':
          requirements[platform] = {
            maxLength: 3000,
            mediaSupport: true,
            hashtagLimit: 5,
          };
          break;
      }
    }

    return requirements;
  }

  private generateTemplateContent(params: any): any {
    const templates = {
      professional: `📊 ${params.prompt}\n\nKey Points:\n• Point 1\n• Point 2\n• Point 3\n\n#Business #Professional`,
      casual: `Hey everyone! 👋 ${params.prompt}\n\nWhat do you think? Drop a comment below! 💬\n\n#Community #Engagement`,
      friendly: `${params.prompt} 😊\n\nWe'd love to hear from you!\n\n#Friendly #Social`,
      informative: `Did you know? 💡 ${params.prompt}\n\nLearn more at [link]\n\n#Education #Knowledge`,
      promotional: `🎉 EXCITING NEWS! ${params.prompt}\n\n🔥 Limited time offer\n✅ Act now\n\n#Promotion #Deal`,
    };

    const content = templates[params.tone] || templates.professional;

    return {
      success: true,
      data: {
        content: content.replace('{prompt}', params.prompt),
        platforms: params.platforms,
        tone: params.tone,
        isTemplate: true,
      },
    };
  }

  private determineContentType(platforms: string[]): string {
    if (platforms.includes('instagram')) return 'image';
    if (platforms.includes('tiktok')) return 'video';
    if (platforms.includes('twitter')) return 'text';
    return 'mixed';
  }

  private generateHashtags(topic: string): string[] {
    const words = topic.toLowerCase().split(' ');
    const hashtags = words
      .filter(word => word.length > 3)
      .map(word => `#${word.charAt(0).toUpperCase() + word.slice(1)}`);

    return hashtags.slice(0, 5);
  }

  private addEmojis(content: string): string {
    const emojiMap: { [key: string]: string } = {
      'happy': '😊',
      'sad': '😢',
      'excited': '🎉',
      'love': '❤️',
      'think': '🤔',
      'idea': '💡',
      'success': '✅',
      'warning': '⚠️',
      'new': '✨',
      'hot': '🔥',
    };

    let enhanced = content;
    for (const [word, emoji] of Object.entries(emojiMap)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      enhanced = enhanced.replace(regex, `${word} ${emoji}`);
    }

    return enhanced;
  }

  private addHashtags(content: string): string {
    if (content.includes('#')) return content;

    const words = content.split(' ');
    const importantWords = words
      .filter(word => word.length > 5 && !word.includes('http'))
      .slice(0, 3)
      .map(word => `#${word.replace(/[^a-zA-Z0-9]/g, '')}`);

    return `${content}\n\n${importantWords.join(' ')}`;
  }

  private improveReadability(content: string): string {
    // Add line breaks for better readability
    const sentences = content.split('. ');
    if (sentences.length > 3) {
      return sentences.join('.\n\n');
    }
    return content;
  }

  private addCallToAction(content: string): string {
    const ctas = [
      '\n\n👉 Learn more at our website!',
      '\n\n💬 What are your thoughts? Comment below!',
      '\n\n🔔 Follow us for more updates!',
      '\n\n📧 Sign up for our newsletter!',
      '\n\n🎯 Take action today!',
    ];

    const randomCta = ctas[Math.floor(Math.random() * ctas.length)];
    return content + randomCta;
  }

  private extractPlatforms(command: string): string[] {
    const platforms = [];
    if (command.includes('facebook')) platforms.push('facebook');
    if (command.includes('twitter')) platforms.push('twitter');
    if (command.includes('instagram')) platforms.push('instagram');
    if (command.includes('linkedin')) platforms.push('linkedin');
    return platforms;
  }

  private extractTone(command: string): string | null {
    if (command.includes('professional')) return 'professional';
    if (command.includes('casual')) return 'casual';
    if (command.includes('friendly')) return 'friendly';
    if (command.includes('informative')) return 'informative';
    if (command.includes('promotional')) return 'promotional';
    return null;
  }

  private analyzeSuccessPatterns(posts: any[]): any {
    const topics = new Set<string>();
    const platforms = new Set<string>();
    let totalEngagement = 0;

    posts.forEach(post => {
      if (post.metadata?.topic) topics.add(post.metadata.topic);
      post.platforms?.forEach((p: string) => platforms.add(p));
      totalEngagement += post.metrics?.engagement || 0;
    });

    return {
      topics: Array.from(topics),
      platforms: Array.from(platforms),
      tone: 'professional', // Default
      avgEngagement: totalEngagement / posts.length,
    };
  }
}