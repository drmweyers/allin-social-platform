import { SocialPlatform } from '@prisma/client';
import { createInstagramService } from './instagram.service';
import { twitterService } from './twitter.service';

interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  accessToken: string;
  refreshToken?: string | null;
  username?: string | null;
}

interface Post {
  id: string;
  content: string;
  media?: string[];
  hashtags?: string[];
  mentions?: string[];
}

interface PublishResult {
  platformPostId: string;
  success: boolean;
  error?: string;
}

export const socialService = {
  /**
   * Publish a post to the specified social media platform
   */
  async publishPost(socialAccount: SocialAccount, post: Post): Promise<PublishResult> {
    try {
      switch (socialAccount.platform) {
        case SocialPlatform.INSTAGRAM:
          return await this.publishToInstagram(socialAccount, post);
        
        case SocialPlatform.TWITTER:
          return await this.publishToTwitter(socialAccount, post);
        
        case SocialPlatform.FACEBOOK:
          return await this.publishToFacebook(socialAccount, post);
        
        case SocialPlatform.LINKEDIN:
          return await this.publishToLinkedIn(socialAccount, post);
        
        case SocialPlatform.TIKTOK:
          return await this.publishToTikTok(socialAccount, post);
        
        default:
          throw new Error(`Platform ${socialAccount.platform} not supported`);
      }
    } catch (error) {
      console.error(`Failed to publish to ${socialAccount.platform}:`, error);
      return {
        platformPostId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Publish to Instagram
   */
  async publishToInstagram(socialAccount: SocialAccount, post: Post): Promise<PublishResult> {
    try {
      // For now, create a basic post - will be enhanced with actual Instagram API
      const instagramService = createInstagramService();
      
      // Instagram requires a two-step process: create container, then publish
      const container = await instagramService.createMediaContainer({
        caption: post.content,
        imageUrl: post.media?.[0] || '', // Instagram requires at least one image
      }, socialAccount.accessToken);
      
      const result = await instagramService.publishMediaContainer(
        container.id, 
        socialAccount.accessToken
      );

      return {
        platformPostId: result.id || 'instagram_' + Date.now(),
        success: true
      };
    } catch (error) {
      throw new Error(`Instagram publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Publish to Twitter
   */
  async publishToTwitter(socialAccount: SocialAccount, post: Post): Promise<PublishResult> {
    try {
      const tweetData = {
        text: post.content,
        mediaIds: post.media,
      };

      const result = await twitterService.createTweet(tweetData, socialAccount.accessToken);

      return {
        platformPostId: result.id || 'twitter_' + Date.now(),
        success: true
      };
    } catch (error) {
      throw new Error(`Twitter publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Publish to Facebook
   */
  async publishToFacebook(socialAccount: SocialAccount, post: Post): Promise<PublishResult> {
    try {
      // TODO: Implement Facebook publishing
      // For now, return mock success
      console.log('Publishing to Facebook:', post.content);
      
      return {
        platformPostId: 'facebook_' + Date.now(),
        success: true
      };
    } catch (error) {
      throw new Error(`Facebook publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Publish to LinkedIn
   */
  async publishToLinkedIn(socialAccount: SocialAccount, post: Post): Promise<PublishResult> {
    try {
      // TODO: Implement LinkedIn publishing
      // For now, return mock success
      console.log('Publishing to LinkedIn:', post.content);
      
      return {
        platformPostId: 'linkedin_' + Date.now(),
        success: true
      };
    } catch (error) {
      throw new Error(`LinkedIn publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Publish to TikTok
   */
  async publishToTikTok(socialAccount: SocialAccount, post: Post): Promise<PublishResult> {
    try {
      // TODO: Implement TikTok publishing
      // For now, return mock success
      console.log('Publishing to TikTok:', post.content);
      
      return {
        platformPostId: 'tiktok_' + Date.now(),
        success: true
      };
    } catch (error) {
      throw new Error(`TikTok publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Check if a platform supports the content type
   */
  validateContent(platform: SocialPlatform, post: Post): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (platform) {
      case SocialPlatform.INSTAGRAM:
        if (!post.media || post.media.length === 0) {
          errors.push('Instagram requires at least one image or video');
        }
        if (post.content.length > 2200) {
          errors.push('Instagram caption must be 2200 characters or less');
        }
        break;

      case SocialPlatform.TWITTER:
        if (post.content.length > 280) {
          errors.push('Twitter posts must be 280 characters or less');
        }
        break;

      case SocialPlatform.FACEBOOK:
        if (post.content.length > 63206) {
          errors.push('Facebook posts must be 63,206 characters or less');
        }
        break;

      case SocialPlatform.LINKEDIN:
        if (post.content.length > 3000) {
          errors.push('LinkedIn posts must be 3000 characters or less');
        }
        break;

      case SocialPlatform.TIKTOK:
        if (!post.media || post.media.length === 0) {
          errors.push('TikTok requires video content');
        }
        if (post.content.length > 300) {
          errors.push('TikTok captions must be 300 characters or less');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Get platform-specific posting requirements
   */
  getPlatformRequirements(platform: SocialPlatform) {
    const requirements = {
      [SocialPlatform.INSTAGRAM]: {
        requiresMedia: true,
        maxTextLength: 2200,
        supportedMediaTypes: ['image', 'video'],
        maxMediaCount: 10
      },
      [SocialPlatform.TWITTER]: {
        requiresMedia: false,
        maxTextLength: 280,
        supportedMediaTypes: ['image', 'video', 'gif'],
        maxMediaCount: 4
      },
      [SocialPlatform.FACEBOOK]: {
        requiresMedia: false,
        maxTextLength: 63206,
        supportedMediaTypes: ['image', 'video'],
        maxMediaCount: 20
      },
      [SocialPlatform.LINKEDIN]: {
        requiresMedia: false,
        maxTextLength: 3000,
        supportedMediaTypes: ['image', 'video', 'document'],
        maxMediaCount: 9
      },
      [SocialPlatform.TIKTOK]: {
        requiresMedia: true,
        maxTextLength: 300,
        supportedMediaTypes: ['video'],
        maxMediaCount: 1
      }
    };

    return requirements[platform];
  }
};