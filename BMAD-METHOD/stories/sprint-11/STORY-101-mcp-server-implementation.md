# Story 101: MCP Server Implementation
**Sprint**: 11 - MCP & Agentic AI
**Points**: 13
**Priority**: HIGH
**Type**: Feature

## Story Description
As a user, I want to control the AllIN platform through Claude AI or other LLMs using the Model Context Protocol (MCP), so that I can manage my entire social media presence through natural language commands without needing to use the web interface.

## Acceptance Criteria
- [ ] MCP server implemented with TypeScript SDK
- [ ] All major platform functions exposed as MCP tools
- [ ] Platform data accessible as MCP resources
- [ ] Authentication and security implemented
- [ ] Claude Desktop integration configured
- [ ] Documentation for MCP usage created
- [ ] Rate limiting and usage tracking
- [ ] Error handling and logging
- [ ] Testing suite for MCP endpoints

## Technical Details

### Step 1: Install MCP Dependencies
```bash
cd backend
npm install @modelcontextprotocol/sdk @modelcontextprotocol/sdk-node
npm install -D @types/node
```

### Step 2: Create MCP Server Structure
```bash
mkdir -p src/services/mcp
mkdir -p src/services/mcp/tools
mkdir -p src/services/mcp/resources
mkdir -p src/services/mcp/prompts
```

### Step 3: Implement Base MCP Server

#### File: `/backend/src/services/mcp/mcpServer.ts`
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { ContentTools } from './tools/contentTools';
import { AnalyticsTools } from './tools/analyticsTools';
import { CampaignTools } from './tools/campaignTools';
import { AccountResources } from './resources/accountResources';
import { ContentPrompts } from './prompts/contentPrompts';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export class AllINMCPServer {
  private server: Server;
  private contentTools: ContentTools;
  private analyticsTools: AnalyticsTools;
  private campaignTools: CampaignTools;
  private accountResources: AccountResources;
  private contentPrompts: ContentPrompts;

  constructor() {
    this.server = new Server(
      {
        name: 'allin-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Initialize tool handlers
    this.contentTools = new ContentTools(prisma);
    this.analyticsTools = new AnalyticsTools(prisma);
    this.campaignTools = new CampaignTools(prisma);
    this.accountResources = new AccountResources(prisma);
    this.contentPrompts = new ContentPrompts();

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        ...this.contentTools.getToolDefinitions(),
        ...this.analyticsTools.getToolDefinitions(),
        ...this.campaignTools.getToolDefinitions(),
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        logger.info(`MCP Tool called: ${name}`, { args });

        // Route to appropriate tool handler
        let result;
        if (this.contentTools.handles(name)) {
          result = await this.contentTools.execute(name, args);
        } else if (this.analyticsTools.handles(name)) {
          result = await this.analyticsTools.execute(name, args);
        } else if (this.campaignTools.handles(name)) {
          result = await this.campaignTools.execute(name, args);
        } else {
          throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`MCP Tool error: ${name}`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: this.accountResources.getResourceDefinitions(),
    }));

    // Read resource data
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        const data = await this.accountResources.read(uri);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`MCP Resource error: ${uri}`, error);
        throw error;
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: this.contentPrompts.getPromptDefinitions(),
    }));

    // Get prompt content
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const prompt = await this.contentPrompts.getPrompt(name, args);
      return {
        description: prompt.description,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: prompt.text,
            },
          },
        ],
      };
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('MCP Server started');
  }

  async stop() {
    await this.server.close();
    logger.info('MCP Server stopped');
  }
}
```

### Step 4: Implement Content Management Tools

#### File: `/backend/src/services/mcp/tools/contentTools.ts`
```typescript
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const CreatePostSchema = z.object({
  content: z.string(),
  platforms: z.array(z.enum(['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK'])),
  scheduledFor: z.string().datetime().optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  accountIds: z.array(z.string()),
});

