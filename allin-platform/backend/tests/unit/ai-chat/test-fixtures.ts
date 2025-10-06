/**
 * AI Chat Test Fixtures
 * Shared test data for AI Chat feature testing
 */

// Define MessageRole enum locally since Prisma might not be available in tests
enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM'
}

// Master Test Credentials (from CLAUDE.md)
export const MASTER_TEST_CREDENTIALS = {
  admin: {
    id: 'admin-user-123',
    email: 'admin@allin.demo',
    password: 'Admin123!@#',
    organizationId: 'org-admin-123',
    role: 'ADMIN'
  },
  agency: {
    id: 'agency-user-123',
    email: 'agency@allin.demo',
    password: 'Agency123!@#',
    organizationId: 'org-agency-123',
    role: 'AGENCY_OWNER'
  },
  manager: {
    id: 'manager-user-123',
    email: 'manager@allin.demo',
    password: 'Manager123!@#',
    organizationId: 'org-manager-123',
    role: 'MANAGER'
  },
  creator: {
    id: 'creator-user-123',
    email: 'creator@allin.demo',
    password: 'Creator123!@#',
    organizationId: 'org-creator-123',
    role: 'CREATOR'
  }
};

// Sample Analytics Data
export const SAMPLE_ANALYTICS = {
  healthy: {
    organizationId: 'org-admin-123',
    dateRange: { from: new Date('2024-01-01'), to: new Date('2024-01-31') },
    platforms: {
      instagram: {
        followers: 12500,
        engagement: {
          rate: 0.051,
          total: 5420,
          likes: 3200,
          comments: 1500,
          shares: 520,
          saves: 200
        },
        reach: 45000,
        impressions: 68000,
        posts: 28
      },
      twitter: {
        followers: 8300,
        engagement: {
          rate: 0.028,
          total: 2100,
          likes: 1200,
          comments: 450,
          shares: 350,
          saves: 100
        },
        reach: 28000,
        impressions: 42000,
        posts: 24
      },
      linkedin: {
        followers: 5600,
        engagement: {
          rate: 0.038,
          total: 1800,
          likes: 1100,
          comments: 450,
          shares: 250,
          saves: 0
        },
        reach: 18000,
        impressions: 25000,
        posts: 16
      },
      facebook: {
        followers: 15200,
        engagement: {
          rate: 0.032,
          total: 3200,
          likes: 2100,
          comments: 750,
          shares: 350,
          saves: 0
        },
        reach: 35000,
        impressions: 52000,
        posts: 20
      }
    },
    overall: {
      totalFollowers: 41600,
      totalEngagement: 12520,
      averageEngagementRate: 0.042,
      totalReach: 126000,
      totalImpressions: 187000,
      totalPosts: 88
    }
  },

  lowEngagement: {
    organizationId: 'org-manager-123',
    dateRange: { from: new Date('2024-01-01'), to: new Date('2024-01-31') },
    platforms: {
      instagram: {
        followers: 3200,
        engagement: {
          rate: 0.018,
          total: 420,
          likes: 280,
          comments: 80,
          shares: 40,
          saves: 20
        },
        reach: 8000,
        impressions: 12000,
        posts: 15
      },
      twitter: {
        followers: 1500,
        engagement: {
          rate: 0.012,
          total: 150,
          likes: 90,
          comments: 35,
          shares: 25,
          saves: 0
        },
        reach: 4500,
        impressions: 6800,
        posts: 12
      }
    },
    overall: {
      totalFollowers: 4700,
      totalEngagement: 570,
      averageEngagementRate: 0.015,
      totalReach: 12500,
      totalImpressions: 18800,
      totalPosts: 27
    }
  },

  trending: {
    organizationId: 'org-agency-123',
    trends: [
      {
        metric: 'engagement',
        direction: 'increasing',
        percentChange: 23.5,
        timeframe: '30d',
        confidence: 0.89
      },
      {
        metric: 'followers',
        direction: 'increasing',
        percentChange: 12.8,
        timeframe: '30d',
        confidence: 0.92
      },
      {
        metric: 'reach',
        direction: 'decreasing',
        percentChange: -8.3,
        timeframe: '7d',
        confidence: 0.76
      }
    ],
    patterns: {
      bestPostingDay: 'Tuesday',
      bestPostingTime: '14:00-16:00',
      bestContentType: 'video',
      seasonality: {
        detected: true,
        pattern: 'weekly',
        peakDays: ['Tuesday', 'Wednesday']
      }
    }
  }
};

