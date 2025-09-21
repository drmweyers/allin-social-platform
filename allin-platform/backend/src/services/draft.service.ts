import { prisma } from '../lib/prisma';
import { SocialPlatform, Prisma } from '@prisma/client';

interface CreateDraftInput {
  userId: string;
  organizationId?: string;
  title?: string;
  content: string;
  platforms: SocialPlatform[];
  mediaUrls?: string[];
  hashtags?: string[];
  aiGenerated?: boolean;
  aiPrompt?: string;
  aiModel?: string;
  scheduledFor?: Date;
}

interface UpdateDraftInput extends Partial<CreateDraftInput> {
  id: string;
}

interface CreateTemplateInput {
  userId?: string;
  organizationId?: string;
  name: string;
  description?: string;
  category?: string;
  template: string;
  variables: string[];
  platforms: SocialPlatform[];
  isPublic?: boolean;
}

interface UpdateTemplateInput extends Partial<CreateTemplateInput> {
  id: string;
}

export class DraftService {
  // Draft operations
  async createDraft(input: CreateDraftInput) {
    return prisma.draft.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        title: input.title,
        content: input.content,
        platforms: input.platforms,
        mediaUrls: input.mediaUrls || [],
        hashtags: input.hashtags || [],
        aiGenerated: input.aiGenerated || false,
        aiPrompt: input.aiPrompt,
        aiModel: input.aiModel,
        scheduledFor: input.scheduledFor,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  async getDrafts(
    userId: string,
    organizationId?: string,
    options?: {
      limit?: number;
      offset?: number;
      platform?: SocialPlatform;
    }
  ) {
    const where: Prisma.DraftWhereInput = {
      userId,
      ...(organizationId && { organizationId }),
      ...(options?.platform && { platforms: { has: options.platform } }),
    };

    const [drafts, total] = await Promise.all([
      prisma.draft.findMany({
        where,
        take: options?.limit || 20,
        skip: options?.offset || 0,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.draft.count({ where }),
    ]);

    return {
      drafts,
      total,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    };
  }

  async getDraftById(id: string, userId: string) {
    return prisma.draft.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  async updateDraft(input: UpdateDraftInput) {
    const { id, userId, ...updateData } = input;

    // Verify ownership
    const draft = await prisma.draft.findFirst({
      where: { id, userId },
    });

    if (!draft) {
      throw new Error('Draft not found or access denied');
    }

    return prisma.draft.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  async deleteDraft(id: string, userId: string) {
    // Verify ownership
    const draft = await prisma.draft.findFirst({
      where: { id, userId },
    });

    if (!draft) {
      throw new Error('Draft not found or access denied');
    }

    return prisma.draft.delete({
      where: { id },
    });
  }

  async convertDraftToPost(draftId: string, userId: string, socialAccountId: string) {
    const draft = await this.getDraftById(draftId, userId);
    if (!draft) {
      throw new Error('Draft not found');
    }

    // Create post from draft
    const post = await prisma.post.create({
      data: {
        userId: draft.userId,
        organizationId: draft.organizationId,
        content: draft.content,
        hashtags: draft.hashtags,
        socialAccountId,
        status: draft.scheduledFor ? 'SCHEDULED' : 'DRAFT',
      },
    });

    // If scheduled, create scheduled post
    if (draft.scheduledFor) {
      await prisma.scheduledPost.create({
        data: {
          postId: post.id,
          scheduledFor: draft.scheduledFor,
          socialAccountId,
          status: 'PENDING',
        },
      });
    }

    // Delete the draft
    await this.deleteDraft(draftId, userId);

    return post;
  }

  // Template operations
  async createTemplate(input: CreateTemplateInput) {
    return prisma.contentTemplate.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
        category: input.category,
        template: input.template,
        variables: input.variables,
        platforms: input.platforms,
        isPublic: input.isPublic || false,
      },
    });
  }

  async getTemplates(
    userId?: string,
    organizationId?: string,
    options?: {
      limit?: number;
      offset?: number;
      platform?: SocialPlatform;
      category?: string;
      includePublic?: boolean;
    }
  ) {
    const where: Prisma.ContentTemplateWhereInput = {
      OR: [
        ...(userId ? [{ userId }] : []),
        ...(organizationId ? [{ organizationId }] : []),
        ...(options?.includePublic ? [{ isPublic: true }] : []),
      ],
      ...(options?.platform && { platforms: { has: options.platform } }),
      ...(options?.category && { category: options.category }),
    };

    const [templates, total] = await Promise.all([
      prisma.contentTemplate.findMany({
        where,
        take: options?.limit || 20,
        skip: options?.offset || 0,
        orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.contentTemplate.count({ where }),
    ]);

    return {
      templates,
      total,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    };
  }

  async getTemplateById(id: string) {
    return prisma.contentTemplate.findUnique({
      where: { id },
    });
  }

  async updateTemplate(input: UpdateTemplateInput) {
    const { id, userId, ...updateData } = input;

    // Verify ownership if userId provided
    if (userId) {
      const template = await prisma.contentTemplate.findFirst({
        where: { id, userId },
      });

      if (!template) {
        throw new Error('Template not found or access denied');
      }
    }

    return prisma.contentTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteTemplate(id: string, userId: string) {
    // Verify ownership
    const template = await prisma.contentTemplate.findFirst({
      where: { id, userId },
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    return prisma.contentTemplate.delete({
      where: { id },
    });
  }

  async applyTemplate(templateId: string, variables: Record<string, string>) {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Increment usage count
    await prisma.contentTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    // Apply variables to template
    let content = template.template;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    return content;
  }

  async getTemplateCategories() {
    const categories = await prisma.contentTemplate.findMany({
      where: {
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return categories
      .map(c => c.category)
      .filter(Boolean) as string[];
  }

  // Bulk operations
  async bulkCreateDrafts(drafts: CreateDraftInput[]) {
    return prisma.draft.createMany({
      data: drafts,
    });
  }

  async bulkDeleteDrafts(ids: string[], userId: string) {
    // Verify ownership of all drafts
    const drafts = await prisma.draft.findMany({
      where: {
        id: { in: ids },
        userId,
      },
      select: { id: true },
    });

    if (drafts.length !== ids.length) {
      throw new Error('Some drafts not found or access denied');
    }

    return prisma.draft.deleteMany({
      where: {
        id: { in: ids },
      },
    });
  }

  // Search operations
  async searchDrafts(userId: string, query: string) {
    return prisma.draft.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { hashtags: { has: query } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
  }

  async searchTemplates(query: string, includePublic: boolean = true) {
    return prisma.contentTemplate.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
        ...(includePublic && { isPublic: true }),
      },
      orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
      take: 10,
    });
  }
}

// Export singleton instance
export const draftService = new DraftService();