const EditPostSchema = z.object({
  postId: z.string(),
  content: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

export class ContentTools {
  constructor(private prisma: PrismaClient) {}

  getToolDefinitions() {
    return [
      {
        name: 'create_post',
        description: 'Create a new social media post',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The post content',
            },
            platforms: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK'],
              },
              description: 'Target platforms',
            },
            scheduledFor: {
              type: 'string',
              format: 'date-time',
              description: 'When to publish (ISO 8601)',
            },
            mediaUrls: {
              type: 'array',
              items: { type: 'string' },
              description: 'Media URLs to attach',
            },
            accountIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Social account IDs',
            },
          },
          required: ['content', 'platforms', 'accountIds'],
        },
      },
      {
        name: 'edit_post',
        description: 'Edit an existing post',
        inputSchema: {
          type: 'object',
          properties: {
            postId: {
              type: 'string',
              description: 'The post ID to edit',
            },
            content: {
              type: 'string',
              description: 'New content',
            },
            scheduledFor: {
              type: 'string',
              format: 'date-time',
              description: 'New schedule time',
            },
          },
          required: ['postId'],
        },
      },
      {
        name: 'delete_post',
        description: 'Delete a post',
        inputSchema: {
          type: 'object',
          properties: {
            postId: {
              type: 'string',
              description: 'The post ID to delete',
            },
          },
          required: ['postId'],
        },
      },
      {
        name: 'get_scheduled_posts',
        description: 'Get all scheduled posts',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              format: 'date',
              description: 'Start date filter',
            },
            endDate: {
              type: 'string',
              format: 'date',
              description: 'End date filter',
            },
            platforms: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by platforms',
            },
          },
        },
      },
    ];
  }

  handles(toolName: string): boolean {
    return ['create_post', 'edit_post', 'delete_post', 'get_scheduled_posts'].includes(toolName);
  }

  async execute(toolName: string, args: any) {
    switch (toolName) {
      case 'create_post':
        return await this.createPost(args);
      case 'edit_post':
        return await this.editPost(args);
      case 'delete_post':
        return await this.deletePost(args);
      case 'get_scheduled_posts':
        return await this.getScheduledPosts(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  private async createPost(args: any) {
    const validated = CreatePostSchema.parse(args);

    const post = await this.prisma.post.create({
      data: {
        content: validated.content,
        platforms: validated.platforms,
        scheduledFor: validated.scheduledFor ? new Date(validated.scheduledFor) : null,
        mediaUrls: validated.mediaUrls || [],
        status: validated.scheduledFor ? 'SCHEDULED' : 'DRAFT',
        socialAccounts: {
          connect: validated.accountIds.map(id => ({ id })),
        },
      },
      include: {
        socialAccounts: true,
      },
    });

    return {
      success: true,
      postId: post.id,
      message: `Post created successfully. ${validated.scheduledFor ? `Scheduled for ${validated.scheduledFor}` : 'Saved as draft'}`,
      post,
    };
  }

  private async editPost(args: any) {
    const validated = EditPostSchema.parse(args);

    const post = await this.prisma.post.update({
      where: { id: validated.postId },
      data: {
        ...(validated.content && { content: validated.content }),
        ...(validated.scheduledFor && { scheduledFor: new Date(validated.scheduledFor) }),
      },
    });

    return {
      success: true,
      message: 'Post updated successfully',
      post,
    };
  }

  private async deletePost(args: any) {
    await this.prisma.post.delete({
      where: { id: args.postId },
    });

    return {
      success: true,
      message: 'Post deleted successfully',
    };
  }

  private async getScheduledPosts(args: any) {
    const posts = await this.prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        ...(args.startDate && {
          scheduledFor: {
            gte: new Date(args.startDate),
          },
        }),
        ...(args.endDate && {
          scheduledFor: {
            lte: new Date(args.endDate),
          },
        }),
        ...(args.platforms && {
          platforms: {
            hasSome: args.platforms,
          },
        }),
      },
      include: {
        socialAccounts: true,
      },
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    return {
      count: posts.length,
      posts,
    };
  }
}
```

### Step 5: Configure Claude Desktop Integration

#### File: `/backend/src/services/mcp/claude-config.json`
```json
{
  "mcpServers": {
    "allin": {
      "command": "node",
      "args": ["./dist/services/mcp/server.js"],
      "env": {
        "ALLIN_API_KEY": "your-api-key",
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/allin"
      }
    }
  }
}
```

### Step 6: Create MCP Server Entry Point

#### File: `/backend/src/services/mcp/server.ts`
```typescript
#!/usr/bin/env node
import { AllINMCPServer } from './mcpServer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  const server = new AllINMCPServer();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down MCP server...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down MCP server...');
    await server.stop();
    process.exit(0);
  });

  try {
    await server.start();
    console.log('AllIN MCP Server is running');
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

main().catch(console.error);
```

### Step 7: Add Package.json Scripts

```json
{
  "scripts": {
    "mcp:dev": "ts-node src/services/mcp/server.ts",
    "mcp:build": "tsc src/services/mcp/server.ts --outDir dist",
    "mcp:start": "node dist/services/mcp/server.js"
  }
}
```

### Step 8: Create Authentication Middleware

#### File: `/backend/src/services/mcp/auth/mcpAuth.ts`
```typescript
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export class MCPAuthenticator {
  async validateApiKey(apiKey: string): Promise<boolean> {
    // Validate API key from database
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    });

    if (!key || !key.active) {
      return false;
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    return true;
  }

  async getUserFromApiKey(apiKey: string) {
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    });

    return key?.user;
  }

  generateApiKey(): string {
    return `allin_${Buffer.from(crypto.randomBytes(32)).toString('base64url')}`;
  }
}
```

### Step 9: Create Usage Examples

#### File: `/docs/mcp-usage-examples.md`
```markdown
# AllIN MCP Usage Examples