// Sample Conversations
export const SAMPLE_CONVERSATIONS = {
  active: {
    id: 'conv-active-123',
    userId: 'admin-user-123',
    organizationId: 'org-admin-123',
    title: 'Analytics Discussion',
    currentPage: 'analytics',
    featureContext: 'engagement-rate',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-active-123',
        role: MessageRole.USER,
        content: 'What does my engagement rate mean?',
        createdAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        id: 'msg-2',
        conversationId: 'conv-active-123',
        role: MessageRole.ASSISTANT,
        content: 'Your engagement rate of 4.2% means that out of every 100 people who see your posts, about 4 interact with them...',
        createdAt: new Date('2024-01-15T10:00:30Z'),
        helpful: true,
        feedback: 'Very helpful explanation!'
      },
      {
        id: 'msg-3',
        conversationId: 'conv-active-123',
        role: MessageRole.USER,
        content: 'How can I improve it?',
        createdAt: new Date('2024-01-15T10:30:00Z')
      }
    ]
  },

  archived: {
    id: 'conv-archived-123',
    userId: 'admin-user-123',
    organizationId: 'org-admin-123',
    title: 'Old Discussion',
    status: 'ARCHIVED',
    createdAt: new Date('2023-12-01T10:00:00Z'),
    updatedAt: new Date('2023-12-01T11:00:00Z'),
    archivedAt: new Date('2024-01-01T00:00:00Z')
  }
};

// Sample Dashboard Data
export const SAMPLE_DASHBOARD = {
  summary: {
    organizationId: 'org-admin-123',
    timeframe: 'week',
    highlights: [
      {
        type: 'win',
        metric: 'followerGrowth',
        value: 145,
        percentChange: 23,
        description: 'Follower growth up 23%'
      },
      {
        type: 'win',
        metric: 'viralPost',
        value: 2300,
        postId: 'post-viral-123',
        description: 'Tuesday post went viral'
      },
      {
        type: 'win',
        metric: 'responseRate',
        value: 0.94,
        percentChange: 16,
        description: 'Response rate improved to 94%'
      }
    ],
    concerns: [
      {
        type: 'concern',
        metric: 'facebookReach',
        value: -18,
        reason: 'Only 2 posts this week (usual: 5)',
        description: 'Facebook reach down 18%'
      },
      {
        type: 'concern',
        metric: 'instagramStories',
        value: -30,
        reason: 'Lack of interactive content',
        description: 'Instagram Stories views dropped 30%'
      }
    ],
    actionItems: [
      {
        priority: 'high',
        action: 'schedule_facebook_posts',
        description: 'Schedule 3 Facebook posts for this week',
        estimatedTime: '30 minutes',
        expectedImpact: 'Restore 18% reach'
      },
      {
        priority: 'medium',
        action: 'create_instagram_stories',
        description: 'Create 2 Instagram Stories with polls',
        estimatedTime: '20 minutes',
        expectedImpact: 'Recover 15-20% of views'
      },
      {
        priority: 'medium',
        action: 'reschedule_linkedin',
        description: 'Reschedule LinkedIn posts to 9 AM - 12 PM',
        estimatedTime: '10 minutes',
        expectedImpact: 'Improve engagement 10-15%'
      }
    ]
  },

  widgets: {
    engagementFunnel: {
      name: 'Engagement Funnel',
      type: 'funnel',
      data: {
        impressions: 187000,
        reach: 126000,
        engagement: 12520,
        conversions: 850
      },
      explanation: 'Shows how many people move from seeing your content to taking action'
    },
    followerGrowth: {
      name: 'Follower Growth',
      type: 'line-chart',
      data: [
        { date: '2024-01-01', followers: 41455 },
        { date: '2024-01-08', followers: 41520 },
        { date: '2024-01-15', followers: 41580 },
        { date: '2024-01-22', followers: 41600 },
        { date: '2024-01-29', followers: 41745 }
      ],
      explanation: 'Your follower count over time across all platforms'
    },
    topPosts: {
      name: 'Top Performing Posts',
      type: 'list',
      data: [
        {
          id: 'post-1',
          platform: 'instagram',
          engagement: 2300,
          caption: 'Sunset vibes...',
          type: 'video'
        },
        {
          id: 'post-2',
          platform: 'twitter',
          engagement: 1850,
          caption: 'Quick tip...',
          type: 'image'
        }
      ],
      explanation: 'Your highest-performing posts this period'
    }
  }
};