## Setup in Claude Desktop

1. Copy the MCP configuration to Claude's config directory:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add the AllIN server configuration:
```json
{
  "mcpServers": {
    "allin": {
      "command": "node",
      "args": ["/path/to/allin/backend/dist/services/mcp/server.js"],
      "env": {
        "ALLIN_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Example Commands in Claude

### Creating a Post
"Create a social media post for Facebook and Twitter saying 'Excited to announce our new product launch!' and schedule it for tomorrow at 2 PM"

### Getting Analytics
"Show me the engagement metrics for my social accounts from the last week"

### Managing Campaigns
"Create a new marketing campaign called 'Summer Sale' with a budget of $5000 targeting millennials interested in technology"

### Bulk Operations
"Generate a week's worth of content about AI trends and schedule them across all my social platforms"
```

### Step 10: Create Tests

#### File: `/backend/src/services/mcp/__tests__/mcpServer.test.ts`
```typescript
import { AllINMCPServer } from '../mcpServer';
import { prisma } from '@/lib/prisma';

describe('MCP Server', () => {
  let server: AllINMCPServer;

  beforeAll(async () => {
    server = new AllINMCPServer();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Content Tools', () => {
    it('should create a post', async () => {
      const result = await server.contentTools.execute('create_post', {
        content: 'Test post',
        platforms: ['TWITTER'],
        accountIds: ['test-account-id'],
      });

      expect(result.success).toBe(true);
      expect(result.postId).toBeDefined();
    });

    it('should get scheduled posts', async () => {
      const result = await server.contentTools.execute('get_scheduled_posts', {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.posts).toBeDefined();
      expect(Array.isArray(result.posts)).toBe(true);
    });
  });

  describe('Resource Access', () => {
    it('should list available resources', async () => {
      const resources = server.accountResources.getResourceDefinitions();
      expect(resources.length).toBeGreaterThan(0);
    });
  });

  describe('Prompts', () => {
    it('should generate content prompts', async () => {
      const prompt = await server.contentPrompts.getPrompt('weekly_content_plan', {
        brandVoice: 'professional',
        targetAudience: 'tech professionals',
      });

      expect(prompt.text).toBeDefined();
      expect(prompt.text).toContain('professional');
    });
  });
});
```

## Implementation Notes

1. **Security**: API key authentication required for all MCP connections
2. **Rate Limiting**: Implement per-user rate limits to prevent abuse
3. **Logging**: All MCP operations logged for audit trail
4. **Error Handling**: Graceful error messages returned to LLM
5. **Testing**: Comprehensive test coverage for all tools and resources

## Testing Instructions

1. **Build MCP Server**:
```bash
npm run mcp:build
```

2. **Test Locally**:
```bash
npm run mcp:dev
```

3. **Configure Claude Desktop** and restart Claude

4. **Test in Claude**:
- Open Claude Desktop
- Type: "Using the AllIN MCP server, create a test post"
- Verify the post is created in the database

## Troubleshooting

1. **Connection Issues**: Check server logs and API key
2. **Permission Errors**: Ensure user has appropriate permissions
3. **Rate Limits**: Check if rate limits are being hit
4. **Data Access**: Verify database connection and schema

## Dependencies
- @modelcontextprotocol/sdk
- TypeScript
- Prisma
- JWT for authentication

## Blocking Issues
- Ensure database schema is up to date
- API key system must be implemented first

## Next Steps
After completing this story:
- Implement remaining tools (analytics, campaigns)
- Add more resources (analytics data, insights)
- Create advanced prompts
- Implement agent system integration

## Time Estimate
- MCP Server setup: 4 hours
- Tool implementation: 6 hours
- Testing and documentation: 3 hours
- Total: 13 hours (1.5 days)

## Notes for Dev Agent
- Follow MCP SDK documentation closely
- Test with actual Claude Desktop application
- Ensure all async operations are properly handled
- Add comprehensive logging for debugging
- Consider implementing caching for frequently accessed resources