// Sample Content Data
export const SAMPLE_CONTENT = {
  instagramCaption: {
    draft: 'Check out this amazing sunset',
    improved: 'Golden hour magic ✨ There\'s something special about watching the day fade into night. What\'s your favorite time to unwind?\n\n📸 Captured this beauty at [location]\n\n#SunsetVibes #GoldenHour #NaturePhotography #Wanderlust #TravelGram',
    suggestions: {
      hashtags: ['#SunsetVibes', '#GoldenHour', '#NaturePhotography', '#Wanderlust', '#TravelGram'],
      callToAction: 'What\'s your favorite time to unwind?',
      emojis: ['✨', '📸'],
      tone: 'inspirational',
      estimatedReach: 15000
    }
  },

  twitterCaption: {
    draft: 'New blog post about social media',
    improved: '🚀 Just dropped: "5 Social Media Hacks That Actually Work"\n\nNo BS. No gimmicks. Just proven strategies that increased engagement by 200%.\n\nRead it here: [link]\n\n#SocialMediaMarketing #ContentStrategy #DigitalMarketing',
    suggestions: {
      hashtags: ['#SocialMediaMarketing', '#ContentStrategy', '#DigitalMarketing'],
      callToAction: 'Read it here',
      hook: '🚀 Just dropped',
      characterCount: 240,
      threadSuggestion: 'Consider breaking into 3-tweet thread for better engagement'
    }
  }
};

// Sample Predictions
export const SAMPLE_PREDICTIONS = {
  nextMonth: {
    organizationId: 'org-admin-123',
    timeframe: '30d',
    predictions: {
      followers: {
        current: 41600,
        predicted: 43850,
        change: 2250,
        percentChange: 5.4,
        confidence: 0.82,
        range: { min: 42800, max: 44900 }
      },
      engagement: {
        current: 12520,
        predicted: 14100,
        change: 1580,
        percentChange: 12.6,
        confidence: 0.76,
        range: { min: 13200, max: 15000 }
      },
      reach: {
        current: 126000,
        predicted: 138000,
        change: 12000,
        percentChange: 9.5,
        confidence: 0.79,
        range: { min: 132000, max: 144000 }
      }
    },
    assumptions: [
      'Maintaining current posting frequency',
      'No major algorithm changes',
      'Seasonal patterns continue',
      'Content quality remains consistent'
    ],
    scenarios: {
      best: 'If you increase video content by 50%: +18% engagement',
      worst: 'If posting frequency drops: -12% engagement'
    }
  }
};

// Mock AI Responses
export const MOCK_AI_RESPONSES = {
  analyticsExplanation: {
    engagementRate: `Great question! Let me break down your engagement rate:

📊 **Your Current Engagement Rate: 4.2%**

This means that out of every 100 people who see your posts, about 4 interact with them (likes, comments, shares, saves).

**How you're doing:**
✅ Above average for your industry (2.5-3.5%)
✅ Instagram: 5.1% (excellent!)
⚠️ Twitter: 2.8% (below your average - let's improve this)

**What this tells us:**
• Your Instagram content resonates well with your audience
• Your Twitter content needs optimization
• Your overall engagement is healthy and growing

**Quick win:** Try posting more video content on Twitter - your Instagram videos have 2x higher engagement than images!

Would you like me to suggest specific ways to improve your Twitter engagement?`,

    reachVsImpressions: `Excellent question! These two metrics are often confused:

📊 **Reach: 126,000**
This is the number of *unique* people who saw your content at least once.

📈 **Impressions: 187,000**
This is the *total* number of times your content was displayed (including repeat views).

**What this means for you:**
• Your impressions are 1.48x your reach
• This means people are seeing your content an average of 1.48 times
• Industry benchmark: 1.3-1.5x is normal, 2x+ means very sticky content

**Good sign:** Your ratio is healthy! It shows people aren't just scrolling past - they're coming back or seeing your content multiple times in their feed.

**Opportunity:** Instagram has the best ratio (1.68x). Consider cross-posting your Instagram content strategy to other platforms!`
  },

  dashboardSummary: `Here's your social media snapshot for this week:

🎉 **Top Wins:**
1. 📈 Follower growth up 23% (gained 145 new followers)
2. 🔥 Your Tuesday post went viral! (2.3K engagements)
3. 💬 Response rate improved to 94% (up from 78%)

⚠️ **Needs Attention:**
1. Facebook reach down 18% - you've only posted 2x this week (usual: 5x)
2. Instagram Stories views dropped 30% - consider more interactive polls/questions
3. LinkedIn engagement flat - try posting during business hours (you've been posting at 8 PM)

🎯 **Priority Actions Today:**
1. ✍️ Schedule 3 Facebook posts for this week
2. 📱 Create 2 Instagram Stories with polls
3. 🕐 Reschedule LinkedIn posts to 9 AM - 12 PM

💡 **Key Insight:** Your audience engagement peaks on Tuesdays and Wednesdays. Focus your best content there!

Want me to help you create content for any of these actions?`,

  trendAnalysis: `Based on your last 30 days of data, here are the key trends I'm seeing:

📈 **Strong Upward Trends:**
1. **Overall Engagement: +23.5%** (High confidence)
   - Driven primarily by video content
   - Tuesday/Wednesday posts performing best
   - 89% confidence this will continue

2. **Follower Growth: +12.8%** (Very high confidence)
   - Consistent daily gains
   - Instagram leading the growth
   - 92% confidence this continues

⚠️ **Concerning Trends:**
1. **Reach: -8.3% (last 7 days)** (Medium confidence)
   - Only on Facebook and Twitter
   - Likely due to reduced posting frequency
   - 76% confidence - this is reversible!

🔍 **Patterns Detected:**
• **Best Posting Time:** Tuesday-Wednesday, 2-4 PM
• **Best Content Type:** Video (2x engagement vs images)
• **Seasonal Pattern:** Weekly cycle detected (weekends slower)

🎯 **Recommendations:**
1. Increase video content across all platforms (+30% expected engagement)
2. Post more consistently on Facebook (restore that -8.3% reach)
3. Double down on Tuesday/Wednesday content (already your best days)

Want me to help you create a content plan based on these trends?`
};

// Export all fixtures
export default {
  MASTER_TEST_CREDENTIALS,
  SAMPLE_ANALYTICS,
  SAMPLE_CONVERSATIONS,
  SAMPLE_DASHBOARD,
  SAMPLE_CONTENT,
  SAMPLE_PREDICTIONS,
  MOCK_AI_RESPONSES
};
